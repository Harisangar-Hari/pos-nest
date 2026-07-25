import {
    Controller,
    Get,
    Post,
    Param,
    Body
} from '@nestjs/common';

import { SalesService } from './sales.service';


@Controller('sales')
export class SalesController {


    constructor(
        private readonly salesService: SalesService
    ) { }



    // =========================
    // CHECKOUT
    // =========================

    @Post('checkout')
    checkout(
        @Body() dto: any
    ) {

        return this.salesService.checkout(dto);

    }



    // =========================
    // GET ALL SALES
    // =========================

    @Get()
    getAll() {

        return this.salesService.getAll();

    }



    // =========================
    // GET SALE BY ID
    // =========================

    @Get(':id')
    getById(
        @Param('id') id: string
    ) {

        return this.salesService.getById(id);

    }



    // =========================
    // RETURN FULL INVOICE
    // =========================

    @Post('return/:invoiceNumber')
    returnInvoice(
        @Param('invoiceNumber') invoiceNumber: string
    ) {

        return this.salesService.returnInvoice(invoiceNumber);

    }



    // =========================
    // PAY CREDIT
    // =========================

    @Post('pay-credit/:saleId')
    payCredit(

        @Param('saleId') saleId: string,

        @Body() body: {
            amount: number
        }

    ) {

        return this.salesService.payCredit(
            saleId,
            body.amount
        );

    }



    // =========================
    // PARTIAL RETURN
    // =========================

    @Post('return')
    returnItems(
        @Body() dto: any
    ) {

        return this.salesService.returnItems(dto);

    }



    // =========================
    // GET INVOICE
    // =========================

    @Get('invoice/:invoiceNumber')
    getInvoice(

        @Param('invoiceNumber') invoiceNumber: string

    ) {

        return this.salesService.getInvoice(invoiceNumber);

    }



    // =========================
    // REPLACEMENT
    // =========================

    @Post('replacement')
    replacement(
        @Body() dto: any
    ) {

        return this.salesService.replacement(dto);

    }



}