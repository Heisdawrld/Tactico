// Training categories
export type TrainingCategory = "Physical" | "Technical" | "Tactical" | "Mental";

// Training intensity (1-5)
export type TrainingIntensity = 1 | 2 | 3 | 4 | 5;

// Training schedule for the week
export interface TrainingSchedule {
  physical: TrainingIntensity;
  technical: TrainingIntensity;
  tactical: TrainingIntensity;
  mental: TrainingIntensity;
}

// Default training schedule
export const defaultTrainingSchedule: TrainingSchedule = {
  physical: 3,
  technical: 3,
  tactical: 3,
  mental: 2,
};

// Training focus areas for each category
export const trainingFocusAreas: Record<TrainingCategory, string[]> = {
  Physical: ["Stamina", "Strength", "Speed", "Agility", "Jumping Reach"],
  Technical: ["Passing", "Shooting", "Dribbling", "First Touch", "Crossing"],
  Tactical: ["Teamwork", "Positioning", "Decision Making", "Off the Ball", "Anticipation"],
  Mental: ["Morale", "Leadership", "Composure", "Determination", "Work Rate"],
};

// Individual training focus
export interface IndividualTraining {
  playerId: number;
  category: TrainingCategory;
  focusArea: string;
}

// Training effects (how much each intensity level improves stats)
export const trainingEffects: Record<TrainingIntensity, number> = {
  1: 0.5,  // Very light training
  2: 1.0,  // Light training
  3: 1.5,  // Moderate training
  4: 2.0,  // Heavy training
  5: 2.5,  // Very heavy training (risk of injury/fatigue)
};

// Youth player (for youth intake)
export interface YouthPlayer {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  potentialRating: number; // 50-100
  currentRating: number; // 30-70 (starts low)
  traits: string[]; // e.g., ["Technically Gifted", "Weak Physically"]
}

// Static youth players (for now, no database)
export const youthPlayers: YouthPlayer[] = [
  {
    id: 1001,
    firstName: "Jamie",
    lastName: "Bowen",
    age: 16,
    position: "ST",
    potentialRating: 85,
    currentRating: 55,
    traits: ["Technically Gifted", "Determined"],
  },
  {
    id: 1002,
    firstName: "Rio",
    lastName: "Nelson",
    age: 16,
    position: "CB",
    potentialRating: 80,
    currentRating: 50,
    traits: ["Strong", "Good Anticipation"],
  },
  {
    id: 1003,
    firstName: "Kai",
    lastName: "Davies",
    age: 16,
    position: "CM",
    potentialRating: 88,
    currentRating: 52,
    traits: ["Creative", "Weak Physically"],
  },
  {
    id: 1004,
    firstName: "Liam",
    lastName: "Shaw",
    age: 16,
    position: "RB",
    potentialRating: 78,
    currentRating: 48,
    traits: ["Pacy", "Poor Composure"],
  },
  {
    id: 1005,
    firstName: "Noah",
    lastName: "Wright",
    age: 16,
    position: "CAM",
    potentialRating: 90,
    currentRating: 58,
    traits: ["Technically Gifted", "Flair"],
  },
  {
    id: 1006,
    firstName: "Ethan",
    lastName: "Hayes",
    age: 16,
    position: "GK",
    potentialRating: 82,
    currentRating: 50,
    traits: ["Good Reflexes", "Poor Distribution"],
  },
  {
    id: 1007,
    firstName: "Ollie",
    lastName: "Watkins",
    age: 16,
    position: "LW",
    potentialRating: 84,
    currentRating: 54,
    traits: ["Pacy", "Two-Footed"],
  },
  {
    id: 1008,
    firstName: "Callum",
    lastName: "Doyle",
    age: 16,
    position: "CDM",
    potentialRating: 79,
    currentRating: 49,
    traits: ["Aggressive", "Good Stamina"],
  },
  {
    id: 1009,
    firstName: "Jacob",
    lastName: "Mitchell",
    age: 16,
    position: "LB",
    potentialRating: 81,
    currentRating: 51,
    traits: ["Good Crossing", "Poor Heading"],
  },
  {
    id: 1010,
    firstName: "Harry",
    lastName: "Bates",
    age: 16,
    position: "ST",
    potentialRating: 87,
    currentRating: 56,
    traits: ["Clinical Finisher", "Weak Physically"],
  },
];

// Mentoring: Pair youth players with seniors
export interface MentoringPair {
  youthPlayerId: number;
  seniorPlayerId: number;
  progress: number; // 0-100
}

// Training results (after a week)
export interface TrainingResult {
  playerId: number;
  attribute: string;
  improvement: number;
  message: string;
}
