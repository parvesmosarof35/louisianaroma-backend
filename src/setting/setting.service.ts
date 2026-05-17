import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AboutUsDto, PrivacyPolicyDto, TermsConditionsDto } from './setting.dto';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateSetting() {
    const setting = await this.prisma.setting.findFirst();
    if (setting) return setting;
    return this.prisma.setting.create({
      data: {
        aboutUs: '',
        privacyPolicy: '',
        termsConditions: '',
      },
    });
  }

  async saveAboutUs(dto: AboutUsDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: { aboutUs: dto.aboutUs },
    });

    return {
      success: true,
      message: 'Successfully updated About Us configuration.',
      data: updated,
    };
  }

  async getAboutUs() {
    const setting = await this.prisma.setting.findFirst();
    return {
      success: true,
      data: {
        aboutUs: setting?.aboutUs || '',
      },
    };
  }

  async savePrivacyPolicy(dto: PrivacyPolicyDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: { privacyPolicy: dto.PrivacyPolicy },
    });

    return {
      success: true,
      message: 'Successfully updated Privacy Policy configuration.',
      data: updated,
    };
  }

  async getPrivacyPolicy() {
    const setting = await this.prisma.setting.findFirst();
    return {
      success: true,
      data: {
        PrivacyPolicy: setting?.privacyPolicy || '',
      },
    };
  }

  async saveTermsConditions(dto: TermsConditionsDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: { termsConditions: dto.TermsConditions },
    });

    return {
      success: true,
      message: 'Successfully updated Terms and Conditions configuration.',
      data: updated,
    };
  }

  async getTermsConditions() {
    const setting = await this.prisma.setting.findFirst();
    return {
      success: true,
      data: {
        TermsConditions: setting?.termsConditions || '',
      },
    };
  }
}
