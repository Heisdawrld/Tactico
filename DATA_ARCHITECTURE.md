# Tactico — Data Architecture

> **Vision**: Real football world (clubs, players, leagues) at career start.
> From week 1 onward, Tactico's simulation diverges from reality — that's *your* football universe.

## The Two-Layer Model

Tactico separates data into two layers:

### Layer 1: Real-World Snapshot (synced from Bzzoiro API)

What we pull from Bzzoiro:

| Entity | Source endpoint | What we take | What we ignore |
|---|---|---|---|
| **Leagues** | `/api/v2/leagues/` | id, name, country, current season, is_active | — |
| **Teams** | `/api/v2/teams/` | id, name, short_name, country, venue_id | — |
| **Players** | `/api/v2/players/?team_id=X` | id, name, position, specific_position, jersey_number, date_of_birth, height, weight, preferred_foot, nationality, current_team_id, market_value_eur, contract_until | `rating`, `potential`, `wage_eur_annual`, `attributes` (these are all `null` in the API) |
| **Standings** | `/api/v2/standings/?league_id=X` | Used ONLY to link teams → leagues and derive team reputation by league tier | We do NOT copy real standings — Tactico generates its own |

**What we explicitly do NOT pull from Bzzoiro:**

- ❌ Fixtures (`/api/v2/matches/`) — Tactico generates its own calendar
- ❌ Real match results — Tactico simulates matches with the physics engine
- ❌ Live scores — Tactico's matches are deterministic given team state
- ❌ Player form/injuries from real world — Tactico simulates these
- ❌ Real transfers — Tactico's AI market generates its own

**Why?** Because the moment you press "Start Career", real-world events shouldn't override your save. If Haaland gets injured IRL, he shouldn't auto-injure in your career. If Mbappé transfers to Real IRL, that shouldn't happen in your career unless *you* do it.

### Layer 2: Tactico-Generated Game Data

What Tactico generates on top of the real-world snapshot:

#### For Leagues
- **`reputation`** (1-100): derived from tier. Top 5 European leagues = 95-100. Second-tier leagues (Eredivisie, Portuguese Liga) = 75-85. Lower divisions = 50-70. Procedural for the rest based on country + UEFA coefficient.
- **`season`**: snapshot of current_season.year from API
- **`is_cup`**: derived from name (Cup/Champions League/Europa League = true)

