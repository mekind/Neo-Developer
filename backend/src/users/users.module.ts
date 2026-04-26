import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
