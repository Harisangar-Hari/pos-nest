import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CashLedgerService } from '../cash-ledger/cash-ledger.service';

import { CreateCustomerDto } from './dto/create-customer.dto';
import { PayCustomerCreditDto } from './dto/pay-customer-credit.dto';


@Injectable()
export class CustomersService {


    constructor(
        private prisma: PrismaService,
        private cashLedger: CashLedgerService
    ) { }



    // =========================
    // GET ALL CUSTOMERS
    // =========================

    async getAllCustomers() {

        return this.prisma.customers.findMany({

            orderBy: {
                CreatedAt: 'desc'
            },

            select: {
                Id: true,
                Name: true,
                Phone: true,
                LoyaltyPoints: true,
                LoyaltyTier: true,
                TotalSpent: true,
                CreatedAt: true
            }

        });

    }



    // =========================
    // CREDIT SUMMARY
    // =========================

    async getCreditSummary() {


        const customers =
            await this.prisma.customers.findMany({

                select: {


                    Id: true,
                    Name: true,
                    Phone: true,

                    LoyaltyPoints: true,
                    LoyaltyTier: true,


                    Sales: {


                        where: {
                            BalanceAmount: {
                                gt: 0
                            }
                        },


                        select: {


                            TotalAmount: true,
                            PaidAmount: true,
                            BalanceAmount: true,
                            Id: true


                        }


                    }



                }

            });



        return customers.map(customer => {


            const sales = customer.Sales;


            const totalPurchases =
                sales.reduce(
                    (sum, s) => sum + Number(s.TotalAmount),
                    0
                );


            const totalPaid =
                sales.reduce(
                    (sum, s) => sum + Number(s.PaidAmount),
                    0
                );


            const totalBalance =
                sales
                    .filter(s => Number(s.BalanceAmount) > 0)
                    .reduce(
                        (sum, s) => sum + Number(s.BalanceAmount),
                        0
                    );



            return {


                Id: customer.Id,

                Name: customer.Name,

                Phone: customer.Phone,


                LoyaltyPoints:
                    customer.LoyaltyPoints,


                LoyaltyTier:
                    customer.LoyaltyTier,


                TotalPurchases:
                    totalPurchases,


                TotalPaid:
                    totalPaid,


                TotalBalance:
                    totalBalance,


                ActiveCreditSales:
                    sales.filter(
                        s => Number(s.BalanceAmount) > 0
                    ).length,


                TotalInvoices:
                    sales.length



            };



        });


    }



    // =========================
    // GET CUSTOMER DETAILS
    // =========================

    async getCustomerById(id: string) {


        const customer =
            await this.prisma.customers.findUnique({

                where: {
                    Id: id
                },


                include: {


                    Sales: {


                        include: {


                            SaleItems: {


                                include: {
                                    Products: true
                                }


                            },


                            CreditPayments: true


                        }


                    }


                }


            });



        if (!customer) {

            throw new NotFoundException(
                "Customer not found"
            );

        }



        return {


            Id: customer.Id,

            Name: customer.Name,

            Phone: customer.Phone,

            LoyaltyPoints: customer.LoyaltyPoints,

            LoyaltyTier: customer.LoyaltyTier,

            TotalSpent: customer.TotalSpent,


            Sales: customer.Sales.map(s => ({


                Id: s.Id,

                InvoiceNumber: s.InvoiceNumber,

                TotalAmount: s.TotalAmount,

                PaidAmount: s.PaidAmount,

                BalanceAmount: s.BalanceAmount,

                CreatedAt: s.CreatedAt


            }))


        };



    }



    // =========================
    // CREATE CUSTOMER
    // =========================

