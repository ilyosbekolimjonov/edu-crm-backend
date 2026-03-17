import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import express from 'express';
import { AppModule } from './app.module';

export class MyLogger extends ConsoleLogger {
  private ignoreContexts = [
    'RoutesResolver',
    'RouterExplorer',
    'InstanceLoader',
  ];

  log(message: string, context?: string) {
    if (context && this.ignoreContexts.includes(context)) return;
    super.log(message, context);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new MyLogger(),
  });

  const port = Number(process.env.PORT) || 3000;
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'https://getknowva.netlify.app'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("O'quv Markazi CRM")
    .setDescription("O'quv markazi CRM tizimi uchun API dokumentatsiyasi")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`🚀 Server ishga tushdi: http://localhost:${port}`);
  console.log(`📄 Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();
