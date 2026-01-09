import { CategoriesController } from './categories-controller';
import { ICategoryDataSource } from 'src/interfaces/category-datasource';
import { Category } from '../../entities/category';

describe('CategoriesController', () => {
  let mockDataSource: jest.Mocked<ICategoryDataSource>;

  const mockCategories: Category[] = [
    new Category('1', 'Lanche'),
    new Category('2', 'Bebida'),
    new Category('3', 'Sobremesa'),
  ];

  beforeEach(() => {
    mockDataSource = {
      findAll: jest.fn(),
      findById: jest.fn(),
    } as jest.Mocked<ICategoryDataSource>;
  });

  describe('findAll', () => {
    it('deve retornar todas as categorias no formato correto', async () => {
      // Arrange
      mockDataSource.findAll.mockResolvedValue(mockCategories);

      // Act
      const result = await CategoriesController.findAll(mockDataSource);

      // Assert
      expect(mockDataSource.findAll).toHaveBeenCalled();
      expect(result).toEqual([
        { id: '1', name: 'Lanche' },
        { id: '2', name: 'Bebida' },
        { id: '3', name: 'Sobremesa' },
      ]);
    });

    it('deve retornar array vazio quando não existem categorias', async () => {
      // Arrange
      mockDataSource.findAll.mockResolvedValue([]);

      // Act
      const result = await CategoriesController.findAll(mockDataSource);

      // Assert
      expect(mockDataSource.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('deve tratar categorias nulas graciosamente', async () => {
      // Arrange
      mockDataSource.findAll.mockResolvedValue(null as any);

      // Act
      const result = await CategoriesController.findAll(mockDataSource);

      // Assert
      expect(mockDataSource.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
