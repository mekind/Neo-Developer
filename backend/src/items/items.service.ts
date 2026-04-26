import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

export interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ItemsService {
  private items: Item[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Mock Coffee',
      description: 'A freshly brewed mock coffee',
      price: 4500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Mock Sandwich',
      description: 'Tasty mock sandwich',
      price: 7800,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  findAll(): Item[] {
    return this.items;
  }

  findOne(id: string): Item {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  create(dto: CreateItemDto): Item {
    const now = new Date().toISOString();
    const item: Item = { id: uuid(), ...dto, createdAt: now, updatedAt: now };
    this.items.push(item);
    return item;
  }

  update(id: string, dto: UpdateItemDto): Item {
    const item = this.findOne(id);
    Object.assign(item, dto, { updatedAt: new Date().toISOString() });
    return item;
  }

  remove(id: string): { id: string; deleted: true } {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new NotFoundException(`Item ${id} not found`);
    this.items.splice(idx, 1);
    return { id, deleted: true };
  }
}
