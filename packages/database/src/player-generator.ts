/**
 * Tactico Player Generator
 *
 * Generates overall_rating, potential_rating, attributes, and wage for a player
 * based on real-world data (market value, age, position, league reputation).
 *
 * The Bzzoiro API returns NO ratings/attributes/wages — these are all Tactico-generated.
 */

// ---------- TYPES ----------

export interface RealPlayerData {
  id: number;
  name: string;
  position: string;        // 'G' | 'D' | 'M' | 'F' (Bzzoiro broad position)
  specific_position: string; // 'RW', 'CB', 'GK', etc.
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  preferred_foot: string;  // 'L' | 'R' | ''
  nationality: string;
  market_value_eur: number | null;
  current_team_id: number | null;
}

export interface GeneratedPlayerData {
  overall_rating: number;       // 1-99
  potential_rating: number;     // 1-99
  attributes: PlayerAttributes; // 33 sub-attributes as JSON
  wage: number;                 // annual EUR
}

export interface PlayerAttributes {
  // Technical (11)
  crossing: number; dribbling: number; finishing: number; first_touch: number;
  free_kick_taking: number; heading: number; long_shots: number; long_throws: number;
  marking: number; passing: number; penalty_taking: number; tackling: number; technique: number;
  // Physical (8)
  acceleration: number; agility: number; balance: number; jumping_reach: number;
  natural_fitness: number; pace: number; stamina: number; strength: number;
  // Mental (14)
  aggression: number; anticipation: number; bravery: number; composure: number;
  concentration: number; decisions: number; determination: number; flair: number;
  leadership: number; off_the_ball: number; positioning: number; teamwork: number;
  vision: number; work_rate: number;
}

// ---------- HELPERS ----------

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date('2026-06-15'); // career start date
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function clamp(v: number, min = 1, max = 99): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function variance(base: number, amount: number): number {
  return base + (Math.random() - 0.5) * 2 * amount;
}

// ---------- OVERALL RATING GENERATION ----------

/**
 * Generate overall_rating from market value + age + league reputation.
 *
 * Market value is the primary signal (log scale):
 *   €100M+ → 88-95 OVR
 *   €30-100M → 80-88 OVR
 *   €5-30M → 70-80 OVR
 *   €1-5M → 60-70 OVR
 *   <€1M → 45-60 OVR
 *
 * Adjusted by:
 *   - Age (peak modifier: 27 = peak, <24 = small penalty, >30 = declining)
 *   - League reputation (Premier League = +3, Icelandic league = -3)
 */
export function generateOverallRating(
  market_value_eur: number | null,
  age: number | null,
  league_reputation: number = 50
): number {
  const mv = market_value_eur ?? 0;

  // Log-scale market value → base rating
  let base: number;
  if (mv <= 0) base = 40 + Math.random() * 15; // unknown value → 40-55
  else if (mv < 1_000_000) base = 45 + Math.log10(mv / 100_000) * 8; // 45-63
  else if (mv < 5_000_000) base = 63 + Math.log10(mv / 1_000_000) * 8; // 63-69
  else if (mv < 30_000_000) base = 69 + Math.log10(mv / 5_000_000) * 9; // 69-82
  else if (mv < 100_000_000) base = 82 + Math.log10(mv / 30_000_000) * 4; // 82-88
  else base = 88 + Math.min(7, Math.log10(mv / 100_000_000) * 3); // 88-95

  // Age modifier (peak at 27 for outfield, 30 for GKs)
  if (age !== null) {
    if (age < 21) base -= 3; // raw, value is potential-driven
    else if (age < 24) base -= 1;
    else if (age >= 24 && age <= 28) base += 0; // peak
    else if (age === 29) base -= 1;
    else if (age === 30) base -= 2;
    else if (age === 31) base -= 3;
    else if (age === 32) base -= 5;
    else if (age === 33) base -= 7;
    else if (age === 34) base -= 10;
    else if (age >= 35) base -= 13;
  }

  // League reputation modifier (50 = neutral)
  const league_mod = (league_reputation - 50) * 0.06; // ±3 swing
  base += league_mod;

  return clamp(base, 30, 99);
}

