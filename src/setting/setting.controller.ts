import { Controller, Post, Get, Body, UsePipes } from '@nestjs/common';
import { SettingService } from './setting.service';
import { AboutUsDto, AboutUsSchema, PrivacyPolicyDto, PrivacyPolicySchema, TermsConditionsDto, TermsConditionsSchema } from './setting.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('setting')
export class SettingController {
  constructor(private settingService: SettingService) {}

  @Post('about')
  @UsePipes(new ZodValidationPipe(AboutUsSchema))
  async saveAboutUs(@Body() dto: AboutUsDto) {
    return this.settingService.saveAboutUs(dto);
  }

  @Get('find_by_about_us')
  async getAboutUs() {
    return this.settingService.getAboutUs();
  }

  @Post('privacy_policys')
  @UsePipes(new ZodValidationPipe(PrivacyPolicySchema))
  async savePrivacyPolicy(@Body() dto: PrivacyPolicyDto) {
    return this.settingService.savePrivacyPolicy(dto);
  }

  @Get('find_by_privacy_policyss')
  async getPrivacyPolicy() {
    return this.settingService.getPrivacyPolicy();
  }

  @Post('terms_conditions')
  @UsePipes(new ZodValidationPipe(TermsConditionsSchema))
  async saveTermsConditions(@Body() dto: TermsConditionsDto) {
    return this.settingService.saveTermsConditions(dto);
  }

  @Get('find_by_terms_conditions')
  async getTermsConditions() {
    return this.settingService.getTermsConditions();
  }
}
