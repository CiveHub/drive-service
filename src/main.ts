import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("DriveService");
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Port should be unique for Drive Service (following patterns)
  const port = process.env.PORT || 3015;
  await app.listen(port);
  logger.log(`Drive Service is running on: http://localhost:${port}`);
}
bootstrap();
