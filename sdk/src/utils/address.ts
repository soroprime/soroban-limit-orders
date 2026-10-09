export function isValidStellarAddress(address: string): boolean {
  if (!address.startsWith('G')) return false;
  if (address.length !== 56) return false;
  // Basic base32 check
  return /^[A-Z2-7]+$/.test(address.slice(1));
}

export function isValidContractAddress(address: string): boolean {
  if (!address.startsWith('C')) return false;
  if (address.length !== 56) return false;
  return /^[A-Z2-7]+$/.test(address.slice(1));
}