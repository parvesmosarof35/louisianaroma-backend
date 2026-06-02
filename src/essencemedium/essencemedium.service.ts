import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEssencemediumDto } from './dto/create-essencemedium.dto';
import { UpdateEssencemediumDto } from './dto/update-essencemedium.dto';

@Injectable()
export class EssencemediumService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEssencemediumDto) {
    return (this.prisma as any).essencemedium.create({ data: dto as any });
  }

  async findAll() {
    return (this.prisma as any).essencemedium.findMany();
  }

  async findOne(id: string) {
    return (this.prisma as any).essencemedium.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateEssencemediumDto) {
    return (this.prisma as any).essencemedium.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    return (this.prisma as any).essencemedium.delete({ where: { id } });
  }
}