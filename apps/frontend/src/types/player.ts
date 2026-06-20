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

// Static data for players (no database yet)
export const players: Player[] = [
  // Manchester City
  {
    id: 1,
    firstName: "Erling",
    lastName: "Haaland",
    age: 23,
    clubId: 1,
    position: "ST",
    overallRating: 91,
    potentialRating: 95,
    pace: 88,
    shooting: 94,
    passing: 75,
    dribbling: 82,
    defending: 45,
    physicality: 88,
    wage: 380000,
    morale: 92,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 2,
    firstName: "Kevin",
    lastName: "De Bruyne",
    age: 32,
    clubId: 1,
    position: "CAM",
    overallRating: 92,
    potentialRating: 94,
    pace: 78,
    shooting: 90,
    passing: 95,
    dribbling: 88,
    defending: 65,
    physicality: 80,
    wage: 400000,
    morale: 85,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 3,
    firstName: "Rodri",
    lastName: "Hernandez",
    age: 27,
    clubId: 1,
    position: "CDM",
    overallRating: 89,
    potentialRating: 91,
    pace: 75,
    shooting: 80,
    passing: 90,
    dribbling: 82,
    defending: 88,
    physicality: 85,
    wage: 300000,
    morale: 90,
    stamina: 90,
    injuryStatus: "fit",
  },

  // Real Madrid
  {
    id: 4,
    firstName: "Jude",
    lastName: "Bellingham",
    age: 20,
    clubId: 2,
    position: "CM",
    overallRating: 90,
    potentialRating: 94,
    pace: 80,
    shooting: 88,
    passing: 88,
    dribbling: 85,
    defending: 78,
    physicality: 85,
    wage: 420000,
    morale: 94,
    stamina: 90,
    injuryStatus: "fit",
  },
  {
    id: 5,
    firstName: "Vinicius",
    lastName: "Junior",
    age: 23,
    clubId: 2,
    position: "LW",
    overallRating: 88,
    potentialRating: 92,
    pace: 92,
    shooting: 80,
    passing: 82,
    dribbling: 90,
    defending: 50,
    physicality: 75,
    wage: 350000,
    morale: 88,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 6,
    firstName: "Thibaut",
    lastName: "Courtois",
    age: 31,
    clubId: 2,
    position: "GK",
    overallRating: 89,
    potentialRating: 90,
    pace: 50,
    shooting: 30,
    passing: 70,
    dribbling: 40,
    defending: 90,
    physicality: 80,
    wage: 320000,
    morale: 85,
    stamina: 70,
    injuryStatus: "fit",
  },

  // Liverpool
  {
    id: 7,
    firstName: "Mohamed",
    lastName: "Salah",
    age: 31,
    clubId: 3,
    position: "RW",
    overallRating: 90,
    potentialRating: 91,
    pace: 90,
    shooting: 88,
    passing: 82,
    dribbling: 90,
    defending: 50,
    physicality: 78,
    wage: 350000,
    morale: 88,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 8,
    firstName: "Virgil",
    lastName: "van Dijk",
    age: 32,
    clubId: 3,
    position: "CB",
    overallRating: 89,
    potentialRating: 90,
    pace: 75,
    shooting: 60,
    passing: 80,
    dribbling: 70,
    defending: 92,
    physicality: 88,
    wage: 300000,
    morale: 90,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 9,
    firstName: "Alisson",
    lastName: "Becker",
    age: 31,
    clubId: 3,
    position: "GK",
    overallRating: 88,
    potentialRating: 89,
    pace: 50,
    shooting: 30,
    passing: 75,
    dribbling: 40,
    defending: 88,
    physicality: 80,
    wage: 280000,
    morale: 85,
    stamina: 70,
    injuryStatus: "fit",
  },

  // Barcelona
  {
    id: 10,
    firstName: "Robert",
    lastName: "Lewandowski",
    age: 35,
    clubId: 4,
    position: "ST",
    overallRating: 88,
    potentialRating: 89,
    pace: 80,
    shooting: 92,
    passing: 80,
    dribbling: 82,
    defending: 50,
    physicality: 85,
    wage: 400000,
    morale: 88,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 11,
    firstName: "Frenkie",
    lastName: "de Jong",
    age: 26,
    clubId: 4,
    position: "CM",
    overallRating: 89,
    potentialRating: 92,
    pace: 78,
    shooting: 80,
    passing: 90,
    dribbling: 88,
    defending: 75,
    physicality: 80,
    wage: 380000,
    morale: 90,
    stamina: 90,
    injuryStatus: "fit",
  },
  {
    id: 12,
    firstName: "Pedri",
    lastName: "Gonzalez",
    age: 21,
    clubId: 4,
    position: "CAM",
    overallRating: 86,
    potentialRating: 92,
    pace: 82,
    shooting: 80,
    passing: 88,
    dribbling: 90,
    defending: 60,
    physicality: 70,
    wage: 250000,
    morale: 85,
    stamina: 80,
    injuryStatus: "fit",
  },

  // Manchester United
  {
    id: 13,
    firstName: "Bruno",
    lastName: "Fernandes",
    age: 29,
    clubId: 5,
    position: "CAM",
    overallRating: 88,
    potentialRating: 89,
    pace: 75,
    shooting: 88,
    passing: 90,
    dribbling: 85,
    defending: 65,
    physicality: 78,
    wage: 280000,
    morale: 87,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 14,
    firstName: "Marcus",
    lastName: "Rashford",
    age: 26,
    clubId: 5,
    position: "LW",
    overallRating: 85,
    potentialRating: 88,
    pace: 88,
    shooting: 82,
    passing: 78,
    dribbling: 85,
    defending: 50,
    physicality: 78,
    wage: 250000,
    morale: 82,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 15,
    firstName: "Andre",
    lastName: "Onana",
    age: 27,
    clubId: 5,
    position: "GK",
    overallRating: 84,
    potentialRating: 86,
    pace: 60,
    shooting: 30,
    passing: 75,
    dribbling: 50,
    defending: 85,
    physicality: 80,
    wage: 200000,
    morale: 80,
    stamina: 70,
    injuryStatus: "fit",
  },

  // Bayern Munich
  {
    id: 16,
    firstName: "Harry",
    lastName: "Kane",
    age: 30,
    clubId: 6,
    position: "ST",
    overallRating: 89,
    potentialRating: 90,
    pace: 78,
    shooting: 92,
    passing: 85,
    dribbling: 80,
    defending: 50,
    physicality: 85,
    wage: 400000,
    morale: 90,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 17,
    firstName: "Joshua",
    lastName: "Kimmich",
    age: 28,
    clubId: 6,
    position: "CM",
    overallRating: 88,
    potentialRating: 89,
    pace: 75,
    shooting: 80,
    passing: 90,
    dribbling: 82,
    defending: 80,
    physicality: 85,
    wage: 320000,
    morale: 88,
    stamina: 90,
    injuryStatus: "fit",
  },
  {
    id: 18,
    firstName: "Manuel",
    lastName: "Neuer",
    age: 37,
    clubId: 6,
    position: "GK",
    overallRating: 87,
    potentialRating: 88,
    pace: 50,
    shooting: 30,
    passing: 80,
    dribbling: 50,
    defending: 88,
    physicality: 75,
    wage: 350000,
    morale: 85,
    stamina: 70,
    injuryStatus: "fit",
  },

  // PSG
  {
    id: 19,
    firstName: "Kylian",
    lastName: "Mbappe",
    age: 24,
    clubId: 7,
    position: "ST",
    overallRating: 92,
    potentialRating: 96,
    pace: 95,
    shooting: 90,
    passing: 80,
    dribbling: 92,
    defending: 45,
    physicality: 85,
    wage: 500000,
    morale: 94,
    stamina: 88,
    injuryStatus: "fit",
  },
  {
    id: 20,
    firstName: "Vitinha",
    lastName: "Fagundes",
    age: 23,
    clubId: 7,
    position: "CM",
    overallRating: 84,
    potentialRating: 88,
    pace: 78,
    shooting: 80,
    passing: 85,
    dribbling: 82,
    defending: 70,
    physicality: 75,
    wage: 220000,
    morale: 85,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 21,
    firstName: "Gianluigi",
    lastName: "Donnarumma",
    age: 24,
    clubId: 7,
    position: "GK",
    overallRating: 86,
    potentialRating: 89,
    pace: 55,
    shooting: 30,
    passing: 75,
    dribbling: 50,
    defending: 86,
    physicality: 80,
    wage: 280000,
    morale: 88,
    stamina: 75,
    injuryStatus: "fit",
  },

  // Juventus
  {
    id: 22,
    firstName: "Dušan",
    lastName: "Vlahović",
    age: 23,
    clubId: 8,
    position: "ST",
    overallRating: 85,
    potentialRating: 88,
    pace: 78,
    shooting: 88,
    passing: 75,
    dribbling: 80,
    defending: 45,
    physicality: 82,
    wage: 250000,
    morale: 85,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 23,
    firstName: "Adrien",
    lastName: "Rabiot",
    age: 28,
    clubId: 8,
    position: "CM",
    overallRating: 84,
    potentialRating: 86,
    pace: 75,
    shooting: 80,
    passing: 82,
    dribbling: 78,
    defending: 75,
    physicality: 80,
    wage: 200000,
    morale: 82,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 24,
    firstName: "Wojciech",
    lastName: "Szczęsny",
    age: 33,
    clubId: 8,
    position: "GK",
    overallRating: 85,
    potentialRating: 86,
    pace: 50,
    shooting: 30,
    passing: 70,
    dribbling: 45,
    defending: 85,
    physicality: 78,
    wage: 220000,
    morale: 80,
    stamina: 70,
    injuryStatus: "fit",
  },

  // Arsenal
  {
    id: 25,
    firstName: "Bukayo",
    lastName: "Saka",
    age: 22,
    clubId: 9,
    position: "RW",
    overallRating: 85,
    potentialRating: 90,
    pace: 85,
    shooting: 82,
    passing: 80,
    dribbling: 88,
    defending: 55,
    physicality: 75,
    wage: 250000,
    morale: 90,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 26,
    firstName: "Martin",
    lastName: "Ødegaard",
    age: 24,
    clubId: 9,
    position: "CAM",
    overallRating: 84,
    potentialRating: 87,
    pace: 75,
    shooting: 82,
    passing: 88,
    dribbling: 85,
    defending: 60,
    physicality: 70,
    wage: 220000,
    morale: 85,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 27,
    firstName: "Aaron",
    lastName: "Ramsdale",
    age: 25,
    clubId: 9,
    position: "GK",
    overallRating: 83,
    potentialRating: 86,
    pace: 55,
    shooting: 30,
    passing: 70,
    dribbling: 45,
    defending: 83,
    physicality: 78,
    wage: 180000,
    morale: 80,
    stamina: 70,
    injuryStatus: "fit",
  },

  // AC Milan
  {
    id: 28,
    firstName: "Olivier",
    lastName: "Giroud",
    age: 36,
    clubId: 10,
    position: "ST",
    overallRating: 84,
    potentialRating: 85,
    pace: 70,
    shooting: 88,
    passing: 82,
    dribbling: 75,
    defending: 50,
    physicality: 80,
    wage: 180000,
    morale: 88,
    stamina: 75,
    injuryStatus: "fit",
  },
  {
    id: 29,
    firstName: "Sandro",
    lastName: "Tonalí",
    age: 23,
    clubId: 10,
    position: "CM",
    overallRating: 83,
    potentialRating: 87,
    pace: 75,
    shooting: 80,
    passing: 85,
    dribbling: 80,
    defending: 70,
    physicality: 75,
    wage: 200000,
    morale: 85,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 30,
    firstName: "Mike",
    lastName: "Maignan",
    age: 28,
    clubId: 10,
    position: "GK",
    overallRating: 84,
    potentialRating: 86,
    pace: 55,
    shooting: 30,
    passing: 75,
    dribbling: 45,
    defending: 84,
    physicality: 80,
    wage: 220000,
    morale: 82,
    stamina: 70,
    injuryStatus: "fit",
  },

  // Additional players for depth
  {
    id: 31,
    firstName: "Bernardo",
    lastName: "Silva",
    age: 28,
    clubId: 1,
    position: "RW",
    overallRating: 87,
    potentialRating: 89,
    pace: 85,
    shooting: 82,
    passing: 88,
    dribbling: 90,
    defending: 55,
    physicality: 75,
    wage: 300000,
    morale: 88,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 32,
    firstName: "Phil",
    lastName: "Foden",
    age: 23,
    clubId: 1,
    position: "CAM",
    overallRating: 86,
    potentialRating: 91,
    pace: 82,
    shooting: 85,
    passing: 88,
    dribbling: 88,
    defending: 50,
    physicality: 75,
    wage: 250000,
    morale: 90,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 33,
    firstName: "Rúben",
    lastName: "Dias",
    age: 26,
    clubId: 1,
    position: "CB",
    overallRating: 87,
    potentialRating: 89,
    pace: 78,
    shooting: 60,
    passing: 85,
    dribbling: 75,
    defending: 88,
    physicality: 85,
    wage: 280000,
    morale: 88,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 34,
    firstName: "Federico",
    lastName: "Valverde",
    age: 25,
    clubId: 2,
    position: "RW",
    overallRating: 87,
    potentialRating: 90,
    pace: 90,
    shooting: 82,
    passing: 80,
    dribbling: 88,
    defending: 65,
    physicality: 85,
    wage: 320000,
    morale: 88,
    stamina: 90,
    injuryStatus: "fit",
  },
  {
    id: 35,
    firstName: "Luka",
    lastName: "Modrić",
    age: 37,
    clubId: 2,
    position: "CM",
    overallRating: 86,
    potentialRating: 87,
    pace: 70,
    shooting: 82,
    passing: 92,
    dribbling: 88,
    defending: 65,
    physicality: 70,
    wage: 250000,
    morale: 85,
    stamina: 75,
    injuryStatus: "fit",
  },
  {
    id: 36,
    firstName: "Trent",
    lastName: "Alexander-Arnold",
    age: 25,
    clubId: 3,
    position: "RB",
    overallRating: 85,
    potentialRating: 87,
    pace: 80,
    shooting: 78,
    passing: 90,
    dribbling: 82,
    defending: 70,
    physicality: 75,
    wage: 220000,
    morale: 82,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 37,
    firstName: "Andrew",
    lastName: "Robertson",
    age: 29,
    clubId: 3,
    position: "LB",
    overallRating: 84,
    potentialRating: 86,
    pace: 80,
    shooting: 65,
    passing: 82,
    dribbling: 78,
    defending: 80,
    physicality: 80,
    wage: 200000,
    morale: 85,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 38,
    firstName: "Gavi",
    lastName: "Paez",
    age: 19,
    clubId: 4,
    position: "CM",
    overallRating: 82,
    potentialRating: 90,
    pace: 80,
    shooting: 78,
    passing: 85,
    dribbling: 88,
    defending: 70,
    physicality: 75,
    wage: 180000,
    morale: 88,
    stamina: 85,
    injuryStatus: "fit",
  },
  {
    id: 39,
    firstName: "Lautaro",
    lastName: "Martínez",
    age: 26,
    clubId: 4,
    position: "ST",
    overallRating: 86,
    potentialRating: 88,
    pace: 82,
    shooting: 88,
    passing: 78,
    dribbling: 85,
    defending: 50,
    physicality: 85,
    wage: 300000,
    morale: 88,
    stamina: 80,
    injuryStatus: "fit",
  },
  {
    id: 40,
    firstName: "Lisandro",
    lastName: "Martínez",
    age: 25,
    clubId: 1,
    position: "CB",
    overallRating: 85,
    potentialRating: 87,
    pace: 80,
    shooting: 60,
    passing: 80,
    dribbling: 75,
    defending: 85,
    physicality: 88,
    wage: 250000,
    morale: 88,
    stamina: 85,
    injuryStatus: "fit",
  },
];