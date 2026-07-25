import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    NotFoundException
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';



@Controller('products')
export class ProductsController {


    constructor(
        private service: ProductsService
    ) { }

    @Get('name')
    search(
        @Query('search') search: string
    ) {

        return this.service.search(search);

    }

    // GET ALL

    @Get()
    findAll() {

        return this.service.findAll();

    }



    // GET BY ID

    @Get(':id')
    async findOne(
        @Param('id') id: string
    ) {

        const product =
            await this.service.findOne(id);


        if (!product)
            throw new NotFoundException();


        return product;

    }



    // CREATE

    @Post()
    create(
        @Body() dto: CreateProductDto
    ) {

        return this.service.create(dto);

    }



    // UPDATE

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() dto: CreateProductDto
    ) {

        return this.service.update(
            id,
            dto
        );

    }



    // DELETE

    @Delete(':id')
    remove(
        @Param('id') id: string
    ) {

        return this.service.remove(id);

    }



    // BARCODE SEARCH

    @Get('barcode/:barcode')
    findBarcode(
        @Param('barcode') barcode: string
    ) {

        return this.service.findByBarcode(barcode);

    }



    // NAME SEARCH




}