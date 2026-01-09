import { CategoryDTO } from 'src/core/common/dtos/category.dto';
import { Category } from '../../entities/category';

export class CategoriesPresenter {
  static toDTO(categories: Category[]): CategoryDTO[] {
    if (categories) {
      const categoriesDTO: CategoryDTO[] = categories.map((category) => ({
        id: category.id,
        name: category.name,
      }));
      return categoriesDTO;
    } else {
      return [];
    }
  }

  static toDTOSingle(category: Category): CategoryDTO {
    return {
      id: category.id,
      name: category.name,
    };
  }
}
