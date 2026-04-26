import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import matter from 'gray-matter';
import { Prisma } from '@prisma/client';
import { MemoryDocumentRepository } from '../repositories/memory-document.repository';
import { UserRepository } from '../repositories/user.repository';
import { AppendLogDto } from './dto/append-log.dto';
import { PutMemoryDocumentDto } from './dto/put-memory-document.dto';

const LOG_PATH = 'log';
const LOG_HEADER = '# Activity Log\n\n';

@Injectable()
export class MemoryService {
  constructor(
    private readonly docs: MemoryDocumentRepository,
    private readonly users: UserRepository,
  ) {}

  private async ensureUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
  }

  private validatePath(path: string) {
    if (!path || path.includes('..')) {
      throw new BadRequestException('invalid path');
    }
  }

  async listForUser(userId: string) {
    await this.ensureUser(userId);
    const docs = await this.docs.listByUser(userId);
    return docs.map(({ path, frontmatter, updatedAt }) => ({
      path,
      frontmatter,
      updatedAt,
    }));
  }

  async getDoc(userId: string, path: string) {
    this.validatePath(path);
    await this.ensureUser(userId);
    const doc = await this.docs.findOne(userId, path);
    if (!doc) throw new NotFoundException(`Memory ${path} not found`);
    return doc;
  }

  async putDoc(userId: string, path: string, dto: PutMemoryDocumentDto) {
    this.validatePath(path);
    await this.ensureUser(userId);
    let frontmatter = dto.frontmatter as Prisma.InputJsonValue | undefined;
    if (frontmatter === undefined) {
      try {
        const parsed = matter(dto.body);
        frontmatter = (parsed.data ?? {}) as Prisma.InputJsonValue;
      } catch {
        frontmatter = {} as Prisma.InputJsonValue;
      }
    }
    return this.docs.upsert(userId, path, {
      body: dto.body,
      frontmatter: frontmatter as Prisma.InputJsonValue,
    });
  }

  async appendLog(userId: string, dto: AppendLogDto) {
    await this.ensureUser(userId);
    const existing = await this.docs.findOne(userId, LOG_PATH);
    const body = existing?.body ?? LOG_HEADER;
    const timestamp = new Date().toISOString();
    const linkPart = dto.link ? ` → [[${dto.link}]]` : '';
    const newEntry = `- ${timestamp}: ${dto.message}${linkPart}`;

    let nextBody: string;
    if (body.startsWith(LOG_HEADER)) {
      const rest = body.slice(LOG_HEADER.length);
      nextBody = `${LOG_HEADER}${newEntry}\n${rest}`;
    } else {
      nextBody = `${LOG_HEADER}${newEntry}\n${body.startsWith('\n') ? body.slice(1) : body}`;
    }

    return this.docs.upsert(userId, LOG_PATH, {
      body: nextBody,
      frontmatter: {} as Prisma.InputJsonValue,
    });
  }
}
