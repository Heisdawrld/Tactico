/**
 * Tactico Game Loop
 * 
 * The HEART of the game. Wires together:
 *   - WorldEngine (time progression, development, injuries)
 *   - SimulationEngine (match simulation)
 *   - TransferEngine (market, negotiations)
 *   - Career state (fixtures, standings, squads)
 *   - Socket.io (real-time client updates)
 * 
 * This is the ONLY file that touches all engines.
 * All game logic flows through here.
 */

import type { Server, Socket } from 'socket.io';
import { SimulationEngine } from '@tactico/simulation-engine';

// ─── Types ───────────────────────────────────────────────

interface CareerState {
  clubId: number;
  currentWeek: number;
  currentDate: string;
  season: number;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  squads: Record<number, Player[]>;
  budgets: Record<number, number>;
  tactics: TacticsConfig;
  boardConfidence: number;
  squadMorale: number;
  matchHistory: MatchResult[];
  worldState: WorldState;
}

interface LeagueStanding {
  clubId: number;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

interface Fixture {
  id: number;
  homeClubId: number;
  awayClubId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'finished';
  matchDate: string;
  week: number;
  competition: string;
}

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  potentialRating: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physicality: number;
  wage: number;
  morale: number;
  clubId: number;
  injuryStatus: string;
}

interface TacticsConfig {
  formation: string;
  pressingIntensity: 'low' | 'medium' | 'high' | 'very_high';
  passingStyle: 'short' | 'mixed' | 'direct' | 'long';
  defensiveLine: 'low' | 'medium' | 'high' | 'very_high';
  tempo: 'slow' | 'standard' | 'high' | 'very_high';
  style: string;
}

interface MatchResult {
  fixtureId: number;
  homeClubId: number;
  awayClubId: number;
  homeScore: number;
  awayScore: number;
  events: any[];
  stats: any;
  week: number;
}

interface WorldState {
  currentDate: string;
  currentSeason: number;
  currentWeek: number;
  transferWindowOpen: boolean;
  dayOfYear: number;
}

// ─── Mock Data (offline mode) ────────────────────────────

const MOCK_CLUBS: Record<number, { id: number; name: string; shortName: string; reputation: number; leagueId: number }> = {
  1: { id: 1, name: 'Manchester City', shortName: 'MCI', reputation: 95, leagueId: 1 },
  2: { id: 2, name: 'Arsenal', shortName: 'ARS', reputation: 92, leagueId: 1 },
  3: { id: 3, name: 'Liverpool FC', shortName: 'LIV', reputation: 93, leagueId: 1 },
  4: { id: 4, name: 'Chelsea', shortName: 'CHE', reputation: 88, leagueId: 1 },
  5: { id: 5, name: 'Manchester United', shortName: 'MUN', reputation: 87, leagueId: 1 },
  6: { id: 6, name: 'Tottenham Hotspur', shortName: 'TOT', reputation: 86, leagueId: 1 },
  7: { id: 7, name: 'Newcastle United', shortName: 'NEW', reputation: 84, leagueId: 1 },
};

// ─── GameLoop Class ──────────────────────────────────────

export class GameLoop {
  private io: Server;
  private careers: Map<string, CareerState> = new Map();
  private activeMatches: Map<string, SimulationEngine> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  // ── Career Management ──────────────────────────────────

  startCareer(socket: Socket, data: { clubId: number; managerName: string; formation: string }) {
    const { clubId, managerName, formation } = data;

    // Initialize career state
    const career: CareerState = {
      clubId,
      currentWeek: 1,
      currentDate: '2026-08-13',
      season: 2026,
      standings: this.createFreshStandings(1),
      fixtures: this.generateFixtures(clubId),
      squads: this.initializeSquads(),
      budgets: this.initializeBudgets(),
      tactics: {
        formation: formation || '4-3-3',
        pressingIntensity: 'medium',
        passingStyle: 'mixed',
        defensiveLine: 'medium',
        tempo: 'standard',
        style: 'balanced',
      },
      boardConfidence: 75,
      squadMorale: 72,
      matchHistory: [],
      worldState: {
        currentDate: '2026-08-13',
        currentSeason: 2026,
        currentWeek: 1,
        transferWindowOpen: true,
        dayOfYear: 225,
      },
    };

    this.careers.set(socket.id, career);

    socket.emit('career:started', {
      clubId,
      managerName,
      currentDate: career.currentDate,
      week: career.currentWeek,
      season: career.season,
      standings: career.standings,
      fixtures: career.fixtures.slice(0, 10),
      squad: career.squads[clubId] || [],
      budget: career.budgets[clubId] || 0,
      tactics: career.tactics,
    });

    console.log(`[GameLoop] Career started for ${managerName} at club ${clubId}`);
  }

