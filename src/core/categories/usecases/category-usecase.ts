import { CategoryGateway } from '../operation/gateways/categories-gateway';

export class CategoryUseCase {
  static async findAll(categoryGateway: CategoryGateway) {
    return await categoryGateway.findAll();
  }
}
