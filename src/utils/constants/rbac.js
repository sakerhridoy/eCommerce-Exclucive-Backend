/**
 * Role-Based Access Control (RBAC)
 * ---------------------------------------------------------------------------
 * Canonical role values are snake_case and lowercase. `normalizeRole` makes
 * checks resilient to user/source input such as "Super Admin", "SUPER_ADMIN"
 * or "super-admin" so casing never breaks authorization.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  ORDER_MANAGER: 'order_manager',
  PRODUCT_MANAGER: 'product_manager',
  SUPPORT_STAFF: 'support_staff',
  CUSTOMER: 'customer',
  // Legacy value kept so documents created before RBAC still validate.
  ADMIN: 'admin',
};

// Roles that may access the admin panel at all.
export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.ORDER_MANAGER,
  ROLES.PRODUCT_MANAGER,
  ROLES.SUPPORT_STAFF,
];

// Staff roles a Super Admin can assign (customers excluded).
export const ASSIGNABLE_ROLES = ADMIN_ROLES;

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.ORDER_MANAGER]: 'Order Manager',
  [ROLES.PRODUCT_MANAGER]: 'Product Manager',
  [ROLES.SUPPORT_STAFF]: 'Support Staff',
  [ROLES.CUSTOMER]: 'Customer',
};

// Resource:action granular permissions.
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',

  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  CATEGORY_MANAGE: 'category:manage',
  BRAND_MANAGE: 'brand:manage',

  ORDER_VIEW: 'order:view',
  ORDER_UPDATE: 'order:update',

  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_MANAGE: 'customer:manage',

  REVIEW_VIEW: 'review:view',
  REVIEW_MODERATE: 'review:moderate',

  COUPON_VIEW: 'coupon:view',
  COUPON_MANAGE: 'coupon:manage',

  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Banners + About page (storefront content) se ek e permission.
  CONTENT_MANAGE: 'content:manage',

  USER_VIEW: 'user:view',
  USER_MANAGE: 'user:manage',
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Role -> permission set. Super Admin implicitly holds every permission.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.MANAGER]: ALL_PERMISSIONS.filter(
    permission => permission !== PERMISSIONS.USER_MANAGE,
  ),
  [ROLES.PRODUCT_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.BRAND_MANAGE,
    PERMISSIONS.REVIEW_VIEW,
    PERMISSIONS.COUPON_VIEW,
    PERMISSIONS.COUPON_MANAGE,
  ],
  [ROLES.ORDER_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.COUPON_VIEW,
  ],
  [ROLES.SUPPORT_STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REVIEW_VIEW,
    PERMISSIONS.REVIEW_MODERATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
  ],
  [ROLES.CUSTOMER]: [],
};

const ROLE_ALIASES = {
  admin: ROLES.SUPER_ADMIN,
  superadmin: ROLES.SUPER_ADMIN,
  super: ROLES.SUPER_ADMIN,
  ordermanager: ROLES.ORDER_MANAGER,
  productmanager: ROLES.PRODUCT_MANAGER,
  supportstaff: ROLES.SUPPORT_STAFF,
};

/**
 * Normalizes any role input to its canonical lowercase snake_case value.
 * Unknown values are returned as-is so validation can reject them.
 */
export const normalizeRole = role => {
  if (!role) return ROLES.CUSTOMER;

  const key = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (ROLE_ALIASES[key]) return ROLE_ALIASES[key];
  if (Object.values(ROLES).includes(key)) return key;

  return key;
};

export const getPermissionsForRole = role =>
  ROLE_PERMISSIONS[normalizeRole(role)] || [];

export const isAdminRole = role => ADMIN_ROLES.includes(normalizeRole(role));
