import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { BootstrapUserMemoryDto } from './dto/bootstrap-user-memory.dto';

interface UserMemoryPaths {
  root: string;
  profile: string;
  index: string;
  agents: string;
}

export interface UserMemoryStatus {
  userId: string;
  exists: boolean;
  paths: UserMemoryPaths;
  files: {
    profile: boolean;
    index: boolean;
    agents: boolean;
  };
  profilePreview?: string;
}

export interface UserMemoryBootstrapResult extends UserMemoryStatus {
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class MemoryService {
  private readonly rootDirectory = process.env.CMUX_MEMORY_ROOT ?? join(homedir(), '.cmux', 'users');

  async bootstrapUser(userId: string, dto: BootstrapUserMemoryDto): Promise<UserMemoryBootstrapResult> {
    const normalizedUserId = this.normalizeUserId(userId);
    const paths = this.buildPaths(normalizedUserId);
    const now = new Date().toISOString();

    await mkdir(paths.agents, { recursive: true });
    await writeFile(paths.profile, this.renderProfile(normalizedUserId, dto, now), 'utf8');
    await writeFile(paths.index, this.renderIndex(normalizedUserId, now), 'utf8');

    return {
      userId: normalizedUserId,
      exists: true,
      createdAt: now,
      updatedAt: now,
      paths,
      files: {
        profile: true,
        index: true,
        agents: true,
      },
      profilePreview: await readFile(paths.profile, 'utf8'),
    };
  }

  async getUserStatus(userId: string): Promise<UserMemoryStatus> {
    const normalizedUserId = this.normalizeUserId(userId);
    const paths = this.buildPaths(normalizedUserId);
    const profile = await this.exists(paths.profile);
    const index = await this.exists(paths.index);
    const agents = await this.exists(paths.agents);
    const exists = (await this.exists(paths.root)) || profile || index || agents;

    return {
      userId: normalizedUserId,
      exists,
      paths,
      files: {
        profile,
        index,
        agents,
      },
      profilePreview: profile ? await readFile(paths.profile, 'utf8') : undefined,
    };
  }

  private buildPaths(userId: string): UserMemoryPaths {
    const root = join(this.rootDirectory, userId);
    return {
      root,
      profile: join(root, 'profile.md'),
      index: join(root, 'index.md'),
      agents: join(root, 'agents'),
    };
  }

  private normalizeUserId(userId: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      throw new BadRequestException('userId may only contain letters, numbers, hyphens, and underscores');
    }

    return userId;
  }

  private renderProfile(userId: string, dto: BootstrapUserMemoryDto, timestamp: string): string {
    const interests = dto.interests?.length
      ? dto.interests.map((interest) => `  - ${interest}`).join('\n')
      : '  - TBD';

    return [
      '# User Profile',
      '',
      `- user_id: ${userId}`,
      `- name: ${dto.name ?? 'TBD'}`,
      `- purpose: ${dto.purpose ?? 'TBD'}`,
      '- interests:',
      interests,
      `- updated_at: ${timestamp}`,
      '',
      '> Bootstrapped by the backend memory module. Extend this file during onboarding and persona setup.',
      '',
    ].join('\n');
  }

  private renderIndex(userId: string, timestamp: string): string {
    return [
      '# User Memory Hub',
      '',
      `- user_id: ${userId}`,
      `- updated_at: ${timestamp}`,
      '',
      '## Links',
      '- [Profile](./profile.md)',
      '- [Agents](./agents/)',
      '',
      '## Notes',
      '- This hub is the entry point for user-specific memory and generated agents.',
      '',
    ].join('\n');
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}
