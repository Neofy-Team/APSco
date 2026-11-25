import { Injectable } from '@nestjs/common';
import { CatalogPageQuery } from '../../common/catalog-validation';
import { Database } from '../../database/database.module';
import { CreateSubcategory, SubcategoryStatus, UpdateSubcategory } from './dto/subcategory';

type Category = { slug: string; name: string };
type Subcategory = Category & { id: string; categorySlug: string; status: SubcategoryStatus };
const subcategoryColumns = 'id, category_slug AS "categorySlug", slug, name, status';

@Injectable()
export class CategoriesRepository {
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

  async listSubcategories({ categorySlug, page, limit }: CatalogPageQuery) {
    const offset = BigInt(page - 1) * BigInt(limit);
    const { rows } = await this.database.query<(Subcategory | { id: null }) & { totalItems: string }>(
      `WITH matching AS (
         SELECT ${subcategoryColumns} FROM subcategories
         WHERE ($1::text IS NULL OR category_slug = $1)
       ), subcategory_page AS (
         SELECT * FROM matching ORDER BY "categorySlug", slug LIMIT $2 OFFSET $3
       ), totals AS (
         SELECT count(*)::text AS "totalItems" FROM matching
       )
       SELECT subcategory_page.*, totals."totalItems"
       FROM totals LEFT JOIN subcategory_page ON true
       ORDER BY subcategory_page."categorySlug", subcategory_page.slug`,
      [categorySlug ?? null, limit, offset.toString()],
    );
    return {
      items: rows.flatMap(row => {
        if (row.id === null) return [];
        const { totalItems, ...subcategory } = row;
        return [subcategory];
      }),
      page: { number: page, limit, totalItems: Number(rows[0].totalItems) },
    };
  }

  async createSubcategory({ categorySlug, slug, name }: CreateSubcategory) {
    const { rows: [subcategory] } = await this.database.query<Subcategory>(
      `INSERT INTO subcategories (category_slug, slug, name) VALUES ($1, $2, $3)
       RETURNING ${subcategoryColumns}`,
      [categorySlug, slug, name],
    );
    return subcategory;
  }

  async updateSubcategory(id: string, { slug, name, status }: UpdateSubcategory) {
    const { rows: [subcategory] } = await this.database.query<Subcategory>(
      `UPDATE subcategories SET slug = COALESCE($2, slug), name = COALESCE($3, name),
                                status = COALESCE($4, status)
       WHERE id = $1 RETURNING ${subcategoryColumns}`,
      [id, slug, name, status],
    );
    return subcategory;
  }
}
