import { CategoryUseCase } from './category-usecase';
import { CategoryGateway } from '../operation/gateways/categories-gateway';
import { Category } from '../entities/category';

describe('CategoryUseCase', () => {
  let mockCategoryGateway: jest.Mocked<CategoryGateway>;

  const mockCategories: Category[] = [
    new Category('1', 'Lanche'),
    new Category('2', 'Bebida'),
  ];

  beforeEach(() => {
    mockCategoryGateway = {
      dataSource: { findAll: jest.fn(), findById: jest.fn() },
      findAll: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<CategoryGateway>;
  });

  it('findAll should return categories from gateway', async () => {
    mockCategoryGateway.findAll.mockResolvedValue(mockCategories);

    const result = await CategoryUseCase.findAll(mockCategoryGateway);

    expect(mockCategoryGateway.findAll).toHaveBeenCalled();
    expect(result).toBe(mockCategories);
  });

  it('findAll should return null when gateway returns null', async () => {
    mockCategoryGateway.findAll.mockResolvedValue(null as any);

    const result = await CategoryUseCase.findAll(mockCategoryGateway);

    expect(mockCategoryGateway.findAll).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
