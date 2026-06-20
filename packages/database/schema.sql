-- TACTICO Database Schema
-- Complete Football Universe Model
-- Version: 1.0.0
-- Last Updated: June 7, 2026

PRAGMA foreign_keys = ON;

-- ============================================
-- CORE TABLES
-- ============================================

-- World State (singleton)
CREATE TABLE IF NOT EXISTS world_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_date TEXT NOT NULL DEFAULT '2026-06-07',
  current_time TEXT NOT NULL DEFAULT '2026-06-07T00:00:00',
  current_season INTEGER NOT NULL DEFAULT 2026,
  current_week INTEGER NOT NULL DEFAULT 25,
  current_day INTEGER NOT NULL DEFAULT 168,
  transfer_window_open BOOLEAN NOT NULL DEFAULT 1,
  youth_intake_day INTEGER NOT NULL DEFAULT 1,
  last_tick TEXT NOT NULL DEFAULT (datetime('now')),
  last_tick_type TEXT NOT NULL DEFAULT 'day'
);

-- ============================================
-- GEOGRAPHY TABLES
-- ============================================

-- Continents
CREATE TABLE IF NOT EXISTS continents (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  reputation INTEGER DEFAULT 50
);

-- Nations
CREATE TABLE IF NOT EXISTS nations (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  continent_code TEXT NOT NULL,
  -- Youth development ratings (1-100)
  youth_quality INTEGER DEFAULT 50,
  infrastructure INTEGER DEFAULT 50,
  coaching_level INTEGER DEFAULT 50,
  financial_strength INTEGER DEFAULT 50,
  football_culture INTEGER DEFAULT 50,
  -- Reputation (1-100)
  reputation INTEGER DEFAULT 50,
  -- Population and GDP (for economic calculations)
  population INTEGER DEFAULT 1000000,
  gdp INTEGER DEFAULT 1000000000,
  -- Football governing body
  governing_body TEXT,
  -- FIFA ranking
  fifa_ranking INTEGER DEFAULT 100,
  -- Foreign keys
  FOREIGN KEY (continent_code) REFERENCES continents(code)
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  nation_code TEXT NOT NULL,
  population INTEGER DEFAULT 100000,
  latitude REAL,
  longitude REAL,
  FOREIGN KEY (nation_code) REFERENCES nations(code)
);

-- ============================================
-- COMPETITION TABLES
-- ============================================

-- Competition Types
CREATE TABLE IF NOT EXISTS competition_types (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Competitions (Leagues, Cups, etc.)
CREATE TABLE IF NOT EXISTS competitions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  nation_code TEXT,
  type_id INTEGER NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  reputation INTEGER DEFAULT 50,
  financial_strength INTEGER DEFAULT 50,
  competitiveness INTEGER DEFAULT 50,
  -- Prize money (in USD)
  prize_money_champion INTEGER DEFAULT 1000000,
  prize_money_second INTEGER DEFAULT 500000,
  prize_money_third INTEGER DEFAULT 250000,
  prize_money_fourth INTEGER DEFAULT 100000,
  -- TV revenue distribution
  tv_revenue_champion INTEGER DEFAULT 20,
  tv_revenue_second INTEGER DEFAULT 15,
  tv_revenue_third INTEGER DEFAULT 10,
  tv_revenue_fourth INTEGER DEFAULT 5,
  tv_revenue_others INTEGER DEFAULT 50,
  -- Promotion/Relegation
  promotion_spots INTEGER DEFAULT 3,
  relegation_spots INTEGER DEFAULT 3,
  playoff_spots INTEGER DEFAULT 2,
  -- Format
  format TEXT NOT NULL DEFAULT 'league',
  -- Season info
  current_season INTEGER DEFAULT 2026,
  -- Foreign keys
  FOREIGN KEY (nation_code) REFERENCES nations(code),
  FOREIGN KEY (type_id) REFERENCES competition_types(id)
);

-- Competition Seasons
CREATE TABLE IF NOT EXISTS competition_seasons (
  id INTEGER PRIMARY KEY,
  competition_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 0,
  -- Foreign keys
  FOREIGN KEY (competition_id) REFERENCES competitions(id),
  UNIQUE (competition_id, season)
);

