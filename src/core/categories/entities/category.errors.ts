
export class CategoryNotFoundException extends Error {
  constructor(categoryId: string) {
    super(`Categoria com ID "${categoryId}" não encontrada`);
    this.name = 'CategoryNotFoundException';
  }
}