import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // 1. Verify the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('The fragrance product you wish to review does not exist.');
    }

    // 2. Enforce the business rule: users can only review a product they purchased
    const purchaseExists = await this.prisma.order.findFirst({
      where: {
        userId,
        items: {
          some: {
            productId: dto.productId,
          },
        },
      },
    });

    if (!purchaseExists) {
      throw new BadRequestException(
        'Olfactory verification failed: You may only review products that you have purchased from our House.',
      );
    }

    // 3. Create the review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
        pictures: dto.pictures || [],
      },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            image: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Thank you for sharing your sensory experience. Your review has been recorded.',
      data: review,
    };
  }

  async findByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: { count: reviews.length },
      data: reviews,
    };
  }
}
