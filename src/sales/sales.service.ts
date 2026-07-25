import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashLedgerService } from '../cash-ledger/cash-ledger.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { randomUUID } from 'crypto';
import { CreateSaleReturnDto } from './dto/return-sale.dto';



@Injectable()
export class SalesService {


    constructor(

        private prisma: PrismaService,

        private cashLedger: CashLedgerService

    ) { }



    async checkout(dto: CreateCheckoutDto) {

        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException("Cart is empty");
        }


        return await this.prisma.$transaction(
            async (tx) => {

                let total = 0;

                let customer: any = null;


                // ============================
                // CUSTOMER
                // ============================

                if (dto.customerId) {

                    customer = await tx.customers.findUnique({
                        where: {
                            Id: dto.customerId
                        }
                    });


                    if (!customer) {
                        throw new BadRequestException(
                            "Customer not found"
                        );
                    }

                }



                else if (dto.customerPhone) {


                    customer =
                        await tx.customers.findFirst({

                            where: {
                                Phone: dto.customerPhone
                            }

                        });



                    if (!customer) {

                        customer =
                            await tx.customers.create({

                                data: {

                                    Id: randomUUID(),

                                    Name:
                                        dto.customerName ?? "Unknown",

                                    Phone:
                                        dto.customerPhone,

                                    CreatedAt:
                                        new Date(),

                                    LoyaltyPoints: 0,

                                    TotalSpent: 0,

                                    LoyaltyTier: "Bronze"

                                }

                            });

                    }

                }





                // ============================
                // CREATE SALE
                // ============================


                const sale =
                    await tx.sales.create({

                        data: {


                            Id: randomUUID(),

                            InvoiceNumber:
                                "INV-" + Date.now(),


                            CreatedAt:
                                new Date(),


                            Status: 0,


                            TotalAmount: 0,

                            PaidAmount: 0,

                            BalanceAmount: 0,


                            CustomerId:
                                customer?.Id ?? null,


                            IsCreditSale: false


                        }

                    });






                // ============================
                // PRODUCTS
                // ============================


                for (const item of dto.items) {


                    const product =
                        await tx.products.findUnique({

                            where: {
                                Id: item.productId
                            }

                        });



                    if (!product) {

                        throw new BadRequestException(
                            "Product not found"
                        );

                    }



                    if (product.StockQty < item.quantity) {

                        throw new BadRequestException(
                            `Not enough stock ${product.Name}`
                        );

                    }




                    const itemTotal =
                        Number(product.Price)
                        *
                        item.quantity;



                    total += itemTotal;



                    await tx.products.update({

                        where: {
                            Id: product.Id
                        },


                        data: {

                            StockQty: {
                                decrement: item.quantity
                            }

                        }

                    });




                    await tx.saleItems.create({

                        data: {


                            Id: randomUUID(),


                            SaleId: sale.Id,


                            ProductId: product.Id,


                            Quantity: item.quantity,


                            UnitPrice:
                                product.Price,


                            Total: itemTotal


                        }

                    });


                }







                // ============================
                // PAYMENT
                // ============================


                const paid =
                    dto.paidAmount ?? 0;



                const balance =
                    total - paid;




                await tx.sales.update({

                    where: {
                        Id: sale.Id
                    },


                    data: {


                        TotalAmount: total,


                        PaidAmount: paid,


                        BalanceAmount:
                            balance > 0
                                ? balance
                                : 0,


                        IsCreditSale:
                            balance > 0


                    }

                });








                // ============================
                // CREDIT PAYMENT
                // ============================


                if (paid > 0) {


                    await tx.creditPayments.create({

                        data: {


                            Id: randomUUID(),


                            SaleId: sale.Id,


                            Amount: paid,


                            PaidAt: new Date()


                        }

                    });

                }







                // ============================
                // CUSTOMER LEDGER
                // ============================


                if (customer && balance > 0) {


                    await tx.customerLedgerEntries.create({

                        data: {


                            Id: randomUUID(),


                            CustomerId:
                                customer.Id,


                            SaleId:
                                sale.Id,


                            Credit:
                                balance,


                            Debit: 0,


                            Type: "SALE",


                            CreatedAt:
                                new Date()


                        }

                    });


                }







                // ============================
                // LOYALTY
                // ============================


                if (customer) {


                    const points =
                        Math.floor(total / 2000);



                    await tx.customers.update({

                        where: {
                            Id: customer.Id
                        },


                        data: {


                            TotalSpent: {
                                increment: total
                            },


                            LoyaltyPoints: {
                                increment: points
                            }


                        }

                    });


                }






                return {


                    message:
                        "Sale completed",


                    InvoiceNumber:
                        sale.InvoiceNumber,


                    TotalAmount:
                        total,


                    PaidAmount:
                        paid,


                    BalanceAmount:
                        balance > 0
                            ? balance
                            : 0,


                    CustomerId:
                        customer?.Id ?? null


                };


            },
            {
                timeout: 15000,
                maxWait: 5000
            }
        );

    }


    async getAll() {
        const sales = await this.prisma.sales.findMany({
            orderBy: {
                CreatedAt: "desc",
            },

            include: {
                Customers: true,

                SaleItems: {
                    include: {
                        Products: true,
                    },
                },
            },
        });

        return sales.map((sale) => ({
            ...sale,

            itemsCount: sale.SaleItems.length,
        }));
    }

    async getById(id: string) {


        const sale =
            await this.prisma.sales.findUnique({


                where: {
                    Id: id
                },


                include: {


                    Customers: true,


                    SaleItems: {
                        include: {
                            Products: true
                        }
                    },


                    CreditPayments: true


                }


            });



        if (!sale) {

            throw new NotFoundException(
                "Sale not found"
            );

        }


        return sale;


    }

    async payCredit(
        saleId: string,
        amount: number
    ) {



        const sale =
            await this.prisma.sales.findUnique({

                where: {
                    Id: saleId
                }

            });



        if (!sale) {

            throw new NotFoundException(
                "Sale not found"
            );

        }



        if (amount <= 0) {

            throw new BadRequestException(
                "Invalid amount"
            );

        }



        const balance =
            Number(sale.BalanceAmount);



        if (amount > balance) {

            throw new BadRequestException(
                "Exceeds balance"
            );

        }



        const newBalance =
            balance - amount;



        const newPaid =
            Number(sale.PaidAmount) + amount;



        await this.prisma.creditPayments.create({

            data: {


                Id: crypto.randomUUID(),

                SaleId: sale.Id,

                Amount: amount,

                PaidAt: new Date()


            }


        });




        await this.prisma.sales.update({

            where: {
                Id: sale.Id
            },


            data: {


                PaidAmount: newPaid,


                BalanceAmount: newBalance,


                IsCreditSale: newBalance > 0


            }


        });




        // CASH LEDGER

        await this.cashLedger.add(

            "IN",

            amount,

            "CREDIT_PAYMENT",

            sale.InvoiceNumber,

            `Credit payment received for ${sale.InvoiceNumber}`

        );



        return {


            message: "Credit payment successful",


            PaidAmount: newPaid,


            BalanceAmount: newBalance


        };


    }

    async returnInvoice(
        invoiceNumber: string
    ) {



        const sale =
            await this.prisma.sales.findFirst({

                where: {
                    InvoiceNumber: invoiceNumber
                },


                include: {
                    SaleItems: true
                }


            });



        if (!sale) {

            throw new NotFoundException(
                "Invoice not found"
            );

        }



        if (sale.Status === 1) {

            throw new BadRequestException(
                "Already returned"
            );

        }




        for (const item of sale.SaleItems) {


            await this.prisma.products.update({

                where: {
                    Id: item.ProductId
                },


                data: {


                    StockQty: {
                        increment: item.Quantity
                    }


                }


            });


        }





        const saleReturn =
            await this.prisma.saleReturns.create({

                data: {


                    Id: crypto.randomUUID(),

                    SaleId: sale.Id,

                    Reason: "Customer Return",

                    ReturnedAt: new Date()


                }


            });





        await this.prisma.sales.update({

            where: {
                Id: sale.Id
            },

            data: {


                Status: 1,


                PaidAmount: 0,


                BalanceAmount: 0,


                IsCreditSale: false


            }


        });




        return {


            message: "Return processed",

            invoiceNumber


        };


    }

    async returnItems(dto: CreateSaleReturnDto) {


        const sale =
            await this.prisma.sales.findFirst({

                where: {

                    InvoiceNumber: dto.invoiceNumber

                },

                include: {

                    SaleItems: true

                }

            });



        if (!sale) {

            throw new NotFoundException(
                "Invoice not found"
            );

        }



        let totalRefund = 0;



        // ============================
        // CREATE SALE RETURN
        // ============================

        const saleReturn =
            await this.prisma.saleReturns.create({

                data: {

                    Id: crypto.randomUUID(),

                    SaleId: sale.Id,

                    Reason: dto.reason,

                    ReturnedAt: new Date(),

                    ReturnAmount: 0

                }

            });





        // ============================
        // RETURN ITEMS
        // ============================

        for (const item of dto.items) {



            const saleItem =
                sale.SaleItems.find(

                    x =>
                        x.ProductId === item.productId

                );



            if (!saleItem) {

                throw new BadRequestException(
                    "Invalid product"
                );

            }





            const refund =
                Number(saleItem.UnitPrice)
                *
                item.quantity;



            totalRefund += refund;





            // ============================
            // RESTORE STOCK
            // ============================

            await this.prisma.products.update({

                where: {

                    Id: item.productId

                },


                data: {

                    StockQty: {

                        increment: item.quantity

                    }

                }

            });







            // ============================
            // CREATE RETURN ITEM
            // ============================

            await this.prisma.saleReturnItems.create({

                data: {


                    Id: crypto.randomUUID(),


                    SaleReturnId:
                        saleReturn.Id,


                    ProductId:
                        item.productId,


                    Quantity:
                        item.quantity,


                    UnitPrice:
                        saleItem.UnitPrice,


                    Reason:
                        dto.reason


                }

            });


        }







        // ============================
        // UPDATE RETURN TOTAL
        // ============================


        await this.prisma.saleReturns.update({

            where: {

                Id: saleReturn.Id

            },


            data: {


                ReturnAmount:
                    totalRefund


            }

        });








        // ============================
        // UPDATE SALE
        // ============================


        await this.prisma.sales.update({

            where: {

                Id: sale.Id

            },


            data: {


                HasReturns: true,


                ReturnedAmount: {

                    increment:
                        totalRefund

                },


                BalanceAmount: {

                    decrement:
                        totalRefund

                }


            }

        });







        // ============================
        // CUSTOMER LEDGER
        // ============================


        if (sale.CustomerId) {


            await this.prisma.customerLedgerEntries.create({

                data: {


                    Id:
                        crypto.randomUUID(),


                    CustomerId:
                        sale.CustomerId,


                    SaleId:
                        sale.Id,


                    SaleReturnId:
                        saleReturn.Id,


                    Debit:
                        totalRefund,


                    Credit:
                        0,


                    Type:
                        "RETURN",


                    CreatedAt:
                        new Date()


                }

            });


        }







        // ============================
        // CASH LEDGER
        // ============================

        await this.cashLedger.add(

            "OUT",

            totalRefund,

            "RETURN",

            dto.invoiceNumber,

            `Refund for ${dto.invoiceNumber}`

        );







        return {


            message:
                "Return processed successfully",


            refund:
                totalRefund,


            invoiceNumber:
                dto.invoiceNumber


        };


    }

    async getInvoice(
        invoiceNumber: string
    ) {


        const sale =
            await this.prisma.sales.findFirst({

                where: {
                    InvoiceNumber: invoiceNumber
                },


                include: {


                    Customers: true,


                    SaleItems: {
                        include: {
                            Products: true
                        }
                    },


                    CreditPayments: true


                }


            });



        if (!sale) {

            throw new NotFoundException(
                "Invoice not found"
            );

        }



        return sale;


    }

    async replacement(dto: any) {

        let total = 0;


        const saleId = crypto.randomUUID();


        // FIX HERE
        const items: any[] = [];



        for (const item of dto.Items) {


            const product =
                await this.prisma.products.findUnique({

                    where: {
                        Id: item.ProductId
                    }

                });


            if (!product) {

                throw new BadRequestException(
                    "Product not found"
                );

            }



            await this.prisma.products.update({

                where: {
                    Id: item.ProductId
                },

                data: {

                    StockQty: {
                        decrement: item.Quantity
                    }

                }

            });



            const line =
                Number(product.Price) *
                item.Quantity;



            total += line;



            items.push({

                Id: crypto.randomUUID(),

                SaleId: saleId,

                ProductId: item.ProductId,

                Quantity: item.Quantity,

                UnitPrice: product.Price,

                Total: line

            });


        }



        const sale =
            await this.prisma.sales.create({

                data: {


                    Id: saleId,

                    InvoiceNumber:
                        "INV-" + Date.now(),

                    CreatedAt: new Date(),

                    Status: 0,

                    TotalAmount: total,

                    PaidAmount: total,

                    BalanceAmount: 0,


                    SaleItems: {
                        create: items
                    }


                }

            });


        return {

            message: "Replacement created",

            InvoiceNumber: sale.InvoiceNumber,

            Id: sale.Id,

            TotalAmount: sale.TotalAmount

        };


    }



}