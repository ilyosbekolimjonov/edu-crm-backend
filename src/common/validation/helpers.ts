export const PHONE_REGEX = /^\+?\d{9,15}$/;
export const USERNAME_REGEX = /^(?=.{3,32}$)[a-zA-Z0-9_.]+$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const FILE_PATH_REGEX = /^(https?:\/\/.+|\/uploads\/.+)$/i;

export function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/[\s()-]/g, '');
}
