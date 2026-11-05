import {
  asyncHandler,
  AppError,
  verifyAccessToken,
  normalizeRole,
  getPermissionsForRole,
} from '../utils/index.js';
import { User } from '../models/index.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  const decoded = verifyAccessToken(token);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  if (currentUser.isActive === false) {
    return next(
      new AppError(
        'Your account has been deactivated. Please contact an administrator.',
        403,
      ),
    );
  }

  req.user = currentUser;
  next();
});

/**
 * Role-based guard. Kept for simple cases; role values are normalized so
 * casing/format issues never break authorization.
 */
export const authorize = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    if (!allowedRoles.includes(normalizeRole(req.user?.role))) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };
};

/**
 * Permission-based guard. Every required permission must be granted to the
 * caller's role. This is the primary RBAC enforcement for admin routes.
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    const granted = getPermissionsForRole(req.user?.role);

    const allowed = requiredPermissions.every(permission =>
      granted.includes(permission),
    );

    if (!allowed) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }

    next();
  };
};
