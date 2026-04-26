import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '서비스 상태 + DB ping' })
  @ApiOkResponse({
    schema: {
      example: {
        status: 'ok',
        db: 'ok',
        timestamp: '2026-04-26T10:00:00.000Z',
      },
    },
  })
  async check() {
    let db: 'ok' | 'error' = 'ok';
    let dbError: string | undefined;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      db = 'error';
      dbError = err instanceof Error ? err.message : String(err);
    }

    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      db,
      ...(dbError ? { dbError } : {}),
      timestamp: new Date().toISOString(),
    };
  }
}
