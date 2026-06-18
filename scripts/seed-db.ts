import { db } from "../packages/database/src/index";
import fetch from "node-fetch";

const BZZOIRO_API_KEY = process.env.BZZOIRO_API_KEY || "b14356184634212ce6c3d38bf7814514d46ba74a";
const BZZOIRO_BASE_URL = "https://sports.bzzoiro.com/api/v2";
const headers = { "Authorization": `Token ${BZZOIRO_API_KEY}` };

async function fetchAllPages(endpoint: string) {
  let results: any[] = [];
  let url = `${BZZOIRO_BASE_URL}${endpoint}?limit=200`;
  while (url) {
    const response = await fetch(url, { headers });
    if (!response.ok) break;
    const data = await response.json() as any;
    results = results.concat(data.results || []);
    url = data.next;
  }
  return results;
}

async function seed() {
  console.log("🌱 Starting database seeding...");
  
  const leagues = await fetchAllPages("/leagues/");
  for (const league of leagues) {
    await db.run(
      `INSERT OR IGNORE INTO competitions (id, name, nation_code, type_id, tier, current_season) VALUES (?, ?, ?, 1, 1, ?)`,
      [league.id, league.name, league.country, league.current_season?.year || 2026]
    );
  }
  console.log(`✅ Inserted ${leagues.length} leagues.`);

  const teams = await fetchAllPages("/teams/");
  for (const team of teams) {
    await db.run(
      `INSERT OR IGNORE INTO clubs (id, name, short_name, nation_code) VALUES (?, ?, ?, ?)`,
      [team.id, team.name, team.short_name, team.country]
    );
  }
  console.log(`✅ Inserted ${teams.length} teams.`);

  const teamsToFetch = teams.slice(0, 10); 
  let playerCount = 0;
  for (const team of teamsToFetch) {
    const players = await fetchAllPages(`/players/?team_id=${team.id}`);
    for (const player of players) {
      const personId = await db.run(
        `INSERT INTO people (id, first_name, last_name, common_name, date_of_birth, nation_code, height, foot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [player.id, player.name.split(" ")[0] || "", player.name.split(" ").slice(1).join(" ") || "", player.short_name, player.date_of_birth, player.nationality, player.height_cm, player.preferred_foot === "R" ? "right" : player.preferred_foot === "L" ? "left" : "right"]
      ).then(res => res.lastInsertRowid || player.id);

      await db.run(
        `INSERT INTO players (id, person_id, position, club_id, squad_number, market_value, wage) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [player.id, personId, player.position, player.current_team_id, player.jersey_number, player.market_value_eur || 1000000, player.wage_eur_annual || 100000]
      );
      playerCount++;
    }
  }
  console.log(`✅ Inserted ${playerCount} players.`);
  console.log("🎉 Database seeding completed successfully!");
  process.exit(0);
}
seed().catch(err => { console.error("❌ Seeding failed:", err); process.exit(1); });
