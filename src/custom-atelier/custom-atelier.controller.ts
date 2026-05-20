import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CustomAtelierService } from './custom-atelier.service';
import { CreateCustomBlendDto, CreateCustomBlendSchema } from './custom-atelier.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('atelier')
export class CustomAtelierController {
  constructor(private atelierService: CustomAtelierService) {}

  @Get('ingredients')
  async getIngredients() {
    return this.atelierService.getIngredients();
  }

  @Get('mediums')
  async getMediums() {
    return this.atelierService.getMediums();
  }

  @Get('pricing-configurations')
  async getPricingConfigurations() {
    return this.atelierService.getPricingConfigurations();
  }

  @Get('curated-products')
  async getCuratedProducts() {
    return this.atelierService.getCuratedProducts();
  }

  @Post('create-blend')
  @UseGuards(OptionalJwtAuthGuard)
  async createBlend(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateCustomBlendSchema)) dto: CreateCustomBlendDto,
  ) {
    const userId = user ? user.id : null;
    return this.atelierService.createBlend(userId, dto);
  }
}
