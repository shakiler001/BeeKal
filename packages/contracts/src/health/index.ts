import { z } from 'zod';

/** Liveness and readiness. The deploy gate reads this (docs/05 section 5.2). */
export const HealthStatusSchema = z.enum(['ok', 'degraded', 'down']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const HealthCheckSchema = z.object({
  name: z.string(),
  status: HealthStatusSchema,
  latencyMs: z.number().nonnegative().optional(),
  message: z.string().optional(),
});
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const HealthResponseSchema = z.object({
  status: HealthStatusSchema,
  version: z.string(),
  uptimeSeconds: z.number().nonnegative(),
  checks: z.array(HealthCheckSchema),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
