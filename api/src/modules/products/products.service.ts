import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProductRow, ProductsRepository } from './products.repository';
import { ListProductsQuery } from './dto/list-products-query';

function toProductResponse(product: ProductRow) {
  const { id, subcategoryId, categorySlug, slug, name, description, imageUrls, priceAmount, currency } = product;
  const amount = Number(priceAmount);
  const json = JSON as typeof JSON & { rawJSON(value: string): object };

  return {
    id, subcategoryId, categorySlug, slug, name, description, imageUrls,
    price: {
      amount: Number.isSafeInteger(amount) ? amount : json.rawJSON(priceAmount),
      currency,
    },
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductsRepository) {}

  async listProducts(query: ListProductsQuery) {
    // The management view stays closed until the identity module can verify the admin role.
    if (query.view === 'all') throw new UnauthorizedException();

    const { products, totalItems } = await this.products.listProducts(query);
    return {
      items: products.map(toProductResponse),
      page: { number: query.page, limit: query.limit, totalItems },
    };
  }

  async getProduct(slug: string) {
    const product = await this.products.getProduct(slug);
    if (!product) throw new NotFoundException('Product not found');
    return toProductResponse(product);
  }
}