    async createCustomer(dto: CreateCustomerDto) {



        const exists =
            await this.prisma.customers.findFirst({

                where: {
                    Phone: dto.Phone
                }

            });


        if (exists) {

            throw new BadRequestException(
                "Phone already exists"
            );

        }



        const customer =
            await this.prisma.customers.create({

                data: {


                    Id: crypto.randomUUID(),

                    Name: dto.Name,

                    Phone: dto.Phone,

                    CreatedAt: new Date(),

                    LoyaltyPoints: 0,

                    TotalSpent: 0,

                    LoyaltyTier: "Bronze"


                }


            });



        return {


            Id: customer.Id,

            Name: customer.Name,

            Phone: customer.Phone,

            LoyaltyPoints: customer.LoyaltyPoints,

            LoyaltyTier: customer.LoyaltyTier


        };



    }



    // =========================
    // SEARCH CUSTOMER
    // =========================

    async searchCustomers(q: string) {


        if (!q || q.trim() === "") {

            return [];

        }



        return this.prisma.customers.findMany({

            where: {


                OR: [


                    {
                        Name: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    },


                    {
                        Phone: {
                            contains: q
                        }
                    }


                ]


            },


            take: 20,


            select: {


                Id: true,

                Name: true,

                Phone: true,

                LoyaltyPoints: true,

                LoyaltyTier: true


            }


        });


    }




    // =========================
    // PAY CUSTOMER CREDIT
    // =========================

    async payCustomerCredit(
        dto: PayCustomerCreditDto
    ) {



        const customer =
            await this.prisma.customers.findUnique({

                where: {
                    Id: dto.customerId
                },


                include: {
                    Sales: true
                }


            });



        if (!customer) {

            throw new NotFoundException(
                "Customer not found"
            );

        }



        let remaining = dto.amount;



        const unpaidSales =
            customer.Sales
                .filter(
                    s =>
                        Number(s.BalanceAmount) > 0 &&
                        s.Status !== 1
                )
                .sort(
                    (a, b) =>
                        a.CreatedAt.getTime() -
                        b.CreatedAt.getTime()
                );



        for (const sale of unpaidSales) {


            if (remaining <= 0)
                break;



            const pay =
                Math.min(
                    Number(sale.BalanceAmount),
                    remaining
                );



            await this.prisma.sales.update({

                where: {
                    Id: sale.Id
                },

                data: {


                    PaidAmount: {
                        increment: pay
                    },


                    BalanceAmount: {
                        decrement: pay
                    },


                    IsCreditSale: false

                }



            });



            await this.prisma.creditPayments.create({

                data: {


                    Id: crypto.randomUUID(),

                    SaleId: sale.Id,

                    Amount: pay,

                    PaidAt: new Date()


                }


            });



            this.cashLedger.add(

                "IN",

                pay,

                "CREDIT_PAYMENT",

                sale.InvoiceNumber,

                `Credit payment received for Invoice ${sale.InvoiceNumber}`

            );



            remaining -= pay;


        }



        await this.prisma.$executeRaw`SELECT 1`;



        return {


            message: "Payment allocated successfully",

            remainingUnallocated: remaining


        };



    }



    // =========================
    // CUSTOMER INVOICES
    // =========================

    async getCustomerInvoices(id: string) {


        const customer =
            await this.prisma.customers.findUnique({

                where: {
                    Id: id
                },


                include: {
                    Sales: true
                }


            });


        if (!customer) {

            throw new NotFoundException(
                "Customer not found"
            );

        }



        return {


            customer: {


                Id: customer.Id,

                Name: customer.Name,

                Phone: customer.Phone


            },


            invoices:
                customer.Sales
                    .sort(
                        (a, b) =>
                            b.CreatedAt.getTime() -
                            a.CreatedAt.getTime()
                    )
                    .map(s => ({


                        Id: s.Id,

                        InvoiceNumber: s.InvoiceNumber,

                        TotalAmount: s.TotalAmount,

                        PaidAmount: s.PaidAmount,


                        BalanceAmount:
                            Number(s.BalanceAmount) > 0
                                ? s.BalanceAmount
                                : 0,


                        CreatedAt: s.CreatedAt


                    }))


        };


    }


}