import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../../config/app-config.service';
import { UsersController } from './controllers/users.controller';
import { MongoUsersRepository } from './repositories/mongo-users.repository';
import { PostgresUsersRepository } from './repositories/postgres-users.repository';
import { UsersRepository } from './repositories/users.repository';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './services/users.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [
    MongoUsersRepository,
    PostgresUsersRepository,
    {
      // Select the backend at runtime: PostgreSQL when DELFOS_POSTGRES_URL is
      // configured, MongoDB otherwise. MongoDB stays the default until P5.
      provide: UsersRepository,
      inject: [AppConfigService, MongoUsersRepository, PostgresUsersRepository],
      useFactory: (
        config: AppConfigService,
        mongo: MongoUsersRepository,
        postgres: PostgresUsersRepository,
      ): UsersRepository => (config.postgresUrl ? postgres : mongo),
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
