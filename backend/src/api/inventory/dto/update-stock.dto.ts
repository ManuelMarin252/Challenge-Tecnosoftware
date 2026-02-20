import { IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateStockDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  public change: number;
}
