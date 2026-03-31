import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Helmet with COOP configuration for OAuth
  app.use(
    helmet({
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Set global API prefix with versioning, excluding metrics endpoint

  app.setGlobalPrefix('api/v1', {
    exclude: ['metrics'],
  });

  // Enable CORS with proper configuration for OAuth and frontend
  const corsOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://smartresponse-client.vercel.app',
        'https://smartresponse-frontend.vercel.app',
        'https://swift-response-hubs.vercel.app',
        'https://smartresponse.onrender.com',
        process.env.FRONTEND_URL, // Add from .env if needed
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:4000'];

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response-Length'],
    maxAge: 3600,
  });

  // Swagger API documentation setup
  const config = new DocumentBuilder()
    .setTitle('Smart Accident Report System API')
    .setDescription('API documentation for the Smart Accident Report System')
    .setVersion('1.0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SmartResponse API',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}

void bootstrap();
