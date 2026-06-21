import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CacheService } from '../../../core/cache/cache.service';
import { PostgresHealthService } from '../../../database/postgres/postgres-health.service';
import { HealthResponseDto } from '../dto/health-response.dto';
import { HealthService } from '../services/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly postgresHealthService: PostgresHealthService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Return API health status, including PostgreSQL connectivity and cache stats.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  async getHealth(): Promise<HealthResponseDto> {
    return {
      ...this.healthService.getHealth(),
      postgres: await this.postgresHealthService.check(),
      cache: { enabled: this.cacheService.enabled, ...this.cacheService.stats() },
    };
  }
}
