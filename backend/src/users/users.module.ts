import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { UsersController } from './users.controller';
import { UsersInternalController } from './users-internal.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [UsersController, UsersInternalController],
  providers: [UsersService],
})
export class UsersModule {}
