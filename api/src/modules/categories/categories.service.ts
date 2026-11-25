import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { CatalogPageQuery } from '../../common/catalog-validation';
import { CategoriesRepository } from './categories.repository';
import { CreateSubcategory, UpdateSubcategory } from './dto/subcategory';

function rethrowSubcategoryWriteError(error: unknown): never {
  if (error instanceof DatabaseError && error.constraint === 'subcategories_category_slug_slug_key') {
    throw new ConflictException('Subcategory slug already exists in this category');
  }
  if (error instanceof DatabaseError && error.constraint === 'subcategories_category_slug_fkey') {
    throw new BadRequestException('Category not found');
  }
  throw error;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly categories: CategoriesRepository) {}

  listCategories() {
    return this.categories.listCategories();
  }

  async listCategorySubcategories(categorySlug: string) {
    const subcategories = await this.categories.listCategorySubcategories(categorySlug);
    if (subcategories === null) throw new NotFoundException('Category not found');
    return subcategories;
  }

  listSubcategories(query: CatalogPageQuery) {
    return this.categories.listSubcategories(query);
  }

  createSubcategory(body: CreateSubcategory) {
    return this.categories.createSubcategory(body).catch(rethrowSubcategoryWriteError);
  }

  async updateSubcategory(id: string, body: UpdateSubcategory) {
    if (Object.values(body).every(value => value === undefined)) {
      throw new BadRequestException('Provide at least one subcategory field');
    }
    const subcategory = await this.categories.updateSubcategory(id, body).catch(rethrowSubcategoryWriteError);
    if (!subcategory) throw new NotFoundException('Subcategory not found');
    return subcategory;
  }
}
