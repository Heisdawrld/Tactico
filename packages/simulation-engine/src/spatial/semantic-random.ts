import type { EntityId } from '../core/types';

const SEMANTIC_RANDOM_KEY_VERSION = 'tactico.semantic-random.v1';
const UINT32_RANGE = 0x100000000;

type SemanticScalar = EntityId;
type CanonicalScalar = readonly ['number' | 'string', string];

/**
 * The complete address of one deterministic random sample.
 *
 * `sampleIndex` is the counter within a semantic sample kind. Callers should
 * increment it only when they intentionally need another sample for the same
 * decision (for example, two independent execution-error axes).
 */
export interface SemanticRandomKey {
  readonly matchSeed: number;
  readonly namespace: string;
  readonly period: SemanticScalar;
  readonly tick: number;
  readonly decisionId: SemanticScalar;
  readonly actorIds: readonly EntityId[];
  readonly sampleKind: string;
  readonly sampleIndex: number;
}

const assertSafeInteger = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be a safe integer`);
  }

  // JavaScript distinguishes -0 in a few operations, but entity identifiers
  // and counters do not. Canonicalizing it here avoids two spellings of zero.
  return Object.is(value, -0) ? 0 : value;
};

const assertNonNegativeSafeInteger = (value: number, label: string): number => {
  const integer = assertSafeInteger(value, label);
  if (integer < 0) throw new Error(`${label} must not be negative`);
  return integer;
};

const canonicalText = (value: string, label: string): string => {
  const normalized = value.normalize('NFC');
  if (normalized.length === 0) throw new Error(`${label} must not be empty`);
  return normalized;
};

const canonicalScalar = (value: SemanticScalar, label: string): CanonicalScalar => {
  if (typeof value === 'number') {
    return ['number', String(assertSafeInteger(value, label))];
  }

  return ['string', canonicalText(value, label)];
};

const compareCanonicalScalars = (left: CanonicalScalar, right: CanonicalScalar): number => {
  if (left[0] !== right[0]) return left[0] === 'number' ? -1 : 1;

  if (left[0] === 'number') {
    const numericDifference = Number(left[1]) - Number(right[1]);
    if (numericDifference !== 0) return numericDifference;
  }

  if (left[1] < right[1]) return -1;
  if (left[1] > right[1]) return 1;
  return 0;
};

const canonicalActorIds = (actorIds: readonly EntityId[]): readonly CanonicalScalar[] => {
  const sorted = actorIds
    .map((actorId, index) => canonicalScalar(actorId, `actorIds[${index}]`))
    .sort(compareCanonicalScalars);

  // Actor identifiers describe the involved set, rather than participant
  // iteration order. Repeated identifiers are collapsed for the same reason.
  return sorted.filter((actorId, index) => {
    const previous = sorted[index - 1];
    return previous === undefined || compareCanonicalScalars(previous, actorId) !== 0;
  });
};

/**
 * Produces the stable string hashed by the semantic sampler.
 *
 * Canonicalization rules are part of the replay contract:
 * - fields are encoded in the fixed array order below, never object-key order;
 * - all numbers must be safe integers and `-0` is encoded as `0`;
 * - strings are normalized to Unicode NFC;
 * - numeric and string entity IDs remain distinct (`7` is not `"7"`);
 * - actor IDs are sorted without locale rules and deduplicated, so participant
 *   iteration order cannot affect a sample;
 * - JSON array encoding supplies unambiguous escaping and boundaries.
 *
 * Changing these rules requires a new key version because recorded matches may
 * depend on the exact byte-for-byte canonical form.
 */
export const canonicalizeSemanticRandomKey = (key: SemanticRandomKey): string => {
  const matchSeed = assertSafeInteger(key.matchSeed, 'matchSeed');
  const namespace = canonicalText(key.namespace, 'namespace');
  const tick = assertNonNegativeSafeInteger(key.tick, 'tick');
  const sampleKind = canonicalText(key.sampleKind, 'sampleKind');
  const sampleIndex = assertNonNegativeSafeInteger(key.sampleIndex, 'sampleIndex');

  return JSON.stringify([
    SEMANTIC_RANDOM_KEY_VERSION,
    ['matchSeed', String(matchSeed)],
    ['namespace', namespace],
    ['period', canonicalScalar(key.period, 'period')],
    ['tick', String(tick)],
    ['decisionId', canonicalScalar(key.decisionId, 'decisionId')],
    ['actorIds', canonicalActorIds(key.actorIds)],
    ['sampleKind', sampleKind],
    ['sampleIndex', String(sampleIndex)],
  ]);
};

/** Hashes UTF-16 code units in an explicitly little-endian order. */
const fnv1a32 = (value: string): number => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    hash = Math.imul(hash ^ (codeUnit & 0xff), 0x01000193);
    hash = Math.imul(hash ^ (codeUnit >>> 8), 0x01000193);
  }

  return hash >>> 0;
};

/** Final avalanche prevents nearby canonical keys from retaining FNV patterns. */
const avalanche32 = (input: number): number => {
  let value = input >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return value >>> 0;
};

/** Returns the call-order-independent unsigned 32-bit sample for `key`. */
export const sampleSemanticRandomUint32 = (key: SemanticRandomKey): number =>
  avalanche32(fnv1a32(canonicalizeSemanticRandomKey(key)));

/** Returns the call-order-independent sample for `key` in the range [0, 1). */
export const sampleSemanticRandom = (key: SemanticRandomKey): number =>
  sampleSemanticRandomUint32(key) / UINT32_RANGE;

/**
 * Maps a semantic sample to an inclusive safe-integer range.
 *
 * Ranges wider than 2^32 are rejected because one 32-bit sample cannot select
 * every value in such a range.
 */
export const sampleSemanticRandomInteger = (
  key: SemanticRandomKey,
  minInclusive: number,
  maxInclusive: number,
): number => {
  const minimum = assertSafeInteger(minInclusive, 'minInclusive');
  const maximum = assertSafeInteger(maxInclusive, 'maxInclusive');
  if (maximum < minimum) {
    throw new Error('maxInclusive must not be less than minInclusive');
  }

  const range = maximum - minimum + 1;
  if (!Number.isSafeInteger(range) || range > UINT32_RANGE) {
    throw new Error('semantic integer sample range must contain at most 2^32 values');
  }

  return minimum + Math.floor(sampleSemanticRandom(key) * range);
};
