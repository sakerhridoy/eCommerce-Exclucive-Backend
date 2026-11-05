import { z } from 'zod';
import { ASSIGNABLE_ROLES, normalizeRole } from '../utils/index.js';

// Accepts "Super Admin" / "SUPER_ADMIN" / "super-admin" etc. and normalizes
// before validating, so casing/format never causes a rejection.
const roleField = z.preprocess(
  value => {
    if (value === undefined || value === null || value === '') return undefined;
    return normalizeRole(value);
  },
  z.enum(ASSIGNABLE_ROLES, {
    errorMap: () => ({
      message: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
    }),
  }),
);

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().optional(),
  role: roleField,
});

export const updateAdminUserSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100).optional(),
  phone: z.string().trim().optional(),
  role: roleField.optional(),
  isActive: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform(value => value === true || value === 'true')
    .optional(),
});
