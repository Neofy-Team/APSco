import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AccessTokens, AdminGuard } from '../identity/access-tokens';
import { ProductsService } from './products.service';
import { ListProductsQuery } from './dto/list-products-query';
import { CreateProduct, UpdateProduct } from './dto/product';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService, private readonly tokens: AccessTokens) {}

  @Get()
  async listProducts(@Query() query: ListProductsQuery, @Headers('authorization') authorization?: string) {
    if (query.view === 'all') await this.tokens.requireAdmin(authorization);
    return this.products.listProducts(query);
  }

  @Post()
  @UseGuards(AdminGuard)
  createProduct(@Body() body: CreateProduct) {
    return this.products.createProduct(body);
  }

  @Get('by-slug/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.products.getProduct(slug);
  }

  @Get(':productId')
  @UseGuards(AdminGuard)
  getAdminProduct(@Param('productId', ParseUUIDPipe) id: string) {
    return this.products.getAdminProduct(id);
  }

  @Patch(':productId')
  @UseGuards(AdminGuard)
  updateProduct(@Param('productId', ParseUUIDPipe) id: string, @Body() body: UpdateProduct) {
    return this.products.updateProduct(id, body);
  }
}
