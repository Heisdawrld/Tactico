// Scout report for an opponent team
export interface ScoutReport {
  opponentId: number;
  opponentName: string;
  formation: string;
  playingStyle: string;
  strengths: string[];
  weaknesses: string[];
  keyPlayers: ScoutedPlayer[];
  overallThreat: number; // 1-10
}

// Scouted player (opponent)
export interface ScoutedPlayer {
  id: number;
  name: string;
  position: string;
  overallRating: number;
  keyAttributes: Record<string, number>; // e.g., { pace: 85, shooting: 90 }
  threatLevel: "Low" | "Medium" | "High" | "Extreme";
}

// Static scout reports (for now, no database)
export const scoutReports: Record<number, ScoutReport> = {
  1: {
    opponentId: 2,
    opponentName: "Real Madrid",
    formation: "4-3-3",
    playingStyle: "Possession-Based",
    strengths: [
      "Strong midfield control",
      "Excellent passing",
      "Clinical finishing",
    ],
    weaknesses: [
      "Slow centre-backs",
      "Weak at set pieces",
      "Over-reliant on left wing",
    ],
    keyPlayers: [
      {
        id: 4,
        name: "Jude Bellingham",
        position: "CM",
        overallRating: 90,
        keyAttributes: { passing: 88, shooting: 88, stamina: 85 },
        threatLevel: "Extreme",
      },
      {
        id: 5,
        name: "Vinicius Junior",
        position: "LW",
        overallRating: 88,
        keyAttributes: { pace: 92, dribbling: 90 },
        threatLevel: "High",
      },
    ],
    overallThreat: 9,
  },
  2: {
    opponentId: 3,
    opponentName: "Liverpool",
    formation: "4-3-3",
    playingStyle: "High Pressing",
    strengths: [
      "Aggressive pressing",
      "Fast transitions",
      "Strong full-backs",
    ],
    weaknesses: [
      "Vulnerable to long balls",
      "Lack of creative midfielders",
      "Inconsistent finishing",
    ],
    keyPlayers: [
      {
        id: 7,
        name: "Mohamed Salah",
        position: "RW",
        overallRating: 90,
        keyAttributes: { pace: 90, dribbling: 90, finishing: 88 },
        threatLevel: "Extreme",
      },
      {
        id: 8,
        name: "Virgil van Dijk",
        position: "CB",
        overallRating: 89,
        keyAttributes: { defending: 92, heading: 88 },
        threatLevel: "High",
      },
    ],
    overallThreat: 8,
  },
  3: {
    opponentId: 4,
    opponentName: "Barcelona",
    formation: "4-3-3",
    playingStyle: "Tiki-Taka",
    strengths: [
      "Exceptional ball retention",
      "Quick passing",
      "Technically gifted players",
    ],
    weaknesses: [
      "Weak in aerial duels",
      "Slow defensive line",
      "Struggles with physical teams",
    ],
    keyPlayers: [
      {
        id: 10,
        name: "Robert Lewandowski",
        position: "ST",
        overallRating: 88,
        keyAttributes: { finishing: 92, heading: 85 },
        threatLevel: "Extreme",
      },
      {
        id: 11,
        name: "Frenkie de Jong",
        position: "CM",
        overallRating: 89,
        keyAttributes: { passing: 90, vision: 88 },
        threatLevel: "High",
      },
    ],
    overallThreat: 9,
  },
  4: {
    opponentId: 5,
    opponentName: "Manchester United",
    formation: "4-2-3-1",
    playingStyle: "Counter-Attacking",
    strengths: [
      "Fast wingers",
      "Strong counter-attacks",
      "Good set-piece takers",
    ],
    weaknesses: [
      "Slow build-up",
      "Inconsistent defending",
      "Over-reliant on individual brilliance",
    ],
    keyPlayers: [
      {
        id: 13,
        name: "Bruno Fernandes",
        position: "CAM",
        overallRating: 88,
        keyAttributes: { passing: 90, shooting: 88 },
        threatLevel: "Extreme",
      },
      {
        id: 14,
        name: "Marcus Rashford",
        position: "LW",
        overallRating: 85,
        keyAttributes: { pace: 88, dribbling: 85 },
        threatLevel: "High",
      },
    ],
    overallThreat: 7,
  },
  5: {
    opponentId: 6,
    opponentName: "Bayern Munich",
    formation: "4-2-3-1",
    playingStyle: "Balanced",
    strengths: [
      "Strong in all areas",
      "Good teamwork",
      "Physical presence",
    ],
    weaknesses: [
      "Lack of pace in defence",
      "Predictable play",
    ],
    keyPlayers: [
      {
        id: 16,
        name: "Harry Kane",
        position: "ST",
        overallRating: 89,
        keyAttributes: { finishing: 92, passing: 85 },
        threatLevel: "Extreme",
      },
      {
        id: 17,
        name: "Joshua Kimmich",
        position: "CM",
        overallRating: 88,
        keyAttributes: { passing: 90, workRate: 85 },
        threatLevel: "High",
      },
    ],
    overallThreat: 8,
  },
};

// Opponent playstyles
export const playStyles = [
  "Possession-Based",
  "High Pressing",
  "Counter-Attacking",
  "Direct Play",
  "Balanced",
  "Defensive",
  "Wing Play",
  "Target Man",
] as const;
