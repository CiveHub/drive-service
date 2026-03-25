import { Module } from '@nestjs/common';
import { DriveModule } from './drive/drive.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [DriveModule, HealthModule],
})
export class AppModule {}
