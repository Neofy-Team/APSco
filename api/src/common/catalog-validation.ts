import { Type } from 'class-transformer';
import { IsInt, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function CatalogTextLength(min: number, max: number) {
  // PostgreSQL varchar limits count Unicode code points, including variation selectors.
  const pattern = new RegExp(`^[^\\u0000]{${min},${max}}$`, 'u');
  return Matches(pattern, { message: `$property must contain ${min} to ${max} characters and no null bytes` });
}

export class CatalogPageQuery {
  @ValidateIf((_, value) => value !== undefined)
  @Matches(slugPattern)
  @MaxLength(100)
  categorySlug?: string;

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
