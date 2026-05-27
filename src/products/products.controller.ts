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
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
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

  // ─── Admin: Upload a single image to Cloudinary (for sectiontwo cards) ─────
  @Post('upload_image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file?: any) {
    if (!file) {
      throw new BadRequestException('No file provided. Send a single file under the "file" field.');
    }
    try {
      const result = await uploadBufferToCloudinary(file.buffer, 'louisianaroma/products/sectiontwo');
      return { success: true, url: result.secure_url };
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Cloudinary upload failed: ${err?.message || 'Unknown error'}`,
      );
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
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const isFeaturedBool = isfeatured === 'true' ? true : isfeatured === 'false' ? false : undefined;
    const isAvailableBool = isAvailable === 'false' ? false : isAvailable === 'true' ? true : undefined;
    const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

    return this.productsService.findAll(
      category,
      isFeaturedBool,
      searchTerm,
      pageNum,
      limitNum,
      isAvailableBool,
      minPriceNum,
      maxPriceNum,
      sortBy,
    );
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
