import { IsNumber, IsUUID } from 'class-validator';


export class PayCustomerCreditDto {


    @IsUUID()
    CustomerId!: string;


    @IsNumber()
    Amount!: number;


    SaleIds?: string[];

}