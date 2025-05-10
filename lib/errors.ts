import { z } from 'zod';

export const formatZodError = (err: z.ZodError) => ({
  error: 'ValidationError',
  details: err.errors.map(e => ({
    path: e.path.join('.'),
    message: e.message
  }))
});
