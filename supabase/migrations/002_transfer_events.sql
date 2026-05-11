-- Migration 002: Replace squad-based schema with transfer events
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- ── Drop old tables ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS squad_players;
DROP TABLE IF EXISTS player_nationalities;
DROP TABLE IF EXISTS players;

-- ── Transfer events table ─────────────────────────────────────────────────────
-- One row per player transfer into a top-5 league club, per season.

CREATE TABLE IF NOT EXISTS transfer_events (
  id                BIGSERIAL PRIMARY KEY,
  season            TEXT NOT NULL,            -- e.g. "2015-16"
  player_id         TEXT NOT NULL,
  player_name       TEXT NOT NULL,
  to_club_id        TEXT NOT NULL REFERENCES clubs(id),
  to_competition_id TEXT NOT NULL REFERENCES competitions(id),
  from_club_id      TEXT,                     -- Transfermarkt origin club ID
  from_club_name    TEXT,
  from_country      TEXT,                     -- country of origin club
  market_value_eur  BIGINT,                   -- player market value at time of transfer
  transfer_date     DATE,
  UNIQUE (player_id, to_club_id, season)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_transfer_events_from_country
  ON transfer_events (from_country);

CREATE INDEX IF NOT EXISTS idx_transfer_events_season
  ON transfer_events (season);

CREATE INDEX IF NOT EXISTS idx_transfer_events_to_competition
  ON transfer_events (to_competition_id);

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Returns distinct origin countries with transfer counts (for the dropdown)
CREATE OR REPLACE FUNCTION get_transfer_countries()
RETURNS TABLE (country TEXT, transfer_count BIGINT)
LANGUAGE sql STABLE AS $fn$
  SELECT from_country, COUNT(*) AS transfer_count
  FROM   transfer_events
  WHERE  from_country IS NOT NULL
  GROUP  BY from_country
  ORDER  BY COUNT(*) DESC
$fn$;

-- Returns per-season, per-league breakdown for a given origin country
CREATE OR REPLACE FUNCTION get_country_transfer_flows(p_country TEXT)
RETURNS TABLE (
  season           TEXT,
  competition_id   TEXT,
  competition_name TEXT,
  transfer_count   BIGINT,
  total_value      BIGINT
)
LANGUAGE sql STABLE AS $fn2$
  SELECT
    te.season,
    te.to_competition_id,
    comp.name            AS competition_name,
    COUNT(*)             AS transfer_count,
    COALESCE(SUM(te.market_value_eur), 0) AS total_value
  FROM  transfer_events te
  JOIN  competitions comp ON comp.id = te.to_competition_id
  WHERE te.from_country = p_country
  GROUP BY te.season, te.to_competition_id, comp.name
  ORDER BY te.season, COUNT(*) DESC
$fn2$;
