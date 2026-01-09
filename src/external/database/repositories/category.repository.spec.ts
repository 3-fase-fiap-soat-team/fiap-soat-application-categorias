import { Repository } from 'typeorm';
import { OrmCategoryRepository } from './category.repository';
import { CategoryEntity } from '../entities/category.entity';
import { Category } from 'src/core/categories/entities/category';

describe('OrmCategoryRepository', () => {
  let mockRepository: Partial<Repository<CategoryEntity>>;
  let ormCategoryRepository: OrmCategoryRepository;

  const sampleEntity: CategoryEntity = {
    id: 'cat-1',
    name: 'Category 1',
  } as any;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    ormCategoryRepository = new OrmCategoryRepository(
      mockRepository as unknown as Repository<CategoryEntity>,
    );
  });

  it('should find all categories', async () => {
    (mockRepository.find as jest.Mock).mockResolvedValue([sampleEntity]);

    const result = await ormCategoryRepository.findAll();

    expect(mockRepository.find).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBeInstanceOf(Category);
  });

  it('should find category by id', async () => {
    (mockRepository.findOneOrFail as jest.Mock).mockResolvedValue(sampleEntity);

    const result = await ormCategoryRepository.findById('cat-1');

    expect(mockRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(result).toBeInstanceOf(Category);
  });

  it('should find many by ids', async () => {
    (mockRepository.find as jest.Mock).mockResolvedValue([sampleEntity]);

    const result = await ormCategoryRepository.findManyByIds(['cat-1']);

    expect(mockRepository.find).toHaveBeenCalled();
    expect(result[0]).toBeInstanceOf(Category);
  });
});
