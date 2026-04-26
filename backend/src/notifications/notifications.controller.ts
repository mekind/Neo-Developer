import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ServiceTokenGuard } from './guards/service-token.guard';

@ApiTags('notifications')
@Controller('users/:userId/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @UseGuards(ServiceTokenGuard)
  @ApiBearerAuth('BACKEND_SERVICE_TOKEN')
  @ApiOperation({
    summary: '알림 생성 (시스템용)',
    description: '서비스 토큰 인증이 필요합니다.',
  })
  @ApiParam({ name: 'userId', description: '사용자 uuid' })
  create(
    @Param('userId') userId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notifications.create(userId, dto);
  }
}
