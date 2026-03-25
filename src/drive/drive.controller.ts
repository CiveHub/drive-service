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
  findAll(@TenantId() tenantId: string, @UserId() userId: string) {
    return this.driveService.findAll(tenantId, userId);
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
