import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("DriveService");
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const domain = (process.env.DOMAIN || 'civehub.com').toLowerCase();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const lowerOrigin = origin.toLowerCase();
      const isLocalhost = 
        lowerOrigin.startsWith('http://localhost') || 
        lowerOrigin.startsWith('http://127.0.0.1');
      const isCiveHub = 
        lowerOrigin.endsWith(`.${domain}`) || 
        lowerOrigin === `https://${domain}` ||
        lowerOrigin === `https://www.${domain}`;

      if (isLocalhost || isCiveHub) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  // Port should be unique for Drive Service (following patterns)
  const port = process.env.PORT || 3015;
  await app.listen(port, "0.0.0.0");
  logger.log(`Drive Service is running on: http://localhost:${port}`);
}
bootstrap();
