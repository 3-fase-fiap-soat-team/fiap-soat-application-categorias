import { CategoriesPresenter } from './categories-presenter';
import { Category } from '../../entities/category';

describe('CategoriesPresenter', () => {
  it('toDTO should map categories to dtos', () => {
    const categories = [new Category('1', 'Lanche')];
    const dto = CategoriesPresenter.toDTO(categories);
    expect(dto).toEqual([{ id: '1', name: 'Lanche' }]);
  });

  it('toDTO should return empty array when input is falsy', () => {
    // @ts-ignore
    expect(CategoriesPresenter.toDTO(null)).toEqual([]);
  });
});
