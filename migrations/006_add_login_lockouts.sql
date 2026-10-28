-- Migration: Add login_lockouts table for escalating login lockouts
-- Run this against your local PostgreSQL database (pgAdmin 4) to restore staff login

CREATE TABLE IF NOT EXISTS login_lockouts (
  username TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  last_failed_at TIMESTAMP
);
