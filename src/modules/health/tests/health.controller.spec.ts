import { CacheService } from '../../../core/cache/cache.service';
import {
  PostgresHealth,
  PostgresHealthService,
} from '../../../database/postgres/postgres-health.service';
import { HealthController } from '../controllers/health.controller';
import { BaseHealthDto } from '../dto/health-response.dto';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
  it('composes base health with the PostgreSQL probe and cache stats', async () => {
    const base: BaseHealthDto = {
      status: 'ok',
      timestamp: '2026-04-26T12:00:00.000Z',
      uptimeSeconds: 1.23,
    };
    const postgres: PostgresHealth = { status: 'disabled' };

    const getHealth = jest.fn(() => base);
    const check = jest.fn(async () => postgres);
    const stats = jest.fn(() => ({ hits: 4, misses: 2, errors: 0 }));
    const healthService: HealthService = { getHealth };
    const postgresHealthService = { check } as Pick<PostgresHealthService, 'check'>;
    const cacheService = { enabled: false, stats } as Pick<CacheService, 'enabled' | 'stats'>;

    const controller = new HealthController(
      healthService,
      postgresHealthService as PostgresHealthService,
      cacheService as CacheService,
    );

    const result = await controller.getHealth();

    expect(result).toEqual({
      ...base,
      postgres,
      cache: { enabled: false, hits: 4, misses: 2, errors: 0 },
    });
    expect(getHealth).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledTimes(1);
    expect(stats).toHaveBeenCalledTimes(1);
  });
});
