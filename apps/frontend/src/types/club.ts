export interface Club {
  id: number;
  name: string;
  country: string;
  league: string;
  reputation: number;
  finances: number;
  stadiumCapacity: number;
  homeKitColor: string;
  awayKitColor: string;
}

// Static data for clubs (no database yet)
export const clubs: Club[] = [
  {
    id: 1,
    name: "Manchester City",
    country: "England",
    league: "Premier League",
    reputation: 95,
    finances: 100000000,
    stadiumCapacity: 53400,
    homeKitColor: "#6CABDD",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 2,
    name: "Real Madrid",
    country: "Spain",
    league: "La Liga",
    reputation: 98,
    finances: 150000000,
    stadiumCapacity: 81044,
    homeKitColor: "#FFFFFF",
    awayKitColor: "#000000",
  },
  {
    id: 3,
    name: "Liverpool",
    country: "England",
    league: "Premier League",
    reputation: 88,
    finances: 80000000,
    stadiumCapacity: 53287,
    homeKitColor: "#C8102E",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 4,
    name: "Barcelona",
    country: "Spain",
    league: "La Liga",
    reputation: 97,
    finances: 140000000,
    stadiumCapacity: 99354,
    homeKitColor: "#A50044",
    awayKitColor: "#FDB813",
  },
  {
    id: 5,
    name: "Manchester United",
    country: "England",
    league: "Premier League",
    reputation: 90,
    finances: 50000000,
    stadiumCapacity: 74140,
    homeKitColor: "#DA291C",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 6,
    name: "Bayern Munich",
    country: "Germany",
    league: "Bundesliga",
    reputation: 92,
    finances: 90000000,
    stadiumCapacity: 75000,
    homeKitColor: "#FC2026",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 7,
    name: "Paris Saint-Germain",
    country: "France",
    league: "Ligue 1",
    reputation: 89,
    finances: 120000000,
    stadiumCapacity: 47929,
    homeKitColor: "#004170",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 8,
    name: "Juventus",
    country: "Italy",
    league: "Serie A",
    reputation: 87,
    finances: 60000000,
    stadiumCapacity: 41507,
    homeKitColor: "#000000",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 9,
    name: "Arsenal",
    country: "England",
    league: "Premier League",
    reputation: 85,
    finances: 70000000,
    stadiumCapacity: 60260,
    homeKitColor: "#EF0107",
    awayKitColor: "#FFFFFF",
  },
  {
    id: 10,
    name: "AC Milan",
    country: "Italy",
    league: "Serie A",
    reputation: 84,
    finances: 55000000,
    stadiumCapacity: 75817,
    homeKitColor: "#DA291C",
    awayKitColor: "#FFFFFF",
  },
];