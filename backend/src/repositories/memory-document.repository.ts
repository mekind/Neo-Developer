import { Injectable } from '@nestjs/common';
import { MemoryDocument, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface MemoryDocumentUpsertInput {
  body: string;
  frontmatter: Prisma.InputJsonValue;
}

export interface IMemoryDocumentRepository {
  upsert(
    userId: string,
    path: string,
    input: MemoryDocumentUpsertInput,
  ): Promise<MemoryDocument>;
  findOne(userId: string, path: string): Promise<MemoryDocument | null>;
  listByUser(userId: string, pathPrefix?: string): Promise<MemoryDocument[]>;
  delete(userId: string, path: string): Promise<void>;
}

@Injectable()
export class MemoryDocumentRepository implements IMemoryDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(userId: string, path: string, input: MemoryDocumentUpsertInput) {
    return this.prisma.memoryDocument.upsert({
      where: { userId_path: { userId, path } },
      create: { userId, path, ...input },
      update: input,
    });
  }

  findOne(userId: string, path: string) {
    return this.prisma.memoryDocument.findUnique({
      where: { userId_path: { userId, path } },
    });
  }

  listByUser(userId: string, pathPrefix?: string) {
    return this.prisma.memoryDocument.findMany({
      where: {
        userId,
        ...(pathPrefix ? { path: { startsWith: pathPrefix } } : {}),
      },
      orderBy: { path: 'asc' },
    });
  }

  async delete(userId: string, path: string) {
    await this.prisma.memoryDocument.delete({
      where: { userId_path: { userId, path } },
    });
  }
}
