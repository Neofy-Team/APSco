import { Injectable } from '@nestjs/common';
import { Database } from '../../database/database.module';
import { ListProductsQuery } from './dto/list-products-query';

type Category = { slug: string; name: string };
type Subcategory = Category & { id: string; categorySlug: string; status: 'active' };

export type CatalogProduct = {
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
export class CatalogRepository {
  constructor(private readonly database: Database) {}

  async listCategories() {
    const { rows } = await this.database.query<Category>('SELECT slug, name FROM categories ORDER BY slug');
    return rows;
  }

  async listCategorySubcategories(categorySlug: string) {
    const { rows } = await this.database.query<{ id: null } | Subcategory>(
      `SELECT subcategory.id, category.slug AS "categorySlug", subcategory.slug,
              subcategory.name, subcategory.status
       FROM categories AS category
       LEFT JOIN subcategories AS subcategory
         ON subcategory.category_slug = category.slug AND subcategory.status = 'active'
       WHERE category.slug = $1
       ORDER BY subcategory.slug`,
      [categorySlug],
    );
    if (!rows.length) return null;
    return rows.filter((row): row is Subcategory => row.id !== null);
  }

  async listProducts({ categorySlug, subcategoryId, page, limit }: ListProductsQuery) {
    const offset = BigInt(page - 1) * BigInt(limit);
    const { rows } = await this.database.query<
      { totalItems: string } & (CatalogProduct | { id: null })
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
      products: rows.filter((row): row is CatalogProduct & { totalItems: string } => row.id !== null),
      totalItems: Number(rows[0].totalItems),
    };
  }

  async getProduct(slug: string) {
    const { rows: [product] } = await this.database.query<CatalogProduct>(
      `SELECT ${productColumns}, ${productImages}
       ${visibleProducts} AND product.slug = $1`,
      [slug],
    );
    return product;
  }
}
