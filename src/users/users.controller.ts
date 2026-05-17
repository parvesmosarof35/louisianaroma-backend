import { Controller, Post, Patch, Body, UseGuards, UsePipes } from '@nestjs/common';
import { UsersService } from './users.service';
import { 
  CreateUserDto, CreateUserSchema,
  UserVerificationDto, UserVerificationSchema,
  ChangePasswordDto, ChangePasswordSchema,
  ForgotPasswordDto, ForgotPasswordSchema,
  VerificationForgotUserDto, VerificationForgotUserSchema,
  ResetPasswordDto, ResetPasswordSchema
} from './users.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create_user')
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create_user(dto);
  }

  @Patch('user_verification')
  @UsePipes(new ZodValidationPipe(UserVerificationSchema))
  async verify(@Body() dto: UserVerificationDto) {
    return this.usersService.user_verification(dto);
  }

  @Patch('change_password')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.change_password(user.id, dto);
  }

  @Post('forgot_password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.usersService.forgot_password(dto);
  }

  @Post('verification_forgot_user')
  @UsePipes(new ZodValidationPipe(VerificationForgotUserSchema))
  async verifyForgot(@Body() dto: VerificationForgotUserDto) {
    return this.usersService.verification_forgot_user(dto);
  }

  @Post('reset_password')
  @UseGuards(OptionalJwtAuthGuard)
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(
    @CurrentUser() user: any,
    @Body() dto: ResetPasswordDto,
  ) {
    const authUserId = user ? user.id : undefined;
    return this.usersService.reset_password(dto, authUserId);
  }
}
