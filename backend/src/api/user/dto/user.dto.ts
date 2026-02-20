import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { RoleDto } from 'src/api/role/dto/role.dto';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public password: string;
}

export class UserDto {
  @Expose()
  public id: number;

  @Expose()
  public email: string;

  @Expose()
  @Type(() => RoleDto)
  public roles: RoleDto[];
}

export class UpdateUserRolesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  public roleIds: number[];
}

export class CreateUserByAdminDto extends CreateUserDto {
  @IsArray()
  @IsNumber({}, { each: true })
  public roleIds: number[];
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  public newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  public oldPassword: string;

  @IsString()
  @IsNotEmpty()
  public newPassword: string;
}
