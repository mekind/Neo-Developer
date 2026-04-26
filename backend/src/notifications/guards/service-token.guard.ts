import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    
    const token = process.env.BACKEND_SERVICE_TOKEN;
    if (!token) {
      throw new UnauthorizedException('Service token not configured');
    }

    if (authHeader !== `Bearer ${token}`) {
      throw new UnauthorizedException('Invalid service token');
    }

    return true;
  }
}
