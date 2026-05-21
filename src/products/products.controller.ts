import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto, CreateProductSchema, UpdateProductDto, UpdateProductSchema } from './products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ─── Admin: Create Product ────────────────────────────────────────────────
  @Post('create_product')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() body: any,
    @UploadedFiles() files?: any[],
  ) {
    let parsedData: any = {};
    if (body.data) {
      try {
        parsedData = JSON.parse(body.data);
      } catch (e) {
        parsedData = body;
      }
    } else {
      parsedData = body;
    }

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map(async (file, idx) => {
          const uploadResult = await uploadBufferToCloudinary(file.buffer, 'louisianaroma/products');
          return {
            image: uploadResult.secure_url,
            position: idx,
          };
        }),
      );
      parsedData.images = uploadedImages;
    }

    try {
      const validated = CreateProductSchema.parse(parsedData);
      return this.productsService.create(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  // ─── Public: List All Products (with pagination & filters) ────────────────
  @Get('find_all')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('isfeatured') isfeatured?: string,
    @Query('isAvailable') isAvailable?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const isFeaturedBool = isfeatured === 'true' ? true : isfeatured === 'false' ? false : undefined;
    const isAvailableBool = isAvailable === 'false' ? false : isAvailable === 'true' ? true : undefined;

    return this.productsService.findAll(category, isFeaturedBool, searchTerm, pageNum, limitNum, isAvailableBool);
  }

  // ─── Public: Get Single Product ───────────────────────────────────────────
  @Get('find_one/:id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ─── Admin: Update Product ────────────────────────────────────────────────
  @Patch('update_product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files?: any[],
  ) {
    let parsedData: any = {};
    if (body.data) {
      try {
        parsedData = JSON.parse(body.data);
      } catch (e) {
        parsedData = body;
      }
    } else {
      parsedData = body;
    }

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map(async (file, idx) => {
          const uploadResult = await uploadBufferToCloudinary(file.buffer, 'louisianaroma/products');
          return {
            image: uploadResult.secure_url,
            position: idx,
          };
        }),
      );
      parsedData.images = uploadedImages;
    }

    try {
      const validated = UpdateProductSchema.parse(parsedData);
      return this.productsService.update(id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  // ─── Admin: Delete Product ────────────────────────────────────────────────
  @Delete('delete_product/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
