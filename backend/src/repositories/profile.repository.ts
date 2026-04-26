import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ProfileUpsertInput {
  nickname: string;
  purpose?: string | null;
  techLevel?: string | null;
}

export interface IProfileRepository {
  upsert(userId: string, input: ProfileUpsertInput): Promise<Profile>;
  findByUserId(userId: string): Promise<Profile | null>;
}

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(userId: string, input: ProfileUpsertInput) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    });
  }

  findByUserId(userId: string) {
    return this.prisma.profile.findUnique({ where: { userId } });
  }
}
