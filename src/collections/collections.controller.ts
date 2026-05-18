import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, CreateCollectionSchema, UpdateCollectionDto, UpdateCollectionSchema } from './collections.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Post('create_collection')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async create(
    @Body(new ZodValidationPipe(CreateCollectionSchema)) dto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(dto);
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
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCollectionSchema)) dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(id, dto);
  }

  @Delete('delete_collection/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
