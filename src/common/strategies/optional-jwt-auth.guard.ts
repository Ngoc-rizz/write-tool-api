import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Không ném lỗi (UnauthorizedException) nếu không có user hợp lệ
    // Chỉ cần trả về user nếu có, hoặc null nếu không
    return user || null;
  }
}
