import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto, UpdateCollectionDto } from './collections.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCollectionDto) {
    const collection = await this.prisma.collection.create({
      data: {
        name: dto.name,
        image: dto.image,
        numberOfProducts: 0,
      },
    });

    return {
      success: true,
      message: 'Luxury collection successfully formulated.',
      data: collection,
    };
  }

  async findAll() {
    const [collections, priceStats] = await Promise.all([
      this.prisma.collection.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.aggregate({
        where: {
          isAvailable: true,
        },
        _max: {
          price: true,
        },
        _min: {
          price: true,
        },
      }),
    ]);

    const maxPrice = priceStats._max?.price ?? 0;
    const minPrice = priceStats._min?.price ?? 0;

    return {
      success: true,
      meta: {
        count: collections.length,
        mostExpensivePrice: maxPrice,
        mostCheapestPrice: minPrice,
        maxPrice,
        minPrice,
      },
      data: collections,
    };
  }

  async findOne(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('The premium collection you are searching for is not present in our vaults.');
    }

    return {
      success: true,
      data: collection,
    };
  }

  async update(id: string, dto: UpdateCollectionDto) {
    const existing = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('The premium collection you wish to refine is not present in our vaults.');
    }

    const collection = await this.prisma.collection.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'The collection details have been successfully refined.',
      data: collection,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('The premium collection you wish to dissolve is not present in our vaults.');
    }

    // Delete associated products or disassociate them
    // For safety, we can delete the products in this category or set their category to an empty string
    await this.prisma.product.deleteMany({
      where: { category: id },
    });

    await this.prisma.collection.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Collection and all associated products dissolved successfully.',
    };
  }
}
