import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRepository } from '../repositories/user.repository';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class CurrentUserGuard implements CanActivate {
  constructor(private readonly users: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const id = this.extractId(req);
    if (!id) throw new UnauthorizedException('missing user id');
    if (!UUID_REGEX.test(id)) throw new UnauthorizedException('invalid user id');

    const user = await this.users.findById(id);
    if (!user) throw new UnauthorizedException('unknown user');

    (req as Request & { user?: unknown }).user = {
      id: user.id,
      createdAt: user.createdAt,
    };
    return true;
  }

  private extractId(req: Request): string | null {
    const auth = req.header('authorization') ?? req.header('Authorization');
    if (auth) {
      const match = /^Bearer\s+(.+)$/i.exec(auth);
      if (match) return match[1].trim();
    }
    const headerId = req.header('x-user-id');
    return headerId ? headerId.trim() : null;
  }
}
