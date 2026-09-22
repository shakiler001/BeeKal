import { Module } from '@nestjs/common';
import { LeadsController } from './http/leads.controller.js';
import { SubmitLeadUseCase } from './application/submit-lead.usecase.js';
import { LEAD_REPOSITORY } from './ports/lead.repository.js';
import { PrismaLeadRepository } from './infrastructure/prisma-lead.repository.js';

/** Wiring: this is the only place a port is bound to a concrete adapter. */
@Module({
  controllers: [LeadsController],
  providers: [SubmitLeadUseCase, { provide: LEAD_REPOSITORY, useClass: PrismaLeadRepository }],
  exports: [SubmitLeadUseCase],
})
export class LeadsModule {}