#### For Teams
- **`league_id`**: linked via `/standings/` endpoint (which teams are in which leagues this season)
- **`reputation`** (1-100): derived from league reputation + recent finishing position. Top-4 in Premier League = 90+. Mid-table La Liga = 75-80. Lower-division teams = 40-60.
- **`market_value`**: sum of squad market values (refreshed periodically)
- **`primary_color` / `secondary_color`**: hardcoded lookup for famous clubs (Liverpool = #C8102E, Man City = #6CABDD, etc.). Falls back to country flag colors.
- **`stadium` / `stadium_capacity`**: hardcoded lookup for famous clubs. Falls back to "Stadium" + 10,000.
- **`balance`**: derived from league reputation (Premier League clubs start with €100-300M, lower leagues €5-20M)
- **`wage_budget`**: ~40% of balance
- **`transfer_budget`**: ~30% of balance
- **`training_facilities`** (1-5): derived from reputation (top clubs = 5, lower = 2-3)
- **`youth_academy`** (1-5): same as training facilities, with bonus for clubs known for youth (Ajax, Barcelona, etc.)

#### For Players (the most important generation)
The Bzzoiro API returns **no ratings, no attributes, no wages**. Tactico must generate all of these.

**`overall_rating`** (1-99) — generated from:
- `market_value_eur` (primary signal — log scale, €100M ≈ 88 OVR, €10M ≈ 75 OVR, €1M ≈ 65 OVR)
- `age` (peak modifier — peak at 27 for outfield, 30 for GK)
- `league_reputation` (Premier League starter gets +5 OVR vs same market value in Icelandic league)

**`potential_rating`** (1-99) — generated from:
- `overall_rating` as floor
- `age` (younger = more room to grow — 18yo can have +20 potential, 28yo = +0)
- Random variance ±3

**`attributes`** (JSON object with 33 sub-attributes) — generated from:
- `overall_rating` as the "ceiling"
- `position` (GK gets GK-specific attrs, CB gets defending-heavy, ST gets shooting-heavy, etc.)
- `specific_position` (RW favors pace + crossing, CDM favors tackling + positioning, etc.)
- Random variance to make each player unique (no two #10s have identical attributes)

**`wage`** (annual, EUR) — generated from:
- `market_value_eur` × 0.05 / 52 (rough rule: a player's annual wage ≈ 5% of their market value)
- Adjusted by league (Premier League wages inflated ~1.5x, Serie A ~1.0x, MLS ~0.7x)

**`morale`** (0-100): default 70 (content) for new careers
**`fatigue`** (0-100): default 0 (fully rested)
**`sharpness`** (0-100): default 80 (match-fit)

**`injury`** (JSON or null): default null at career start
**`appearances`, `goals`, `assists`, `clean_sheets`, `average_rating`**: all default 0 at career start (Tactico tracks these going forward, doesn't pull real-world stats)

## Sync Strategy

### Initial Sync (one-time, at career start)
Run `pnpm sync:full` to populate the DB. This is a long-running operation (3-5 hours) because:
- 65 leagues
- 3,507 teams
- ~61,000 players (we limit to teams in active leagues → ~25,000-30,000 players)

### Incremental Sync (rare, manual)
Run `pnpm sync:refresh` to update market values, contract statuses, and squad rosters. **This NEVER touches game state** (player ratings, morale, fatigue, development) — only the underlying real-world data.

### Per-Career Snapshot
When a user starts a new career, Tactico takes a snapshot of the current DB state into a per-user `career_save_<userId>_<careerId>` schema. This snapshot is what the simulation mutates. The shared DB remains "real-world truth" for new career starts.

## When Real Data Diverges From Game Data

**Reality**: Mbappé transfers to Real Madrid IRL.
**Tactico**: In your career, Mbappé is still at PSG (or wherever you have him).

This is correct behavior. Tactico's world is your save, not real life. Future Bzzoiro syncs only update the **template** for new careers, not existing saves.

## Youth Intake (Procedural)

Every season, each club's youth academy generates 3-8 new 15-16 year olds. These players are **entirely procedurally generated** — they have no real-world counterpart. Their attributes are seeded by:
- Club's `youth_academy` level (5/5 = better intake)
- Club's `reputation` (higher rep = better intake)
- Random variance
- Country's `youth_quality` (Brazil, France, Spain = higher quality)

Youth players get a `is_procedural = TRUE` flag in the DB so we can distinguish them from real-world players.

## Retirement

Each off-season, the world engine:
1. Identifies players who turned 34+ (GKs: 36+)
2. Computes a retirement probability based on age, recent injuries, overall_rating decline
3. Marks retired players as `status = 'retired'`
4. Optionally converts a few into coaches (future feature)

Retired players STAY in the DB (for historical stats) but are removed from active squad rosters.

## Player Development

During each world tick (weekly):
1. Training engine applies attribute deltas based on training schedule + intensity
2. Age-based curve: 16-23 = development (gains), 24-28 = peak (small gains), 29-32 = decline (small losses), 33+ = rapid decline
3. Match performance modifiers: high-rated matches → small attribute boosts, low-rated → small penalties
4. Morale modifiers: high morale = +10% development rate, low morale = -20%
5. Fatigue modifiers: high fatigue = -30% development rate (overtraining penalty)

## Data Flow Summary

```
┌──────────────────┐
│  Bzzoiro API     │  (real-world snapshot, periodically refreshed)
│  - Leagues       │
│  - Teams         │
│  - Players       │
└────────┬─────────┘
         │ sync:full / sync:refresh
         ▼
┌──────────────────┐
│  Turso (shared)  │  (source of truth for new careers)
│  - leagues       │  ← augmented with reputation, season
│  - teams         │  ← augmented with league_id, finances, kit colors
│  - players       │  ← augmented with ratings, attributes, wages
└────────┬─────────┘
         │ snapshot at career start
         ▼
┌──────────────────┐
│  Per-Career Save │  (mutated by world engine + user actions)
│  - matches       │  ← Tactico-generated fixtures
│  - events        │  ← match events from physics sim
│  - stats         │  ← match statistics
│  - standings     │  ← Tactico-computed tables
│  - transfers     │  ← Tactico AI market
│  - world_state   │  ← current_date, season, week
└──────────────────┘
```

## API Key Handling

- The Bzzoiro API key is **server-side only** (NEVER exposed to the client)
- All Bzzoiro requests go through the `/api/football` proxy route
- The seed/sync scripts read `BZZOIRO_API_KEY` from `.env` (gitignored)
- The deployed Render instance reads from Render's environment variables
- The API key in the committed `seed-db.ts` script was rotated and is now removed — current code requires the env var

## Future Considerations

- **Caching**: Bzzoiro responses should be cached in Turso for 24h to reduce API calls
- **Rate limiting**: Bzzoiro has a 429 rate limit; the sync script implements exponential backoff
- **Webhooks**: Future — Bzzoiro may offer webhooks for transfers/injuries. We'd use them ONLY to update the shared DB, never active careers.
- **Multi-sport**: Bzzoiro offers tennis, CS2, darts, etc. — future expansion potential for "Tactico Tennis" etc.
