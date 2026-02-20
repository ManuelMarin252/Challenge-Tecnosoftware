import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto/create-category.dto';
import { Auth } from '../../auth/guards/auth.decorator';
import { RoleIds } from '../../role/enum/role.enum';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Auth(RoleIds.Admin)
  @Post()
  async create(@Body() body: CreateCategoryDto) {
    return this.categoryService.create(body);
  }

  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Auth(RoleIds.Admin)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, body.name);
  }

  @Auth(RoleIds.Admin)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.delete(id);
  }
}
