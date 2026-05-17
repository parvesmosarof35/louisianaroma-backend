import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailerService } from '../common/services/mailer.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET') || '0ab803014b805f51442b4909e5b90e44068499c71ab85cbee51d96911cfae4e2',
        signOptions: {
          expiresIn: (configService.get<string>('EXPIRES_IN') || '10d') as any,
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, MailerService],
  exports: [UsersService],
})
export class UsersModule {}
