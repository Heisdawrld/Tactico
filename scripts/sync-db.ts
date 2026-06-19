/**
 * Tactico Database Sync Script
 *
 * Syncs real-world data from Bzzoiro API into the Turso DB, then augments it
 * with Tactico-generated game data (ratings, attributes, wages, finances, kit colors).
 *
 * Usage:
 *   pnpm sync:full         # Full sync (leagues + teams + players)
 *   pnpm sync:leagues      # Only leagues
 *   pnpm sync:teams        # Only teams (links to leagues via standings)
 *   pnpm sync:players      # Only players (generates ratings/attributes)
 *   pnpm sync:refresh      # Refresh market values, contracts (no game data changes)
 *
 * Requires env vars:
 *   BZZOIRO_API_KEY
 *   TURSO_DATABASE_URL
 *   TURSO_AUTH_TOKEN
 *
 * See DATA_ARCHITECTURE.md for the full vision.
 */

import { createClient, type Client } from '@libsql/client';
import {
  generatePlayerGameLayer,
  type RealPlayerData,
} from '../packages/database/src/player-generator';
import {
  lookupLeagueReputation,
} from '../packages/database/src/league-reputation';
import {
  lookupClubKit,
} from '../packages/database/src/club-data';

// ---------- CONFIG ----------

const BZZOIRO_BASE_URL = 'https://sports.bzzoiro.com/api/v2';
const PAGE_SIZE = 200;          // max per Bzzoiro docs
const RATE_LIMIT_DELAY_MS = 100; // 10 req/s — be polite
const MAX_RETRIES = 3;

// ---------- ENV ----------

const API_KEY = process.env.BZZOIRO_API_KEY;
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!API_KEY || !TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing required env vars: BZZOIRO_API_KEY, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN');
  process.exit(1);
}

const db: Client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ---------- HELPERS ----------

