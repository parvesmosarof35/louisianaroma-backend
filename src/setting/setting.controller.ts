import { Controller, Post, Get, Body, UsePipes, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SettingService } from './setting.service';
import { AboutUsDto, AboutUsSchema, PrivacyPolicyDto, PrivacyPolicySchema, TermsConditionsDto, TermsConditionsSchema, BrandingSocialsDto, BrandingSocialsSchema, ShutdownDto, ShutdownSchema, DeliveryPriceDto, DeliveryPriceSchema, CreateFragranceStatusDto, CreateFragranceStatusSchema } from './setting.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { uploadBufferToCloudinary } from '../utils/cloudinary';

@Controller('setting')
export class SettingController {
  constructor(private settingService: SettingService) {}

  @Post('about')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'aboutusimage', maxCount: 1 },
      { name: 'adminimage', maxCount: 1 },
    ]),
  )
  async saveAboutUs(
    @Body() body: any,
    @UploadedFiles()
    files: {
      aboutusimage?: any[];
      adminimage?: any[];
    },
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

    if (files?.aboutusimage && files.aboutusimage[0]) {
      const uploadResult = await uploadBufferToCloudinary(files.aboutusimage[0].buffer, 'louisianaroma/settings');
      parsedData.aboutusimage = uploadResult.secure_url;
    }
    if (files?.adminimage && files.adminimage[0]) {
      const uploadResult = await uploadBufferToCloudinary(files.adminimage[0].buffer, 'louisianaroma/settings');
      parsedData.adminimage = uploadResult.secure_url;
    }

    try {
      const validated = AboutUsSchema.parse(parsedData);
      return this.settingService.saveAboutUs(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Get('find_by_about_us')
  async getAboutUs() {
    return this.settingService.getAboutUs();
  }

  @Post('branding_socials')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'navbarLogo', maxCount: 1 },
      { name: 'footerLogo', maxCount: 1 },
    ]),
  )
  async saveBrandingSocials(
    @Body() body: any,
    @UploadedFiles()
    files: {
      navbarLogo?: any[];
      footerLogo?: any[];
    },
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

    if (files?.navbarLogo && files.navbarLogo[0]) {
      const uploadResult = await uploadBufferToCloudinary(files.navbarLogo[0].buffer, 'louisianaroma/settings');
      parsedData.navbarLogo = uploadResult.secure_url;
    }
    if (files?.footerLogo && files.footerLogo[0]) {
      const uploadResult = await uploadBufferToCloudinary(files.footerLogo[0].buffer, 'louisianaroma/settings');
      parsedData.footerLogo = uploadResult.secure_url;
    }

    try {
      const validated = BrandingSocialsSchema.parse(parsedData);
      return this.settingService.saveBrandingSocials(validated);
    } catch (error: any) {
      const issues = error.issues || error.errors;
      const errorMessages = Array.isArray(issues)
        ? issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
        : error.message;
      throw new BadRequestException(errorMessages);
    }
  }

  @Get('find_by_branding_socials')
  async getBrandingSocials() {
    return this.settingService.getBrandingSocials();
  }

  @Post('privacy_policys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(PrivacyPolicySchema))
  async savePrivacyPolicy(@Body() dto: PrivacyPolicyDto) {
    return this.settingService.savePrivacyPolicy(dto);
  }

  @Get('find_by_privacy_policyss')
  async getPrivacyPolicy() {
    return this.settingService.getPrivacyPolicy();
  }

  @Post('terms_conditions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(TermsConditionsSchema))
  async saveTermsConditions(@Body() dto: TermsConditionsDto) {
    return this.settingService.saveTermsConditions(dto);
  }

  @Get('find_by_terms_conditions')
  async getTermsConditions() {
    return this.settingService.getTermsConditions();
  }

  @Post('shutdown')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(ShutdownSchema))
  async saveShutdown(@Body() dto: ShutdownDto) {
    return this.settingService.saveShutdown(dto);
  }

  @Get('find_by_shutdown')
  async getShutdown() {
    return this.settingService.getShutdown();
  }

  @Get('delivery-price')
  async getDeliveryPrice() {
    return this.settingService.getDeliveryPrice();
  }

  @Post('delivery-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(DeliveryPriceSchema))
  async saveDeliveryPrice(@Body() dto: DeliveryPriceDto) {
    return this.settingService.saveDeliveryPrice(dto);
  }

  @Post('create_fragrance_status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(CreateFragranceStatusSchema))
  async saveCreateFragranceStatus(@Body() dto: CreateFragranceStatusDto) {
    return this.settingService.saveCreateFragranceStatus(dto);
  }

  @Get('find_by_create_fragrance_status')
  async getCreateFragranceStatus() {
    return this.settingService.getCreateFragranceStatus();
  }
}

