import { Injectable, NotFoundException } from '@nestjs/common';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserRepository } from '../repositories/user.repository';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { AppendLogDto } from './dto/append-log.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly docs: MemoryDocumentRepository,
  ) {}

  async create() {
    const user = await this.users.create();
    return { id: user.id };
  }

  async findOne(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const profile = await this.profiles.findByUserId(id);
    return {
      id: user.id,
      createdAt: user.createdAt,
      profile: profile
        ? {
            nickname: profile.nickname,
            purpose: profile.purpose,
            techLevel: profile.techLevel,
          }
        : null,
    };
  }

  async upsertProfile(userId: string, dto: UpsertProfileDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const profile = await this.profiles.upsert(userId, {
      nickname: dto.nickname,
      purpose: dto.purpose,
      techLevel: dto.techLevel,
    });
    return profile;
  }

  async appendLog(userId: string, dto: AppendLogDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    const logPath = 'log';
    let doc = await this.docs.findOne(userId, logPath);
    
    const ts = dto.ts || new Date().toISOString();
    const newLine = `- ${ts}: ${dto.event}`;

    if (doc) {
      // Append to top (newest first)
      const lines = doc.body.split('\n').filter(l => l.trim() !== '');
      lines.unshift(newLine);
      
      // Keep only last 100 entries to prevent infinite growth
      if (lines.length > 100) lines.length = 100;
      
      const updatedBody = lines.join('\n');
      await this.docs.upsert(userId, logPath, {
        body: updatedBody,
        frontmatter: {},
      });
    } else {
      await this.docs.upsert(userId, logPath, {
        body: newLine,
        frontmatter: {},
      });
    }

    return { success: true, appended: newLine };
  }
}
