import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create() {
    return this.users.create();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id/profile')
  upsertProfile(@Param('id') id: string, @Body() dto: UpsertProfileDto) {
    return this.users.upsertProfile(id, dto);
  }
}
