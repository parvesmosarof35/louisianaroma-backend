import { Controller, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CustomAtelierService } from './custom-atelier.service';
import {
  AdminCreateIngredientDto,
  AdminCreateIngredientSchema,
  AdminUpdateIngredientDto,
  AdminUpdateIngredientSchema,
  AdminSizePricingDto,
  AdminSizePricingSchema,
  AdminConcentrationLevelDto,
  AdminConcentrationLevelSchema,
  AdminEssenceMediumDto,
  AdminEssenceMediumSchema,
  AdminCuratedProductDto,
  AdminCuratedProductSchema,
} from './custom-atelier.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { uploadBufferToCloudinary } from '../utils/cloudinary';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/atelier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminAtelierController {
  constructor(private atelierService: CustomAtelierService) {}

  // ─── Ingredient Management ──────────────────────────────────────────

  @Post('ingredients')
  @UseInterceptors(AnyFilesInterceptor())
  async createIngredient(
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/atelier/ingredients');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = AdminCreateIngredientSchema.parse(parsedData);
      return this.atelierService.createIngredient(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Put('ingredients/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateIngredient(
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/atelier/ingredients');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = AdminUpdateIngredientSchema.parse(parsedData);
      return this.atelierService.updateIngredient(id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Delete('ingredients/:id')
  async deleteIngredient(@Param('id') id: string) {
    return this.atelierService.deleteIngredient(id);
  }

  // ─── Sizing & Base Pricing Configuration ───────────────────────────

  @Post('size-pricing')
  async createSizePricing(
    @Body(new ZodValidationPipe(AdminSizePricingSchema)) dto: AdminSizePricingDto,
  ) {
    return this.atelierService.upsertSizePricing(dto);
  }

  @Put('size-pricing')
  async updateSizePricing(
    @Body(new ZodValidationPipe(AdminSizePricingSchema)) dto: AdminSizePricingDto,
  ) {
    return this.atelierService.upsertSizePricing(dto);
  }

  // ─── Concentration Markup Setting ──────────────────────────────────

  @Post('concentration-pricing')
  async createConcentrationLevel(
    @Body(new ZodValidationPipe(AdminConcentrationLevelSchema)) dto: AdminConcentrationLevelDto,
  ) {
    return this.atelierService.upsertConcentrationLevel(dto);
  }

  @Put('concentration-pricing')
  async updateConcentrationLevel(
    @Body(new ZodValidationPipe(AdminConcentrationLevelSchema)) dto: AdminConcentrationLevelDto,
  ) {
    return this.atelierService.upsertConcentrationLevel(dto);
  }

  // ─── Essence Medium Customization ─────────────────────────────────

  @Post('mediums')
  async createEssenceMedium(
    @Body(new ZodValidationPipe(AdminEssenceMediumSchema)) dto: AdminEssenceMediumDto,
  ) {
    return this.atelierService.upsertEssenceMedium(dto);
  }

  @Put('mediums')
  async updateEssenceMedium(
    @Body(new ZodValidationPipe(AdminEssenceMediumSchema)) dto: AdminEssenceMediumDto,
  ) {
    return this.atelierService.upsertEssenceMedium(dto);
  }

  // ─── Curated Portfolio Showcase Designs ────────────────────────────

  @Post('curated')
  @UseInterceptors(AnyFilesInterceptor())
  async createCuratedProduct(
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/atelier/curated');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = AdminCuratedProductSchema.parse(parsedData);
      return this.atelierService.createCuratedProduct(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Put('curated/:id')
  @UseInterceptors(AnyFilesInterceptor())
  async updateCuratedProduct(
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
      const uploadResult = await uploadBufferToCloudinary(files[0].buffer, 'louisianaroma/atelier/curated');
      parsedData.image = uploadResult.secure_url;
    }

    try {
      const validated = AdminCuratedProductSchema.parse(parsedData);
      return this.atelierService.updateCuratedProduct(id, validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Delete('curated/:id')
  async deleteCuratedProduct(@Param('id') id: string) {
    return this.atelierService.deleteCuratedProduct(id);
  }
}
