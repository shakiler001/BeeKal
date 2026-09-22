import { Module } from '@nestjs/common';
import { ContentController } from './http/content.controller.js';
import { PublicContentController } from './http/public-content.controller.js';

@Module({
  controllers: [ContentController, PublicContentController],
})
export class ContentModule {}
