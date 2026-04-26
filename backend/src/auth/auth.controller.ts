import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from './current-user.decorator';
import { CurrentUserGuard } from './current-user.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(CurrentUserGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
