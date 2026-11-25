import { Type } from 'class-transformer';
import {
  IsArray, IsDefined, IsIn, IsObject, IsUUID, Matches, MaxLength,
  Validate, ValidateIf, ValidateNested, ValidatorConstraint, ValidatorConstraintInterface,
} from 'class-validator';
import { CatalogTextLength, slugPattern } from '../../../common/catalog-validation';

const statuses = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof statuses)[number];

@ValidatorConstraint({ name: 'int64Amount' })
class Int64Amount implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (typeof value === 'bigint') return value >= 0n && value <= 9223372036854775807n;
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  }

  defaultMessage() {
    return 'amount must be a nonnegative 64-bit integer';
  }
}

@ValidatorConstraint({ name: 'absoluteUri' })
class AbsoluteUri implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'string' && !/[\s\u0000-\u001f\u007f]/.test(value) && URL.canParse(value);
  }

  defaultMessage() {
    return 'each image URL must be an absolute URI';
  }
}

class ProductPrice {
  @Validate(Int64Amount)
  amount!: number | bigint;

  @Matches(/^[A-Z]{3}$/)
  currency!: string;
}

export class CreateProduct {
  @IsUUID()
  subcategoryId!: string;

  @Matches(slugPattern)
  @MaxLength(100)
  slug!: string;

  @CatalogTextLength(1, 200)
  name!: string;

  @CatalogTextLength(0, 10000)
  description!: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => ProductPrice)
  price!: ProductPrice;

  @IsArray()
  @Validate(AbsoluteUri, { each: true })
  imageUrls!: string[];

  @CatalogTextLength(1, 64)
  sku!: string;
}

export class UpdateProduct {
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  subcategoryId?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Matches(slugPattern)
  @MaxLength(100)
  slug?: string;

  @ValidateIf((_, value) => value !== undefined)
  @CatalogTextLength(1, 200)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @CatalogTextLength(0, 10000)
  description?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => ProductPrice)
  price?: ProductPrice;

  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @Validate(AbsoluteUri, { each: true })
  imageUrls?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @CatalogTextLength(1, 64)
  sku?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(statuses)
  status?: ProductStatus;
}
