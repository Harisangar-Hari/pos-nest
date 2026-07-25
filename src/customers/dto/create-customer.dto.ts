import { IsString } from 'class-validator';


export class CreateCustomerDto {

    @IsString()
    Name!: string;


    @IsString()
    Phone!: string;

}