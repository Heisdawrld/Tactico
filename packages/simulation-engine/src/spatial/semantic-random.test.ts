import {
  canonicalizeSemanticRandomKey,
  sampleSemanticRandom,
  sampleSemanticRandomInteger,
  sampleSemanticRandomUint32,
  type SemanticRandomKey,
} from './semantic-random';

const createKey = (overrides: Partial<SemanticRandomKey> = {}): SemanticRandomKey => ({
  matchSeed: 20260810,
  namespace: 'player.action.execution',
  period: 'first_half',
  tick: 4182,
  decisionId: 'pass-104',
  actorIds: ['away-4', 17, 'home-8'],
  sampleKind: 'contact_error_x',
  sampleIndex: 0,
  ...overrides,
});

describe('semantic random sampling', () => {
  it('is deterministic and pinned to a stable golden value', () => {
    const key = createKey();

    expect(sampleSemanticRandomUint32(key)).toBe(1600461760);
    expect(sampleSemanticRandom(key)).toBe(1600461760 / 0x100000000);
    expect(sampleSemanticRandom(key)).toBe(sampleSemanticRandom(createKey()));
  });

  it('is independent of request order', () => {
    const keys = Array.from({ length: 12 }, (_, sampleIndex) => createKey({ sampleIndex }));
    const forward = new Map(keys.map(key => [key.sampleIndex, sampleSemanticRandom(key)]));
    const reverse = new Map(
      [...keys].reverse().map(key => [key.sampleIndex, sampleSemanticRandom(key)]),
    );

    expect(reverse).toEqual(forward);
  });

  it('canonicalizes actor identifiers as a type-aware unordered set', () => {
    const first = createKey({ actorIds: ['home-8', 17, 'away-4', 17] });
    const reordered = createKey({ actorIds: [17, 'away-4', 'home-8'] });
    const stringId = createKey({ actorIds: ['17', 'away-4', 'home-8'] });

    expect(canonicalizeSemanticRandomKey(first)).toBe(canonicalizeSemanticRandomKey(reordered));
    expect(sampleSemanticRandom(first)).toBe(sampleSemanticRandom(reordered));
    expect(canonicalizeSemanticRandomKey(first)).not.toBe(
      canonicalizeSemanticRandomKey(stringId),
    );
    expect(sampleSemanticRandom(first)).not.toBe(sampleSemanticRandom(stringId));
  });

  it('normalizes equivalent Unicode spellings and keeps field boundaries unambiguous', () => {
    const composed = createKey({ namespace: 'décision', decisionId: 'a|b:c' });
    const decomposed = createKey({ namespace: 'décision', decisionId: 'a|b:c' });
    const shiftedBoundary = createKey({ namespace: 'décision|a', decisionId: 'b:c' });

    expect(canonicalizeSemanticRandomKey(composed)).toBe(
      canonicalizeSemanticRandomKey(decomposed),
    );
    expect(canonicalizeSemanticRandomKey(composed)).not.toBe(
      canonicalizeSemanticRandomKey(shiftedBoundary),
    );
  });

  it('changes the address when any semantic dimension changes', () => {
    const baseline = sampleSemanticRandomUint32(createKey());
    const variants: SemanticRandomKey[] = [
      createKey({ matchSeed: 20260811 }),
      createKey({ namespace: 'player.action.choice' }),
      createKey({ period: 'second_half' }),
      createKey({ tick: 4183 }),
      createKey({ decisionId: 'pass-105' }),
      createKey({ actorIds: ['away-4', 17, 'home-9'] }),
      createKey({ sampleKind: 'contact_error_y' }),
      createKey({ sampleIndex: 1 }),
    ];

    expect(new Set(variants.map(sampleSemanticRandomUint32)).size).toBe(variants.length);
    variants.forEach(key => expect(sampleSemanticRandomUint32(key)).not.toBe(baseline));
  });

  it('never consults ambient randomness or wall-clock time', () => {
    const random = jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('ambient randomness is forbidden');
    });
    const now = jest.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('wall-clock time is forbidden');
    });

    try {
      expect(() => sampleSemanticRandom(createKey())).not.toThrow();
    } finally {
      random.mockRestore();
      now.mockRestore();
    }
  });

  it('maps samples to inclusive integer ranges', () => {
    const samples = Array.from({ length: 64 }, (_, sampleIndex) =>
      sampleSemanticRandomInteger(createKey({ sampleIndex }), -3, 4),
    );

    samples.forEach(value => {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-3);
      expect(value).toBeLessThanOrEqual(4);
    });
    expect(new Set(samples).size).toBeGreaterThan(1);
  });

  it('rejects ambiguous or invalid key components and impossible integer ranges', () => {
    expect(() => sampleSemanticRandom(createKey({ matchSeed: Number.NaN }))).toThrow(
      'matchSeed must be a safe integer',
    );
    expect(() => sampleSemanticRandom(createKey({ tick: -1 }))).toThrow(
      'tick must not be negative',
    );
    expect(() => sampleSemanticRandom(createKey({ sampleIndex: 0.5 }))).toThrow(
      'sampleIndex must be a safe integer',
    );
    expect(() => sampleSemanticRandom(createKey({ namespace: '' }))).toThrow(
      'namespace must not be empty',
    );
    expect(() => sampleSemanticRandom(createKey({ actorIds: [Number.POSITIVE_INFINITY] }))).toThrow(
      'actorIds[0] must be a safe integer',
    );
    expect(() => sampleSemanticRandomInteger(createKey(), 5, 4)).toThrow(
      'maxInclusive must not be less than minInclusive',
    );
    expect(() => sampleSemanticRandomInteger(createKey(), 0, 0x100000000)).toThrow(
      'semantic integer sample range must contain at most 2^32 values',
    );
  });
});
