/**
 * Tactico League Reputation Table
 *
 * Reputation is a 1-100 scale. Used to:
 * - Boost player overall_rating in stronger leagues
 * - Set team starting reputation by league tier
 * - Determine prize money, TV revenue, sponsorship income
 * - Influence transfer market values
 *
 * Top European leagues: 90-100 (the "Big 5")
 * Strong secondary leagues: 75-89 (Eredivisie, Portuguese, etc.)
 * Mid-tier European: 60-74 (Austrian, Belgian, Swiss, etc.)
 * Lower European: 45-59 (Iceland, Slovenia, etc.)
 * Non-European top: 65-80 (Brazil, Argentina, MLS, Saudi)
 * Non-European lower: 35-55
 */

export interface LeagueReputationEntry {
  id?: number;          // Bzzoiro league ID (if known)
  name_pattern: RegExp; // Match against league name (case-insensitive)
  reputation: number;   // 1-100
  tier: number;         // 1 (top domestic) | 2 (second division) | 3 (third+) | 0 (continental cup)
  country_boost?: number; // Bonus for clubs in this country (UEFA coefficient proxy)
}

// Ordered by specificity — first match wins
export const LEAGUE_REPUTATION_TABLE: LeagueReputationEntry[] = [
  // ---------- CONTINENTAL (tier 0) ----------
  { name_pattern: /champions league/i, reputation: 99, tier: 0 },
  { name_pattern: /europa league/i, reputation: 88, tier: 0 },
  { name_pattern: /conference league|europa conference/i, reputation: 78, tier: 0 },
  { name_pattern: /copa libertadores/i, reputation: 92, tier: 0 },
  { name_pattern: /copa sudamericana/i, reputation: 75, tier: 0 },
  { name_pattern: /afc champions league/i, reputation: 70, tier: 0 },
  { name_pattern: /caf champions league/i, reputation: 65, tier: 0 },
  { name_pattern: /concacaf champions/i, reputation: 60, tier: 0 },

  // ---------- BIG 5 EUROPEAN TOP FLIGHTS (90-100) ----------
  { name_pattern: /^premier league$/i, reputation: 96, tier: 1, country_boost: 5 },
  { name_pattern: /^la liga$/i, reputation: 95, tier: 1, country_boost: 4 },
  { name_pattern: /^serie a$/i, reputation: 93, tier: 1, country_boost: 3 },
  { name_pattern: /^bundesliga$/i, reputation: 93, tier: 1, country_boost: 3 },
  { name_pattern: /^ligue 1$/i, reputation: 90, tier: 1, country_boost: 2 },

  // ---------- BIG 5 SECOND DIVISIONS (60-70) ----------
  { name_pattern: /championship/i, reputation: 68, tier: 2 },
  { name_pattern: /la liga 2|segunda divisi/i, reputation: 65, tier: 2 },
  { name_pattern: /serie b/i, reputation: 63, tier: 2 },
  { name_pattern: /2\. bundesliga/i, reputation: 65, tier: 2 },
  { name_pattern: /ligue 2/i, reputation: 60, tier: 2 },

  // ---------- STRONG EUROPEAN TOP FLIGHTS (75-89) ----------
  { name_pattern: /eredivisie/i, reputation: 82, tier: 1, country_boost: 1 },
  { name_pattern: /liga portugal|primeira liga/i, reputation: 82, tier: 1, country_boost: 1 },
  { name_pattern: /scottish premiership/i, reputation: 75, tier: 1 },
  { name_pattern: /jupiler pro league|belgian pro league/i, reputation: 78, tier: 1 },
  { name_pattern: /super lig|süper lig|turkish.*super/i, reputation: 76, tier: 1 },
  { name_pattern: /austrian bundesliga/i, reputation: 72, tier: 1 },
  { name_pattern: /swiss super league/i, reputation: 70, tier: 1 },
  { name_pattern: /czech.*first|fortuna liga/i, reputation: 70, tier: 1 },
  { name_pattern: /greek super league/i, reputation: 72, tier: 1 },
  { name_pattern: /ukrainian premier/i, reputation: 70, tier: 1 },
  { name_pattern: /russian premier/i, reputation: 70, tier: 1 },

  // ---------- MID-TIER EUROPEAN (60-74) ----------
  { name_pattern: /danish superliga/i, reputation: 68, tier: 1 },
  { name_pattern: /swedish allsvenskan/i, reputation: 65, tier: 1 },
  { name_pattern: /norwegian eliteserien/i, reputation: 64, tier: 1 },
  { name_pattern: /finnish veikkausliiga/i, reputation: 58, tier: 1 },
  { name_pattern: /polish ekstraklasa/i, reputation: 67, tier: 1 },
  { name_pattern: /croatian first|hrvatska/i, reputation: 64, tier: 1 },
  { name_pattern: /serbian super liga/i, reputation: 63, tier: 1 },
  { name_pattern: /romanian liga i/i, reputation: 62, tier: 1 },
  { name_pattern: /hungarian nb i|nemzeti bajnoks/i, reputation: 60, tier: 1 },
  { name_pattern: /bulgarian first|parva liga/i, reputation: 58, tier: 1 },
  { name_pattern: /slovak.*fortuna liga/i, reputation: 58, tier: 1 },
  { name_pattern: /slovenian prva liga/i, reputation: 55, tier: 1 },
  { name_pattern: /icelandic urvalsdeild/i, reputation: 50, tier: 1 },
  { name_pattern: /irish premier|loi/i, reputation: 52, tier: 1 },
  { name_pattern: /welsh premier/i, reputation: 48, tier: 1 },
  { name_pattern: /northern irish premiership/i, reputation: 48, tier: 1 },
  { name_pattern: /luxembourg.*national/i, reputation: 45, tier: 1 },
  { name_pattern: /maltese premier/i, reputation: 45, tier: 1 },
  { name_pattern: /gibraltar.*national/i, reputation: 40, tier: 1 },
  { name_pattern: /andorran/i, reputation: 40, tier: 1 },
  { name_pattern: /san marino/i, reputation: 38, tier: 1 },
  { name_pattern: /montenegrin first/i, reputation: 52, tier: 1 },
  { name_pattern: /albanian super/i, reputation: 52, tier: 1 },
  { name_pattern: /estonian meistriliiga/i, reputation: 48, tier: 1 },
  { name_pattern: /latvian virsliga/i, reputation: 50, tier: 1 },
  { name_pattern: /lithuanian a lyga/i, reputation: 48, tier: 1 },
  { name_pattern: /georgian.*national|erovnuli/i, reputation: 52, tier: 1 },
  { name_pattern: /armenian premier/i, reputation: 48, tier: 1 },
  { name_pattern: /azerbaijani premier/i, reputation: 52, tier: 1 },
  { name_pattern: /kazakhstan.*premier/i, reputation: 50, tier: 1 },
  { name_pattern: /israeli premier/i, reputation: 62, tier: 1 },
  { name_pattern: /cyprus first division/i, reputation: 60, tier: 1 },

  // ---------- NON-EUROPEAN TOP FLIGHTS ----------
  { name_pattern: /brasileirão|serie a.*brasil/i, reputation: 80, tier: 1 },
  { name_pattern: /argentine.*primera|liga profesional/i, reputation: 78, tier: 1 },
  { name_pattern: /mls|major league soccer/i, reputation: 70, tier: 1 },
  { name_pattern: /liga mx|mexican.*primera/i, reputation: 72, tier: 1 },
  { name_pattern: /saudi.*pro league|roshn saudi/i, reputation: 75, tier: 1 },
  { name_pattern: /j1 league/i, reputation: 70, tier: 1 },
  { name_pattern: /k.*league 1|korean.*top/i, reputation: 66, tier: 1 },
  { name_pattern: /chinese.*super/i, reputation: 65, tier: 1 },
  { name_pattern: /a-league|australian.*top/i, reputation: 62, tier: 1 },
  { name_pattern: /qatari.*stars/i, reputation: 62, tier: 1 },
  { name_pattern: /uae.*arabian gulf|uae pro league/i, reputation: 60, tier: 1 },
  { name_pattern: /egyptian premier/i, reputation: 60, tier: 1 },
  { name_pattern: /south african premier/i, reputation: 60, tier: 1 },
  { name_pattern: /nigerian.*professional/i, reputation: 55, tier: 1 },

  // ---------- CUPS ----------
  { name_pattern: /fa cup/i, reputation: 85, tier: 0 },
  { name_pattern: /copa del rey/i, reputation: 82, tier: 0 },
  { name_pattern: /copa italia/i, reputation: 80, tier: 0 },
  { name_pattern: /dfb.*pokal/i, reputation: 80, tier: 0 },
  { name_pattern: /coupe de france/i, reputation: 78, tier: 0 },

  // ---------- INTERNATIONAL ----------
  { name_pattern: /world cup/i, reputation: 100, tier: 0 },
  { name_pattern: /euro\s*\d+|uefa euro/i, reputation: 96, tier: 0 },
  { name_pattern: /copa america/i, reputation: 92, tier: 0 },
  { name_pattern: /nations league/i, reputation: 85, tier: 0 },
  { name_pattern: /africa cup of nations/i, reputation: 80, tier: 0 },
  { name_pattern: /asian cup/i, reputation: 72, tier: 0 },
  { name_pattern: /concacaf.*gold cup/i, reputation: 65, tier: 0 },
];

/**
 * Look up league reputation by name.
 * Falls back to 50 (neutral) for unknown leagues.
 */
export function lookupLeagueReputation(name: string): { reputation: number; tier: number } {
  for (const entry of LEAGUE_REPUTATION_TABLE) {
    if (entry.name_pattern.test(name)) {
      return { reputation: entry.reputation, tier: entry.tier };
    }
  }
  return { reputation: 50, tier: 1 };
}

/**
 * Lookup country boost (UEFA coefficient proxy).
 * Returns 0 for unknown countries.
 */
export function lookupCountryBoost(country: string): number {
  const found = LEAGUE_REPUTATION_TABLE.find(
    (e) => e.country_boost && e.name_pattern.test(country)
  );
  return found?.country_boost ?? 0;
}
