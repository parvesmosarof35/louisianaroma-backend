import { Controller, Post, Get, Body, Param, UseGuards, UsePipes } from '@nestjs/common';
import { CustomBlendsService } from './custom-blends.service';
import { CreateCustomBlendDto, CreateCustomBlendSchema } from './custom-blends.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('custom-blends')
export class CustomBlendsController {
  constructor(private customBlendsService: CustomBlendsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateCustomBlendSchema)) dto: CreateCustomBlendDto,
  ) {
    const userId = user ? user.id : null;
    return this.customBlendsService.create(userId, dto);
  }

  @Get('my-blends')
  @UseGuards(JwtAuthGuard)
  async findMyBlends(@CurrentUser() user: any) {
    return this.customBlendsService.findUserBlends(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customBlendsService.findOne(id);
  }
}
