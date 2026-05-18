import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateProductSchema, UpdateProductDto, UpdateProductSchema } from './products.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post('create_product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async create(
    @Body(new ZodValidationPipe(CreateProductSchema)) dto: CreateProductDto,
  ) {
    return this.productsService.create(dto);
  }

  @Get('find_all')
  async findAll(
    @Query('category') category?: string,
    @Query('isfeatured') isfeatured?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    const isFeaturedBool = isfeatured === 'true' ? true : isfeatured === 'false' ? false : undefined;
    return this.productsService.findAll(category, isFeaturedBool, searchTerm);
  }

  @Get('find_one/:id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('update_product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete('delete_product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
