import { Controller, Post, Patch, Get, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, CreateReviewSchema, UpdateReviewDto, UpdateReviewSchema } from './reviews.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('create_review')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @CurrentUser() user: any,
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
        files.map(async (file) => {
          const uploadResult = await uploadBufferToCloudinary(file.buffer, 'louisianaroma/reviews');
          return uploadResult.secure_url;
        }),
      );
      const existingPictures = Array.isArray(parsedData.pictures) ? parsedData.pictures : [];
      parsedData.pictures = [...existingPictures, ...uploadedImages];
    }

    try {
      const validated = CreateReviewSchema.parse(parsedData);
      return this.reviewsService.create(user.id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Patch('update_review/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
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
        files.map(async (file) => {
          const uploadResult = await uploadBufferToCloudinary(file.buffer, 'louisianaroma/reviews');
          return uploadResult.secure_url;
        }),
      );
      const existingPictures = Array.isArray(parsedData.pictures) ? parsedData.pictures : [];
      parsedData.pictures = [...existingPictures, ...uploadedImages];
    }

    try {
      const validated = UpdateReviewSchema.parse(parsedData);
      return this.reviewsService.update(id, user.id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Get('my_review/:productId')
  @UseGuards(JwtAuthGuard)
  async getMyReview(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Query('orderId') orderId?: string,
  ) {
    return this.reviewsService.findMyReviewForProduct(user.id, productId, orderId);
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('all_reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async getAllReviews() {
    return this.reviewsService.findAll();
  }

  @Delete('delete_review/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }
}
