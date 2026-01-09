import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesController } from 'src/core/categories/operation/controllers/categories-controller';
import { ICategoryDataSource } from 'src/interfaces/category-datasource';
import { CategoryDTO } from 'src/core/common/dtos/category.dto';

@Controller('categories')
export class NestJSCategoriesController {
  constructor(private readonly categoryDataSource: ICategoryDataSource) {}
  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retorna todas as categorias',
    type: [CategoryDTO],
  })
  async findAll() {
    return await CategoriesController.findAll(this.categoryDataSource);
  }
}
