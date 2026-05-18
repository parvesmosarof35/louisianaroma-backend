import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: dto as any,
    });

    // Increment count on associated collection
    await this.prisma.collection.updateMany({
      where: { id: dto.category },
      data: { numberOfProducts: { increment: 1 } },
    });

    return {
      success: true,
      message: 'A luxury fragrance has been successfully formulated and cataloged in the House archives.',
      data: product,
    };
  }

  async findAll(category?: string, isfeatured?: boolean, searchTerm?: string) {
    const whereClause: any = { isAvailable: true };

    if (category) {
      whereClause.category = category;
    }

    if (isfeatured !== undefined) {
      whereClause.isfeatured = isfeatured;
    }

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { label: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullname: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: { count: products.length },
      data: products,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                fullname: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('The premium product you are searching for is not present in our vaults.');
    }

    return {
      success: true,
      data: product,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('The premium product you wish to refine is not present in our vaults.');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: dto as any,
    });

    // Update associated Collection counts if category/collection changes
    if (dto.category && dto.category !== existing.category) {
      await this.prisma.collection.updateMany({
        where: { id: existing.category },
        data: { numberOfProducts: { decrement: 1 } },
      });
      await this.prisma.collection.updateMany({
        where: { id: dto.category },
        data: { numberOfProducts: { increment: 1 } },
      });
    }

    return {
      success: true,
      message: 'The olfactory profile of the product has been successfully updated.',
      data: product,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('The premium product you wish to dissolve is not present in our vaults.');
    }

    await this.prisma.product.delete({
      where: { id },
    });

    // Decrement associated Collection count
    await this.prisma.collection.updateMany({
      where: { id: existing.category },
      data: { numberOfProducts: { decrement: 1 } },
    });

    return {
      success: true,
      message: 'Product successfully dissolved and removed from House catalogs.',
    };
  }
}
