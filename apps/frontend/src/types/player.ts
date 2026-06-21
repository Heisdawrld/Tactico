export type PlayerPosition =
  | "GK"
  | "CB"
  | "RB"
  | "LB"
  | "RWB"
  | "LWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "RM"
  | "LM"
  | "RW"
  | "LW"
  | "CF"
  | "ST"
  | "SS"
  // Broad positions from Bzzoiro API
  | "G"
  | "D"
  | "M"
  | "F"
  | "FWD"
  | "MID"
  | "DEF"
  | "AM"
  | "RCB"
  | "LCB"
  | "RDM"
  | "LDM"
  | "RCM"
  | "LCM"
  | "RAM"
  | "LAM"
  | "RS"
  | "LS";

export interface PlayerAttributes {
  // Technical (13)
  crossing?: number;
  dribbling?: number;
  finishing?: number;
  first_touch?: number;
  free_kick_taking?: number;
  heading?: number;
  long_shots?: number;
  long_throws?: number;
  marking?: number;
  passing?: number;
  penalty_taking?: number;
  tackling?: number;
  technique?: number;
  // Physical (8)
  acceleration?: number;
  agility?: number;
  balance?: number;
  jumping_reach?: number;
  natural_fitness?: number;
  pace?: number;
  stamina?: number;
  strength?: number;
  // Mental (14)
  aggression?: number;
  anticipation?: number;
  bravery?: number;
  composure?: number;
  concentration?: number;
  decisions?: number;
  determination?: number;
  flair?: number;
  leadership?: number;
  off_the_ball?: number;
  positioning?: number;
  teamwork?: number;
  vision?: number;
  work_rate?: number;
}

export interface Player {
  // Identity
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  age: number;
  dateOfBirth?: string | null;
  nationality?: string;
  nationalityCode?: string | null;

  // Club
  clubId: number;
  clubName?: string;
  clubShort?: string;
  clubColor?: string;

  // Position
  position: PlayerPosition | string;
  secondaryPositions?: string | null;
  foot?: string | null;
  height?: number | null;
  weight?: number | null;
  shirtNumber?: number | null;

  // Ratings
  overallRating: number;
  potentialRating: number;

  // FIFA-style 6-stat breakdown (derived from full attributes)
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;

  // Game state
  wage: number;
  morale: number;
  fatigue?: number;
  sharpness?: number;
  stamina?: number;
  injuryStatus: "fit" | "injured" | "suspended";
  injury?: string | null;

  // Contract + value
  marketValue?: number;
  contractExpires?: string | null;

  // Season stats
  appearances?: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  averageRating?: number;

  // Full attributes (33 sub-attrs) — for detailed view
  attributes?: PlayerAttributes | null;
}
