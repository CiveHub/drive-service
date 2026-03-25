import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  StreamableFile,
  Header as NestHeader,
} from "@nestjs/common";
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

  @Get("files/:id/download")
  @NestHeader('Content-Type', 'application/pdf')
  async download(
    @TenantId() tenantId: string,
    @Param("id") id: string,
  ): Promise<StreamableFile> {
    const file = await this.driveService.getFileBuffer(tenantId, id);
    return new StreamableFile(file.buffer, {
      disposition: `attachment; filename="${file.name}"`,
    });
  }
}
