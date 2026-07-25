import {
    Controller,
    Get,
    Query
} from '@nestjs/common';


import { CashDashboardService }
    from './cash-dashboard.service';


@Controller('cash-dashboard')
export class CashDashboardController {


    constructor(
        private service: CashDashboardService
    ) { }



    @Get('daily')
    async getDaily(
        @Query('date') date: string
    ) {


        return this.service.getDaily(
            new Date(date)
        );

    }


}