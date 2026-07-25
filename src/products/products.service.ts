import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';


@Injectable()
export class ProductsService {


    constructor(
        private prisma: PrismaService
    ) { }



    // GET ALL PRODUCTS

    async findAll() {


        return await this.prisma.products.findMany({

            include: {
                Categories: true
            }

        });


    }



    // GET PRODUCT BY ID

    async findOne(id: string) {


        return await this.prisma.products.findUnique({

            where: {
                Id: id
            },

            include: {
                Categories: true
            }

        });


    }



    // CREATE PRODUCT

    async create(dto: CreateProductDto) {


        return await this.prisma.products.create({

            data: {


                Id:
                    crypto.randomUUID(),

                Name:
                    dto.name,

                Barcode:
                    dto.barcode,

                SKU:
                    dto.sku,

                Price:
                    dto.price,

                CostPrice:
                    dto.costPrice,

                StockQty:
                    dto.stockQty,

                ReorderLevel:
                    dto.reorderLevel,

                CategoryId:
                    dto.categoryId,

                IsActive: true


            }

        });


    }



    // UPDATE PRODUCT


    async update(
        id: string,
        dto: CreateProductDto
    ) {


        return await this.prisma.products.update({

            where: {
                Id: id
            },


            data: {


                Name: dto.name,

                Barcode: dto.barcode,

                SKU: dto.sku,

                Price: dto.price,

                CostPrice: dto.costPrice,

                StockQty: dto.stockQty,

                ReorderLevel: dto.reorderLevel,

                CategoryId: dto.categoryId


            }


        });


    }



    // DELETE PRODUCT


    async remove(id: string) {


        await this.prisma.products.delete({

            where: {
                Id: id
            }

        });


        return {
            message: "Deleted successfully"
        };


    }



    // GET BY BARCODE


    async findByBarcode(barcode: string) {


        return await this.prisma.products.findFirst({

            where: {
                Barcode: barcode
            },

            include: {
                Categories: true
            }

        });


    }



    // SEARCH PRODUCT


    async search(search?: string) {


        if (!search) {

            return await this.prisma.products.findMany({
                include: {
                    Categories: true
                }
            });

        }



        return await this.prisma.products.findMany({

            where: {

                OR: [

                    {
                        Name: {
                            contains: search
                        }
                    },

                    {
                        Barcode: {
                            contains: search
                        }
                    },

                    {
                        SKU: {
                            contains: search
                        }
                    }

                ]

            },

            include: {
                Categories: true
            }


        });


    }


}