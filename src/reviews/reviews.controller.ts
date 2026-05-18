import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, CreateReviewSchema } from './reviews.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post('create_review')
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, dto);
  }

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }
}
