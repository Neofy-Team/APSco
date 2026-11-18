import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CatalogProduct, CatalogRepository } from './catalog.repository';
import { ListProductsQuery } from './dto/list-products-query';

function toProductResponse(product: CatalogProduct) {
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
export class CatalogService {
  constructor(private readonly catalog: CatalogRepository) {}

  listCategories() {
    return this.catalog.listCategories();
  }

  async listCategorySubcategories(categorySlug: string) {
    const subcategories = await this.catalog.listCategorySubcategories(categorySlug);
    if (subcategories === null) throw new NotFoundException('Category not found');
    return subcategories;
  }

  async listProducts(query: ListProductsQuery) {
    // The management view stays closed until the identity module can verify the admin role.
    if (query.view === 'all') throw new UnauthorizedException();

    const { products, totalItems } = await this.catalog.listProducts(query);
    return {
      items: products.map(toProductResponse),
      page: { number: query.page, limit: query.limit, totalItems },
    };
  }

  async getProduct(slug: string) {
    const product = await this.catalog.getProduct(slug);
    if (!product) throw new NotFoundException('Product not found');
    return toProductResponse(product);
  }
}