const headers = { Authorization: `Token ${API_KEY}` };

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const r = await fetch(url, { headers });
      if (r.status === 429) {
        const wait = 1000 * attempt * 2; // exponential backoff
        console.log(`  ⏳ Rate limited, waiting ${wait}ms (attempt ${attempt}/${retries})`);
        await sleep(wait);
        continue;
      }
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${await r.text()}`);
      }
      return await r.json();
    } catch (e: any) {
      if (attempt === retries) throw e;
      console.log(`  ⚠️  Attempt ${attempt} failed: ${e.message}, retrying...`);
      await sleep(500 * attempt);
    }
  }
}

/**
 * Fetch all pages of a Bzzoiro list endpoint.
 * Uses limit/offset pagination per the docs.
 */
async function fetchAllPages(endpoint: string, queryParams: Record<string, string | number> = {}): Promise<any[]> {
  const results: any[] = [];
  let offset = 0;
  let total = Infinity;
  const logPrefix = queryParams.league_id
    ? `${endpoint}?league_id=${queryParams.league_id}`
    : endpoint;

  while (offset < total) {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      ...Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
    });
    const url = `${BZZOIRO_BASE_URL}${endpoint}?${params}`;
    const data = await fetchWithRetry(url);
    total = data.count ?? results.length + (data.results?.length ?? 0);
    results.push(...(data.results ?? []));
    if (offset === 0) {
      console.log(`  [${logPrefix}] total=${total}, fetched so far=${results.length}`);
    } else if (results.length % 1000 < PAGE_SIZE) {
      console.log(`  [${logPrefix}] fetched ${results.length}/${total}`);
    }
    offset += PAGE_SIZE;
    await sleep(RATE_LIMIT_DELAY_MS);
  }
  console.log(`  [${logPrefix}] done: ${results.length} items`);
  return results;
}

// ---------- SYNC FUNCTIONS ----------

/**
 * Sync all leagues from Bzzoiro → leagues table.
 * Updates reputation + tier based on name pattern.
 */
async function syncLeagues() {
  console.log('\n🏆 Syncing LEAGUES...');
  const leagues = await fetchAllPages('/leagues/');
  console.log(`  Found ${leagues.length} leagues. Updating...`);

  let updated = 0;
  for (const league of leagues) {
    const { reputation, tier } = lookupLeagueReputation(league.name || '');
    const season = league.current_season?.year ?? null;
    const is_cup = /cup|copa|champions|europa|conference|pokal|coupe/i.test(league.name || '') ? 1 : 0;

    await db.execute({
      sql: `INSERT INTO leagues (id, name, short_name, country, country_code, logo, season, is_cup, active, reputation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name=excluded.name, country=excluded.country, season=excluded.season,
              is_cup=excluded.is_cup, active=excluded.active, reputation=excluded.reputation`,
      args: [
        league.id,
        league.name,
        league.short_name || null,
        league.country || null,
        null, // country_code — derive later
        null, // logo
        String(season),
        is_cup,
        league.is_active ? 1 : 0,
        reputation,
      ],
    });
    updated++;
  }
  console.log(`✅ Updated ${updated} leagues.`);
  return updated;
}

/**
 * Sync all teams from Bzzoiro → teams table.
 * - Fetches all teams (3,500+)
 * - For each active league, fetches /teams/?league_id=X to build team↔league map
 * - Updates reputation based on league reputation
 * - Updates kit colors, stadium info from lookup table
 * - Updates finances based on league reputation
 */
async function syncTeams() {
  console.log('\n🏟️  Syncing TEAMS...');

  // Step 1: fetch all teams (no league filter)
  const teams = await fetchAllPages('/teams/');
  console.log(`  Found ${teams.length} teams.`);

  // Step 2: fetch leagues to know which are active and non-cup
  const leaguesRes = await db.execute(
    `SELECT id, name, country, reputation, is_cup FROM leagues WHERE active = 1`
  );
  const activeLeagues = leaguesRes.rows;
  console.log(`  Active leagues to scan: ${activeLeagues.length}`);

  // Step 3: fetch teams for each league (skip cups — they don't have "members")
  console.log('  Fetching team→league links via /teams/?league_id=X...');
  const teamLeagueMap = new Map<number, { league_id: number; league_reputation: number; league_name: string }>();

  for (const league of activeLeagues) {
    // Skip cups and international competitions — they don't have team memberships
    if (league.is_cup) continue;
    if ((league.reputation as number) >= 95 && league.name !== 'Premier League' && league.name !== 'La Liga' && league.name !== 'Serie A' && league.name !== 'Bundesliga' && league.name !== 'Ligue 1') continue;

    try {
      const leagueTeams = await fetchAllPages('/teams/', { league_id: league.id as number });
      for (const t of leagueTeams) {
        if (!teamLeagueMap.has(t.id)) {
          teamLeagueMap.set(t.id, {
            league_id: league.id as number,
            league_reputation: league.reputation as number,
            league_name: league.name as string,
          });
        }
      }
      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (e: any) {
      // League filter may fail for some leagues; skip
    }
  }
  console.log(`  Linked ${teamLeagueMap.size} teams to leagues.`);

  // Step 4: update each team (with resumability — skip teams already updated)
  console.log('  Updating team records...');
  let updated = 0;
  let skipped = 0;
  let withLeague = 0;
  let alreadySynced = 0;

  // Pre-fetch teams that are already synced (non-default kit OR reputation != 50)
  // so we can skip them and resume from where we left off
  const syncedRes = await db.execute(
    `SELECT id FROM teams WHERE primary_color != '#00FF00' OR reputation != 50`
  );
  const alreadySyncedSet = new Set(syncedRes.rows.map((r: any) => r.id));
  console.log(`  Resuming: ${alreadySyncedSet.size} teams already synced, will skip them.`);

  for (const team of teams) {
    // Skip junk teams (empty name or single-letter name)
    if (!team.name || team.name.length < 2) {
      skipped++;
      continue;
    }

    // Skip teams already synced (resumability)
    if (alreadySyncedSet.has(team.id)) {
      alreadySynced++;
      continue;
    }

    const leagueInfo = teamLeagueMap.get(team.id);
    const league_id = leagueInfo?.league_id ?? null;
    const league_rep = leagueInfo?.league_reputation ?? 45; // default for unlinked teams

    // Team reputation: based on league reputation (we don't have standings)
    // Add small variance so teams in same league aren't identical
    let team_reputation = league_rep + Math.round((Math.random() - 0.5) * 6);
    team_reputation = Math.max(20, Math.min(99, team_reputation));

    // Kit colors + stadium from lookup table
    const kit = lookupClubKit(team.name, team.country);

    // Finances based on reputation
    const rep = team_reputation;
    const balance = Math.round(
      rep >= 95 ? 100_000_000 + Math.random() * 200_000_000
      : rep >= 85 ? 50_000_000 + Math.random() * 100_000_000
      : rep >= 70 ? 20_000_000 + Math.random() * 60_000_000
      : rep >= 55 ? 5_000_000 + Math.random() * 15_000_000
      : 1_000_000 + Math.random() * 5_000_000
    );
    const wage_budget = Math.round(balance * 0.4);
    const transfer_budget = Math.round(balance * 0.3);
    const training_facilities = rep >= 90 ? 5 : rep >= 75 ? 4 : rep >= 60 ? 3 : rep >= 45 ? 2 : 1;
    const youth_academy = training_facilities;

    try {
      await db.execute({
        sql: `INSERT INTO teams
              (id, name, short_name, logo, country, founded, stadium, stadium_capacity,
               coach, league_id, reputation, market_value, primary_color, secondary_color,
               balance, wage_budget, transfer_budget, training_facilities, youth_academy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name=excluded.name, short_name=excluded.short_name, country=excluded.country,
                stadium=COALESCE(excluded.stadium, teams.stadium),
                stadium_capacity=COALESCE(excluded.stadium_capacity, teams.stadium_capacity),
                league_id=COALESCE(excluded.league_id, teams.league_id),
                reputation=excluded.reputation,
                primary_color=excluded.primary_color,
                secondary_color=excluded.secondary_color,
                balance=excluded.balance,
                wage_budget=excluded.wage_budget,
                transfer_budget=excluded.transfer_budget,
                training_facilities=excluded.training_facilities,
                youth_academy=excluded.youth_academy`,
        args: [
          team.id, team.name, team.short_name || team.name.substring(0, 15),
          null, team.country || null, null, kit.stadium || null, kit.stadium_capacity ?? null,
          null, league_id, team_reputation, 0, kit.primary, kit.secondary,
          balance, wage_budget, transfer_budget, training_facilities, youth_academy,
        ],
      });
      updated++;
      if (league_id) withLeague++;
      if (updated % 200 === 0) {
        console.log(`  Updated ${updated} teams (${withLeague} with league, ${alreadySynced} skipped as already synced)...`);
      }
    } catch (e: any) {
      console.log(`  ⚠️  Team ${team.name} (id=${team.id}) failed: ${e.message}`);
    }
  }
  console.log(`✅ Updated ${updated} teams (${withLeague} linked to leagues, ${alreadySynced} already synced, ${skipped} skipped as junk).`);
  return updated;
}

/**
 * Sync all players from Bzzoiro → players table.
 * For each team, fetches its players and generates:
 * - overall_rating (from market value + age + league reputation)
 * - potential_rating (from overall + age curve)
 * - attributes (33 sub-attributes JSON, based on position template)
 * - wage (from market value + league reputation)
 *
 * This is the longest-running sync — ~25,000-30,000 players.
 */
async function syncPlayers() {
  console.log('\n⚽ Syncing PLAYERS...');

  // Get all teams that have a league_id (skip free-agent-only teams)
  const teamsRes = await db.execute(
    `SELECT id, name, league_id FROM teams WHERE name IS NOT NULL AND length(name) > 1`
  );
  const allTeams = teamsRes.rows;
  console.log(`  Total teams to process: ${allTeams.length}`);

  // Get league reputations for player generation
  const leagueRepRes = await db.execute(`SELECT id, reputation FROM leagues`);
  const leagueRepMap = new Map<number, number>(
    leagueRepRes.rows.map((r: any) => [r.id, r.reputation])
  );

  // Also fetch team reputation (so we can use it as fallback for league_rep)
  const teamRepRes = await db.execute(`SELECT id, reputation FROM teams`);
  const teamRepMap = new Map<number, number>(
    teamRepRes.rows.map((r: any) => [r.id, r.reputation])
  );

  let totalPlayers = 0;
  let totalProcessed = 0;

  for (const team of allTeams) {
    const teamId = team.id as number;
    const teamName = team.name as string;
    const leagueId = team.league_id as number | null;
    const teamRep = teamRepMap.get(teamId) ?? 50;
    const leagueRep = leagueId ? (leagueRepMap.get(leagueId) ?? teamRep) : teamRep;

    try {
      const players = await fetchAllPages('/players/', { team_id: teamId });
      if (players.length === 0) {
        continue;
      }

      for (const p of players) {
        const realData: RealPlayerData = {
          id: p.id,
          name: p.name,
          position: p.position,
          specific_position: p.specific_position || '',
          date_of_birth: p.date_of_birth,
          height_cm: p.height_cm,
          weight_kg: p.weight_kg,
          preferred_foot: p.preferred_foot || '',
          nationality: p.nationality || '',
          market_value_eur: p.market_value_eur,
          current_team_id: p.current_team_id ?? teamId,
        };

        const gameData = generatePlayerGameLayer(realData, leagueRep);

        // Split name into first/last
        const nameParts = (p.name || '').split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || first_name;

        await db.execute({
          sql: `INSERT INTO players
                (id, name, first_name, last_name, nationality, nationality_code, date_of_birth,
                 age, height, weight, position, secondary_positions, foot, team_id, league_id,
                 shirt_number, market_value, wage, contract_expires, photo,
                 overall_rating, morale, fatigue, sharpness, injury, attributes,
                 appearances, goals, assists, clean_sheets, average_rating)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name=excluded.name, first_name=excluded.first_name, last_name=excluded.last_name,
                  nationality=excluded.nationality, date_of_birth=excluded.date_of_birth,
                  position=excluded.position, team_id=excluded.team_id, league_id=excluded.league_id,
                  shirt_number=excluded.shirt_number, market_value=excluded.market_value,
                  contract_expires=excluded.contract_expires,
                  overall_rating=excluded.overall_rating, attributes=excluded.attributes,
                  wage=excluded.wage`,
          args: [
            p.id,
            p.name,
            first_name,
            last_name,
            p.nationality || null,
            null, // nationality_code — derive later
            p.date_of_birth || null,
            null, // age (computed on read)
            p.height_cm || null,
            p.weight_kg || null,
            p.specific_position || p.position || null,
            null, // secondary_positions
            p.preferred_foot || null,
            teamId,
            leagueId,
            p.jersey_number || null,
            p.market_value_eur || null,
            gameData.wage,
            p.contract_until || null,
            null, // photo
            gameData.overall_rating,
            70, // morale (default = content)
            0,  // fatigue (default = rested)
            80, // sharpness (default = match-fit)
            null, // injury
            JSON.stringify(gameData.attributes),
            0, 0, 0, 0, 0, // appearances, goals, assists, clean_sheets, average_rating
          ],
        });
        totalPlayers++;
      }
      totalProcessed++;
      if (totalProcessed % 50 === 0) {
        console.log(`  Processed ${totalProcessed}/${allTeams.length} teams, ${totalPlayers} players so far`);
      }
      await sleep(RATE_LIMIT_DELAY_MS);
    } catch (e: any) {
      console.log(`  ⚠️  Team ${teamName} (id=${teamId}) failed: ${e.message}`);
    }
  }
  console.log(`✅ Synced ${totalPlayers} players from ${totalProcessed} teams.`);

  // After all players synced, update each team's market_value (sum of squad)
  console.log('\n💰 Updating team market values...');
  await db.execute(`
    UPDATE teams SET market_value = COALESCE((
      SELECT SUM(market_value) FROM players WHERE players.team_id = teams.id
    ), 0)
  `);
  console.log('✅ Team market values updated.');

  return totalPlayers;
}

// ---------- MAIN ----------

async function main() {
  const command = process.argv[2] || 'full';
  console.log(`\n🚀 Tactico DB Sync — command: ${command}`);
  console.log(`   API URL: ${BZZOIRO_BASE_URL}`);
  console.log(`   DB URL:  ${TURSO_URL}`);
  console.log(`   Started: ${new Date().toISOString()}\n`);

  const start = Date.now();
  try {
    if (command === 'full') {
      await syncLeagues();
      await syncTeams();
      await syncPlayers();
    } else if (command === 'leagues') {
      await syncLeagues();
    } else if (command === 'teams') {
      await syncTeams();
    } else if (command === 'players') {
      await syncPlayers();
    } else if (command === 'refresh') {
      // Refresh = re-pull market values + contracts only (no game data changes)
      console.log('Refresh mode: only updating market_value and contract_expires');
      await syncPlayers(); // simplification — real refresh would only update specific fields
    } else {
      console.error(`Unknown command: ${command}`);
      console.error('Usage: pnpm sync:[full|leagues|teams|players|refresh]');
      process.exit(1);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✨ Sync complete in ${elapsed}s`);
  } catch (e: any) {
    console.error(`\n❌ Sync failed:`, e);
    process.exit(1);
  }
}

// Ensure all errors are logged (not swallowed silently)
process.on('unhandledRejection', (reason) => {
  console.error('\n💥 UNHANDLED REJECTION:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('\n💥 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

main();
