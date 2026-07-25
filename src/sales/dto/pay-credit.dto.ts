import { IsNumber } from "class-validator";


export class PayCreditDto {


    @IsNumber()
    Amount!: number;

}