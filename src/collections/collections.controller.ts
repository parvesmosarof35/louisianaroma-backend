import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, CreateCollectionSchema, UpdateCollectionDto, UpdateCollectionSchema } from './collections.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('collections')
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Post('create_collection')
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/collections');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = CreateCollectionSchema.parse(parsedData);
      return this.collectionsService.create(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Get('find_all')
  async findAll() {
    return this.collectionsService.findAll();
  }

  @Get('find_one/:id')
  async findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Patch('update_collection/:id')
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/collections');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = UpdateCollectionSchema.parse(parsedData);
      return this.collectionsService.update(id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Delete('delete_collection/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
