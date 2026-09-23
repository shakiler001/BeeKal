import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LeadCreateSchema, type LeadCreate, type LeadCreateResponse } from '@beekal/contracts';
import { SubmitLeadUseCase } from '../application/submit-lead.usecase.js';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_WRITE_THROTTLE } from '../../../shared/throttle/throttle.config.js';
import { Public } from '../../../shared/auth/index.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly submitLead: SubmitLeadUseCase) {}

  /**
   * Thin by design: validate, call the use case, map the result. Business logic
   * in a controller is business logic that cannot be reused by a worker or a
   * CLI, and cannot be tested without HTTP.
   */
  // The public form posts here. Everything else in the API requires a session.
  @Public()
  @Throttle(PUBLIC_WRITE_THROTTLE)
  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown): Promise<LeadCreateResponse> {
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const data: LeadCreate = parsed.data;
    const result = await this.submitLead.execute(data);

    if (!result.ok) {
      // A rejected bot gets the same shape as a success. Telling it that the
      // honeypot caught it just teaches it to leave the field empty.
      if (result.error === 'spam') {
        return {
          ok: true,
          firstName: data.name.trim().split(/\s+/)[0] ?? data.name,
          email: data.email,
        };
      }
      throw new BadRequestException({ code: 'INVALID_LEAD', message: result.detail });
    }

    return { ok: true, firstName: result.firstName, email: result.email };
  }
}
