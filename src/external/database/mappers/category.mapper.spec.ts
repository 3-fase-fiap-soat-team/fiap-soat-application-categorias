import { CategoryMapper } from './category.mapper';
import { CategoryEntity } from '../entities/category.entity';

describe('CategoryMapper', () => {
  it('toDomain should map entity to domain', () => {
    const entity = new CategoryEntity();
    entity.id = 'c1';
    entity.name = 'Cat';
    const domain = CategoryMapper.toDomain(entity);
    expect(domain.id).toBe('c1');
    expect(domain.name).toBe('Cat');
  });
});
