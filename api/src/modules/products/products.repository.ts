import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Database } from '../../database/database.module';
import { ListProductsQuery } from './dto/list-products-query';
import { CreateProduct, ProductStatus, UpdateProduct } from './dto/product';

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

export type AdminProductRow = ProductRow & { sku: string; status: ProductStatus };

type ProductUpdateResult =
  | { product: AdminProductRow }
  | { reason: 'missing-product' | 'missing-subcategory' | 'archived-subcategory' };

const productsWithSubcategory = `
  FROM products AS product
  JOIN subcategories AS subcategory ON subcategory.id = product.subcategory_id
`;
const visibleProduct = "product.status = 'published' AND subcategory.status = 'active'";

const productColumns = `
  product.id, product.subcategory_id AS "subcategoryId",
  subcategory.category_slug AS "categorySlug", product.slug, product.name,
  product.description, product.price_amount::text AS "priceAmount", product.currency
`;
const adminProductColumns = `${productColumns}, product.sku, product.status`;

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

  async listProducts({ categorySlug, subcategoryId, page, limit, view }: ListProductsQuery) {
    const offset = BigInt(page - 1) * BigInt(limit);
    const { rows } = await this.database.query<
      { totalItems: string } & (AdminProductRow | { id: null })
    >(
      `WITH matching AS (
         SELECT ${adminProductColumns}, product.created_at
         ${productsWithSubcategory}
         WHERE ($1::text IS NULL OR subcategory.category_slug = $1)
           AND ($2::uuid IS NULL OR subcategory.id = $2)
           AND ($5::boolean OR (${visibleProduct}))
       ), product_page AS (
         SELECT * FROM matching ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4
       ), totals AS (
         SELECT count(*)::text AS "totalItems" FROM matching
       )
       SELECT product.id, product."subcategoryId", product."categorySlug", product.slug,
              product.name, product.description, product."priceAmount", product.currency, product.sku, product.status,
              ${productImages}, totals."totalItems"
       FROM totals LEFT JOIN product_page AS product ON true
       ORDER BY product.created_at DESC, product.id DESC`,
      [categorySlug ?? null, subcategoryId ?? null, limit, offset.toString(), view === 'all'],
    );
    return {
      products: rows.filter((row): row is AdminProductRow & { totalItems: string } => row.id !== null),
      totalItems: Number(rows[0].totalItems),
    };
  }

  async getProduct(slug: string) {
    const { rows: [product] } = await this.database.query<ProductRow>(
      `SELECT ${productColumns}, ${productImages}
       ${productsWithSubcategory}
       WHERE ${visibleProduct} AND product.slug = $1`,
      [slug],
    );
    return product;
  }

  async getAdminProduct(id: string, connection: Database | PoolClient = this.database) {
    const { rows: [product] } = await connection.query<AdminProductRow>(
      `SELECT ${adminProductColumns}, ${productImages}
       ${productsWithSubcategory} WHERE product.id = $1`,
      [id],
    );
    return product;
  }

  createProduct({ subcategoryId, slug, sku, name, description, price, imageUrls }: CreateProduct) {
    return this.inTransaction(async client => {
      const { rows: [{ id }] } = await client.query<{ id: string }>(
        `INSERT INTO products (subcategory_id, slug, sku, name, description, price_amount, currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [subcategoryId, slug, sku, name, description, price.amount.toString(), price.currency],
      );
      await client.query('INSERT INTO inventory (product_id) VALUES ($1)', [id]);
      await this.insertImages(client, id, imageUrls);
      return this.getAdminProduct(id, client);
    });
  }

  updateProduct(id: string, body: UpdateProduct): Promise<ProductUpdateResult> {
    return this.inTransaction(async client => {
      const { rows: [current] } = await client.query<{ subcategory_id: string; status: ProductStatus }>(
        'SELECT subcategory_id, status FROM products WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (!current) return { reason: 'missing-product' };

      const subcategoryId = body.subcategoryId?.toLowerCase() ?? current.subcategory_id;
      if (subcategoryId !== current.subcategory_id || body.status === 'published') {
        // Share the subcategory row lock with other publishers and serialize against archival.
        const { rows: [subcategory] } = await client.query<{ status: string }>(
          'SELECT status FROM subcategories WHERE id = $1 FOR SHARE',
          [subcategoryId],
        );
        if (!subcategory) return { reason: 'missing-subcategory' };
        if ((body.status ?? current.status) === 'published' && subcategory.status !== 'active') {
          return { reason: 'archived-subcategory' };
        }
      }

      await client.query(
        `UPDATE products
         SET subcategory_id = $2, slug = COALESCE($3, slug), sku = COALESCE($4, sku),
             name = COALESCE($5, name), description = COALESCE($6, description),
             price_amount = COALESCE($7, price_amount), currency = COALESCE($8, currency),
             status = COALESCE($9, status)
         WHERE id = $1`,
        [id, subcategoryId, body.slug, body.sku, body.name, body.description,
          body.price?.amount.toString(), body.price?.currency, body.status],
      );
      if (body.imageUrls !== undefined) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        await this.insertImages(client, id, body.imageUrls);
      }
      return { product: await this.getAdminProduct(id, client) };
    });
  }

  private async insertImages(client: PoolClient, id: string, imageUrls: string[]) {
    if (!imageUrls.length) return;
    await client.query(
      `INSERT INTO product_images (product_id, position, url)
       SELECT $1, image.position - 1, image.url
       FROM unnest($2::text[]) WITH ORDINALITY AS image(url, position)`,
      [id, imageUrls],
    );
  }

  private async inTransaction<T>(write: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.database.connect();
    let discardClient = false;
    try {
      await client.query('BEGIN');
      const result = await write(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        discardClient = true;
      }
      throw error;
    } finally {
      client.release(discardClient);
    }
  }
}
