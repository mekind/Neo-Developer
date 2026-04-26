import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BootstrapUserMemoryDto } from './dto/bootstrap-user-memory.dto';
import { MemoryService } from './memory.service';

@Controller('memory/users')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post(':userId/bootstrap')
  bootstrap(@Param('userId') userId: string, @Body() dto: BootstrapUserMemoryDto) {
    return this.memoryService.bootstrapUser(userId, dto);
  }

  @Get(':userId')
  getStatus(@Param('userId') userId: string) {
    return this.memoryService.getUserStatus(userId);
  }
}
