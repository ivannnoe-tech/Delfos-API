import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { createMongooseOptions } from './config/mongoose.config';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: createMongooseOptions,
    }),
    HealthModule,
  ],
})
export class AppModule {}
