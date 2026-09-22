import { z } from 'zod';
import { EmailSchema, text } from '../shared/index.js';

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Enter your password'),
});
export type Login = z.infer<typeof LoginSchema>;

export const SetPasswordSchema = z
  .object({
    token: z.string().min(16),
    password: z.string().min(12, 'Use at least 12 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Those do not match',
    path: ['confirm'],
  });
export type SetPassword = z.infer<typeof SetPasswordSchema>;

export const ChangePasswordSchema = z
  .object({
    current: z.string().min(1),
    password: z.string().min(12, 'Use at least 12 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Those do not match',
    path: ['confirm'],
  });
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;

/** What /me returns. The admin UI builds its navigation from this. */
export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(z.string()),
  /** permission key -> scope. Drives which nav items and buttons render. */
  permissions: z.record(z.enum(['ALL', 'OWN', 'ASSIGNED'])),
  mfaEnabled: z.boolean(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;

export const InviteUserSchema = z.object({
  email: EmailSchema,
  name: text(2, 120),
  roleIds: z.array(z.string().uuid()).min(1, 'Give the user at least one role'),
});
export type InviteUser = z.infer<typeof InviteUserSchema>;
