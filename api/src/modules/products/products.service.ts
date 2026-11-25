import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseError } from 'pg';
import { AdminProductRow, ProductRow, ProductsRepository } from './products.repository';
import { ListProductsQuery } from './dto/list-products-query';
import { CreateProduct, UpdateProduct } from './dto/product';

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

function toAdminProductResponse(product: AdminProductRow) {
  return { ...toProductResponse(product), sku: product.sku, status: product.status };
}

function rethrowProductWriteError(error: unknown): never {
  if (error instanceof DatabaseError && error.constraint === 'products_slug_key') {
    throw new ConflictException('Product slug already exists');
  }
  if (error instanceof DatabaseError && error.constraint === 'products_sku_key') {
    throw new ConflictException('Product SKU already exists');
  }
  if (error instanceof DatabaseError && error.constraint === 'products_subcategory_id_fkey') {
    throw new BadRequestException('Subcategory not found');
  }
  throw error;
}

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductsRepository, private readonly config: ConfigService) {}

  async listProducts(query: ListProductsQuery) {
    const { products, totalItems } = await this.products.listProducts(query);
    return {
      items: products.map(query.view === 'all' ? toAdminProductResponse : toProductResponse),
      page: { number: query.page, limit: query.limit, totalItems },
    };
  }

  async getProduct(slug: string) {
    const product = await this.products.getProduct(slug);
    if (!product) throw new NotFoundException('Product not found');
    return toProductResponse(product);
  }

  async getAdminProduct(id: string) {
    const product = await this.products.getAdminProduct(id);
    if (!product) throw new NotFoundException('Product not found');
    return toAdminProductResponse(product);
  }

  async createProduct(body: CreateProduct) {
    this.validateCurrency(body.price.currency);
    const product = await this.products.createProduct(body).catch(rethrowProductWriteError);
    return toAdminProductResponse(product);
  }

  async updateProduct(id: string, body: UpdateProduct) {
    if (Object.values(body).every(value => value === undefined)) {
      throw new BadRequestException('Provide at least one product field');
    }
    if (body.price) this.validateCurrency(body.price.currency);

    const result = await this.products.updateProduct(id, body).catch(rethrowProductWriteError);
    if ('product' in result) return toAdminProductResponse(result.product);
    if (result.reason === 'missing-product') throw new NotFoundException('Product not found');
    if (result.reason === 'missing-subcategory') throw new BadRequestException('Subcategory not found');
    throw new BadRequestException('Published products must belong to an active subcategory');
  }

  private validateCurrency(currency: string) {
    const checkoutCurrency = this.config.get<string>('CHECKOUT_CURRENCY');
    if (checkoutCurrency && currency !== checkoutCurrency) {
      throw new BadRequestException(`Price currency must be ${checkoutCurrency}`);
    }
  }
}
