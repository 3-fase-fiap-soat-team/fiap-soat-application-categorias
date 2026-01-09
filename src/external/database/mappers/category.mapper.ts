import { Category } from "src/core/categories/entities/category";
import { CategoryEntity } from "../entities/category.entity";

export class CategoryMapper {
  static toDomain(categoryEntity: CategoryEntity): Category {
    const categoryModel = new Category(categoryEntity.id, categoryEntity.name);
    return categoryModel;
  }
}
