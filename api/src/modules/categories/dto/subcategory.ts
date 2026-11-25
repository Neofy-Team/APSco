import { IsIn, Matches, MaxLength, ValidateIf } from 'class-validator';
import { CatalogTextLength, slugPattern } from '../../../common/catalog-validation';

const statuses = ['active', 'archived'] as const;
export type SubcategoryStatus = (typeof statuses)[number];

export class CreateSubcategory {
  @Matches(slugPattern)
  @MaxLength(100)
  categorySlug!: string;

  @Matches(slugPattern)
  @MaxLength(100)
  slug!: string;

  @CatalogTextLength(1, 120)
  name!: string;
}

export class UpdateSubcategory {
  @ValidateIf((_, value) => value !== undefined)
  @Matches(slugPattern)
  @MaxLength(100)
  slug?: string;

  @ValidateIf((_, value) => value !== undefined)
  @CatalogTextLength(1, 120)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(statuses)
  status?: SubcategoryStatus;
}