-- ============================================
-- CLUB TABLES
-- ============================================

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  nation_code TEXT NOT NULL,
  city_id INTEGER,
  founded_year INTEGER,
  -- Finances (in USD)
  balance INTEGER DEFAULT 10000000,
  wage_budget INTEGER DEFAULT 1000000,
  transfer_budget INTEGER DEFAULT 5000000,
  -- Facilities (1-5)
  training_facilities INTEGER DEFAULT 1,
  youth_academy INTEGER DEFAULT 1,
  stadium_capacity INTEGER DEFAULT 20000,
  medical_center INTEGER DEFAULT 1,
  scouting_network INTEGER DEFAULT 1,
  -- Quality ratings (1-100)
  reputation INTEGER DEFAULT 50,
  tactical_culture INTEGER DEFAULT 50,
  youth_quality INTEGER DEFAULT 50,
  scouting_quality INTEGER DEFAULT 50,
  -- Ownership
  ownership_type TEXT NOT NULL DEFAULT 'private',
  owner_name TEXT,
  -- Tactical preferences
  preferred_formation TEXT DEFAULT '4-4-2',
  -- Colors
  home_kit_color TEXT DEFAULT '#00FF00',
  away_kit_color TEXT DEFAULT '#FFFFFF',
  third_kit_color TEXT,
  -- Stadium
  stadium_name TEXT DEFAULT 'Stadium',
  stadium_address TEXT,
  -- History
  founded_date TEXT,
  -- Social media
  website TEXT,
  twitter TEXT,
  facebook TEXT,
  instagram TEXT,
  -- Foreign keys
  FOREIGN KEY (nation_code) REFERENCES nations(code),
  FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- Club Ownership History
CREATE TABLE IF NOT EXISTS club_ownership_history (
  id INTEGER PRIMARY KEY,
  club_id INTEGER NOT NULL,
  owner_name TEXT NOT NULL,
  ownership_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  investment_amount INTEGER,
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

-- ============================================
-- PERSON TABLES
-- ============================================

-- People (base table for players, managers, staff)
CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  common_name TEXT,
  date_of_birth TEXT,
  nation_code TEXT,
  city_id INTEGER,
  height INTEGER,
  weight INTEGER,
  foot TEXT DEFAULT 'right',
  -- Appearance
  skin_tone TEXT,
  hair_color TEXT,
  hair_style TEXT,
  facial_hair TEXT,
  build TEXT
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL,
  -- Position
  position TEXT NOT NULL,
  -- Club info
  club_id INTEGER,
  squad_number INTEGER,
  -- Technical attributes (1-100)
  passing INTEGER DEFAULT 50,
  shooting INTEGER DEFAULT 50,
  dribbling INTEGER DEFAULT 50,
  ball_control INTEGER DEFAULT 50,
  first_touch INTEGER DEFAULT 50,
  heading INTEGER DEFAULT 50,
  crossing INTEGER DEFAULT 50,
  finishing INTEGER DEFAULT 50,
  long_shots INTEGER DEFAULT 50,
  set_pieces INTEGER DEFAULT 50,
  penalty_taking INTEGER DEFAULT 50,
  -- Physical attributes (1-100)
  pace INTEGER DEFAULT 50,
  acceleration INTEGER DEFAULT 50,
  agility INTEGER DEFAULT 50,
  balance INTEGER DEFAULT 50,
  strength INTEGER DEFAULT 50,
  stamina INTEGER DEFAULT 50,
  jumping_reach INTEGER DEFAULT 50,
  natural_fitness INTEGER DEFAULT 50,
  -- Mental attributes (1-100)
  aggression INTEGER DEFAULT 50,
  anticipation INTEGER DEFAULT 50,
  composure INTEGER DEFAULT 50,
  concentration INTEGER DEFAULT 50,
  creativity INTEGER DEFAULT 50,
  decisions INTEGER DEFAULT 50,
  determination INTEGER DEFAULT 50,
  flair INTEGER DEFAULT 50,
  leadership INTEGER DEFAULT 50,
  off_the_ball INTEGER DEFAULT 50,
  positioning INTEGER DEFAULT 50,
  teamwork INTEGER DEFAULT 50,
  vision INTEGER DEFAULT 50,
  work_rate INTEGER DEFAULT 50,
  -- Hidden attributes (1-100)
  professionalism INTEGER DEFAULT 50,
  consistency INTEGER DEFAULT 50,
  pressure_handling INTEGER DEFAULT 50,
  adaptability INTEGER DEFAULT 50,
  sportsmanship INTEGER DEFAULT 50,
  injury_proneness INTEGER DEFAULT 50,
  controversy INTEGER DEFAULT 50,
  loyalty INTEGER DEFAULT 50,
  ambition INTEGER DEFAULT 50,
  hidden_potential INTEGER DEFAULT 50,
  -- Dynamic stats
  current_ability INTEGER DEFAULT 50,
  potential_ability INTEGER DEFAULT 50,
  reputation INTEGER DEFAULT 50,
  market_value INTEGER DEFAULT 1000000,
  wage INTEGER DEFAULT 100000,
  morale INTEGER DEFAULT 50,
  fatigue INTEGER DEFAULT 0,
  sharpness INTEGER DEFAULT 50,
  -- Foreign keys
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

-- Player Contracts
CREATE TABLE IF NOT EXISTS player_contracts (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'full_time',
  start_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  wage INTEGER NOT NULL DEFAULT 100000,
  signing_bonus INTEGER DEFAULT 0,
  release_clause INTEGER,
  loan_club_id INTEGER,
  loan_expiry_date TEXT,
  -- Foreign keys
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (loan_club_id) REFERENCES clubs(id)
);

-- ============================================
-- MATCH TABLES
-- ============================================

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  competition_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  home_club_id INTEGER NOT NULL,
  away_club_id INTEGER NOT NULL,
  home_club_formation TEXT DEFAULT '4-4-2',
  away_club_formation TEXT DEFAULT '4-4-2',
  venue_id INTEGER,
  weather TEXT DEFAULT 'clear',
  attendance INTEGER DEFAULT 0,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  match_date TEXT NOT NULL,
  kickoff_time TEXT,
  referee_id INTEGER,
  -- Foreign keys
  FOREIGN KEY (competition_id) REFERENCES competitions(id),
  FOREIGN KEY (home_club_id) REFERENCES clubs(id),
  FOREIGN KEY (away_club_id) REFERENCES clubs(id),
  FOREIGN KEY (venue_id) REFERENCES cities(id),
  FOREIGN KEY (referee_id) REFERENCES people(id)
);

