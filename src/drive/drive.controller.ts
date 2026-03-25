import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  UseGuards,
  StreamableFile,
  Header as NestHeader,
  UploadedFile,
  UseInterceptors,
  Res,
  Query,
  Patch,
  Body,
} from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { DriveService } from "./drive.service";
import { TenantGuard } from "../common/guards/tenant.guard";
import { TenantId, UserId } from "../common/decorators/tenant.decorator";

@Controller("drive")
@UseGuards(TenantGuard)
export class DriveController {
  constructor(private readonly driveService: DriveService) {}

  @Get("files")
  findAll(
    @TenantId() tenantId: string, 
    @UserId() userId: string,
    @Query("view") view?: string,
    @Query("folderId") folderId?: string,
  ) {
    return this.driveService.findAll(tenantId, userId, view || 'all', folderId || null);
  }

  @Post("folders")
  createFolder(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() dto: { name: string; parentId?: string },
  ) {
    return this.driveService.createFolder(tenantId, userId, dto.name, dto.parentId || null);
  }

  @Patch("files/:id")
  updateFile(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() dto: { name?: string; folderId?: string },
  ) {
    if (dto.name) {
      return this.driveService.renameFile(tenantId, id, dto.name);
    }
    if (dto.hasOwnProperty('folderId')) {
      return this.driveService.moveFile(tenantId, id, dto.folderId || null);
    }
    return { success: true };
  }

  @Patch("folders/:id")
  updateFolder(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() dto: { name: string },
  ) {
    return this.driveService.renameFolder(tenantId, id, dto.name);
  }

  @Post("files/:id/star")
  toggleFileStar(
    @TenantId() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.driveService.toggleStar(tenantId, id, 'file');
  }

  @Post("folders/:id/star")
  toggleFolderStar(
    @TenantId() tenantId: string,
    @Param("id") id: string,
  ) {
    return this.driveService.toggleStar(tenantId, id, 'folder');
  }

  @Post("files/upload")
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @UploadedFile() file: any, // Express.Multer.File
  ) {
    return this.driveService.uploadFile(tenantId, userId, file);
  }

  @Get("files/:id/download")
  async download(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.driveService.getFileBuffer(tenantId, id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    });
    return new StreamableFile(file.buffer);
  }

  @Delete("files/:id")
  async remove(
    @TenantId() tenantId: string,
    @Param("id") id: string,
  ) {
    await this.driveService.deleteFile(tenantId, id);
    return { success: true };
  }
}
