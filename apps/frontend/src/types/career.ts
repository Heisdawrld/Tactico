// Career types
export interface Career {
  id: number;
  userId: string;
  clubId: number;
  startDate: string;
  endDate?: string;
  reputation: number; // 0-100
  achievements: string[];
  seasons: Season[];
}

// Season history
export interface Season {
  year: number;
  clubId: number;
  competition: string;
  finalPosition: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  trophiesWon: string[];
}

// Career status (for current career)
export interface CareerStatus {
  clubId: number;
  season: number;
  week: number;
  reputation: number;
  finances: number;
  boardExpectations: BoardExpectation[];
}

// Board expectations
export interface BoardExpectation {
  target: string; // e.g., "Finish top 4", "Win the league", "Avoid relegation"
  priority: "Critical" | "High" | "Medium" | "Low";
  progress: number; // 0-100
  deadline: string; // e.g., "End of season"
}

// Default board expectations based on club reputation
export const getDefaultBoardExpectations = (clubReputation: number): BoardExpectation[] => {
  if (clubReputation >= 90) {
    return [
      {
        target: "Win the league",
        priority: "Critical",
        progress: 0,
        deadline: "End of season",
      },
      {
        target: "Reach Champions League final",
        priority: "High",
        progress: 0,
        deadline: "End of season",
      },
    ];
  } else if (clubReputation >= 70) {
    return [
      {
        target: "Finish top 4",
        priority: "Critical",
        progress: 0,
        deadline: "End of season",
      },
      {
        target: "Reach cup semi-final",
        priority: "Medium",
        progress: 0,
        deadline: "End of season",
      },
    ];
  } else {
    return [
      {
        target: "Avoid relegation",
        priority: "Critical",
        progress: 0,
        deadline: "End of season",
      },
      {
        target: "Improve squad depth",
        priority: "Medium",
        progress: 0,
        deadline: "End of season",
      },
    ];
  }
};

// Career progression (for simulating seasons)
export interface CareerProgression {
  week: number;
  matches: MatchResult[];
  trainingEffects: TrainingEffect[];
  playerDevelopment: PlayerDevelopment[];
  financialUpdates: FinancialUpdate[];
}

// Match result
export interface MatchResult {
  matchId: number;
  opponentId: number;
  opponentName: string;
  homeScore: number;
  awayScore: number;
  result: "Win" | "Draw" | "Loss";
  playerRatings: Record<number, number>; // playerId: rating (1-10)
  keyEvents: MatchEvent[];
}

// Match event
export interface MatchEvent {
  type: "Goal" | "Assist" | "Yellow Card" | "Red Card" | "Injury" | "Man of the Match";
  playerId: number;
  playerName: string;
  minute: number;
  description: string;
}

// Training effect
export interface TrainingEffect {
  playerId: number;
  attribute: string;
  improvement: number;
}

// Player development
export interface PlayerDevelopment {
  playerId: number;
  attributeChanges: Record<string, number>;
  newRating: number;
}

// Financial update
export interface FinancialUpdate {
  type: "Income" | "Expense";
  category: string; // e.g., "Sponsorship", "Wages", "Transfer Fee"
  amount: number;
  description: string;
}

// Static career data (for now, no database)
export const initialCareer: CareerStatus = {
  clubId: 1,
  season: 2026,
  week: 1,
  reputation: 50,
  finances: 50000000,
  boardExpectations: getDefaultBoardExpectations(90),
};

// League tables (static for now)
export interface LeagueTableEntry {
  position: number;
  clubId: number;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// Generate initial league table
export const generateLeagueTable = (clubIds: number[]): LeagueTableEntry[] => {
  return clubIds.map((clubId, index) => ({
    position: index + 1,
    clubId,
    clubName: clubs.find((c) => c.id === clubId)?.name || "Unknown",
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
};

// Clubs for league tables (import from club.ts)
import { clubs } from "./club";

// Initial Premier League table
export const premierLeagueTable: LeagueTableEntry[] = generateLeagueTable([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
]);
