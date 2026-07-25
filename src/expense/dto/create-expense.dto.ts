import { IsNumber, IsOptional, IsString } from 'class-validator';


export class CreateExpenseDto {


    @IsString()
    Title!: string;


    @IsNumber()
    Amount!: number;


    @IsString()
    Category!: string;


    @IsOptional()
    @IsString()
    Notes?: string;


}