import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CatalogPageQuery } from '../../common/catalog-validation';
import { AdminGuard } from '../identity/access-tokens';
import { CategoriesService } from './categories.service';
import { CreateSubcategory, UpdateSubcategory } from './dto/subcategory';

@Controller('subcategories')
@UseGuards(AdminGuard)
export class SubcategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  listSubcategories(@Query() query: CatalogPageQuery) {
    return this.categories.listSubcategories(query);
  }

  @Post()
  createSubcategory(@Body() body: CreateSubcategory) {
    return this.categories.createSubcategory(body);
  }

  @Patch(':subcategoryId')
  updateSubcategory(@Param('subcategoryId', ParseUUIDPipe) id: string, @Body() body: UpdateSubcategory) {
    return this.categories.updateSubcategory(id, body);
  }
}
