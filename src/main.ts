import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LuxuryExceptionFilter } from './common/filters/luxury-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Global prefix for all API endpoints
  app.setGlobalPrefix('api/v1');

  // Enable CORS with luxury domain settings (and localhost fallback)
  app.enableCors({
    origin: true, // Reflect request origin in response headers
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Apply the brand-aligned Exception Filter globally
  app.useGlobalFilters(new LuxuryExceptionFilter());

  await app.listen(port);
  console.log(`\n⚜️ Maison Louisianaroma Backend Active ⚜️`);
  console.log(`Olfactory Chambers Listening at: http://localhost:${port}/api\n`);
}
bootstrap();

