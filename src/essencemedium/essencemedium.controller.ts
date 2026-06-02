import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { EssencemediumService } from './essencemedium.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('essencemedium')
export class EssencemediumController {
  constructor(private readonly essencemediumService: EssencemediumService) {}

  // Public: Get all
  @Get()
  findAll() {
    return this.essencemediumService.findAll();
  }

  // Public: Get one by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.essencemediumService.findOne(id);
  }

  // Admin: Create (accepts FormData with optional image file)
  @Post()
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

    // Upload image file to Cloudinary if provided
    if (files && files.length > 0) {
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/essencemedium');
      parsedData.image = uploadResult.secure_url;
    }

    // Ensure price is a number
    if (parsedData.price !== undefined) {
      parsedData.price = Number(parsedData.price);
    }

    if (!parsedData.name) {
      throw new BadRequestException('Name is required.');
    }

    return this.essencemediumService.create(parsedData);
  }

  // Admin: Update (accepts FormData with optional image file)
  @Put(':id')
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

    // Upload image file to Cloudinary if provided
    if (files && files.length > 0) {
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/essencemedium');
      parsedData.image = uploadResult.secure_url;
    }

    // Ensure price is a number if provided
    if (parsedData.price !== undefined) {
      parsedData.price = Number(parsedData.price);
    }

    return this.essencemediumService.update(id, parsedData);
  }

  // Admin: Delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.essencemediumService.remove(id);
  }
}
