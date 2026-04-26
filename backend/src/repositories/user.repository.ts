import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface IUserRepository {
  create(): Promise<User>;
  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  create() {
    return this.prisma.user.create({ data: {} });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }
}
