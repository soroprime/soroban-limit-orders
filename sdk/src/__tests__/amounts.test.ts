import { toBaseUnits, fromBaseUnits } from '../utils/amounts';

describe('amounts', () => {
  describe('toBaseUnits', () => {
    it('converts whole numbers', () => {
      expect(toBaseUnits('100', 6)).toBe(100_000_000n);
      expect(toBaseUnits('1', 18)).toBe(1_000_000_000_000_000_000n);
    });

    it('converts decimal numbers', () => {
      expect(toBaseUnits('1.5', 6)).toBe(1_500_000n);
      expect(toBaseUnits('0.000001', 6)).toBe(1n);
    });

    it('pads fractional part', () => {
      expect(toBaseUnits('1.1', 6)).toBe(1_100_000n);
      expect(toBaseUnits('1.123456', 6)).toBe(1_123_456n);
    });

    it('truncates excess precision', () => {
      expect(toBaseUnits('1.123456789', 6)).toBe(1_123_456n);
    });
  });

  describe('fromBaseUnits', () => {
    it('converts back to string', () => {
      expect(fromBaseUnits(100_000_000n, 6)).toBe('100');
      expect(fromBaseUnits(1_500_000n, 6)).toBe('1.5');
    });

    it('round trips', () => {
      const original = '123.456789';
      const base = toBaseUnits(original, 6);
      const converted = fromBaseUnits(base, 6);
      expect(converted).toBe(original);
    });

    it('handles zero', () => {
      expect(fromBaseUnits(0n, 6)).toBe('0');
    });
  });
});