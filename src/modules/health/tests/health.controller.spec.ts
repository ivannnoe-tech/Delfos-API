import { HealthController } from '../controllers/health.controller';
import { HealthResponseDto } from '../dto/health-response.dto';
import { HealthService } from '../services/health.service';

describe('HealthController', () => {
  it('delegates health response creation to the service', () => {
    const response: HealthResponseDto = {
      status: 'ok',
      timestamp: '2026-04-26T12:00:00.000Z',
      uptimeSeconds: 1.23,
    };
    const service: Pick<HealthService, 'getHealth'> = {
      getHealth: jest.fn(() => response),
    };
    const controller = new HealthController(service);

    expect(controller.getHealth()).toBe(response);
    expect(service.getHealth).toHaveBeenCalledTimes(1);
  });
});
