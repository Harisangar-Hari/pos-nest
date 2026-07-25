import {
    IsString,
    IsNumber,
    IsInt,
    IsUUID
} from 'class-validator';


export class CreateProductDto {


    @IsString()
    name!: string;


    @IsString()
    barcode!: string;


    @IsString()
    sku!: string;


    @IsNumber()
    price!: number;


    @IsNumber()
    costPrice!: number;


    @IsInt()
    stockQty!: number;


    @IsInt()
    reorderLevel!: number;


    @IsUUID()
    categoryId!: string;


}