import { Module } from '@nestjs/common';
import { AgentRepository } from './agent.repository';
import { MemoryDocumentRepository } from './memory-document.repository';
import { ProfileRepository } from './profile.repository';
import { SkillRepository } from './skill.repository';
import { UserRepository } from './user.repository';

const repositories = [
  UserRepository,
  ProfileRepository,
  AgentRepository,
  MemoryDocumentRepository,
  SkillRepository,
];

@Module({
  providers: repositories,
  exports: repositories,
})
export class RepositoriesModule {}
