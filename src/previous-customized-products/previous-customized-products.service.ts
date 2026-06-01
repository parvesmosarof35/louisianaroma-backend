import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreviousCustomizedProductDto, UpdatePreviousCustomizedProductDto } from './previous-customized-products.dto';

@Injectable()
export class PreviousCustomizedProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePreviousCustomizedProductDto) {
    const product = await this.prisma.previousCustomizedProduct.create({
      data: {
        name: dto.name,
        title: dto.title,
        image: dto.image || '',
      },
    });

    return {
      success: true,
      message: 'Previous customized product created successfully',
      data: product,
    };
  }

  async findAll(searchTerm?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition: any = {};
    if (searchTerm) {
      whereCondition.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { title: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.previousCustomizedProduct.count({ where: whereCondition });
    const products = await this.prisma.previousCustomizedProduct.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: {
        page,
        limit,
        total,
      },
      data: products,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.previousCustomizedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Previous customized product with ID '${id}' was not found.`);
    }

    return {
      success: true,
      data: product,
    };
  }

  async update(id: string, dto: UpdatePreviousCustomizedProductDto) {
    const product = await this.prisma.previousCustomizedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Previous customized product with ID '${id}' was not found.`);
    }

    const updated = await this.prisma.previousCustomizedProduct.update({
      where: { id },
      data: {
        name: dto.name ?? product.name,
        title: dto.title ?? product.title,
        image: dto.image ?? product.image,
      },
    });

    return {
      success: true,
      message: 'Previous customized product updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const product = await this.prisma.previousCustomizedProduct.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Previous customized product with ID '${id}' was not found.`);
    }

    await this.prisma.previousCustomizedProduct.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Previous customized product deleted successfully',
    };
  }
}
