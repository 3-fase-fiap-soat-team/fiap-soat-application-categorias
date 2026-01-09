import { Controller, Get, HttpStatus, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retorna a categoria encontrada',
    type: CategoryDTO,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Categoria não encontrada',
  })
  async findById(@Param('id') id: string) {
    const category = await CategoriesController.findById(id, this.categoryDataSource);
    
    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    
    return category;
  }
}