// ---------- POTENTIAL RATING GENERATION ----------

/**
 * Generate potential_rating from overall_rating + age.
 *
 * Young players have higher potential ceiling; older players have potential = overall.
 */
export function generatePotentialRating(
  overall: number,
  age: number | null,
  is_goalkeeper: boolean = false
): number {
  if (age === null) return clamp(overall + 5);

  const peakAge = is_goalkeeper ? 30 : 27;

  if (age >= peakAge) {
    // Past peak — potential = overall (±2 random)
    return clamp(overall + (Math.random() < 0.3 ? 1 : 0));
  }

  // Years until peak
  const yearsToPeak = peakAge - age;

  // Potential gain: capped by age curve
  // 16yo: up to +25 potential
  // 20yo: up to +18
  // 24yo: up to +8
  // 27yo: +0
  const maxGain = Math.min(25, yearsToPeak * 4);
  const randomFactor = 0.5 + Math.random() * 0.5; // 0.5-1.0 of max gain
  const gain = maxGain * randomFactor;

  // Hard cap at 99
  return clamp(overall + gain, overall, 99);
}

// ---------- WAGE GENERATION ----------

/**
 * Generate annual wage (EUR) from market value + league reputation.
 *
 * Rule of thumb: annual wage ≈ 5% of market value.
 * Adjusted by league (Premier League inflated 1.5x, Serie A 1.0x, lower leagues 0.7x).
 */
export function generateWage(
  market_value_eur: number | null,
  league_reputation: number = 50
): number {
  const mv = market_value_eur ?? 500_000;
  let wage = mv * 0.05;

  // League inflation factor
  if (league_reputation >= 90) wage *= 1.5; // Premier League, La Liga, Serie A, Bundesliga
  else if (league_reputation >= 75) wage *= 1.2; // Eredivisie, Portuguese Liga
  else if (league_reputation >= 60) wage *= 1.0;
  else wage *= 0.7;

  // Minimum wage floor (€50k/year — youth/reserve contract)
  return Math.max(50_000, Math.round(wage));
}

// ---------- ATTRIBUTE GENERATION ----------

/**
 * Per-position attribute weight templates.
 * Higher weight = attribute is more important for the position.
 * Used to distribute the overall_rating "budget" across attributes.
 */
