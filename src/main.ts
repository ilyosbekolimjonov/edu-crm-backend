import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server ishga tushdi: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📄 Swagger: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
