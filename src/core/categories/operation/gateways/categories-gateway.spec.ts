import { CategoryGateway } from './categories-gateway';
import { Category } from '../../entities/category';

describe('CategoryGateway', () => {
  const mockDataSource: any = {
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const gateway = new CategoryGateway(mockDataSource);
  const category = new Category('cat1', 'Category 1');

  it('should delegate findAll and findById', async () => {
    (mockDataSource.findAll as jest.Mock).mockResolvedValue([category]);
    (mockDataSource.findById as jest.Mock).mockResolvedValue(category);

    await expect(gateway.findAll()).resolves.toEqual([category]);
    await expect(gateway.findById('cat1')).resolves.toBe(category);
  });
});
