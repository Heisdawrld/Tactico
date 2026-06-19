/**
 * Tactico Kit Colors Table
 *
 * Hardcoded primary/secondary kit colors for famous clubs.
 * The Bzzoiro API doesn't return kit colors, so we maintain this lookup.
 * For unknown clubs, falls back to country flag colors.
 */

export interface KitEntry {
  name_pattern: RegExp;
  primary: string;   // hex
  secondary: string; // hex
  stadium?: string;
  stadium_capacity?: number;
}

// Ordered by specificity — first match wins
export const CLUB_KIT_TABLE: KitEntry[] = [
  // ---------- PREMIER LEAGUE ----------
  { name_pattern: /^manchester city$/i, primary: '#6CABDD', secondary: '#1C2C5B', stadium: 'Etihad Stadium', stadium_capacity: 53400 },
  { name_pattern: /^manchester united$/i, primary: '#DA291C', secondary: '#FBE122', stadium: 'Old Trafford', stadium_capacity: 74310 },
  { name_pattern: /^liverpool/i, primary: '#C8102E', secondary: '#F6EB61', stadium: 'Anfield', stadium_capacity: 61276 },
  { name_pattern: /^chelsea$/i, primary: '#034694', secondary: '#FFFFFF', stadium: 'Stamford Bridge', stadium_capacity: 40341 },
  { name_pattern: /^arsenal$/i, primary: '#EF0107', secondary: '#FFFFFF', stadium: 'Emirates Stadium', stadium_capacity: 60704 },
  { name_pattern: /^tottenham|spurs/i, primary: '#132257', secondary: '#FFFFFF', stadium: 'Tottenham Hotspur Stadium', stadium_capacity: 62850 },
  { name_pattern: /^newcastle$/i, primary: '#241F20', secondary: '#FFFFFF', stadium: 'St James\' Park', stadium_capacity: 52305 },
  { name_pattern: /^aston villa$/i, primary: '#95BFE5', secondary: '#670E36', stadium: 'Villa Park', stadium_capacity: 42095 },
  { name_pattern: /^brighton/i, primary: '#0057B8', secondary: '#FFFFFF', stadium: 'Amex Stadium', stadium_capacity: 31800 },
  { name_pattern: /^west ham$/i, primary: '#7A263A', secondary: '#1BB1E7', stadium: 'London Stadium', stadium_capacity: 62500 },
  { name_pattern: /^everton$/i, primary: '#003399', secondary: '#FFFFFF', stadium: 'Goodison Park', stadium_capacity: 39414 },
  { name_pattern: /^leicester$/i, primary: '#003090', secondary: '#FDBE11', stadium: 'King Power Stadium', stadium_capacity: 32259 },
  { name_pattern: /^wolves$/i, primary: '#FDB913', secondary: '#231F20', stadium: 'Molineux Stadium', stadium_capacity: 32050 },
  { name_pattern: /^crystal palace$/i, primary: '#1B458F', secondary: '#C4122E', stadium: 'Selhurst Park', stadium_capacity: 25486 },
  { name_pattern: /^brentford$/i, primary: '#E30613', secondary: '#FFFFFF', stadium: 'Gtech Community Stadium', stadium_capacity: 17250 },
  { name_pattern: /^fulham$/i, primary: '#000000', secondary: '#FFFFFF', stadium: 'Craven Cottage', stadium_capacity: 25700 },
  { name_pattern: /^nottingham forest$/i, primary: '#DD0000', secondary: '#FFFFFF', stadium: 'City Ground', stadium_capacity: 30445 },
  { name_pattern: /^bournemouth$/i, primary: '#DA291C', secondary: '#000000', stadium: 'Vitality Stadium', stadium_capacity: 11329 },
  { name_pattern: /^burnley$/i, primary: '#6C1D45', secondary: '#99D6EA', stadium: 'Turf Moor', stadium_capacity: 21944 },
  { name_pattern: /^luton town$/i, primary: '#F78F1E', secondary: '#002D62', stadium: 'Kenilworth Road', stadium_capacity: 10356 },
  { name_pattern: /^sheffield united$/i, primary: '#EE2737', secondary: '#000000', stadium: 'Bramall Lane', stadium_capacity: 32702 },
  { name_pattern: /^leeds$/i, primary: '#1D428A', secondary: '#FFCD00', stadium: 'Elland Road', stadium_capacity: 37792 },

  // ---------- LA LIGA ----------
  { name_pattern: /^real madrid$/i, primary: '#FFFFFF', secondary: '#FEBE10', stadium: 'Santiago Bernabéu', stadium_capacity: 81044 },
  { name_pattern: /^barcelona/i, primary: '#A50044', secondary: '#004D98', stadium: 'Camp Nou', stadium_capacity: 99354 },
  { name_pattern: /^atletico madrid|atlético madrid/i, primary: '#CB3524', secondary: '#262E62', stadium: 'Metropolitano', stadium_capacity: 67729 },
  { name_pattern: /^sevilla$/i, primary: '#D81920', secondary: '#FFFFFF', stadium: 'Ramón Sánchez-Pizjuán', stadium_capacity: 43883 },
  { name_pattern: /^real sociedad$/i, primary: '#0067B1', secondary: '#FFFFFF', stadium: 'Reale Arena', stadium_capacity: 32429 },
  { name_pattern: /^villarreal$/i, primary: '#FFE667', secondary: '#005187', stadium: 'Estadio de la Cerámica', stadium_capacity: 23500 },
  { name_pattern: /^real betis$/i, primary: '#00954C', secondary: '#FFFFFF', stadium: 'Benito Villamarín', stadium_capacity: 60721 },
  { name_pattern: /^athletic club|athletic bilbao/i, primary: '#EE2523', secondary: '#FFFFFF', stadium: 'San Mamés', stadium_capacity: 53289 },
  { name_pattern: /^valencia$/i, primary: '#FFFFFF', secondary: '#000000', stadium: 'Mestalla', stadium_capacity: 49430 },
  { name_pattern: /^girona$/i, primary: '#CD2534', secondary: '#FFFFFF', stadium: 'Estadi Montilivi', stadium_capacity: 14624 },

  // ---------- SERIE A ----------
  { name_pattern: /^juventus$/i, primary: '#000000', secondary: '#FFFFFF', stadium: 'Allianz Stadium', stadium_capacity: 41507 },
  { name_pattern: /^inter milan|internazionale$/i, primary: '#0066CC', secondary: '#000000', stadium: 'San Siro', stadium_capacity: 75923 },
  { name_pattern: /^ac milan$/i, primary: '#FB090B', secondary: '#000000', stadium: 'San Siro', stadium_capacity: 75923 },
  { name_pattern: /^napoli$/i, primary: '#12A0D7', secondary: '#FFFFFF', stadium: 'Diego Maradona', stadium_capacity: 54726 },
  { name_pattern: /^roma$/i, primary: '#8E1F2F', secondary: '#F0BC42', stadium: 'Stadio Olimpico', stadium_capacity: 70634 },
  { name_pattern: /^lazio$/i, primary: '#87D8F7', secondary: '#FFFFFF', stadium: 'Stadio Olimpico', stadium_capacity: 70634 },
  { name_pattern: /^atalanta$/i, primary: '#1D1D1D', secondary: '#00A752', stadium: 'Gewiss Stadium', stadium_capacity: 21300 },
  { name_pattern: /^fiorentina$/i, primary: '#592C82', secondary: '#FFFFFF', stadium: 'Artemio Franchi', stadium_capacity: 43147 },
  { name_pattern: /^torino$/i, primary: '#881600', secondary: '#FFFFFF', stadium: 'Stadio Olimpico Grande Torino', stadium_capacity: 27958 },
  { name_pattern: /^bologna$/i, primary: '#A21C26', secondary: '#1A2C48', stadium: 'Renato Dall\'Ara', stadium_capacity: 36462 },

  // ---------- BUNDESLIGA ----------
  { name_pattern: /^bayern munich|bayern münchen/i, primary: '#DC052D', secondary: '#FFFFFF', stadium: 'Allianz Arena', stadium_capacity: 75000 },
  { name_pattern: /^borussia dortmund|bvb/i, primary: '#FDE100', secondary: '#000000', stadium: 'Signal Iduna Park', stadium_capacity: 81365 },
  { name_pattern: /^rb leipzig/i, primary: '#DD0741', secondary: '#001F47', stadium: 'Red Bull Arena', stadium_capacity: 47069 },
  { name_pattern: /^bayer leverkusen/i, primary: '#E32219', secondary: '#000000', stadium: 'BayArena', stadium_capacity: 30210 },
  { name_pattern: /^eintracht frankfurt/i, primary: '#000000', secondary: '#E1000F', stadium: 'Deutsche Bank Park', stadium_capacity: 51500 },
  { name_pattern: /^vfl wolfsburg|wolfsburg$/i, primary: '#65B32E', secondary: '#FFFFFF', stadium: 'Volkswagen Arena', stadium_capacity: 30000 },
  { name_pattern: /^borussia m.*gladbach|m.*gladbach/i, primary: '#000000', secondary: '#00B04F', stadium: 'Borussia-Park', stadium_capacity: 54057 },
  { name_pattern: /^vfb stuttgart|stuttgart$/i, primary: '#FFFFFF', secondary: '#E32219', stadium: 'MHPArena', stadium_capacity: 60449 },
  { name_pattern: /^union berlin/i, primary: '#D2122E', secondary: '#FFFFFF', stadium: 'An der Alten Försterei', stadium_capacity: 22012 },

  // ---------- LIGUE 1 ----------
  { name_pattern: /^paris saint|psg/i, primary: '#004170', secondary: '#DA291C', stadium: 'Parc des Princes', stadium_capacity: 47929 },
  { name_pattern: /^marseille$/i, primary: '#2FAEE0', secondary: '#FFFFFF', stadium: 'Stade Vélodrome', stadium_capacity: 67394 },
  { name_pattern: /^monaco$/i, primary: '#E51B22', secondary: '#FFFFFF', stadium: 'Stade Louis II', stadium_capacity: 18523 },
  { name_pattern: /^lyon$/i, primary: '#FFFFFF', secondary: '#1A2C48', stadium: 'Groupama Stadium', stadium_capacity: 59186 },
  { name_pattern: /^lille$/i, primary: '#E01E13', secondary: '#0033A0', stadium: 'Stade Pierre-Mauroy', stadium_capacity: 50186 },

  // ---------- EREDIVISIE ----------
  { name_pattern: /^ajax$/i, primary: '#D2122E', secondary: '#FFFFFF', stadium: 'Johan Cruyff Arena', stadium_capacity: 55865 },
  { name_pattern: /^psv eindhoven|psv$/i, primary: '#ED1C24', secondary: '#FFFFFF', stadium: 'Philips Stadion', stadium_capacity: 35000 },
  { name_pattern: /^feyenoord$/i, primary: '#E62225', secondary: '#FFFFFF', stadium: 'De Kuip', stadium_capacity: 47500 },

  // ---------- PORTUGUESE LIGA ----------
  { name_pattern: /^benfica$/i, primary: '#E60026', secondary: '#FFFFFF', stadium: 'Estádio da Luz', stadium_capacity: 64642 },
  { name_pattern: /^porto$/i, primary: '#003876', secondary: '#FFFFFF', stadium: 'Estádio do Dragão', stadium_capacity: 50033 },
  { name_pattern: /^sporting cp|sporting lisbon/i, primary: '#008057', secondary: '#FFFFFF', stadium: 'Estádio José Alvalade', stadium_capacity: 50095 },

  // ---------- INTERNATIONAL MAJOR ----------
  { name_pattern: /^real madrid$/i, primary: '#FFFFFF', secondary: '#FEBE10' },
];

