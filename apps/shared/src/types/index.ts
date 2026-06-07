// Player types
export type PlayerPosition =
  | "GK"
  | "CB"
  | "RB"
  | "LB"
  | "CDM"
  | "CM"
  | "CAM"
  | "RW"
  | "LW"
  | "CF"
  | "ST";

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
}

export interface PlayerTraits {
  weakFoot: boolean;
  flair: boolean;
  leadership: boolean;
  professionalism: boolean;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  clubId: number;
  position: PlayerPosition;
  overallRating: number;
  potentialRating: number;
  attributes: PlayerAttributes;
  traits: PlayerTraits;
  contractExpiry: string;
  wage: number;
  morale: number;
  stamina: number;
  injuryStatus: "fit" | "injured" | "suspended";
  injuryDuration?: number;
}

// Club types
export interface Club {
  id: number;
  name: string;
  country: string;
  leagueId: number;
  reputation: number;
  finances: number;
  stadiumCapacity: number;
  trainingFacilities: number;
  youthAcademy: number;
  homeKitColor: string;
  awayKitColor: string;
}

// Match types
export type MatchStatus = "scheduled" | "in_progress" | "completed";
export type Weather = "clear" | "rain" | "snow" | "windy";

export interface Match {
  id: number;
  homeClubId: number;
  awayClubId: number;
  competition: string;
  matchDate: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  weather: Weather;
}

// Tactics types
export type Formation =
  | "4-4-2"
  | "4-3-3"
  | "3-5-2"
  | "4-2-3-1"
  | "5-3-2";

export interface Tactics {
  id: number;
  userId: string;
  clubId: number;
  formation: Formation;
  instructions: {
    pressingIntensity: "low" | "medium" | "high";
    passingStyle: "short" | "long" | "mixed";
    defensiveLine: "low" | "medium" | "high";
  };
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
}

// Career types
export interface Career {
  id: number;
  userId: string;
  clubId: number;
  startDate: string;
  endDate?: string;
  reputation: number;
  achievements: string[];
}

// Transfer types
export type TransferStatus = "pending" | "completed" | "rejected";

export interface Transfer {
  id: number;
  playerId: number;
  fromClubId: number;
  toClubId: number;
  transferDate: string;
  fee: number;
  wage: number;
  status: TransferStatus;
}

// Match event types
export type EventType = "goal" | "assist" | "yellow_card" | "red_card" | "substitution";

export interface MatchEvent {
  id: number;
  matchId: number;
  playerId: number;
  clubId: number;
  eventType: EventType;
  minute: number;
}