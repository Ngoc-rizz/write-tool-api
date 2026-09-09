import { Module } from "@nestjs/common";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

@Module({
    imports: [],
    controllers: [],
    providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
    ],
    exports: [],
})

export class CommonModule { }