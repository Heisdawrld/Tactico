// Finance types
export interface ClubFinances {
  clubId: number;
  balance: number; // Current balance in USD
  wageBudget: number; // Weekly wage budget
  transferBudget: number; // Budget for transfers
  sponsorshipRevenue: number; // Weekly income from sponsors
  ticketRevenue: number; // Weekly income from tickets
  otherIncome: number; // Other income (merchandise, etc.)
  weeklyExpenses: number; // Total weekly expenses
}

// Financial transaction
export interface FinancialTransaction {
  id: number;
  date: string;
  type: "Income" | "Expense";
  category:
    | "Sponsorship"
    | "Ticket Sales"
    | "Merchandise"
    | "Wages"
    | "Transfer Fee"
    | "Loan Fee"
    | "Facility Upgrade"
    | "Youth Development"
    | "Bonus"
    | "Fine";
  amount: number;
  description: string;
  relatedId?: number; // e.g., playerId for wages, transferId for fees
}

// Facility types
export interface Facility {
  id: number;
  clubId: number;
  type: "Training Grounds" | "Youth Academy" | "Stadium" | "Medical Center";
  level: number; // 1-5
  upgradeCost: number;
  maintenanceCost: number;
  benefits: string[];
}

// Facility benefits by type and level
export const facilityBenefits: Record<string, Record<number, string[]>> = {
  "Training Grounds": {
    1: ["Basic training equipment"],
    2: ["Improved gym facilities", "+5% player development speed"],
    3: ["Professional training pitches", "+10% player development speed", "Reduced injury risk"],
    4: ["State-of-the-art facilities", "+15% player development speed", "+5% morale"],
    5: ["World-class training center", "+20% player development speed", "+10% morale", "Best injury recovery"],
  },
  "Youth Academy": {
    1: ["Basic youth setup"],
    2: ["Improved scouting", "+10% youth potential"],
    3: ["Better coaching", "+15% youth potential", "More youth intake"],
    4: ["Elite academy", "+20% youth potential", "+25% youth intake", "Better youth traits"],
    5: ["World-leading academy", "+25% youth potential", "+50% youth intake", "Guaranteed wonderkids"],
  },
  "Stadium": {
    1: ["Small stadium", "Low ticket revenue"],
    2: ["Medium capacity", "+25% ticket revenue"],
    3: ["Large stadium", "+50% ticket revenue", "Improved atmosphere"],
    4: ["Major stadium", "+75% ticket revenue", "+10% home advantage"],
    5: ["World-class arena", "+100% ticket revenue", "+20% home advantage", "Sells out every match"],
  },
  "Medical Center": {
    1: ["Basic medical facilities"],
    2: ["Improved physio team", "-10% injury duration"],
    3: ["Advanced medical equipment", "-20% injury duration", "Better recovery programs"],
    4: ["Elite medical staff", "-30% injury duration", "+5% player fitness"],
    5: ["World-class medical center", "-40% injury duration", "+10% player fitness", "Prevents long-term injuries"],
  },
};

// Facility upgrade costs
export const facilityUpgradeCosts: Record<string, number[]> = {
  "Training Grounds": [0, 5000000, 10000000, 20000000, 40000000],
  "Youth Academy": [0, 3000000, 8000000, 15000000, 30000000],
  "Stadium": [0, 10000000, 25000000, 50000000, 100000000],
  "Medical Center": [0, 2000000, 5000000, 10000000, 20000000],
};

// Facility maintenance costs (weekly)
export const facilityMaintenanceCosts: Record<string, number[]> = {
  "Training Grounds": [0, 50000, 150000, 300000, 500000],
  "Youth Academy": [0, 30000, 100000, 200000, 400000],
  "Stadium": [0, 200000, 500000, 1000000, 2000000],
  "Medical Center": [0, 100000, 250000, 500000, 1000000],
};

// Static finances for clubs (for now, no database)
import { clubs } from "./club";