-- Match Lineups
CREATE TABLE IF NOT EXISTS match_lineups (
  id INTEGER PRIMARY KEY,
  match_id INTEGER NOT NULL,
  club_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  position TEXT NOT NULL,
  shirt_number INTEGER,
  is_starter BOOLEAN NOT NULL DEFAULT 1,
  minutes_played INTEGER DEFAULT 0,
  -- Foreign keys
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Match Events
CREATE TABLE IF NOT EXISTS match_events (
  id INTEGER PRIMARY KEY,
  match_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  minute INTEGER NOT NULL,
  second INTEGER DEFAULT 0,
  player_id INTEGER,
  club_id INTEGER,
  description TEXT,
  x REAL,
  y REAL,
  details JSON,
  -- Foreign keys
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);


-- ============================================
-- USER TABLES (Auth.js Drizzle Adapter Compatible)
-- ============================================

-- Users (Table name: "user")
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  image TEXT
);

-- User Sessions (Table name: "session")
CREATE TABLE IF NOT EXISTS "session" (
  sessionToken TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE
);

-- User Accounts (for OAuth) (Table name: "account")
CREATE TABLE IF NOT EXISTS "account" (
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  PRIMARY KEY (provider, providerAccountId)
);

-- User Verification Tokens (Table name: "verificationToken")
CREATE TABLE IF NOT EXISTS "verificationToken" (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires INTEGER NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Authenticators (for Passkeys/WebAuthn) (Table name: "authenticator")
CREATE TABLE IF NOT EXISTS "authenticator" (
  credentialID TEXT NOT NULL UNIQUE,
  userId TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  credentialPublicKey TEXT NOT NULL,
  counter INTEGER NOT NULL,
  credentialDeviceType TEXT NOT NULL,
  credentialBackedUp INTEGER NOT NULL,
  transports TEXT,
  FOREIGN KEY (userId) REFERENCES "user"(id) ON DELETE CASCADE,
  PRIMARY KEY (userId, credentialID)
);

-- ============================================
-- INDEXES
-- ============================================

-- World State
CREATE INDEX IF NOT EXISTS idx_world_state_current_date ON world_state(current_date);

-- Nations
CREATE INDEX IF NOT EXISTS idx_nations_code ON nations(code);
CREATE INDEX IF NOT EXISTS idx_nations_continent ON nations(continent_code);
CREATE INDEX IF NOT EXISTS idx_nations_reputation ON nations(reputation);

-- Cities
CREATE INDEX IF NOT EXISTS idx_cities_nation ON cities(nation_code);

-- Competitions
CREATE INDEX IF NOT EXISTS idx_competitions_nation ON competitions(nation_code);
CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type_id);

-- Clubs
CREATE INDEX IF NOT EXISTS idx_clubs_nation ON clubs(nation_code);
CREATE INDEX IF NOT EXISTS idx_clubs_reputation ON clubs(reputation);

-- People
CREATE INDEX IF NOT EXISTS idx_people_nation ON people(nation_code);

-- Players
CREATE INDEX IF NOT EXISTS idx_players_club ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

-- Matches
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Match Events
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(type);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample continents
INSERT OR IGNORE INTO continents (code, name, reputation) VALUES
  ('AF', 'Africa', 50),
  ('AS', 'Asia', 60),
  ('EU', 'Europe', 80),
  ('NA', 'North America', 55),
  ('OC', 'Oceania', 40),
  ('SA', 'South America', 70);

