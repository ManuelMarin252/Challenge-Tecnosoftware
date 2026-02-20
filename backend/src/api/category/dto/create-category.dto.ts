import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @IsNotEmpty()
  @IsString()
  public name: string;
}

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsInt()
  public id: number;

  @IsNotEmpty()
  @IsString()
  public name: string;
}
