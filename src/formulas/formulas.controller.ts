import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FormulasService } from './formulas.service';
import { CreateFormulaSchema, UpdateFormulaSchema } from './formulas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('formulas')
export class FormulasController {
  constructor(private service: FormulasService) {}

  @Post('create_formula')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() body: any,
    @UploadedFiles() files?: any[],
  ) {
    let parsedData: any = {};
    if (body.data) {
      try {
        parsedData = JSON.parse(body.data);
      } catch (e) {
        parsedData = body;
      }
    } else {
      parsedData = body;
    }

    if (files && files.length > 0) {
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/formulas');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = CreateFormulaSchema.parse(parsedData);
      return this.service.create(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Get('find_all')
  async findAll(
    @Query('searchTerm') searchTerm?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.service.findAll(searchTerm, pageNum, limitNum);
  }

  @Get('find_one/:id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch('update_formula/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files?: any[],
  ) {
    let parsedData: any = {};
    if (body.data) {
      try {
        parsedData = JSON.parse(body.data);
      } catch (e) {
        parsedData = body;
      }
    } else {
      parsedData = body;
    }

    if (files && files.length > 0) {
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/formulas');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = UpdateFormulaSchema.parse(parsedData);
      return this.service.update(id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Delete('delete_formula/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
