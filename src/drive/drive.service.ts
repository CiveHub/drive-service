import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DriveFile } from './entities/file.entity';
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

  async findAll(tenantId: string, userId: string): Promise<DriveFile[]> {
    const repo = await this.getRepository(tenantId);
    // Return all files for the tenant. In a team drive, everyone sees everything.
    return repo.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
    });
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
