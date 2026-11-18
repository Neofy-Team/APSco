import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

export class ListProductsQuery {
  @IsOptional()
  @IsIn(['published', 'all'])
  view: 'published' | 'all' = 'published';

  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(100)
  categorySlug?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
