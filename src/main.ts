import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    const config = new DocumentBuilder()
      .setTitle('Group Management API')
      .setDescription('API for managing groups and users')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(configService.get<number>('PORT') ?? 3000);

    console.log(
      `API Documentation: http://localhost:${configService.get<number>('PORT') ?? 3000}/api/docs`,
    );
  } catch (error) {
    console.error(
      'Failed to start application:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error(
    'Bootstrap failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
