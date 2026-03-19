import { z } from 'zod';

// ── Register Schema ───────────────────────────────────────────────────────────
export const registerSchema = z.object({
  fullName: z.string()
    .min(2,  'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),

  email: z.string()
    .email('Please enter a valid email address'),

  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .optional(),

  password: z.string()
    .min(6, 'Password must be at least 6 characters'),

  confirmPassword: z.string(),

  terms: z.literal('on', {
    errorMap: () => ({ message: 'You must agree to the Terms of Service' })
  }),

}).refine(data => data.password === data.confirmPassword, {
  message : 'Passwords do not match',
  path    : ['confirmPassword']
});

// ── Login Schema ──────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address'),

  password: z.string()
    .min(1, 'Password is required'),
});