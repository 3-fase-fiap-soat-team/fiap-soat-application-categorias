import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { CategoryMapper } from '../mappers/category.mapper';
import { Category } from 'src/core/categories/entities/category';
import { CategoryEntity } from '../entities/category.entity';
import { ICategoryDataSource } from 'src/interfaces/category-datasource';

@Injectable()
export class OrmCategoryRepository implements ICategoryDataSource {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepository.find();
    return categories.map(CategoryMapper.toDomain);
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneOrFail({ where: { id } });
    return CategoryMapper.toDomain(category);
  }

  async findManyByIds(ids: string[]): Promise<Category[]> {
    const categories = await this.categoryRepository.find({ where: { id: In(ids) } });
    return categories.map(CategoryMapper.toDomain);
  }
} 