import { MongooseModuleOptions } from '@nestjs/mongoose';

import { AppConfigService } from './app-config.service';

export function createMongooseOptions(config: AppConfigService): MongooseModuleOptions {
  return {
    uri: config.databaseUrl,
    autoIndex: config.nodeEnv !== 'production',
    serverSelectionTimeoutMS: 5000,
  };
}
