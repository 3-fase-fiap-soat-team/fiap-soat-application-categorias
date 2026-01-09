import { ICategoryDataSource } from "src/interfaces/category-datasource";
import { Category } from "../../entities/category";

export class CategoryGateway {
    dataSource: ICategoryDataSource

    constructor(dataSource: ICategoryDataSource) {
        this.dataSource = dataSource;
    }

    async findAll(): Promise<Category[]> {
        return this.dataSource.findAll();
    }

    async findById(id: string): Promise<Category> {
        return this.dataSource.findById(id);
    }
}