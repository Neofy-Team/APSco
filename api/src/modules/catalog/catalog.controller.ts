import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ListProductsQuery } from './dto/list-products-query';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get('categories/:categorySlug/subcategories')
  listCategorySubcategories(@Param('categorySlug') categorySlug: string) {
    return this.catalog.listCategorySubcategories(categorySlug);
  }

  @Get('products')
  listProducts(@Query() query: ListProductsQuery) {
    return this.catalog.listProducts(query);
  }

  @Get('products/by-slug/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getProduct(slug);
  }
}
