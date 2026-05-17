import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UsePipes } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto, CreateFaqSchema, UpdateFaqDto, UpdateFaqSchema } from './faq.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('faq')
export class FaqController {
  constructor(private faqService: FaqService) {}

  @Post('create_faq')
  @UsePipes(new ZodValidationPipe(CreateFaqSchema))
  async create(@Body() dto: CreateFaqDto) {
    return this.faqService.create(dto);
  }

  @Get('findB_by_all_faq')
  async findAll(
    @Query('searchTerm') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.faqService.findAll(searchTerm, pageNum, limitNum);
  }

  @Get('find_by_specific_faq/:id')
  async findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @Patch('update_faq/:id')
  @UsePipes(new ZodValidationPipe(UpdateFaqSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqService.update(id, dto);
  }

  @Delete('delete_faq/:id')
  async remove(@Param('id') id: string) {
    return this.faqService.remove(id);
  }
}
