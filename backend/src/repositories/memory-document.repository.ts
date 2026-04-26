import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class MemoryDocumentRepository {
  private readonly baseDir = path.join(os.homedir(), '.cmux');

  async upsert(userId: string, docPath: string, data: { body: string; frontmatter: any }) {
    const fullDir = path.join(this.baseDir, 'users', userId, path.dirname(docPath));
    await fs.mkdir(fullDir, { recursive: true });
    
    const fileName = path.basename(docPath).endsWith('.md') ? path.basename(docPath) : `\${path.basename(docPath)}.md`;
    const fullPath = path.join(fullDir, fileName);
    
    let content = '';
    if (Object.keys(data.frontmatter).length > 0) {
      content += '---\n';
      content += JSON.stringify(data.frontmatter, null, 2);
      content += '\n---\n\n';
    }
    content += data.body;
    
    await fs.writeFile(fullPath, content, 'utf8');
  }

  async findOne(userId: string, docPath: string) {
    const fileName = docPath.endsWith('.md') ? docPath : `\${docPath}.md`;
    const fullPath = path.join(this.baseDir, 'users', userId, fileName);
    try {
      const content = await fs.readFile(fullPath, 'utf8');
      // Simple parser (not robust but works for mock)
      if (content.startsWith('---\n')) {
        const parts = content.split('---\n');
        return {
          frontmatter: JSON.parse(parts[1]),
          body: parts.slice(2).join('---\n').trim(),
        };
      }
      return { frontmatter: {}, body: content.trim() };
    } catch {
      return null;
    }
  }
}
