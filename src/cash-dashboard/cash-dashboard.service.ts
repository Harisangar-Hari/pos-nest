import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ManualCashDto } from './dto/manual-cash.dto';


@Injectable()
export class CashDashboardService {


    constructor(
        private prisma: PrismaService,
    ) { }



    async getDaily(date: Date) {


        // Same as:
        // DateTime.SpecifyKind(date, DateTimeKind.Utc)

        const utcDate = new Date(
            Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            )
        );


        const start = utcDate;


        const end = new Date(start);

        end.setUTCDate(
            end.getUTCDate() + 1
        );



        const entries =
            await this.prisma.cashLedgerEntries.findMany({

                where: {
                    Date: {
                        gte: start,
                        lt: end,
                    },
                },

                orderBy: {
                    Date: 'asc',
                },

            });



        const totalIn =
            entries
                .filter(
                    x => x.Type === "IN"
                )
                .reduce(
                    (sum, x) => sum + Number(x.Amount),
                    0
                );



        const totalOut =
            entries
                .filter(
                    x => x.Type === "OUT"
                )
                .reduce(
                    (sum, x) => sum + Number(x.Amount),
                    0
                );



        const balance =
            totalIn - totalOut;



        return {

            date: start,

            totalIn,

            totalOut,

            balance,

            entries,

        };

    }

    async addManualCash(
    dto: ManualCashDto
) {

    if (dto.amount <= 0) {

        throw new BadRequestException(
            'Amount must be greater than zero'
        );

    }

    await this.prisma.cashLedgerEntries.create({

        data: {

            Id: crypto.randomUUID(),

            Date: new Date(),

            CreatedAt: new Date(),

            Type: dto.type,

            Amount: dto.amount,

            Category: dto.category,

            Description: dto.description ?? 'Manual Cash Entry',

            ReferenceId: null

        }

    });

    return {

        message: 'Manual cash entry added successfully'

    };

}

}