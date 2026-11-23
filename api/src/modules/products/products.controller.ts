import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ListProductsQuery } from './dto/list-products-query';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  listProducts(@Query() query: ListProductsQuery) {
    return this.products.listProducts(query);
  }

  @Get('by-slug/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.products.getProduct(slug);
  }
}
