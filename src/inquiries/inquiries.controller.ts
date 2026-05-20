import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UsePipes, UseGuards } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto, CreateInquirySchema } from './inquiries.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  @Post('create')
  @UsePipes(new ZodValidationPipe(CreateInquirySchema))
  async create(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.create(dto);
  }

  @Get('find_all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async findAll(
    @Query('searchTerm') searchTerm?: string,
    @Query('inquiryType') inquiryType?: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.inquiriesService.findAll(searchTerm, inquiryType, isRead, pageNum, limitNum);
  }

  @Patch('mark_read/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async markAsRead(@Param('id') id: string) {
    return this.inquiriesService.markAsRead(id);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.inquiriesService.remove(id);
  }
}