  continueCareer(socket: Socket) {
    const career = this.careers.get(socket.id);
    if (!career) {
      socket.emit('error', { message: 'No active career found' });
      return;
    }

    // Advance one day
    career.currentDate = this.addDays(career.currentDate, 1);
    career.worldState.currentDate = career.currentDate;

    // Check for matches today
    const todaysMatch = career.fixtures.find(
      f => f.matchDate === career.currentDate && f.status === 'scheduled' &&
      (f.homeClubId === career.clubId || f.awayClubId === career.clubId)
    );

    // Simulate background matches
    const bgMatches = this.simulateBackgroundMatches(career);
    for (const match of bgMatches) {
      career.standings = this.applyResult(career.standings, match.homeClubId, match.awayClubId, match.homeScore, match.awayScore);
    }

    // Generate daily events
    const events = this.generateDailyEvents(career);

    socket.emit('career:advanced', {
      currentDate: career.currentDate,
      week: career.currentWeek,
      todaysMatch: todaysMatch || null,
      backgroundResults: bgMatches,
      events,
      standings: career.standings,
      boardConfidence: career.boardConfidence,
      squadMorale: career.squadMorale,
    });
  }

  // ── Match Simulation ───────────────────────────────────

  playMatch(socket: Socket, data: { fixtureId: number }) {
    const career = this.careers.get(socket.id);
    if (!career) {
      socket.emit('error', { message: 'No active career found' });
      return;
    }

    const fixture = career.fixtures.find(f => f.id === data.fixtureId);
    if (!fixture) {
      socket.emit('error', { message: 'Fixture not found' });
      return;
    }

    const homeSquad = career.squads[fixture.homeClubId] || [];
    const awaySquad = career.squads[fixture.awayClubId] || [];

    if (homeSquad.length < 11 || awaySquad.length < 11) {
      socket.emit('error', { message: 'Not enough players for match' });
      return;
    }

    // Create simulation engine
    const engine = new SimulationEngine({
      tickRate: 16,
      matchSpeed: 'normal',
      detailLevel: 'standard',
      enablePhysics: false, // Server-side: no physics rendering
      enableCommentary: true,
      enableStats: true,
    });

    // Initialize match
    engine.initializeMatch(
      fixture.homeClubId,
      fixture.awayClubId,
      homeSquad.slice(0, 11).map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        overallRating: p.overallRating,
        pace: p.pace,
        shooting: p.shooting,
        passing: p.passing,
        dribbling: p.dribbling,
        defending: p.defending,
        physicality: p.physicality,
        position: p.position,
        clubId: p.clubId,
        injuryStatus: p.injuryStatus,
        morale: p.morale,
        wage: p.wage,
      } as any)),
      awaySquad.slice(0, 11).map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        overallRating: p.overallRating,
        pace: p.pace,
        shooting: p.shooting,
        passing: p.passing,
        dribbling: p.dribbling,
        defending: p.defending,
        physicality: p.physicality,
        position: p.position,
        clubId: p.clubId,
        injuryStatus: p.injuryStatus,
        morale: p.morale,
        wage: p.wage,
      } as any)),
      {
        formation: career.tactics.formation,
        pressingIntensity: career.tactics.pressingIntensity,
        pressingTrigger: 'standard',
        defensiveLine: career.tactics.defensiveLine,
        lineOfEngagement: 'standard',
        passingStyle: career.tactics.passingStyle,
        passingDirectness: 'standard',
        tempo: career.tactics.tempo,
        timeWasting: false,
        offsideTrap: false,
        counterPress: false,
        counterAttack: false,
        playForSetPieces: false,
        beMoreExpressive: false,
        stayOnFeet: false,
        tackleHarder: false,
      },
      {
        formation: '4-3-3',
        pressingIntensity: 'medium',
        pressingTrigger: 'standard',
        defensiveLine: 'medium',
        lineOfEngagement: 'standard',
        passingStyle: 'mixed',
        passingDirectness: 'standard',
        tempo: 'standard',
        timeWasting: false,
        offsideTrap: false,
        counterPress: false,
        counterAttack: false,
        playForSetPieces: false,
        beMoreExpressive: false,
        stayOnFeet: false,
        tackleHarder: false,
      }
    );

    this.activeMatches.set(socket.id, engine);

    // Start simulation with real-time event streaming
    engine.start();

    // Stream events to client every 500ms
    const interval = setInterval(() => {
      const state = engine.getState();
      socket.emit('match:tick', {
        time: state.currentTime,
        events: state.events.slice(-5), // Last 5 events
        stats: state.stats,
        homeScore: (state as any).homeScore || 0,
        awayScore: (state as any).awayScore || 0,
        isHalfTime: state.isHalfTime,
        isFullTime: state.isFullTime,
        phase: engine.getPhaseState()?.phase,
      });

      if (state.isFullTime) {
        clearInterval(interval);
        this.finishMatch(socket, career, fixture, engine);
      }
    }, 500);

    // Store interval for cleanup
    socket.on('disconnect', () => {
      clearInterval(interval);
      engine.destroy();
      this.activeMatches.delete(socket.id);
    });

    socket.emit('match:started', {
      fixtureId: fixture.id,
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      homeClubName: MOCK_CLUBS[fixture.homeClubId]?.name || 'Home',
      awayClubName: MOCK_CLUBS[fixture.awayClubId]?.name || 'Away',
    });
  }

  private finishMatch(socket: Socket, career: CareerState, fixture: Fixture, engine: SimulationEngine) {
    const state = engine.getState();
    const homeScore = (state as any).homeScore || 0;
    const awayScore = (state as any).awayScore || 0;

    // Update fixture
    fixture.homeScore = homeScore;
    fixture.awayScore = awayScore;
    fixture.status = 'finished';

    // Update standings
    career.standings = this.applyResult(
      career.standings,
      fixture.homeClubId,
      fixture.awayClubId,
      homeScore,
      awayScore
    );

    // Update morale based on result
    const isUserHome = fixture.homeClubId === career.clubId;
    const userWon = (isUserHome && homeScore > awayScore) || (!isUserHome && awayScore > homeScore);
    const userLost = (isUserHome && homeScore < awayScore) || (!isUserHome && awayScore < homeScore);

    if (userWon) {
      career.boardConfidence = Math.min(100, career.boardConfidence + 3);
      career.squadMorale = Math.min(100, career.squadMorale + 4);
    } else if (userLost) {
      career.boardConfidence = Math.max(20, career.boardConfidence - 4);
      career.squadMorale = Math.max(35, career.squadMorale - 4);
    } else {
      career.boardConfidence = Math.min(100, career.boardConfidence + 1);
    }

    // Record match result
    career.matchHistory.push({
      fixtureId: fixture.id,
      homeClubId: fixture.homeClubId,
      awayClubId: fixture.awayClubId,
      homeScore,
      awayScore,
      events: state.events,
      stats: state.stats,
      week: fixture.week,
    });

    // Simulate background matches for this week
    const bgMatches = this.simulateBackgroundMatches(career);
    for (const match of bgMatches) {
      career.standings = this.applyResult(career.standings, match.homeClubId, match.awayClubId, match.homeScore, match.awayScore);
    }

    // Cleanup
    engine.destroy();
    this.activeMatches.delete(socket.id);

    // Send final result
    socket.emit('match:finished', {
      fixtureId: fixture.id,
      homeScore,
      awayScore,
      events: state.events,
      stats: state.stats,
      standings: career.standings,
      boardConfidence: career.boardConfidence,
      squadMorale: career.squadMorale,
      backgroundResults: bgMatches,
    });
  }

  updateMatchTactics(socket: Socket, data: Partial<TacticsConfig>) {
    const career = this.careers.get(socket.id);
    if (!career) return;
    career.tactics = { ...career.tactics, ...data };
    socket.emit('tactics:updated', career.tactics);
  }

  makeSubstitution(socket: Socket, data: { playerOff: number; playerOn: number }) {
    const engine = this.activeMatches.get(socket.id);
    if (!engine) {
      socket.emit('error', { message: 'No active match' });
      return;
    }
    // Substitution logic would go here
    socket.emit('substitution:made', data);
  }

  // ── Transfer Market ────────────────────────────────────

  searchPlayers(socket: Socket, data: { position?: string; maxAge?: number; maxPrice?: number }) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    // Get all players not in user's club
    const allPlayers: Player[] = [];
    for (const [clubId, squad] of Object.entries(career.squads)) {
      if (Number(clubId) === career.clubId) continue;
      for (const player of squad) {
        if (data.position && player.position !== data.position) continue;
        if (data.maxAge && player.age > data.maxAge) continue;
        allPlayers.push(player);
      }
    }

    // Sort by overall rating
    allPlayers.sort((a, b) => b.overallRating - a.overallRating);

    socket.emit('transfer:results', {
      players: allPlayers.slice(0, 50),
      total: allPlayers.length,
    });
  }

  placeBid(socket: Socket, data: { playerId: number; fromClubId: number; amount: number; wageOffer: number }) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    const budget = career.budgets[career.clubId] || 0;
    if (data.amount > budget) {
      socket.emit('transfer:rejected', { reason: 'Insufficient budget' });
      return;
    }

    // Simple acceptance logic based on offer vs market value
    const fromSquad = career.squads[data.fromClubId] || [];
    const player = fromSquad.find(p => p.id === data.playerId);
    if (!player) {
      socket.emit('transfer:rejected', { reason: 'Player not found' });
      return;
    }

    const marketValue = player.overallRating * 100000;
    const offerRatio = data.amount / marketValue;

    if (offerRatio >= 0.9) {
      // Accept! Transfer the player
      career.squads[data.fromClubId] = fromSquad.filter(p => p.id !== data.playerId);
      career.squads[career.clubId] = [...(career.squads[career.clubId] || []), { ...player, clubId: career.clubId }];
      career.budgets[career.clubId] = budget - data.amount;
      career.budgets[data.fromClubId] = (career.budgets[data.fromClubId] || 0) + data.amount;

      socket.emit('transfer:completed', {
        player,
        fromClubId: data.fromClubId,
        toClubId: career.clubId,
        fee: data.amount,
        remainingBudget: career.budgets[career.clubId],
      });
    } else if (offerRatio >= 0.7) {
      // Counter offer
      socket.emit('transfer:counterOffer', {
        playerId: data.playerId,
        requestedAmount: Math.round(marketValue * 0.95),
        message: 'The selling club wants closer to market value.',
      });
    } else {
      socket.emit('transfer:rejected', {
        reason: 'Offer too low. The selling club dismissed it immediately.',
      });
    }
  }

  respondToBid(socket: Socket, data: { playerId: number; fromClubId: number; accepted: boolean; counterAmount?: number }) {
    if (data.accepted) {
      this.placeBid(socket, {
        playerId: data.playerId,
        fromClubId: data.fromClubId,
        amount: data.counterAmount || 0,
        wageOffer: 0,
      });
    } else {
      socket.emit('transfer:rejected', { reason: 'Negotiations ended.' });
    }
  }

  // ── Squad Management ───────────────────────────────────

  getSquad(socket: Socket, data: { clubId?: number }) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    const clubId = data.clubId || career.clubId;
    const squad = career.squads[clubId] || [];

    socket.emit('squad:data', {
      clubId,
      players: squad,
      count: squad.length,
    });
  }

  setFormation(socket: Socket, data: { formation: string; lineup: number[] }) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    career.tactics.formation = data.formation;

    socket.emit('formation:updated', {
      formation: data.formation,
      lineup: data.lineup,
    });
  }

  // ── World State ────────────────────────────────────────

  getWorldState(socket: Socket) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    socket.emit('world:state', career.worldState);
  }

  getStandings(socket: Socket, data: { leagueId?: number }) {
    const career = this.careers.get(socket.id);
    if (!career) return;

    socket.emit('world:standings', {
      leagueId: data.leagueId || 1,
      standings: career.standings,
    });
  }

  handleDisconnect(socket: Socket) {
    // Keep career state for 5 minutes in case of reconnect
    setTimeout(() => {
      this.careers.delete(socket.id);
      this.activeMatches.delete(socket.id);
    }, 5 * 60 * 1000);
  }

  // ── Private Helpers ────────────────────────────────────

  private createFreshStandings(leagueId: number): LeagueStanding[] {
    const clubs = Object.values(MOCK_CLUBS).filter(c => c.leagueId === leagueId);
    return clubs.map(c => ({
      clubId: c.id,
      clubName: c.name,
      shortName: c.shortName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    }));
  }

  private generateFixtures(clubId: number): Fixture[] {
    const clubs = Object.values(MOCK_CLUBS);
    const fixtures: Fixture[] = [];
    let id = 1;
    const seasonStart = new Date('2026-08-16T12:00:00Z');

    for (let week = 1; week <= 38; week++) {
      const opponent = clubs[(week - 1) % clubs.length];
      if (opponent.id === clubId) continue;

      const isHome = week % 2 === 1;
      const matchDate = new Date(seasonStart);
      matchDate.setUTCDate(seasonStart.getUTCDate() + (week - 1) * 7);

      fixtures.push({
        id: id++,
        homeClubId: isHome ? clubId : opponent.id,
        awayClubId: isHome ? opponent.id : clubId,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        matchDate: matchDate.toISOString().slice(0, 10),
        week,
        competition: 'Premier League',
      });
    }

    return fixtures;
  }

  private initializeSquads(): Record<number, Player[]> {
    const squads: Record<number, Player[]> = {};
    for (const club of Object.values(MOCK_CLUBS)) {
      squads[club.id] = this.generateSquad(club.id, club.reputation);
    }
    return squads;
  }

  private generateSquad(clubId: number, reputation: number): Player[] {
    const positions = ['GK', 'CB', 'CB', 'RB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'LW', 'ST',
                       'GK', 'CB', 'RB', 'LB', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CB', 'CM', 'ST'];
    const players: Player[] = [];

    for (let i = 0; i < 23; i++) {
      const pos = positions[i];
      const baseRating = reputation - 10 + Math.floor(Math.random() * 20);
      const rating = Math.max(45, Math.min(95, baseRating));

      players.push({
        id: clubId * 100 + i + 1,
        firstName: `Player${i + 1}`,
        lastName: `${pos}${clubId}`,
        age: 18 + Math.floor(Math.random() * 17),
        position: pos,
        overallRating: rating,
        potentialRating: Math.min(99, rating + Math.floor(Math.random() * 15)),
        pace: rating - 10 + Math.floor(Math.random() * 20),
        shooting: rating - 10 + Math.floor(Math.random() * 20),
        passing: rating - 10 + Math.floor(Math.random() * 20),
        dribbling: rating - 10 + Math.floor(Math.random() * 20),
        defending: rating - 10 + Math.floor(Math.random() * 20),
        physicality: rating - 10 + Math.floor(Math.random() * 20),
        wage: rating * 1000,
        morale: 60 + Math.floor(Math.random() * 30),
        clubId,
        injuryStatus: 'fit',
      });
    }

    return players;
  }

  private initializeBudgets(): Record<number, number> {
    const budgets: Record<number, number> = {};
    for (const club of Object.values(MOCK_CLUBS)) {
      budgets[club.id] = club.reputation * 2000000;
    }
    return budgets;
  }

  private applyResult(standings: LeagueStanding[], homeId: number, awayId: number, homeScore: number, awayScore: number): LeagueStanding[] {
    const updated = standings.map(s => ({ ...s, form: [...s.form] }));
    const home = updated.find(s => s.clubId === homeId);
    const away = updated.find(s => s.clubId === awayId);
    if (!home || !away) return standings;

    home.played++;
    away.played++;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
      home.form.push('W');
      away.form.push('L');
    } else if (homeScore < awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
      home.form.push('L');
      away.form.push('W');
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
      home.form.push('D');
      away.form.push('D');
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
    home.form = home.form.slice(-5);
    away.form = away.form.slice(-5);

    return updated.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
  }

  private simulateBackgroundMatches(career: CareerState): { homeClubId: number; awayClubId: number; homeScore: number; awayScore: number }[] {
    const clubs = Object.values(MOCK_CLUBS).filter(c => c.id !== career.clubId);
    const results: { homeClubId: number; awayClubId: number; homeScore: number; awayScore: number }[] = [];

    for (let i = 0; i < clubs.length - 1; i += 2) {
      const home = clubs[i];
      const away = clubs[i + 1];
      if (!home || !away) continue;

      const homeStr = home.reputation + Math.random() * 10;
      const awayStr = away.reputation + Math.random() * 10;
      const roll = Math.random();

      let homeScore: number;
      let awayScore: number;

      if (roll < 0.45) {
        homeScore = 1 + Math.floor(Math.random() * 3);
        awayScore = Math.floor(Math.random() * homeScore);
      } else if (roll < 0.7) {
        homeScore = Math.floor(Math.random() * 3);
        awayScore = homeScore;
      } else {
        awayScore = 1 + Math.floor(Math.random() * 3);
        homeScore = Math.floor(Math.random() * awayScore);
      }

      results.push({ homeClubId: home.id, awayClubId: away.id, homeScore, awayScore });
    }

    return results;
  }

  private generateDailyEvents(career: CareerState): any[] {
    const events: any[] = [];

    // Random training event
    if (Math.random() > 0.5) {
      events.push({
        type: 'training',
        title: 'Training Report',
        message: 'The squad had a sharp session today. Focus on shape and pressing triggers.',
        importance: 'medium',
      });
    }

    // Random world event
    if (Math.random() > 0.7) {
      const randomClub = Object.values(MOCK_CLUBS).find(c => c.id !== career.clubId);
      if (randomClub) {
        events.push({
          type: 'world',
          title: 'Transfer Rumour',
          message: `${randomClub.name} are reportedly eyeing a move for a top striker this window.`,
          importance: 'low',
        });
      }
    }

    return events;
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(`${dateStr}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
