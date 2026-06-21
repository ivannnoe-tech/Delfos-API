import { Module } from '@nestjs/common';

import { UsersController } from './controllers/users.controller';
import { PostgresUsersRepository } from './repositories/postgres-users.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    PostgresUsersRepository,
    { provide: UsersRepository, useExisting: PostgresUsersRepository },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
