import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';

@Injectable()
export class PromocodeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromocodeDto) {
    return this.prisma.promocode.create({
      data: {
        PromoCode: dto.code,
        reward: dto.discount,
      },
    });
  }

  async findAll() {
    const results = await this.prisma.promocode.findMany();
    return results.map((p) => ({
      id: p.id,
      code: p.PromoCode,
      discount: p.reward,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async findOne(id: string) {
    const p = await this.prisma.promocode.findUnique({ where: { id } });
    if (!p) return null;
    return {
      id: p.id,
      code: p.PromoCode,
      discount: p.reward,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async update(id: string, dto: UpdatePromocodeDto) {
    const data: any = {};
    if (dto.code !== undefined) data.PromoCode = dto.code;
    if (dto.discount !== undefined) data.reward = dto.discount;
    return this.prisma.promocode.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.promocode.delete({ where: { id } });
  }
}
