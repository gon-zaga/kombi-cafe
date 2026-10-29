-- Migration: Add password_reset_requests table for forgot password flow
-- Run this against your local PostgreSQL database (pgAdmin 4)

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES staff(user_id) ON DELETE CASCADE,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_requests_user_id ON password_reset_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_requests_status ON password_reset_requests (status);