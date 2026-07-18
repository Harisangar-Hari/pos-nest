import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }


    // =========================
    // REGISTER
    // =========================

    async register(dto: RegisterDto) {

        const exists = await this.prisma.users.findFirst({
            where: {
                Username: dto.username
            }
        });


        if (exists) {
            throw new BadRequestException(
                "Username already exists"
            );
        }


        const passwordHash = await bcrypt.hash(
            dto.password,
            10
        );


        const user = await this.prisma.users.create({

            data: {
                Id: crypto.randomUUID(),

                Username: dto.username,

                PasswordHash: passwordHash,

                Role: dto.role ?? "Cashier",

                CreatedAt: new Date(),

            }

        });


        return {
            message: "User created successfully"
        };

    }



    // =========================
    // LOGIN
    // =========================

    async login(dto: LoginDto) {


        const user = await this.prisma.users.findFirst({

            where: {
                Username: dto.username
            }

        });


        if (!user) {

            throw new UnauthorizedException(
                "Invalid username or password"
            );

        }



        const validPassword =
            await bcrypt.compare(
                dto.password,
                user.PasswordHash
            );



        if (!validPassword) {

            throw new UnauthorizedException(
                "Invalid username or password"
            );

        }



        const token =
            this.generateToken(user);



        return {

            token,

            user: {
                Id: user.Id,
                Username: user.Username,
                Role: user.Role
            }

        };

    }



    // =========================
    // JWT TOKEN
    // =========================

    private generateToken(user: any) {


        const payload = {

            sub: user.Id,

            username: user.Username,

            role: user.Role

        };


        return this.jwtService.sign(payload);

    }

}