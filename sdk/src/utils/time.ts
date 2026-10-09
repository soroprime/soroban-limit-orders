export function nowPlusSeconds(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

export function isExpired(expiry: number): boolean {
  return expiry < Math.floor(Date.now() / 1000);
}

export const EXPIRY_PRESETS = {
  '1h': 3600,
  '4h': 14400,
  '24h': 86400,
  '7d': 604800,
} as const;

export type ExpiryPreset = keyof typeof EXPIRY_PRESETS;

export function getExpiryPreset(preset: ExpiryPreset): number {
  return nowPlusSeconds(EXPIRY_PRESETS[preset]);
}