import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { PromocodeService } from './promocode.service';
import { CreatePromocodeDto } from './dto/create-promocode.dto';
import { UpdatePromocodeDto } from './dto/update-promocode.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('promocode')
export class PromocodeController {
  constructor(private readonly promocodeService: PromocodeService) {}

  @Get('find_all')
  findAll() {
    return this.promocodeService.findAll();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCode(@Body('code') code: string) {
    return this.promocodeService.validateCode(code);
  }

  @Get('find_one/:id')
  findOne(@Param('id') id: string) {
    return this.promocodeService.findOne(id);
  }

  @Post('create_promocode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  create(@Body() dto: CreatePromocodeDto) {
    return this.promocodeService.create(dto);
  }

  @Patch('update_promocode/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdatePromocodeDto) {
    return this.promocodeService.update(id, dto);
  }

  @Delete('delete_promocode/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.promocodeService.remove(id);
  }
}
