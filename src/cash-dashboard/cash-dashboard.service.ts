import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';


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

}