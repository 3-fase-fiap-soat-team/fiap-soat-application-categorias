import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Validates that all required environment variables are present
 * Fails fast on startup if any required variable is missing
 */
function validateEnvironment(): void {
  const required = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'NODE_ENV',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\n💡 Tip: Check your .env.rds file or Kubernetes secrets');
    process.exit(1);
  }

  console.log('✅ Environment variables validated successfully');
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
}

async function bootstrap() {
  // Validate environment before initializing the application
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('SOAT Tech Challenge')
    .setDescription("API's para sistema da lanchonete")
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Application is running on port ${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
