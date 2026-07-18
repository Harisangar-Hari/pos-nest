import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    PrismaModule,

    ConfigModule,

    JwtModule.registerAsync({

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({

        secret: configService.get<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: '1d',
        },

      }),

    }),

  ],

  controllers: [
    AuthController
  ],

  providers: [
    AuthService
  ],

  exports: [
    AuthService
  ]

})
export class AuthModule { }