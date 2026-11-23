import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  listCategories() {
    return this.categories.listCategories();
  }

  @Get(':categorySlug/subcategories')
  listCategorySubcategories(@Param('categorySlug') categorySlug: string) {
    return this.categories.listCategorySubcategories(categorySlug);
  }
}
