import { Order } from '../types';
import { isValidStellarAddress, isValidContractAddress } from '../utils/address';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOrder(order: Order): ValidationResult {
  const errors: string[] = [];

  if (order.amountIn <= 0n) errors.push('amountIn must be positive');
  if (order.minAmountOut <= 0n) errors.push('minAmountOut must be positive');
  if (order.keeperFee < 0n) errors.push('keeperFee must be non-negative');
  if (order.keeperFee >= order.amountIn) errors.push('keeperFee must be less than amountIn');
  if (order.expiry <= Math.floor(Date.now() / 1000)) errors.push('expiry must be in the future');
  if (order.nonce < 0n) errors.push('nonce must be non-negative');
  if (!isValidStellarAddress(order.maker)) errors.push('maker must be a valid Stellar G-address');
  if (!isValidContractAddress(order.tokenIn)) errors.push('tokenIn must be a valid contract C-address');
  if (!isValidContractAddress(order.tokenOut)) errors.push('tokenOut must be a valid contract C-address');
  if (order.preferredDex !== null && !isValidContractAddress(order.preferredDex)) {
    errors.push('preferredDex must be a valid contract C-address or null');
  }

  return { valid: errors.length === 0, errors };
}