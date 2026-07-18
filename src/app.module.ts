import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestController } from './test/test.controller';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,
  ],

  controllers: [
    AppController,
    TestController,
  ],

  providers: [
    AppService,
  ],
})
export class AppModule { }