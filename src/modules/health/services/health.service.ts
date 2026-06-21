import { Injectable } from '@nestjs/common';

import { BaseHealthDto } from '../dto/health-response.dto';

@Injectable()
export class HealthService {
  getHealth(): BaseHealthDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(2)),
    };
  }
}
