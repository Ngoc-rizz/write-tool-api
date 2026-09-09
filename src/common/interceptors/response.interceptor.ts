import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, map } from "rxjs";
import { RESPONSE_MSG_KEY } from "../decorators/response-message.decorator";

interface Response<T> {
    success: boolean;
    statusCode: number;
    message: string;
    timestamp: Date;
    data: T;
}
@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, Response<T>> {

    constructor(private reflector: Reflector) { } // DI

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> | Promise<Observable<Response<T>>> {
        const msg = this.reflector.get<string>(RESPONSE_MSG_KEY, context.getHandler()) ?? 'Success'

        const statusCode = context.switchToHttp().getResponse().statusCode;

        return next.handle().pipe(
            map((data) => ({
                success: true,
                statusCode,
                message: msg,
                timestamp: new Date(),
                data,
            })),
        );
    }
}