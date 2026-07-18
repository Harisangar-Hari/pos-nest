
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('test')
export class TestController {
    constructor(
        private prisma: PrismaService
    ) { }

    @Get()
    async testDatabase() {

        const products = await this.prisma.customers.findMany({
            take: 5
        });

        return products;
    }
}
