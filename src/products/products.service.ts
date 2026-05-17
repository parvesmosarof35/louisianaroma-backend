import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { isAvailable: true },
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
    });

    if (!product) {
      throw new NotFoundException('The premium product you are searching for is not present in our vaults.');
    }

    return {
      success: true,
      data: product,
    };
  }
}
