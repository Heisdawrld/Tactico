// Player roles (for tactics)
export type PlayerRole =
  | "Goalkeeper"
  | "Sweeper Keeper"
  | "Ball-Playing Defender"
  | "Central Defender"
  | "No-Nonsense Centre-Back"
  | "Full-Back"
  | "Wing-Back"
  | "Defensive Midfielder"
  | "Ball-Winning Midfielder"
  | "Deep-Lying Playmaker"
  | "Box-to-Box Midfielder"
  | "Central Midfielder"
  | "Advanced Playmaker"
  | "Attacking Midfielder"
  | "Trequartista"
  | "Winger"
  | "Inside Forward"
  | "Pressing Forward"
  | "Deep-Lying Forward"
  | "Complete Forward"
  | "Target Man"
  | "Poacher";

// Map positions to valid roles
export const positionToRoles: Record<string, PlayerRole[]> = {
  GK: ["Goalkeeper", "Sweeper Keeper"],
  CB: [
    "Ball-Playing Defender",
    "Central Defender",
    "No-Nonsense Centre-Back",
  ],
  RB: ["Full-Back", "Wing-Back"],
  LB: ["Full-Back", "Wing-Back"],
  CDM: [
    "Defensive Midfielder",
    "Ball-Winning Midfielder",
    "Deep-Lying Playmaker",
  ],
  CM: [
    "Defensive Midfielder",
    "Ball-Winning Midfielder",
    "Box-to-Box Midfielder",
    "Central Midfielder",
    "Deep-Lying Playmaker",
    "Advanced Playmaker",
  ],
  CAM: [
    "Attacking Midfielder",
    "Advanced Playmaker",
    "Trequartista",
  ],
  RW: ["Winger", "Inside Forward", "Pressing Forward"],
  LW: ["Winger", "Inside Forward", "Pressing Forward"],
  CF: [
    "Deep-Lying Forward",
    "Complete Forward",
    "Target Man",
    "Poacher",
    "Pressing Forward",
  ],
  ST: [
    "Deep-Lying Forward",
    "Complete Forward",
    "Target Man",
    "Poacher",
    "Pressing Forward",
  ],
};

// Role descriptions
export const roleDescriptions: Record<PlayerRole, string> = {
  "Goalkeeper": "Traditional goalkeeper. Stays in goal and makes saves.",
  "Sweeper Keeper": "Aggressive goalkeeper who rushes off his line to sweep up through balls.",
  "Ball-Playing Defender": "Defender who focuses on playing out from the back with accurate passes.",
  "Central Defender": "Standard centre-back. Strong in the air and good at tackling.",
  "No-Nonsense Centre-Back": "Aggressive defender who focuses on clearing the ball at all costs.",
  "Full-Back": "Defensive full-back who stays back and marks wingers.",
  "Wing-Back": "Attacking full-back who bombs forward to support attacks.",
  "Defensive Midfielder": "Holds position in front of the defence to shield the back line.",
  "Ball-Winning Midfielder": "Aggressive midfielder who focuses on winning the ball back.",
  "Deep-Lying Playmaker": "Playmaker who sits deep and dictates play with long passes.",
  "Box-to-Box Midfielder": "Complete midfielder who contributes both defensively and offensively.",
  "Central Midfielder": "Balanced midfielder with no extreme strengths or weaknesses.",
  "Advanced Playmaker": "Creative midfielder who looks to play through balls and key passes.",
  "Attacking Midfielder": "Offensive midfielder who focuses on scoring and creating chances.",
  "Trequartista": "Creative attacking midfielder who roams between the lines.",
  "Winger": "Wide player who hugs the touchline and delivers crosses.",
  "Inside Forward": "Wide player who cuts inside to shoot or create chances.",
  "Pressing Forward": "Forward who presses defenders and harries them into mistakes.",
  "Deep-Lying Forward": "Forward who drops deep to link play and create chances.",
  "Complete Forward": "All-round forward who can score, create, and hold up play.",
  "Target Man": "Physical forward who wins aerial duels and holds up play.",
  "Poacher": "Goal-hungry forward who stays in the box and finishes chances.",
};

// Role bonuses (how roles affect player attributes in matches)
export const roleBonuses: Record<PlayerRole, Partial<Record<string, number>>> = {
  "Goalkeeper": {},
  "Sweeper Keeper": { pace: +5, handling: -5, rushingOut: +10 },
  "Ball-Playing Defender": { passing: +10, vision: +5, tackling: -5 },
  "Central Defender": { strength: +5, heading: +5 },
  "No-Nonsense Centre-Back": { aggression: +10, passing: -5 },
  "Full-Back": { defending: +5, crossing: -5 },
  "Wing-Back": { stamina: +5, crossing: +10, defending: -5 },
  "Defensive Midfielder": { tackling: +10, passing: -5 },
  "Ball-Winning Midfielder": { aggression: +15, passing: -10 },
  "Deep-Lying Playmaker": { passing: +15, vision: +10, pace: -5 },
  "Box-to-Box Midfielder": { stamina: +10, workRate: +10 },
  "Central Midfielder": {},
  "Advanced Playmaker": { passing: +10, vision: +10, defending: -5 },
  "Attacking Midfielder": { shooting: +5, passing: +10, defending: -10 },
  "Trequartista": { creativity: +15, defending: -15 },
  "Winger": { pace: +10, crossing: +10, strength: -5 },
  "Inside Forward": { finishing: +5, dribbling: +10, crossing: -5 },
  "Pressing Forward": { aggression: +10, stamina: +5, finishing: -5 },
  "Deep-Lying Forward": { passing: +10, vision: +5, pace: -5 },
  "Complete Forward": { finishing: +5, passing: +5, strength: +5 },
  "Target Man": { strength: +15, heading: +10, pace: -10 },
  "Poacher": { finishing: +15, composure: +10, strength: -10 },
};