// ---------- COUNTRY FALLBACK COLORS ----------

export const COUNTRY_COLORS: Record<string, { primary: string; secondary: string }> = {
  England: { primary: '#FFFFFF', secondary: '#003399' },
  Spain: { primary: '#C60B1E', secondary: '#FFC400' },
  Italy: { primary: '#0066CC', secondary: '#FFFFFF' },
  Germany: { primary: '#000000', secondary: '#DD0000' },
  France: { primary: '#0055A4', secondary: '#EF4135' },
  Portugal: { primary: '#006600', secondary: '#FF0000' },
  Netherlands: { primary: '#FF6200', secondary: '#003DA5' },
  Belgium: { primary: '#FAE042', secondary: '#ED2939' },
  Brazil: { primary: '#009C3B', secondary: '#FFDF00' },
  Argentina: { primary: '#75AADB', secondary: '#FFFFFF' },
  Uruguay: { primary: '#0038A8', secondary: '#FFFFFF' },
  Mexico: { primary: '#006847', secondary: '#CE1126' },
  'United States': { primary: '#3C3B6E', secondary: '#B22234' },
  Japan: { primary: '#BC002D', secondary: '#FFFFFF' },
  'South Korea': { primary: '#003478', secondary: '#FFFFFF' },
  China: { primary: '#DE2910', secondary: '#FFDE00' },
  Australia: { primary: '#012169', secondary: '#FFFFFF' },
  'Saudi Arabia': { primary: '#006C35', secondary: '#FFFFFF' },
  Qatar: { primary: '#8A1538', secondary: '#FFFFFF' },
  Egypt: { primary: '#CE1126', secondary: '#FFFFFF' },
  Morocco: { primary: '#C1272D', secondary: '#006233' },
  Nigeria: { primary: '#008751', secondary: '#FFFFFF' },
  Senegal: { primary: '#00853F', secondary: '#FDEF42' },
  'South Africa': { primary: '#007A4D', secondary: '#FFB612' },
  'Cape Verde': { primary: '#003893', secondary: '#FFFFFF' },
  Turkey: { primary: '#E30A17', secondary: '#FFFFFF' },
  Greece: { primary: '#0D5EAF', secondary: '#FFFFFF' },
  Croatia: { primary: '#FF0000', secondary: '#FFFFFF' },
  Serbia: { primary: '#C6363C', secondary: '#0C4076' },
  Russia: { primary: '#0039A6', secondary: '#D52B1E' },
  Ukraine: { primary: '#0057B7', secondary: '#FFD700' },
  Poland: { primary: '#FFFFFF', secondary: '#DC143C' },
  'Czech Republic': { primary: '#11457E', secondary: '#FFFFFF' },
  Sweden: { primary: '#006AA7', secondary: '#FECC00' },
  Norway: { primary: '#EF2B2D', secondary: '#008F3D' },
  Denmark: { primary: '#C8102E', secondary: '#FFFFFF' },
  Finland: { primary: '#FFFFFF', secondary: '#003580' },
  Iceland: { primary: '#003897', secondary: '#D7282F' },
  Ireland: { primary: '#169B62', secondary: '#FFFFFF' },
  Switzerland: { primary: '#DA291C', secondary: '#FFFFFF' },
  Austria: { primary: '#ED2939', secondary: '#FFFFFF' },
  Hungary: { primary: '#CE2939', secondary: '#FFFFFF' },
  Romania: { primary: '#002B7F', secondary: '#FCD116' },
  Bulgaria: { primary: '#00966E', secondary: '#D61212' },
  Slovakia: { primary: '#0B4EA2', secondary: '#FFFFFF' },
  Slovenia: { primary: '#FFFFFF', secondary: '#FF0000' },
};

/**
 * Look up kit colors for a club by name.
 * Falls back to country colors, then to neutral gold.
 */
export function lookupClubKit(
  clubName: string,
  country?: string
): { primary: string; secondary: string; stadium?: string; stadium_capacity?: number } {
  // Try to match against the kit table
  for (const entry of CLUB_KIT_TABLE) {
    if (entry.name_pattern.test(clubName)) {
      return {
        primary: entry.primary,
        secondary: entry.secondary,
        stadium: entry.stadium,
        stadium_capacity: entry.stadium_capacity,
      };
    }
  }

  // Fall back to country colors
  if (country && COUNTRY_COLORS[country]) {
    return {
      primary: COUNTRY_COLORS[country].primary,
      secondary: COUNTRY_COLORS[country].secondary,
    };
  }

  // Ultimate fallback: Tactico gold on black
  return { primary: '#FFD700', secondary: '#0A0A0F' };
}
