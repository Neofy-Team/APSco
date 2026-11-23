import { Injectable } from '@nestjs/common';
import { Database } from '../../database/database.module';
import { ListProductsQuery } from './dto/list-products-query';

export type ProductRow = {
  id: string;
  subcategoryId: string;
  categorySlug: string;
  slug: string;
  name: string;
  description: string;
  priceAmount: string;
  currency: string;
  imageUrls: string[];
};

const visibleProducts = `
  FROM products AS product
  JOIN subcategories AS subcategory ON subcategory.id = product.subcategory_id
  WHERE product.status = 'published' AND subcategory.status = 'active'
`;

const productColumns = `
  product.id, product.subcategory_id AS "subcategoryId",
  subcategory.category_slug AS "categorySlug", product.slug, product.name,
  product.description, product.price_amount::text AS "priceAmount", product.currency
`;

const productImages = `
  ARRAY(
    SELECT image.url
    FROM product_images AS image
    WHERE image.product_id = product.id
    ORDER BY image.position
  ) AS "imageUrls"
`;

@Injectable()
export class ProductsRepository {
  constructor(private readonly database: Database) {}

  async listProducts({ categorySlug, subcategoryId, page, limit }: ListProductsQuery) {
    const offset = BigInt(page - 1) * BigInt(limit);
    const { rows } = await this.database.query<
      { totalItems: string } & (ProductRow | { id: null })
    >(
      `WITH matching AS (
         SELECT ${productColumns}, product.created_at
         ${visibleProducts}
           AND ($1::text IS NULL OR subcategory.category_slug = $1)
           AND ($2::uuid IS NULL OR subcategory.id = $2)
       ), product_page AS (
         SELECT * FROM matching ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4
       ), totals AS (
         SELECT count(*)::text AS "totalItems" FROM matching
       )
       SELECT product.id, product."subcategoryId", product."categorySlug", product.slug,
              product.name, product.description, product."priceAmount", product.currency,
              ${productImages}, totals."totalItems"
       FROM totals LEFT JOIN product_page AS product ON true
       ORDER BY product.created_at DESC, product.id DESC`,
      [categorySlug ?? null, subcategoryId ?? null, limit, offset.toString()],
    );
    return {
      products: rows.filter((row): row is ProductRow & { totalItems: string } => row.id !== null),
      totalItems: Number(rows[0].totalItems),
    };
  }

  async getProduct(slug: string) {
    const { rows: [product] } = await this.database.query<ProductRow>(
      `SELECT ${productColumns}, ${productImages}
       ${visibleProducts} AND product.slug = $1`,
      [slug],
    );
    return product;
  }
}
