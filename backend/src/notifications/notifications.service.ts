import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { UserRepository } from '../repositories/user.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly users: UserRepository,
  ) {}

  async create(userId: string, dto: CreateNotificationDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const createdAt = dto.ts ? new Date(dto.ts) : undefined;
    
    return this.notifications.create({
      userId,
      agentId: dto.agentId,
      kind: dto.kind,
      body: dto.body,
      meta: dto.meta,
      createdAt,
    });
  }
}
