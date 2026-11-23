import { Injectable } from '@nestjs/common';
import { Database } from '../../database/database.module';

type Category = { slug: string; name: string };
type Subcategory = Category & { id: string; categorySlug: string; status: 'active' };

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
}
