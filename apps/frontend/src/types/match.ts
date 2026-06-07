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

// Static data for matches (no database yet)
export const matches: Match[] = [
  {
    id: 1,
    homeClubId: 1,
    awayClubId: 3,
    competition: "Premier League",
    matchDate: "2026-06-15T15:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 2,
    homeClubId: 2,
    awayClubId: 4,
    competition: "La Liga",
    matchDate: "2026-06-16T20:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "rain",
  },
  {
    id: 3,
    homeClubId: 5,
    awayClubId: 1,
    competition: "Premier League",
    matchDate: "2026-06-17T12:30:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 4,
    homeClubId: 6,
    awayClubId: 2,
    competition: "Champions League",
    matchDate: "2026-06-18T20:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 5,
    homeClubId: 7,
    awayClubId: 8,
    competition: "Ligue 1",
    matchDate: "2026-06-19T18:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 6,
    homeClubId: 9,
    awayClubId: 10,
    competition: "Serie A",
    matchDate: "2026-06-20T15:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "windy",
  },
  {
    id: 7,
    homeClubId: 1,
    awayClubId: 2,
    competition: "Champions League",
    matchDate: "2026-06-21T20:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 8,
    homeClubId: 3,
    awayClubId: 5,
    competition: "Premier League",
    matchDate: "2026-06-22T12:30:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "rain",
  },
  {
    id: 9,
    homeClubId: 4,
    awayClubId: 6,
    competition: "La Liga",
    matchDate: "2026-06-23T20:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "clear",
  },
  {
    id: 10,
    homeClubId: 10,
    awayClubId: 7,
    competition: "Champions League",
    matchDate: "2026-06-24T20:00:00",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    weather: "snow",
  },
];