const POSITION_TEMPLATES: Record<string, Partial<Record<keyof PlayerAttributes, number>>> = {
  // ---------- GOALKEEPERS ----------
  GK: {
    // No technical outfield attrs; we'll set GK-specific ones high
    // Note: real FM uses a separate set of GK attrs. For simplicity, we map them onto the existing schema.
    technique: 80, // "ball playing"
    passing: 75,
    long_throws: 90, // "kicking"
    agility: 95, anticipation: 95, composure: 90, concentration: 95,
    decisions: 90, positioning: 95, bravery: 85, leadership: 70,
    // Physical
    acceleration: 75, balance: 80, jumping_reach: 85, natural_fitness: 80,
    reflexes: 95, // (we'll stuff into agility)
  },
  // ---------- DEFENDERS ----------
  CB: {
    tackling: 95, marking: 95, heading: 90, positioning: 95,
    anticipation: 90, concentration: 90, decisions: 90, strength: 85,
    jumping_reach: 85, aggression: 80, bravery: 80, passing: 70,
    technique: 65, composure: 75,
  },
  RB: { // also LB
    tackling: 85, marking: 80, crossing: 80, pace: 85, stamina: 90,
    positioning: 85, anticipation: 80, work_rate: 90, acceleration: 85,
    passing: 75, technique: 75, agility: 80,
  },
  LB: {
    tackling: 85, marking: 80, crossing: 80, pace: 85, stamina: 90,
    positioning: 85, anticipation: 80, work_rate: 90, acceleration: 85,
    passing: 75, technique: 75, agility: 80,
  },
  RWB: { // also LWB
    tackling: 80, crossing: 90, pace: 88, stamina: 95, work_rate: 95,
    positioning: 80, acceleration: 85, passing: 78, technique: 78,
    anticipation: 78, dribbling: 75,
  },
  LWB: {
    tackling: 80, crossing: 90, pace: 88, stamina: 95, work_rate: 95,
    positioning: 80, acceleration: 85, passing: 78, technique: 78,
    anticipation: 78, dribbling: 75,
  },
  // ---------- MIDFIELDERS ----------
  CDM: {
    tackling: 90, marking: 80, positioning: 95, anticipation: 90,
    passing: 85, decisions: 90, stamina: 88, strength: 80,
    concentration: 90, composure: 85, work_rate: 88, technique: 80,
    vision: 82, aggression: 80,
  },
  CM: {
    passing: 92, technique: 88, vision: 88, decisions: 88,
    stamina: 88, positioning: 85, anticipation: 85, composure: 85,
    first_touch: 85, dribbling: 80, work_rate: 82, concentration: 82,
  },
  CAM: {
    passing: 92, vision: 95, technique: 92, flair: 90, first_touch: 90,
    dribbling: 88, creativity: 90, long_shots: 82, decisions: 85,
    composure: 85, agility: 82, anticipation: 82,
  },
  RW: { // also LW
    pace: 92, acceleration: 92, dribbling: 92, crossing: 88,
    technique: 88, agility: 90, flair: 85, first_touch: 88,
    finishing: 80, long_shots: 75, stamina: 82, balance: 85,
  },
  LW: {
    pace: 92, acceleration: 92, dribbling: 92, crossing: 88,
    technique: 88, agility: 90, flair: 85, first_touch: 88,
    finishing: 80, long_shots: 75, stamina: 82, balance: 85,
  },
  // ---------- FORWARDS ----------
  ST: { // also CF
    finishing: 95, composure: 92, positioning: 92, heading: 82,
    strength: 80, anticipation: 88, decisions: 85, first_touch: 88,
    technique: 80, agility: 78, balance: 78, off_the_ball: 92,
  },
  CF: {
    finishing: 88, technique: 88, vision: 85, passing: 82,
    first_touch: 90, dribbling: 85, flair: 85, composure: 85,
    positioning: 85, anticipation: 82, decisions: 82, agility: 80,
  },
};

/**
 * Map Bzzoiro's specific_position to our template key.
 */
function mapPosition(broadPos: string, specificPos: string): keyof typeof POSITION_TEMPLATES {
  const sp = (specificPos || '').toUpperCase();
  const bp = (broadPos || '').toUpperCase();

  if (bp === 'G' || sp === 'GK') return 'GK';
  if (['RCB', 'CB', 'LCB', 'DC'].includes(sp)) return 'CB';
  if (['RB', 'RWB'].includes(sp)) return sp === 'RWB' ? 'RWB' : 'RB';
  if (['LB', 'LWB'].includes(sp)) return sp === 'LWB' ? 'LWB' : 'LB';
  if (['CDM', 'DM', 'RDM', 'LDM'].includes(sp)) return 'CDM';
  if (['CM', 'RCM', 'LCM', 'MID'].includes(sp)) return 'CM';
  if (['CAM', 'AM', 'ACM'].includes(sp)) return 'CAM';
  if (['RW', 'RM'].includes(sp)) return 'RW';
  if (['LW', 'LM'].includes(sp)) return 'LW';
  if (['ST', 'RS', 'LS', 'CF', 'SS'].includes(sp)) return sp === 'CF' || sp === 'SS' ? 'CF' : 'ST';

  // Fallback by broad position
  if (bp === 'D') return 'CB';
  if (bp === 'M') return 'CM';
  if (bp === 'F') return 'ST';
  return 'CM';
}

