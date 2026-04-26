import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { AppendLogDto } from './dto/append-log.dto';
import { PutMemoryDocumentDto } from './dto/put-memory-document.dto';
import { MemoryService } from './memory.service';

@Controller('users/:userId')
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Get('memory')
  list(@Param('userId') userId: string) {
    return this.memory.listForUser(userId);
  }

  @Get('memory/*')
  getOne(@Param('userId') userId: string, @Param('0') path: string) {
    return this.memory.getDoc(userId, path);
  }

  @Put('memory/*')
  put(
    @Param('userId') userId: string,
    @Param('0') path: string,
    @Body() dto: PutMemoryDocumentDto,
  ) {
    return this.memory.putDoc(userId, path, dto);
  }

  @Post('log')
  appendLog(@Param('userId') userId: string, @Body() dto: AppendLogDto) {
    return this.memory.appendLog(userId, dto);
  }
}
