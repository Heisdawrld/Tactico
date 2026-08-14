/**
 * Small deterministic sequential PRNG retained for non-authoritative or
 * compatibility uses.
 *
 * Mulberry32 is deliberately simple and stable across JavaScript runtimes. It
 * is not suitable for cryptography; it is suitable for reproducible gameplay.
 * Authoritative football decisions must use semantic-random.ts so adding or
 * reordering unrelated samples cannot change later match events.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    const high = Math.floor(seed / 0x100000000);
    const folded = (seed ^ high) >>> 0;
    this.state = folded || 0x6d2b79f5;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  }

  integer(minInclusive: number, maxInclusive: number): number {
    if (!Number.isSafeInteger(minInclusive) || !Number.isSafeInteger(maxInclusive)) {
      throw new Error('SeededRandom.integer bounds must be safe integers');
    }
    if (maxInclusive < minInclusive) {
      throw new Error('SeededRandom.integer maximum must not be less than its minimum');
    }

    return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1));
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new Error('SeededRandom.pick requires at least one value');
    return values[this.integer(0, values.length - 1)];
  }
}
