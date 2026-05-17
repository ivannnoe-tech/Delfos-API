import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { resolveCorsOptions } from './config/cors.config';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { RequestContextInterceptor } from './core/interceptors/request-context.interceptor';
import { createApiValidationPipe } from './core/pipes/api-validation.pipe';
import { DELFOS_ADMIN_KEY_HEADER } from './modules/auth/constants/auth-headers';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(AppConfigService);

  app.enableCors(resolveCorsOptions(config.corsOrigin, config.nodeEnv));
  app.useGlobalPipes(createApiValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());

  if (config.swaggerEnabled) {
    const openApiConfig = new DocumentBuilder()
      .setTitle('Delfos Analytics API')
      .setDescription('HTTP contracts for Delfos Analytics.')
      .setVersion('0.1.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: DELFOS_ADMIN_KEY_HEADER,
          in: 'header',
          description: 'Temporary foundation admin key for protected administrative endpoints.',
        },
        'delfos-admin-key',
      )
      .build();
    const document = SwaggerModule.createDocument(app, openApiConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(config.port);
}

void bootstrap();
