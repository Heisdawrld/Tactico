-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  tier INTEGER NOT NULL,
  reputation INTEGER DEFAULT 50,
  CHECK (tier >= 1 AND tier <= 5),
  CHECK (reputation >= 0 AND reputation <= 100)
);

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  league_id INTEGER NOT NULL,
  reputation INTEGER DEFAULT 50,
  finances INTEGER DEFAULT 1000000,
  stadium_capacity INTEGER DEFAULT 20000,
  training_facilities INTEGER DEFAULT 1,
  youth_academy INTEGER DEFAULT 1,
  home_kit_color TEXT DEFAULT '#00FF00',
  away_kit_color TEXT DEFAULT '#FFFFFF',
  CHECK (reputation >= 0 AND reputation <= 100),
  CHECK (finances >= 0),
  CHECK (stadium_capacity > 0),
  CHECK (training_facilities >= 1 AND training_facilities <= 5),
  CHECK (youth_academy >= 1 AND youth_academy <= 5)
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  club_id INTEGER,
  position TEXT NOT NULL,
  overall_rating INTEGER DEFAULT 50,
  potential_rating INTEGER DEFAULT 50,
  attributes JSON DEFAULT '{"pace": 50, "shooting": 50, "passing": 50, "dribbling": 50, "defending": 50, "physicality": 50}',
  traits JSON DEFAULT '{"weakFoot": false, "flair": false, "leadership": false, "professionalism": false}',
  contract_expiry TEXT,
  wage INTEGER DEFAULT 1000,
  morale INTEGER DEFAULT 50,
  stamina INTEGER DEFAULT 100,
  injury_status TEXT DEFAULT 'fit',
  injury_duration INTEGER DEFAULT 0,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL,
  CHECK (age >= 16 AND age <= 45),
  CHECK (overall_rating >= 0 AND overall_rating <= 100),
  CHECK (potential_rating >= 0 AND potential_rating <= 100),
  CHECK (morale >= 0 AND morale <= 100),
  CHECK (stamina >= 0 AND stamina <= 100),
  CHECK (injury_status IN ('fit', 'injured', 'suspended')),
  CHECK (injury_duration >= 0)
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY,
  home_club_id INTEGER NOT NULL,
  away_club_id INTEGER NOT NULL,
  competition TEXT NOT NULL,
  match_date TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  weather TEXT DEFAULT 'clear',
  FOREIGN KEY (home_club_id) REFERENCES clubs(id),
  FOREIGN KEY (away_club_id) REFERENCES clubs(id),
  CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  CHECK (weather IN ('clear', 'rain', 'snow', 'windy')),
  CHECK (home_score >= 0),
  CHECK (away_score >= 0)
);

-- User Careers table
CREATE TABLE IF NOT EXISTS careers (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  club_id INTEGER NOT NULL,
  start_date TEXT DEFAULT (datetime('now')),
  end_date TEXT,
  reputation INTEGER DEFAULT 50,
  achievements JSON DEFAULT '[]',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  CHECK (reputation >= 0 AND reputation <= 100)
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  from_club_id INTEGER NOT NULL,
  to_club_id INTEGER NOT NULL,
  transfer_date TEXT DEFAULT (datetime('now')),
  fee INTEGER DEFAULT 0,
  wage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (from_club_id) REFERENCES clubs(id),
  FOREIGN KEY (to_club_id) REFERENCES clubs(id),
  CHECK (fee >= 0),
  CHECK (wage >= 0),
  CHECK (status IN ('pending', 'completed', 'rejected'))
);

-- Match Events table
CREATE TABLE IF NOT EXISTS match_events (
  id INTEGER PRIMARY KEY,
  match_id INTEGER NOT NULL,
  player_id INTEGER,
  club_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  minute INTEGER NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution')),
  CHECK (minute >= 0 AND minute <= 120)
);