export const clubFinances: Record<number, ClubFinances> = clubs.reduce(
  (acc, club) => {
    acc[club.id] = {
      clubId: club.id,
      balance: club.finances,
      wageBudget: Math.floor(club.finances * 0.1), // 10% of finances
      transferBudget: Math.floor(club.finances * 0.2), // 20% of finances
      sponsorshipRevenue: Math.floor(club.reputation * 100000), // Based on reputation
      ticketRevenue: Math.floor(club.stadiumCapacity * 100), // Per match
      otherIncome: Math.floor(club.finances * 0.05), // 5% of finances
      weeklyExpenses: Math.floor(club.finances * 0.02), // 2% of finances
    };
    return acc;
  },
  {} as Record<number, ClubFinances>
);

// Static facilities for clubs
export const clubFacilities: Record<number, Facility[]> = clubs.reduce(
  (acc, club) => {
    acc[club.id] = [
      {
        id: 1,
        clubId: club.id,
        type: "Training Grounds",
        level: club.trainingFacilities as number,
        upgradeCost: facilityUpgradeCosts["Training Grounds"][club.trainingFacilities as number],
        maintenanceCost: facilityMaintenanceCosts["Training Grounds"][club.trainingFacilities as number],
        benefits: facilityBenefits["Training Grounds"][club.trainingFacilities as number],
      },
      {
        id: 2,
        clubId: club.id,
        type: "Youth Academy",
        level: club.youthAcademy as number,
        upgradeCost: facilityUpgradeCosts["Youth Academy"][club.youthAcademy as number],
        maintenanceCost: facilityMaintenanceCosts["Youth Academy"][club.youthAcademy as number],
        benefits: facilityBenefits["Youth Academy"][club.youthAcademy as number],
      },
      {
        id: 3,
        clubId: club.id,
        type: "Stadium",
        level: Math.min(5, Math.floor(club.stadiumCapacity / 20000)) as number,
        upgradeCost: facilityUpgradeCosts["Stadium"][Math.min(5, Math.floor(club.stadiumCapacity / 20000)) as number],
        maintenanceCost: facilityMaintenanceCosts["Stadium"][Math.min(5, Math.floor(club.stadiumCapacity / 20000)) as number],
        benefits: facilityBenefits["Stadium"][Math.min(5, Math.floor(club.stadiumCapacity / 20000)) as number],
      },
      {
        id: 4,
        clubId: club.id,
        type: "Medical Center",
        level: 1 as number,
        upgradeCost: facilityUpgradeCosts["Medical Center"][1],
        maintenanceCost: facilityMaintenanceCosts["Medical Center"][1],
        benefits: facilityBenefits["Medical Center"][1],
      },
    ];
    return acc;
  },
  {} as Record<number, Facility[]>
);

// Financial history (for tracking transactions)
export const financialHistory: FinancialTransaction[] = [];

// Add a transaction to history
export const addFinancialTransaction = (transaction: Omit<FinancialTransaction, "id">) => {
  const newTransaction: FinancialTransaction = {
    id: financialHistory.length + 1,
    ...transaction,
  };
  financialHistory.push(newTransaction);
  return newTransaction;
};

// Calculate weekly income/expenses
export const calculateWeeklyFinances = (clubId: number): { income: number; expenses: number } => {
  const finances = clubFinances[clubId];
  const facilities = clubFacilities[clubId] || [];
  
  if (!finances) {
    return { income: 0, expenses: 0 };
  }

  // Calculate total maintenance costs
  const maintenanceCosts = facilities.reduce(
    (sum, facility) => sum + facility.maintenanceCost,
    0
  );

  // Weekly income
  const income = finances.sponsorshipRevenue + finances.otherIncome;
  
  // Weekly expenses (wages + maintenance)
  const expenses = finances.weeklyExpenses + maintenanceCosts;

  return { income, expenses };
};
