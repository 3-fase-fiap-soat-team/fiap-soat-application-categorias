import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from 'src/config/database.config';
import { OrmCategoryRepository } from './repositories/category.repository';
import { CategoryEntity } from './entities/category.entity';
import { ICategoryDataSource } from 'src/interfaces/category-datasource';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    TypeOrmModule.forFeature([
      CategoryEntity
    ]),
  ],
  providers: [
    {
      provide: ICategoryDataSource,
      useClass: OrmCategoryRepository,
    }
  ],
  exports: [
    ICategoryDataSource
  ],
})
export class DatabaseModule {}
