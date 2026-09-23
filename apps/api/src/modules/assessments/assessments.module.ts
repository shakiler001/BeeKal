import { Module } from '@nestjs/common';
import { ScoreController } from './http/score.controller.js';

@Module({ controllers: [ScoreController] })
export class AssessmentsModule {}
