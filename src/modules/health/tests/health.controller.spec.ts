import {
  PostgresHealth,
  PostgresHealthService,
} from '../../../database/postgres/postgres-health.service';
import { HealthController } from '../controllers/health.controller';
import { BaseHealthDto } from '../dto/health-response.dto';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
  it('composes the base health payload with the PostgreSQL probe', async () => {
    const base: BaseHealthDto = {
      status: 'ok',
      timestamp: '2026-04-26T12:00:00.000Z',
      uptimeSeconds: 1.23,
    };
    const postgres: PostgresHealth = { status: 'disabled' };

    const getHealth = jest.fn(() => base);
    const check = jest.fn(async () => postgres);
    const healthService: HealthService = { getHealth };
    const postgresHealthService = { check } as Pick<PostgresHealthService, 'check'>;

    const controller = new HealthController(
      healthService,
      postgresHealthService as PostgresHealthService,
    );

    const result = await controller.getHealth();

    expect(result).toEqual({ ...base, postgres });
    expect(getHealth).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledTimes(1);
  });
});
