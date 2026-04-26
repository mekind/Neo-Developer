import { Module } from '@nestjs/common';
import { AgentRepository } from './agent.repository';
import { MemoryDocumentRepository } from './memory-document.repository';
import { ProfileRepository } from './profile.repository';
import { SkillRepository } from './skill.repository';
import { UserRepository } from './user.repository';
import { NotificationRepository } from './notification.repository';

@Module({
  providers: [
    UserRepository,
    ProfileRepository,
    AgentRepository,
    MemoryDocumentRepository,
    SkillRepository,
    NotificationRepository,
  ],
  exports: [
    UserRepository,
    ProfileRepository,
    AgentRepository,
    MemoryDocumentRepository,
    SkillRepository,
    NotificationRepository,
  ],
})
export class RepositoriesModule {}
