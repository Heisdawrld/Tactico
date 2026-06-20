export type Formation =
  | "4-4-2"
  | "4-3-3"
  | "3-5-2"
  | "4-2-3-1"
  | "5-3-2";

export type PressingIntensity = "low" | "medium" | "high";
export type PassingStyle = "short" | "long" | "mixed";
export type DefensiveLine = "low" | "medium" | "high";

export interface Tactics {
  formation: Formation;
  pressingIntensity: PressingIntensity;
  passingStyle: PassingStyle;
  defensiveLine: DefensiveLine;
}

// Default tactics
export const defaultTactics: Tactics = {
  formation: "4-4-2",
  pressingIntensity: "medium",
  passingStyle: "mixed",
  defensiveLine: "medium",
};

// Formation positions for drag-and-drop
// Maps formation to player positions on the pitch (x, y coordinates)
export const formationPositions: Record<Formation, { position: string; x: number; y: number }[]> = {
  "4-4-2": [
    { position: "GK", x: 0.5, y: 0.1 },
    { position: "CB", x: 0.3, y: 0.3 },
    { position: "CB", x: 0.7, y: 0.3 },
    { position: "RB", x: 0.1, y: 0.4 },
    { position: "LB", x: 0.9, y: 0.4 },
    { position: "CM", x: 0.25, y: 0.6 },
    { position: "CM", x: 0.75, y: 0.6 },
    { position: "RM", x: 0.1, y: 0.8 },
    { position: "LM", x: 0.9, y: 0.8 },
    { position: "ST", x: 0.4, y: 0.9 },
    { position: "ST", x: 0.6, y: 0.9 },
  ],
  "4-3-3": [
    { position: "GK", x: 0.5, y: 0.1 },
    { position: "CB", x: 0.3, y: 0.3 },
    { position: "CB", x: 0.7, y: 0.3 },
    { position: "RB", x: 0.1, y: 0.4 },
    { position: "LB", x: 0.9, y: 0.4 },
    { position: "CDM", x: 0.5, y: 0.55 },
    { position: "CM", x: 0.25, y: 0.7 },
    { position: "CM", x: 0.75, y: 0.7 },
    { position: "RW", x: 0.1, y: 0.85 },
    { position: "LW", x: 0.9, y: 0.85 },
    { position: "ST", x: 0.5, y: 0.95 },
  ],
  "3-5-2": [
    { position: "GK", x: 0.5, y: 0.1 },
    { position: "CB", x: 0.2, y: 0.3 },
    { position: "CB", x: 0.5, y: 0.3 },
    { position: "CB", x: 0.8, y: 0.3 },
    { position: "RWB", x: 0.1, y: 0.5 },
    { position: "LWB", x: 0.9, y: 0.5 },
    { position: "CM", x: 0.3, y: 0.7 },
    { position: "CM", x: 0.5, y: 0.7 },
    { position: "CM", x: 0.7, y: 0.7 },
    { position: "ST", x: 0.4, y: 0.9 },
    { position: "ST", x: 0.6, y: 0.9 },
  ],
  "4-2-3-1": [
    { position: "GK", x: 0.5, y: 0.1 },
    { position: "CB", x: 0.3, y: 0.3 },
    { position: "CB", x: 0.7, y: 0.3 },
    { position: "RB", x: 0.1, y: 0.4 },
    { position: "LB", x: 0.9, y: 0.4 },
    { position: "CDM", x: 0.3, y: 0.55 },
    { position: "CDM", x: 0.7, y: 0.55 },
    { position: "CAM", x: 0.5, y: 0.7 },
    { position: "RW", x: 0.1, y: 0.8 },
    { position: "LW", x: 0.9, y: 0.8 },
    { position: "ST", x: 0.5, y: 0.95 },
  ],
  "5-3-2": [
    { position: "GK", x: 0.5, y: 0.1 },
    { position: "CB", x: 0.2, y: 0.3 },
    { position: "CB", x: 0.5, y: 0.3 },
    { position: "CB", x: 0.8, y: 0.3 },
    { position: "RB", x: 0.1, y: 0.45 },
    { position: "LB", x: 0.9, y: 0.45 },
    { position: "CM", x: 0.3, y: 0.65 },
    { position: "CM", x: 0.5, y: 0.65 },
    { position: "CM", x: 0.7, y: 0.65 },
    { position: "ST", x: 0.4, y: 0.9 },
    { position: "ST", x: 0.6, y: 0.9 },
  ],
};

// Map player positions to their roles in formations
export const positionRoles: Record<string, string[]> = {
  GK: ["GK"],
  CB: ["CB", "RCB", "LCB"],
  RB: ["RB", "RWB"],
  LB: ["LB", "LWB"],
  CDM: ["CDM"],
  CM: ["CM", "LCM", "RCM"],
  CAM: ["CAM", "AMC"],
  RW: ["RW", "RM"],
  LW: ["LW", "LM"],
  CF: ["CF"],
  ST: ["ST", "LS", "RS"],
};