/**
 * Generate the 33 attributes for a player.
 *
 * Strategy:
 * 1. Get the position template (weights 0-100 per attribute)
 * 2. For each attribute, generate a value based on:
 *    - Overall rating (ceiling)
 *    - Position weight (higher = closer to overall)
 *    - Random variance (±5)
 * 3. Goalkeepers get a special handling (most outfield attrs are low)
 */
export function generateAttributes(
  overall: number,
  broad_position: string,
  specific_position: string
): PlayerAttributes {
  const posKey = mapPosition(broad_position, specific_position);
  const template = POSITION_TEMPLATES[posKey];

  // For each attribute, compute weighted value
  const computeAttr = (weight: number = 50): number => {
    // Weight 100 → attribute is at overall ±3
    // Weight 50 → attribute is at (overall - 15) ±5
    // Weight 0 → attribute is at 30-45 (low for non-relevant attrs)
    let base: number;
    if (weight >= 80) base = overall + (Math.random() - 0.5) * 6;
    else if (weight >= 60) base = overall - 5 + (Math.random() - 0.5) * 8;
    else if (weight >= 40) base = overall - 15 + (Math.random() - 0.5) * 10;
    else if (weight >= 20) base = overall - 30 + (Math.random() - 0.5) * 12;
    else base = 25 + Math.random() * 20; // irrelevant attrs are 25-45

    return clamp(base, 1, 99);
  };

  // Build attrs from template; default weight = 30 for unspecified
  const attrs: any = {};
  const allAttrs: (keyof PlayerAttributes)[] = [
    'crossing', 'dribbling', 'finishing', 'first_touch', 'free_kick_taking',
    'heading', 'long_shots', 'long_throws', 'marking', 'passing',
    'penalty_taking', 'tackling', 'technique',
    'acceleration', 'agility', 'balance', 'jumping_reach', 'natural_fitness',
    'pace', 'stamina', 'strength',
    'aggression', 'anticipation', 'bravery', 'composure', 'concentration',
    'decisions', 'determination', 'flair', 'leadership', 'off_the_ball',
    'positioning', 'teamwork', 'vision', 'work_rate',
  ];

  for (const attr of allAttrs) {
    const weight = template?.[attr] ?? 25;
    attrs[attr] = computeAttr(weight);
  }

  // Special handling for goalkeepers — boost reflexes via agility
  if (posKey === 'GK') {
    attrs.agility = clamp(overall + 3 + (Math.random() - 0.5) * 4);
    attrs.anticipation = clamp(overall + 2 + (Math.random() - 0.5) * 4);
    attrs.positioning = clamp(overall + 3 + (Math.random() - 0.5) * 4);
    attrs.concentration = clamp(overall + 2 + (Math.random() - 0.5) * 4);
    // Lower outfield attrs (don't need finishing etc.)
    attrs.finishing = clamp(15 + Math.random() * 15);
    attrs.dribbling = clamp(15 + Math.random() * 15);
    attrs.tackling = clamp(10 + Math.random() * 15);
    attrs.crossing = clamp(10 + Math.random() * 15);
  }

  return attrs as PlayerAttributes;
}

// ---------- MAIN ENTRY ----------

/**
 * Generate all game data for a player from real-world data.
 */
export function generatePlayerGameLayer(
  real: RealPlayerData,
  league_reputation: number = 50
): GeneratedPlayerData {
  const age = calculateAge(real.date_of_birth);
  const is_gk = (real.position || '').toUpperCase() === 'G' ||
                (real.specific_position || '').toUpperCase() === 'GK';

  const overall_rating = generateOverallRating(real.market_value_eur, age, league_reputation);
  const potential_rating = generatePotentialRating(overall_rating, age, is_gk);
  const attributes = generateAttributes(overall_rating, real.position, real.specific_position);
  const wage = generateWage(real.market_value_eur, league_reputation);

  return {
    overall_rating,
    potential_rating,
    attributes,
    wage,
  };
}
