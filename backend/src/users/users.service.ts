import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserRepository } from '../repositories/user.repository';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
  ) {}

  create() {
    return this.users.create();
  }

  async findOne(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const profile = await this.profiles.findByUserId(id);
    return { ...user, profile };
  }

  async upsertProfile(id: string, dto: UpsertProfileDto) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.profiles.upsert(id, {
      nickname: dto.nickname,
      purpose: dto.purpose ?? null,
      techLevel: dto.techLevel ?? null,
    });
  }
}
