import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DriveFile } from './entities/file.entity';
import { DriveFolder } from './entities/folder.entity';
import { TenantConnectionManager } from './tenant-connection-manager';
import { DataSource, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DriveService {
  private readonly storageRoot = process.env.STORAGE_ROOT || './uploads';

  constructor(
    private readonly connectionManager: TenantConnectionManager,
  ) {
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
  }

  private async getRepository(tenantId: string): Promise<Repository<DriveFile>> {
    const ds = await this.connectionManager.getConnection({ id: tenantId });
    return ds.getRepository(DriveFile);
  }

  private async getFolderRepository(tenantId: string): Promise<Repository<DriveFolder>> {
    const ds = await this.connectionManager.getConnection({ id: tenantId });
    return ds.getRepository(DriveFolder);
  }

  async findAll(
    tenantId: string, 
    userId: string, 
    view: string = 'all', 
    folderId: string | null = null
  ): Promise<{ files: DriveFile[], folders: DriveFolder[] }> {
    const fileRepo = await this.getRepository(tenantId);
    const folderRepo = await this.getFolderRepository(tenantId);

    const fileWhere: any = { tenantId };
    const folderWhere: any = { tenantId };

    if (view === 'starred') {
      fileWhere.isStarred = true;
      folderWhere.isStarred = true;
    } else if (view === 'recent') {
      // Logic for recent files (e.g., modified in last 7 days)
      // For now, just order by updatedAt (already handled)
    } else if (view === 'shared') {
      fileWhere.isShared = true;
    } else if (view === 'all') {
      fileWhere.folderId = folderId;
      folderWhere.parentId = folderId;
    }

    const [files, folders] = await Promise.all([
      fileRepo.find({ where: fileWhere, order: { updatedAt: 'DESC' } }),
      folderRepo.find({ where: folderWhere, order: { updatedAt: 'DESC' } }),
    ]);

    return { files, folders };
  }

  async createFolder(tenantId: string, userId: string, name: string, parentId: string | null = null): Promise<DriveFolder> {
    const repo = await this.getFolderRepository(tenantId);
    const folder = repo.create({ tenantId, userId, name, parentId });
    return repo.save(folder);
  }

  async renameFile(tenantId: string, fileId: string, newName: string): Promise<DriveFile> {
    const repo = await this.getRepository(tenantId);
    const file = await repo.findOne({ where: { id: fileId, tenantId } });
    if (!file) throw new NotFoundException('File not found');
    file.name = newName;
    return repo.save(file);
  }

  async renameFolder(tenantId: string, folderId: string, newName: string): Promise<DriveFolder> {
    const repo = await this.getFolderRepository(tenantId);
    const folder = await repo.findOne({ where: { id: folderId, tenantId } });
    if (!folder) throw new NotFoundException('Folder not found');
    folder.name = newName;
    return repo.save(folder);
  }

  async toggleStar(tenantId: string, id: string, type: 'file' | 'folder'): Promise<any> {
    if (type === 'file') {
      const repo = await this.getRepository(tenantId);
      const file = await repo.findOne({ where: { id, tenantId } });
      if (!file) throw new NotFoundException('File not found');
      file.isStarred = !file.isStarred;
      return repo.save(file);
    } else {
      const repo = await this.getFolderRepository(tenantId);
      const folder = await repo.findOne({ where: { id, tenantId } });
      if (!folder) throw new NotFoundException('Folder not found');
      folder.isStarred = !folder.isStarred;
      return repo.save(folder);
    }
  }

  async moveFile(tenantId: string, fileId: string, newFolderId: string | null): Promise<DriveFile> {
    const repo = await this.getRepository(tenantId);
    const file = await repo.findOne({ where: { id: fileId, tenantId } });
    if (!file) throw new NotFoundException('File not found');
    file.folderId = newFolderId;
    return repo.save(file);
  }

  async uploadFile(
    tenantId: string,
    userId: string,
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number }
  ): Promise<DriveFile> {
    const repo = await this.getRepository(tenantId);
    
    // Create tenant directory if it doesn't exist
    const tenantDir = path.join(this.storageRoot, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}-${file.originalname}`;
    const filePath = path.join(tenantId, fileName);
    const fullPath = path.join(this.storageRoot, filePath);

    // Write to disk
    fs.writeFileSync(fullPath, file.buffer);

    // Save metadata
    const newFile = repo.create({
      id: fileId,
      tenantId,
      userId,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      path: filePath,
    });

    return repo.save(newFile);
  }

  async getFileBuffer(tenantId: string, fileId: string): Promise<{ buffer: Buffer; name: string; mimeType: string }> {
    const repo = await this.getRepository(tenantId);
    const file = await repo.findOne({ where: { id: fileId, tenantId } });
    
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const fullPath = path.join(this.storageRoot, file.path);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File physical data missing');
    }

    const buffer = fs.readFileSync(fullPath);
    return { buffer, name: file.name, mimeType: file.mimeType };
  }

  async deleteFile(tenantId: string, fileId: string): Promise<void> {
    const repo = await this.getRepository(tenantId);
    const file = await repo.findOne({ where: { id: fileId, tenantId } });
    
    if (!file) return;

    const fullPath = path.join(this.storageRoot, file.path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await repo.remove(file);
  }
}
