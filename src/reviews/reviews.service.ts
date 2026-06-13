import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './reviews.dto';

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

    // 2. Verify that the order exists, belongs to the current user, is DELIVERED, and contains the product
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId: dto.productId,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(
        'Olfactory verification failed: You may only review products that you have purchased and that have been delivered from our House.',
      );
    }

    // 3. Prevent duplicate reviews at the backend validation level
    const existingReview = await this.prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId: dto.productId,
          orderId: dto.orderId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this product on this order.');
    }

    // 4. Create the review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        title: dto.title,
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

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    // 1. Verify the review exists
    const existing = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('The review you wish to update does not exist.');
    }

    // 2. Verify authorization
    if (existing.userId !== userId) {
      throw new BadRequestException('You are not authorized to update this review.');
    }

    // 3. Update the review
    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating !== undefined ? dto.rating : existing.rating,
        title: dto.title !== undefined ? dto.title : existing.title,
        comment: dto.comment !== undefined ? dto.comment : existing.comment,
        pictures: dto.pictures !== undefined ? dto.pictures : existing.pictures,
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
      message: 'Your sensory feedback has been updated successfully.',
      data: updated,
    };
  }

  async findMyReviewForProduct(userId: string, productId: string, orderId?: string) {
    if (!orderId) {
      // Get the latest review if no orderId is provided
      const review = await this.prisma.review.findFirst({
        where: { userId, productId },
        orderBy: { createdAt: 'desc' },
      });
      return {
        success: true,
        data: review,
      };
    }

    const review = await this.prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId,
          productId,
          orderId,
        },
      },
    });

    return {
      success: true,
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
