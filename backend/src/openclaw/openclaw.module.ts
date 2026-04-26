import { Global, Module } from '@nestjs/common';
import { OpenclawClient } from './openclaw.client';

@Global()
@Module({
  providers: [OpenclawClient],
  exports: [OpenclawClient],
})
export class OpenclawModule {}
