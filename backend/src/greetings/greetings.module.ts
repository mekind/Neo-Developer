import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { GreetingsController } from './greetings.controller';
import { GreetingsService } from './greetings.service';

@Module({
  imports: [RepositoriesModule],
  controllers: [GreetingsController],
  providers: [GreetingsService],
})
export class GreetingsModule {}
