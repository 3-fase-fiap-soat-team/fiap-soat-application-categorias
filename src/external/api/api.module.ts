import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { NestJSCategoriesController } from './controllers/nestjs-categories.controller';
import { DatabaseModule } from '../database/database.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [DatabaseModule, ProvidersModule],
  controllers: [
    HealthController,
    NestJSCategoriesController,
  ],
})

export class ApiModule {}
