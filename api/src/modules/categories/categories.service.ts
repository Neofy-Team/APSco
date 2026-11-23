import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  listCategories() {
    return this.categories.listCategories();
  }

  async listCategorySubcategories(categorySlug: string) {
    const subcategories = await this.categories.listCategorySubcategories(categorySlug);
    if (subcategories === null) throw new NotFoundException('Category not found');
    return subcategories;
  }
}
