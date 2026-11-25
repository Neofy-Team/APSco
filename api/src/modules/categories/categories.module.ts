import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { SubcategoriesController } from './subcategories.controller';

@Module({
  imports: [IdentityModule],
  controllers: [CategoriesController, SubcategoriesController],
  providers: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