-- Insert sample nations
INSERT OR IGNORE INTO nations (code, name, continent_code, youth_quality, infrastructure, coaching_level, financial_strength, football_culture, reputation, population, gdp) VALUES
  ('NG', 'Nigeria', 'AF', 75, 40, 65, 50, 85, 60, 200000000, 500000000000),
  ('ENG', 'England', 'EU', 90, 95, 95, 95, 95, 95, 55000000, 3000000000000),
  ('ESP', 'Spain', 'EU', 88, 92, 93, 90, 92, 92, 47000000, 1500000000000),
  ('DEU', 'Germany', 'EU', 85, 90, 90, 92, 90, 90, 83000000, 4000000000000),
  ('FRA', 'France', 'EU', 87, 88, 90, 88, 88, 88, 67000000, 2800000000000),
  ('ITA', 'Italy', 'EU', 84, 85, 88, 85, 88, 85, 60000000, 2000000000000),
  ('BRA', 'Brazil', 'SA', 95, 70, 90, 60, 95, 90, 213000000, 2000000000000),
  ('ARG', 'Argentina', 'SA', 92, 75, 88, 65, 93, 88, 45000000, 500000000000);

-- Insert sample competition types
INSERT OR IGNORE INTO competition_types (id, name, description) VALUES
  (1, 'League', 'Domestic league competition'),
  (2, 'Domestic Cup', 'National cup competition'),
  (3, 'Continental', 'Continental club competition');

-- Insert sample competitions
INSERT OR IGNORE INTO competitions (id, name, nation_code, type_id, tier, reputation, financial_strength, competitiveness, prize_money_champion, format) VALUES
  (1, 'Premier League', 'ENG', 1, 1, 95, 95, 95, 200000000, 'league'),
  (2, 'Championship', 'ENG', 1, 2, 70, 70, 70, 10000000, 'league'),
  (3, 'La Liga', 'ESP', 1, 1, 92, 90, 90, 180000000, 'league'),
  (4, 'Champions League', 'EU', 3, 1, 100, 100, 100, 200000000, 'group_and_knockout');

-- Insert sample clubs
INSERT OR IGNORE INTO clubs (id, name, short_name, nation_code, founded_year, balance, wage_budget, transfer_budget, training_facilities, youth_academy, stadium_capacity, reputation, stadium_name) VALUES
  (1, 'Manchester City', 'Man City', 'ENG', 1880, 500000000, 5000000, 100000000, 5, 5, 53400, 95, 'Etihad Stadium'),
  (2, 'Real Madrid', 'Real Madrid', 'ESP', 1902, 400000000, 4000000, 150000000, 5, 5, 81044, 98, 'Santiago Bernabéu'),
  (3, 'Liverpool', 'Liverpool', 'ENG', 1892, 300000000, 3000000, 80000000, 5, 5, 53287, 88, 'Anfield'),
  (4, 'Barcelona', 'Barça', 'ESP', 1899, 350000000, 3500000, 140000000, 5, 5, 99354, 97, 'Camp Nou'),
  (5, 'Manchester United', 'Man Utd', 'ENG', 1878, 250000000, 2500000, 50000000, 5, 5, 74140, 90, 'Old Trafford');

-- Insert sample people
INSERT OR IGNORE INTO people (id, first_name, last_name, nation_code, height, weight) VALUES
  (1, 'Erling', 'Haaland', 'NOR', 194, 88),
  (2, 'Kevin', 'De Bruyne', 'BEL', 181, 70),
  (3, 'Rodri', 'Hernandez', 'ESP', 191, 80),
  (4, 'Jude', 'Bellingham', 'ENG', 185, 75),
  (5, 'Vinicius', 'Junior', 'BRA', 176, 69);

-- Insert sample players
INSERT OR IGNORE INTO players (id, person_id, position, club_id, squad_number, current_ability, potential_ability, wage) VALUES
  (1, 1, 'ST', 1, 9, 91, 95, 380000),
  (2, 2, 'CAM', 1, 8, 92, 94, 400000),
  (3, 3, 'CDM', 1, 16, 89, 91, 300000),
  (4, 4, 'CM', 2, 5, 90, 94, 450000),
  (5, 5, 'LW', 2, 20, 88, 92, 350000);

-- Insert sample matches
INSERT OR IGNORE INTO matches (id, competition_id, season, home_club_id, away_club_id, match_date, status) VALUES
  (1, 1, 2026, 1, 2, '2026-06-15', 'scheduled'),
  (2, 1, 2026, 3, 4, '2026-06-16', 'scheduled'),
  (3, 4, 2026, 1, 2, '2026-06-17', 'scheduled');
