import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DriveModule } from "./drive/drive.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
    }),
    DriveModule,
    HealthModule,
  ],
})
export class AppModule {}
