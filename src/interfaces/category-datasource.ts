import { Category } from "src/core/categories/entities/category";

export abstract class ICategoryDataSource {
    abstract findAll(): Promise<Category[]>
    abstract findById(id: string): Promise<Category>
}