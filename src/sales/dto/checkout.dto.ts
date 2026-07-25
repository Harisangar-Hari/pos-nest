import {
    IsArray,
    IsNumber,
    IsOptional,
    IsUUID,
    ValidateNested
} from "class-validator";

import { Type } from "class-transformer";


export class CartItemDto {

    @IsUUID()
    productId!: string;


    @IsNumber()
    quantity!: number;

}



export class CreateCheckoutDto {


    @IsOptional()
    @IsUUID()
    customerId?: string;



    @IsOptional()
    customerName?: string;



    @IsOptional()
    customerPhone?: string;



    @IsNumber()
    paidAmount!: number;



    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    items!: CartItemDto[];

}