-- Tactics table
CREATE TABLE IF NOT EXISTS tactics (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  club_id INTEGER NOT NULL,
  formation TEXT DEFAULT '4-4-2',
  instructions JSON DEFAULT '{"pressingIntensity": "medium", "passingStyle": "mixed", "defensiveLine": "medium"}',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (club_id) REFERENCES clubs(id),
  CHECK (formation IN ('4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_club_id ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_club_id ON matches(home_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_club_id ON matches(away_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_careers_user_id ON careers(user_id);
CREATE INDEX IF NOT EXISTS idx_careers_club_id ON careers(club_id);
CREATE INDEX IF NOT EXISTS idx_transfers_player_id ON transfers(player_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_club_id ON transfers(from_club_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_club_id ON transfers(to_club_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_tactics_user_id ON tactics(user_id);
CREATE INDEX IF NOT EXISTS idx_tactics_club_id ON tactics(club_id);

-- Sample data for testing
INSERT INTO leagues (id, name, country, tier) VALUES
  (1, 'Premier League', 'England', 1),
  (2, 'Championship', 'England', 2),
  (3, 'League One', 'England', 3),
  (4, 'La Liga', 'Spain', 1),
  (5, 'Serie A', 'Italy', 1);

INSERT INTO clubs (id, name, country, league_id, reputation, finances, stadium_capacity, training_facilities, youth_academy) VALUES
  (1, 'Manchester United', 'England', 1, 90, 50000000, 74140, 5, 5),
  (2, 'Manchester City', 'England', 1, 95, 100000000, 53400, 5, 5),
  (3, 'Liverpool', 'England', 1, 88, 80000000, 53287, 5, 5),
  (4, 'Arsenal', 'England', 1, 85, 70000000, 60260, 5, 5),
  (5, 'Chelsea', 'England', 1, 82, 90000000, 40343, 5, 5),
  (6, 'Real Madrid', 'Spain', 4, 98, 150000000, 81044, 5, 5),
  (7, 'Barcelona', 'Spain', 4, 97, 140000000, 99354, 5, 5),
  (8, 'Juventus', 'Italy', 5, 87, 60000000, 41507, 5, 5),
  (9, 'AC Milan', 'Italy', 5, 84, 55000000, 75817, 5, 5),
  (10, 'Leeds United', 'England', 2, 60, 20000000, 37890, 3, 3);

INSERT INTO players (id, first_name, last_name, age, club_id, position, overall_rating, potential_rating, wage, morale) VALUES
  (1, 'Cristiano', 'Ronaldo', 39, 6, 'ST', 90, 92, 500000, 95),
  (2, 'Lionel', 'Messi', 36, 7, 'RW', 91, 93, 450000, 90),
  (3, 'Kevin', 'De Bruyne', 32, 2, 'CAM', 92, 94, 400000, 85),
  (4, 'Mohamed', 'Salah', 31, 3, 'RW', 90, 91, 350000, 88),
  (5, 'Virgil', 'van Dijk', 32, 3, 'CB', 89, 90, 300000, 90),
  (6, 'Erling', 'Haaland', 23, 2, 'ST', 91, 95, 380000, 92),
  (7, 'Bruno', 'Fernandes', 29, 1, 'CAM', 88, 89, 280000, 87),
  (8, 'Thiago', 'Alcantara', 32, 3, 'CM', 87, 88, 250000, 85),
  (9, 'Harry', 'Kane', 30, 5, 'ST', 89, 90, 320000, 88),
  (10, 'Kylian', 'Mbappe', 24, 4, 'ST', 92, 96, 420000, 94);

INSERT INTO matches (id, home_club_id, away_club_id, competition, match_date, status, home_score, away_score, weather) VALUES
  (1, 1, 2, 'Premier League', '2026-06-15 15:00:00', 'scheduled', 0, 0, 'clear'),
  (2, 3, 4, 'Premier League', '2026-06-16 12:30:00', 'scheduled', 0, 0, 'rain'),
  (3, 5, 6, 'Champions League', '2026-06-17 20:00:00', 'scheduled', 0, 0, 'clear'),
  (4, 7, 8, 'La Liga', '2026-06-18 15:00:00', 'scheduled', 0, 0, 'clear'),
  (5, 9, 10, 'Serie A', '2026-06-19 18:00:00', 'scheduled', 0, 0, 'clear');