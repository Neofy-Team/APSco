import { IsInt, Max, Min } from 'class-validator';

const pgIntMax = 2147483647;

export class SetInventory {
  @IsInt()
  @Min(0)
  @Max(pgIntMax)
  onHand!: number;

  @IsInt()
  @Min(1)
  @Max(pgIntMax)
  version!: number;
}
