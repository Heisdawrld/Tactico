// TACTICO World Engine - Time Types

/** Timestamp in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) */
export type Timestamp = string;

/** Date in YYYY-MM-DD format */
export type DateString = string;

/** Time of day in HH:mm:ss format */
export type TimeString = string;

/** Day of the week */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Month */
export type Month = 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';

/** Season (Northern Hemisphere) */
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** Time state for the world */
export interface TimeState {
  currentDate: DateString;
  currentTime: Timestamp;
  currentYear: number;
  currentMonth: Month;
  currentDay: number; // Day of month (1-31)
  currentDayOfWeek: DayOfWeek;
  currentDayOfYear: number; // Day of year (1-366)
  currentWeek: number; // Week of year (1-53)
  currentSeason: Season;
  isWeekend: boolean;
}

/** Season dates for a competition */
export interface CompetitionSeason {
  competitionId: number;
  season: number;
  startDate: DateString;
  endDate: DateString;
  isActive: boolean;
  currentMatchday: number;
  totalMatchdays: number;
}

/** Transfer window period */
export interface TransferWindow {
  id: number;
  name: string; // e.g., "Summer 2026"
  startDate: DateString;
  endDate: DateString;
  isOpen: boolean;
}

/** Date range */
export interface DateRange {
  startDate: DateString;
  endDate: DateString;
}

/** Time configuration */
export interface TimeConfig {
  tickRate: number; // ms per tick
  matchDay: DayOfWeek; // Default day for matches (e.g., 'saturday')
  transferWindows: TransferWindow[];
  youthIntakeDay: number; // Day of month for youth intake
}

/** Default time configuration */
export const defaultTimeConfig: TimeConfig = {
  tickRate: 1000, // 1 second per tick (for real-time)
  matchDay: 'saturday',
  transferWindows: [
    { id: 1, name: 'Summer Window', startDate: '2026-06-01', endDate: '2026-08-31', isOpen: true },
    { id: 2, name: 'Winter Window', startDate: '2026-01-01', endDate: '2026-01-31', isOpen: false },
  ],
  youthIntakeDay: 1,
};

/** Month numbers (0-11) mapped to Month type */
export const monthNumbers: Record<number, Month> = {
  0: 'january',
  1: 'february',
  2: 'march',
  3: 'april',
  4: 'may',
  5: 'june',
  6: 'july',
  7: 'august',
  8: 'september',
  9: 'october',
  10: 'november',
  11: 'december',
};

/** Month type mapped to numbers (0-11) */
export const monthToNumber: Record<Month, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Day of week numbers (0-6) mapped to DayOfWeek type */
export const dayOfWeekNumbers: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

/** DayOfWeek type mapped to numbers (0-6) */
export const dayOfWeekToNumber: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Season for each month (Northern Hemisphere) */
export const monthToSeason: Record<Month, Season> = {
  january: 'winter',
  february: 'winter',
  march: 'spring',
  april: 'spring',
  may: 'spring',
  june: 'summer',
  july: 'summer',
  august: 'summer',
  september: 'autumn',
  october: 'autumn',
  november: 'autumn',
  december: 'winter',
};

/** Days in each month (non-leap year) */
export const daysInMonth: Record<Month, number> = {
  january: 31,
  february: 28,
  march: 31,
  april: 30,
  may: 31,
  june: 30,
  july: 31,
  august: 31,
  september: 30,
  october: 31,
  november: 30,
  december: 31,
};

/** Check if a year is a leap year */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Get days in February for a specific year */
export function getDaysInFebruary(year: number): number {
  return isLeapYear(year) ? 29 : 28;
}

/** Get days in a month for a specific year */
export function getDaysInMonth(month: Month, year: number): number {
  if (month === 'february') {
    return getDaysInFebruary(year);
  }
  return daysInMonth[month];
}
