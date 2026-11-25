import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { CatalogPageQuery } from '../../../common/catalog-validation';

export class ListProductsQuery extends CatalogPageQuery {
  @IsOptional()
  @IsIn(['published', 'all'])
  view: 'published' | 'all' = 'published';

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;
}
