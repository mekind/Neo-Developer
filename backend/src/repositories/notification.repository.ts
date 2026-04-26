import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationCreateInput {
  userId: string;
  agentId?: string;
  kind: string;
  body: string;
  meta?: Prisma.InputJsonValue;
  createdAt?: Date;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: NotificationCreateInput) {
    return this.prisma.notification.create({ data: input });
  }

  listByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
