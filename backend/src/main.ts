import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Determine path to frontend/dist (supports both local dev and production build)
  const candidatePaths = [
    path.resolve(process.cwd(), 'frontend', 'dist'),
    path.resolve(process.cwd(), '..', 'frontend', 'dist'),
    path.resolve(__dirname, '..', '..', 'frontend', 'dist'),
  ];
  const frontendDistPath = candidatePaths.find(p => fs.existsSync(p));

  if (frontendDistPath) {
    logger.log(`Serving static frontend build from: ${frontendDistPath}`);
    app.useStaticAssets(frontendDistPath);

    // SPA fallback: return index.html for non-API, non-socket routes
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        return res.sendFile(path.join(frontendDistPath, 'index.html'));
      }
      next();
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Surplus Food Redistribution Matcher API running on port ${port}`);
  logger.log(`Socket.IO Gateway active on port ${port}`);
}

bootstrap();

