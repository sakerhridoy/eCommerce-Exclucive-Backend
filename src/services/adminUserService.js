import { userRepository } from '../repositories/index.js';
import {
  AppError,
  ROLES,
  ADMIN_ROLES,
  normalizeRole,
} from '../utils/index.js';

// Legacy 'admin' documents are treated as staff too.
const STAFF_ROLES = [...ADMIN_ROLES, ROLES.ADMIN];
const SUPER_ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

const STAFF_SELECT = '-password -refreshToken -emailVerificationToken';

const isStaffRole = role => STAFF_ROLES.includes(normalizeRole(role));

// Guarantees at least one other active Super Admin remains.
const assertNotLastSuperAdmin = async excludeId => {
  const remaining = await userRepository.countDocuments({
    role: { $in: SUPER_ADMIN_ROLES },
    isActive: true,
    _id: { $ne: excludeId },
  });

  if (remaining === 0) {
    throw new AppError('At least one active Super Admin is required', 400);
  }
};

export const listStaff = async () => {
  return await userRepository.find(
    { role: { $in: STAFF_ROLES } },
    { sort: { createdAt: -1 }, select: STAFF_SELECT },
  );
};

export const createStaff = async data => {
  const email = String(data.email).trim().toLowerCase();

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('A user with this email already exists', 409);
  }

  const role = normalizeRole(data.role);
  if (!ADMIN_ROLES.includes(role)) {
    throw new AppError('Invalid staff role', 400);
  }

  return await userRepository.create({
    name: data.name,
    email,
    password: data.password,
    phone: data.phone,
    role,
    isVerified: true,
    isActive: true,
  });
};

export const updateStaff = async (actorId, id, data) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }

  if (!isStaffRole(user.role)) {
    throw new AppError('This user is not a staff member', 400);
  }

  const update = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.phone !== undefined) update.phone = data.phone;

  if (data.role !== undefined) {
    const role = normalizeRole(data.role);
    if (!ADMIN_ROLES.includes(role)) {
      throw new AppError('Invalid staff role', 400);
    }

    const isDemotingSuperAdmin =
      normalizeRole(user.role) === ROLES.SUPER_ADMIN &&
      role !== ROLES.SUPER_ADMIN;

    if (isDemotingSuperAdmin) {
      await assertNotLastSuperAdmin(id);
    }

    update.role = role;
  }

  if (data.isActive !== undefined) {
    if (String(actorId) === String(id) && data.isActive === false) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    const deactivatingSuperAdmin =
      data.isActive === false &&
      normalizeRole(user.role) === ROLES.SUPER_ADMIN;

    if (deactivatingSuperAdmin) {
      await assertNotLastSuperAdmin(id);
    }

    update.isActive = data.isActive;
  }

  return await userRepository.findByIdAndUpdate(id, update, { new: true });
};

export const deleteStaff = async (actorId, id) => {
  if (String(actorId) === String(id)) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }

  if (!isStaffRole(user.role)) {
    throw new AppError('This user is not a staff member', 400);
  }

  if (normalizeRole(user.role) === ROLES.SUPER_ADMIN) {
    await assertNotLastSuperAdmin(id);
  }

  return await userRepository.findByIdAndDelete(id);
};
