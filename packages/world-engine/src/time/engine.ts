// TACTICO World Engine - Time Engine
// Handles all time-related operations for the football universe

import {
  Timestamp,
  DateString,
  TimeString,
  DayOfWeek,
  Month,
  Season,
  TimeState,
  CompetitionSeason,
  TransferWindow,
  TimeConfig,
  defaultTimeConfig,
  monthNumbers,
  monthToNumber,
  dayOfWeekNumbers,
  dayOfWeekToNumber,
  monthToSeason,
  getDaysInMonth,
  isLeapYear,
} from './types';

/**
 * TimeEngine - Manages all time-related operations
 * 
 * Handles:
 * - Current date/time tracking
 * - Date/time advancement (minutes, hours, days, weeks, months)
 * - Season and matchday calculations
 * - Transfer window status
 * - Weekend detection
 */
export class TimeEngine {
  private state: TimeState;
  private config: TimeConfig;
  private competitionSeasons: Map<number, CompetitionSeason[]> = new Map();

  constructor(config: Partial<TimeConfig> = {}) {
    this.config = { ...defaultTimeConfig, ...config };
    this.state = this.calculateInitialState(config.currentDate || '2026-06-07');
  }

  /**
   * Calculate initial time state from a date
   */
  private calculateInitialState(date: DateString): TimeState {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    const day = d.getDate(); // 1-31
    const dayOfWeek = d.getDay(); // 0-6 (Sunday-Saturday)
    
    return {
      currentDate: date,
      currentTime: `${date}T00:00:00`,
      currentYear: year,
      currentMonth: monthNumbers[month],
      currentDay: day,
      currentDayOfWeek: dayOfWeekNumbers[dayOfWeek],
      currentDayOfYear: this.calculateDayOfYear(d),
      currentWeek: this.calculateWeekOfYear(d),
      currentSeason: monthToSeason[monthNumbers[month]],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // Sunday or Saturday
    };
  }

  /**
   * Calculate day of year (1-366)
   */
  private calculateDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Calculate week of year (1-53)
   */
  private calculateWeekOfYear(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayOfYear = this.calculateDayOfYear(d);
    return Math.ceil(dayOfYear / 7);
  }

  /**
   * Get current time state
   */
  getState(): TimeState {
    return { ...this.state };
  }

  /**
   * Get current date
   */
  getCurrentDate(): DateString {
    return this.state.currentDate;
  }

  /**
   * Get current time
   */
  getCurrentTime(): Timestamp {
    return this.state.currentTime;
  }

  /**
   * Get current year
   */
  getCurrentYear(): number {
    return this.state.currentYear;
  }

  /**
   * Get current month
   */
  getCurrentMonth(): Month {
    return this.state.currentMonth;
  }

  /**
   * Get current day of month
   */
  getCurrentDay(): number {
    return this.state.currentDay;
  }

  /**
   * Get current day of week
   */
  getCurrentDayOfWeek(): DayOfWeek {
    return this.state.currentDayOfWeek;
  }

  /**
   * Get current day of year
   */
  getCurrentDayOfYear(): number {
    return this.state.currentDayOfYear;
  }

  /**
   * Get current week of year
   */
  getCurrentWeek(): number {
    return this.state.currentWeek;
  }

  /**
   * Get current season
   */
  getCurrentSeason(): Season {
    return this.state.currentSeason;
  }

  /**
   * Check if today is a weekend
   */
  isWeekend(): boolean {
    return this.state.isWeekend;
  }

  /**
   * Check if today is the match day
   */
  isMatchDay(): boolean {
    return this.state.currentDayOfWeek === this.config.matchDay;
  }

  /**
   * Check if transfer window is open
   */
  isTransferWindowOpen(): boolean {
    const today = this.state.currentDate;
    return this.config.transferWindows.some(window => {
      return today >= window.startDate && today <= window.endDate;
    });
  }

  /**
   * Get active transfer windows
   */
  getActiveTransferWindows(): TransferWindow[] {
    const today = this.state.currentDate;
    return this.config.transferWindows.filter(window => {
      return today >= window.startDate && today <= window.endDate;
    });
  }

  /**
   * Advance time by minutes
   */
  advanceMinutes(minutes: number): DateString {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setMinutes(currentDate.getMinutes() + minutes);
    const newDate = this.formatDate(currentDate);
    this.updateState(newDate);
    return newDate;
  }

  /**
   * Advance time by hours
   */
  advanceHours(hours: number): DateString {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setHours(currentDate.getHours() + hours);
    const newDate = this.formatDate(currentDate);
    this.updateState(newDate);
    return newDate;
  }

  /**
   * Advance time by days
   */
  advanceDays(days: number): DateString {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setDate(currentDate.getDate() + days);
    const newDate = this.formatDate(currentDate);
    this.updateState(newDate);
    return newDate;
  }

  /**
   * Advance time by weeks
   */
  advanceWeeks(weeks: number): DateString {
    return this.advanceDays(weeks * 7);
  }

  /**
   * Advance time by months
   */
  advanceMonths(months: number): DateString {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setMonth(currentDate.getMonth() + months);
    const newDate = this.formatDate(currentDate);
    this.updateState(newDate);
    return newDate;
  }

  /**
   * Advance time by years
   */
  advanceYears(years: number): DateString {
    const currentDate = new Date(this.state.currentDate);
    currentDate.setFullYear(currentDate.getFullYear() + years);
    const newDate = this.formatDate(currentDate);
    this.updateState(newDate);
    return newDate;
  }

  /**
   * Update state after date change
   */
  private updateState(newDate: DateString): void {
    this.state = this.calculateInitialState(newDate);
    
    // Update transfer window status
    this.config.transferWindows.forEach(window => {
      window.isOpen = newDate >= window.startDate && newDate <= window.endDate;
    });
  }

