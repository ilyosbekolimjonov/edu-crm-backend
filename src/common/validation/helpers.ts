export const PHONE_REGEX = /^\+998\d{9}$/;
export const USERNAME_REGEX = /^\S+$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const FILE_PATH_REGEX = /^(https?:\/\/.+|\/uploads\/.+)$/i;

export function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().replace(/[\s()-]/g, '');
  return normalized.startsWith('998') ? `+${normalized}` : normalized;
}
