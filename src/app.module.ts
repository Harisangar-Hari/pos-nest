import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestController } from './test/test.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}
