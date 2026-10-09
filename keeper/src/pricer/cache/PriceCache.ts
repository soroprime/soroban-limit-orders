interface CacheEntry {
  value: bigint;
  expiresAt: number;
}

export class PriceCache {
  private cache = new Map<string, CacheEntry>();

  get(key: string): bigint | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: bigint, ttlMs: number = 3000): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}