  /**
   * Format date as YYYY-MM-DD
   */
  formatDate(date: Date): DateString {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time as HH:mm:ss
   */
  formatTime(date: Date): TimeString {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  /**
   * Format as full timestamp
   */
  formatTimestamp(date: Date): Timestamp {
    return date.toISOString();
  }

  /**
   * Parse date string to Date object
   */
  parseDate(date: DateString): Date {
    return new Date(date);
  }

  /**
   * Add competition seasons
   */
  addCompetitionSeasons(seasons: CompetitionSeason[]): void {
    seasons.forEach(season => {
      if (!this.competitionSeasons.has(season.competitionId)) {
        this.competitionSeasons.set(season.competitionId, []);
      }
      this.competitionSeasons.get(season.competitionId)!.push(season);
    });
  }

  /**
   * Get current season for a competition
   */
  getCurrentCompetitionSeason(competitionId: number): CompetitionSeason | null {
    const seasons = this.competitionSeasons.get(competitionId);
    if (!seasons) return null;
    
    const today = this.state.currentDate;
    for (const season of seasons) {
      if (season.startDate <= today && today <= season.endDate) {
        return season;
      }
    }
    return null;
  }

  /**
   * Get all competition seasons for a competition
   */
  getCompetitionSeasons(competitionId: number): CompetitionSeason[] {
    return this.competitionSeasons.get(competitionId) || [];
  }

  /**
   * Check if a date is within a competition season
   */
  isInCompetitionSeason(competitionId: number, date: DateString): boolean {
    const seasons = this.competitionSeasons.get(competitionId);
    if (!seasons) return false;
    
    return seasons.some(season => {
      return date >= season.startDate && date <= season.endDate;
    });
  }

  /**
   * Get days between two dates
   */
  getDaysBetween(startDate: DateString, endDate: DateString): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get weeks between two dates
   */
  getWeeksBetween(startDate: DateString, endDate: DateString): number {
    return Math.floor(this.getDaysBetween(startDate, endDate) / 7);
  }

  /**
   * Check if date1 is before date2
   */
  isBefore(date1: DateString, date2: DateString): boolean {
    return date1 < date2;
  }

  /**
   * Check if date1 is after date2
   */
  isAfter(date1: DateString, date2: DateString): boolean {
    return date1 > date2;
  }

  /**
   * Check if date is today
   */
  isToday(date: DateString): boolean {
    return date === this.state.currentDate;
  }

  /**
   * Get the next occurrence of a specific day of week
   */
  getNextDayOfWeek(targetDay: DayOfWeek): DateString {
    const currentDayNum = dayOfWeekToNumber[this.state.currentDayOfWeek];
    const targetDayNum = dayOfWeekToNumber[targetDay];
    
    let daysToAdd = targetDayNum - currentDayNum;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    return this.advanceDays(daysToAdd);
  }

  /**
   * Get the previous occurrence of a specific day of week
   */
  getPreviousDayOfWeek(targetDay: DayOfWeek): DateString {
    const currentDayNum = dayOfWeekToNumber[this.state.currentDayOfWeek];
    const targetDayNum = dayOfWeekToNumber[targetDay];
    
    let daysToSubtract = currentDayNum - targetDayNum;
    if (daysToSubtract <= 0) {
      daysToSubtract += 7;
    }
    
    return this.advanceDays(-daysToSubtract);
  }

  /**
   * Get the start date of the current week (Monday)
   */
  getStartOfWeek(): DateString {
    return this.getPreviousDayOfWeek('monday');
  }

  /**
   * Get the end date of the current week (Sunday)
   */
  getEndOfWeek(): DateString {
    return this.getNextDayOfWeek('sunday');
  }

  /**
   * Get the start date of the current month
   */
  getStartOfMonth(): DateString {
    const year = this.state.currentYear;
    const month = monthToNumber[this.state.currentMonth];
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  }

  /**
   * Get the end date of the current month
   */
  getEndOfMonth(): DateString {
    const year = this.state.currentYear;
    const month = this.state.currentMonth;
    const days = getDaysInMonth(month, year);
    return `${year}-${String(monthToNumber[month] + 1).padStart(2, '0')}-${String(days).padStart(2, '0')}`;
  }

  /**
   * Get the start date of the current year
   */
  getStartOfYear(): DateString {
    return `${this.state.currentYear}-01-01`;
  }

  /**
   * Get the end date of the current year
   */
  getEndOfYear(): DateString {
    return `${this.state.currentYear}-12-31`;
  }

  /**
   * Get the current season progress (0-1)
   */
  getSeasonProgress(): number {
    const season = this.state.currentSeason;
    const seasonStartMonth = season === 'winter' ? 'december' : season === 'spring' ? 'march' : season === 'summer' ? 'june' : 'september';
    const seasonEndMonth = season === 'winter' ? 'february' : season === 'spring' ? 'may' : season === 'summer' ? 'august' : 'november';
    
    const startDate = `${this.state.currentYear}-${String(monthToNumber[seasonStartMonth] + 1).padStart(2, '0')}-01`;
    const endDate = `${this.state.currentYear}-${String(monthToNumber[seasonEndMonth] + 1).padStart(2, '0')}-${String(getDaysInMonth(seasonEndMonth, this.state.currentYear)).padStart(2, '0')}`;
    
    const totalDays = this.getDaysBetween(startDate, endDate);
    const currentDays = this.getDaysBetween(startDate, this.state.currentDate);
    
    return currentDays / totalDays;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to initial state
   */
  reset(date?: DateString): void {
    this.state = this.calculateInitialState(date || '2026-06-07');
  }
}
