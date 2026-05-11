-- Transfer Flows schema
-- Run this in Supabase SQL editor: Dashboard → SQL Editor → New query

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competitions (
  id      TEXT PRIMARY KEY,   -- e.g. "GB1", "L1", "ES1"
  name    TEXT NOT NULL,
  country TEXT,
  tier    INTEGER
);

CREATE TABLE IF NOT EXISTS clubs (
  id             TEXT PRIMARY KEY,   -- Transfermarkt club ID
  name           TEXT NOT NULL,
  competition_id TEXT REFERENCES competitions(id),
  country        TEXT,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id                     TEXT PRIMARY KEY,  -- Transfermarkt player ID
  name                   TEXT NOT NULL,
  date_of_birth          DATE,
  place_of_birth_country TEXT,
  position_main          TEXT,
  market_value_eur       BIGINT,
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_nationalities (
  player_id   TEXT    NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  nationality TEXT    NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (player_id, nationality)
);

CREATE TABLE IF NOT EXISTS squad_players (
  id               BIGSERIAL PRIMARY KEY,
  club_id          TEXT REFERENCES clubs(id),
  player_id        TEXT REFERENCES players(id),
  season           TEXT    NOT NULL,
  position         TEXT,
  age              INTEGER,
  signed_from      TEXT,
  joined_on        DATE,
  contract_expires DATE,
  market_value_eur BIGINT,
  UNIQUE (club_id, player_id, season)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_player_nationalities_nationality
  ON player_nationalities (nationality);

CREATE INDEX IF NOT EXISTS idx_squad_players_club_id
  ON squad_players (club_id);

CREATE INDEX IF NOT EXISTS idx_squad_players_season
  ON squad_players (season);

CREATE INDEX IF NOT EXISTS idx_clubs_competition_id
  ON clubs (competition_id);

-- ── Aggregation function ──────────────────────────────────────────────────────
-- Used by /api/transfer-flows route. Returns nationality→league flow data
-- with player counts, average market values, and top 3 clubs per flow.

CREATE OR REPLACE FUNCTION get_transfer_flows(
  p_season         TEXT    DEFAULT '2024-25',
  p_competition_id TEXT    DEFAULT NULL,
  p_nationality    TEXT    DEFAULT NULL,
  p_limit          INTEGER DEFAULT 50
)
RETURNS TABLE (
  nationality          TEXT,
  competition_id       TEXT,
  competition          TEXT,
  player_count         BIGINT,
  avg_market_value_eur NUMERIC,
  top_clubs            TEXT[]
)
LANGUAGE sql
STABLE
AS $flow$
  SELECT
    pn.nationality,
    comp.id                                          AS competition_id,
    comp.name                                        AS competition,
    COUNT(DISTINCT sp.player_id)                     AS player_count,
    ROUND(AVG(sp.market_value_eur))                  AS avg_market_value_eur,
    ARRAY(
      SELECT cl2.name
      FROM   squad_players     sp2
      JOIN   player_nationalities pn2
             ON pn2.player_id = sp2.player_id AND pn2.is_primary = true
      JOIN   clubs cl2 ON cl2.id = sp2.club_id
      WHERE  sp2.season          = p_season
        AND  pn2.nationality     = pn.nationality
        AND  cl2.competition_id  = comp.id
      GROUP BY cl2.name
      ORDER BY COUNT(*) DESC
      LIMIT 3
    )                                                AS top_clubs
  FROM  squad_players        sp
  JOIN  player_nationalities pn
        ON pn.player_id = sp.player_id AND pn.is_primary = true
  JOIN  clubs                cl   ON cl.id   = sp.club_id
  JOIN  competitions         comp ON comp.id = cl.competition_id
  WHERE sp.season = p_season
    AND (p_competition_id IS NULL OR comp.id       = p_competition_id)
    AND (p_nationality    IS NULL OR pn.nationality = p_nationality)
  GROUP BY pn.nationality, comp.id, comp.name
  ORDER BY COUNT(DISTINCT sp.player_id) DESC
  LIMIT p_limit
$flow$;

-- ── Summary totals function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_transfer_flows_totals(
  p_season         TEXT DEFAULT '2024-25',
  p_competition_id TEXT DEFAULT NULL,
  p_nationality    TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_players        BIGINT,
  total_nationalities  BIGINT
)
LANGUAGE sql
STABLE
AS $totals$
  SELECT
    COUNT(DISTINCT sp.player_id)   AS total_players,
    COUNT(DISTINCT pn.nationality) AS total_nationalities
  FROM  squad_players        sp
  JOIN  player_nationalities pn
        ON pn.player_id = sp.player_id AND pn.is_primary = true
  JOIN  clubs                cl   ON cl.id   = sp.club_id
  JOIN  competitions         comp ON comp.id = cl.competition_id
  WHERE sp.season = p_season
    AND (p_competition_id IS NULL OR comp.id       = p_competition_id)
    AND (p_nationality    IS NULL OR pn.nationality = p_nationality)
$totals$;
