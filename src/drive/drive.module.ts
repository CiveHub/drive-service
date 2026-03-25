import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { DriveService } from './drive.service';
import { TenantConnectionManager } from './tenant-connection-manager';

@Module({
  controllers: [DriveController],
  providers: [DriveService, TenantConnectionManager],
  exports: [DriveService],
})
export class DriveModule {}
