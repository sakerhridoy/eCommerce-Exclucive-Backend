/**
 * Build a Mongo sort object from a compact "field:dir,field:dir" string.
 * Only whitelisted fields are accepted to avoid arbitrary field injection.
 */
export const buildSort = (
  sortQuery,
  allowedFields = [],
  fallback = { createdAt: -1 },
) => {
  if (!sortQuery || typeof sortQuery !== 'string') return fallback;

  const sort = {};

  sortQuery.split(',').forEach(entry => {
    const [rawField, rawDir] = entry.split(':');
    const field = (rawField || '').trim();
    if (!field) return;
    if (allowedFields.length && !allowedFields.includes(field)) return;

    sort[field] = (rawDir || '').trim().toLowerCase() === 'asc' ? 1 : -1;
  });

  return Object.keys(sort).length ? sort : fallback;
};

/**
 * Escape user input before using it inside a RegExp.
 */
export const escapeRegex = value =>
  String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Case-insensitive exact match for enum-like fields that may be stored in
 * inconsistent casing (e.g. "pending" vs "PENDING").
 */
export const caseInsensitiveEquals = value => {
  if (value === undefined || value === null || value === '') return null;
  return new RegExp(`^${escapeRegex(value)}$`, 'i');
};

/**
 * Build a { $gte, $lte } range for a date field. Returns null when unused.
 */
export const buildDateRange = (from, to) => {
  const range = {};

  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }

  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  return Object.keys(range).length ? range : null;
};
