import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AboutUsDto, PrivacyPolicyDto, TermsConditionsDto, BrandingSocialsDto, ShutdownDto } from './setting.dto';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateSetting() {
    const setting = await this.prisma.setting.findFirst();
    if (setting) return setting;
    return this.prisma.setting.create({
      data: {
        aboutus: '',
        aboutusimage: '',
        adminmessage: '',
        adminimage: '',
        privacyPolicy: '',
        termsConditions: '',
        navbarLogo: '',
        footerLogo: '',
        facebook: { url: '', isActive: false },
        instagram: { url: '', isActive: false },
        twitter: { url: '', isActive: false },
        linkedin: { url: '', isActive: false },
        youtube: { url: '', isActive: false },
        tiktok: { url: '', isActive: false },
        whatsapp: { url: '', isActive: false },
        telegram: { url: '', isActive: false },
        snapchat: { url: '', isActive: false },
        address: { url: '', isActive: false },
        phone: { url: '', isActive: false },
        email: { url: '', isActive: false },
        website: { url: '', isActive: false },
        appName: { url: '', isActive: false },
        isShutdown: false,
        shutdownMessage: 'The website is currently undergoing maintenance. Please return later.',
      },
    });
  }

  async saveAboutUs(dto: AboutUsDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: {
        aboutus: dto.aboutus,
        aboutusimage: dto.aboutusimage,
        adminmessage: dto.adminmessage,
        adminimage: dto.adminimage,
      },
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
        aboutus: setting?.aboutus || '',
        aboutusimage: setting?.aboutusimage || '',
        adminmessage: setting?.adminmessage || '',
        adminimage: setting?.adminimage || '',
      },
    };
  }

  async saveBrandingSocials(dto: BrandingSocialsDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: {
        navbarLogo: dto.navbarLogo,
        footerLogo: dto.footerLogo,
        facebook: dto.facebook ? { url: dto.facebook.url || '', isActive: dto.facebook.isActive ?? true } : undefined,
        instagram: dto.instagram ? { url: dto.instagram.url || '', isActive: dto.instagram.isActive ?? true } : undefined,
        twitter: dto.twitter ? { url: dto.twitter.url || '', isActive: dto.twitter.isActive ?? true } : undefined,
        linkedin: dto.linkedin ? { url: dto.linkedin.url || '', isActive: dto.linkedin.isActive ?? true } : undefined,
        youtube: dto.youtube ? { url: dto.youtube.url || '', isActive: dto.youtube.isActive ?? true } : undefined,
        tiktok: dto.tiktok ? { url: dto.tiktok.url || '', isActive: dto.tiktok.isActive ?? true } : undefined,
        whatsapp: dto.whatsapp ? { url: dto.whatsapp.url || '', isActive: dto.whatsapp.isActive ?? true } : undefined,
        telegram: dto.telegram ? { url: dto.telegram.url || '', isActive: dto.telegram.isActive ?? true } : undefined,
        snapchat: dto.snapchat ? { url: dto.snapchat.url || '', isActive: dto.snapchat.isActive ?? true } : undefined,
        address: dto.address ? { url: dto.address.url || '', isActive: dto.address.isActive ?? true } : undefined,
        phone: dto.phone ? { url: dto.phone.url || '', isActive: dto.phone.isActive ?? true } : undefined,
        email: dto.email ? { url: dto.email.url || '', isActive: dto.email.isActive ?? true } : undefined,
        website: dto.website ? { url: dto.website.url || '', isActive: dto.website.isActive ?? true } : undefined,
        appName: dto.appName ? { url: dto.appName.url || '', isActive: dto.appName.isActive ?? true } : undefined,
      },
    });

    return {
      success: true,
      message: 'Successfully updated branding and social configurations.',
      data: updated,
    };
  }

  async getBrandingSocials() {
    const setting = await this.prisma.setting.findFirst();
    const defaultField = { url: '', isActive: false };
    return {
      success: true,
      data: {
        navbarLogo: setting?.navbarLogo || '',
        footerLogo: setting?.footerLogo || '',
        facebook: setting?.facebook || defaultField,
        instagram: setting?.instagram || defaultField,
        twitter: setting?.twitter || defaultField,
        linkedin: setting?.linkedin || defaultField,
        youtube: setting?.youtube || defaultField,
        tiktok: setting?.tiktok || defaultField,
        whatsapp: setting?.whatsapp || defaultField,
        telegram: setting?.telegram || defaultField,
        snapchat: setting?.snapchat || defaultField,
        address: setting?.address || defaultField,
        phone: setting?.phone || defaultField,
        email: setting?.email || defaultField,
        website: setting?.website || defaultField,
        appName: setting?.appName || defaultField,
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

  async saveShutdown(dto: ShutdownDto) {
    const setting = await this.getOrCreateSetting();
    const updated = await this.prisma.setting.update({
      where: { id: setting.id },
      data: {
        isShutdown: dto.isShutdown,
        shutdownMessage: dto.shutdownMessage,
      },
    });

    return {
      success: true,
      message: 'Successfully updated Website Shutdown configuration.',
      data: updated,
    };
  }

  async getShutdown() {
    const setting = await this.prisma.setting.findFirst();
    return {
      success: true,
      data: {
        isShutdown: setting?.isShutdown ?? false,
        shutdownMessage: setting?.shutdownMessage || 'The website is currently undergoing maintenance. Please return later.',
      },
    };
  }
}
