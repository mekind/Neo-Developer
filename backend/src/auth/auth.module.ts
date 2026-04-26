import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { AuthController } from './auth.controller';
import { CurrentUserGuard } from './current-user.guard';

@Module({
  imports: [RepositoriesModule],
  providers: [CurrentUserGuard],
  controllers: [AuthController],
  exports: [CurrentUserGuard],
})
export class AuthModule {}
