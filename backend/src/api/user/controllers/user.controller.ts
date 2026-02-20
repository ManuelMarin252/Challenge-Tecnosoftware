import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common';
import { Auth } from 'src/api/auth/guards/auth.decorator';
import { CurrentUser } from 'src/api/auth/guards/user.decorator';
import { Serialize } from 'src/common/helper/serialize.interceptor';
import { User } from 'src/database/entities/user.entity';
import {
  UpdateUserRolesDto,
  UserDto,
  CreateUserByAdminDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dto/user.dto';
import { UserService } from '../services/user.service';
import { RoleIds } from 'src/api/role/enum/role.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth()
  @Serialize(UserDto)
  @Get('profile')
  profile(@CurrentUser() user: User) {
    return this.userService.findById(user.id);
  }

  @Auth(RoleIds.Admin)
  @Serialize(UserDto)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Auth(RoleIds.Admin)
  @Serialize(UserDto)
  @Patch(':id/roles')
  updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserRolesDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.userService.updateRoles(id, body.roleIds, currentUser.id);
  }

  @Auth(RoleIds.Admin)
  @Serialize(UserDto)
  @Post('create')
  create(@Body() body: CreateUserByAdminDto) {
    return this.userService.createByAdmin(body, body.roleIds);
  }

  @Auth(RoleIds.Admin)
  @Patch(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(id, body.newPassword);
  }

  @Auth()
  @Patch('profile/change-password')
  changePassword(@CurrentUser() user: User, @Body() body: ChangePasswordDto) {
    return this.userService.changePassword(
      user.id,
      body.oldPassword,
      body.newPassword,
    );
  }
}
