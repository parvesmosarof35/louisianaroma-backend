import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards, UsePipes, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto, RegisterSchema, LoginDto, LoginSchema } from './auth.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // https://api.louisianaroma.com/api/v1/auth/login_user
  @Post('login_user')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async loginUser(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  async refresh(@Body('refreshToken') bodyToken: string, @Req() req: any) {
    // Check if token exists in body, cookies, or authorization header
    const token = bodyToken || req.cookies?.refreshToken || req.headers['authorization']?.replace('Bearer ', '');
    return this.authService.refreshToken(token);
  }

  @Get('myprofile')
  @UseGuards(JwtAuthGuard)
  async myprofile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Patch('update_my_profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFile() file?: any,
  ) {
    // Parse form-data body.data if present (Postman serialized JSON)
    let parsedData = {};
    if (body.data) {
      try {
        parsedData = JSON.parse(body.data);
      } catch (e) {
        parsedData = body;
      }
    } else {
      parsedData = body;
    }

    let fileUrl: string | undefined;
    if (file) {
      // Intuitively mock build a Cloudinary URL reflecting their credentials!
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dhxyjdrvr';
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      fileUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1776100000/${cleanFileName}`;
    }

    return this.authService.updateProfile(user.id, parsedData, fileUrl);
  }

  @Delete('delete_account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: any) {
    return this.authService.deleteAccount(user.id);
  }

  @Patch('undo_delete_account/:id')
  async undoDeleteAccount(@Param('id') id: string) {
    return this.authService.undoDeleteAccount(id);
  }
}
