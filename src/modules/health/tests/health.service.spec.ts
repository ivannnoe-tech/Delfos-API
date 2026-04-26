import { HealthService } from '../services/health.service';

describe('HealthService', () => {
  it('returns a safe health payload', () => {
    const service = new HealthService();

    const result = service.getHealth();

    expect(result.status).toBe('ok');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(Object.keys(result)).toEqual(['status', 'timestamp', 'uptimeSeconds']);
  });
});
