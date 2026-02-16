-- Create sessions table for multi-device login support
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hashed_refresh_token TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Create index on is_active for active session queries
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

-- Create composite index on user_id and is_active for faster active session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, is_active);

-- Create index on last_activity for session cleanup queries
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- Optional: Remove hashed_refresh_token from users table since we're now using sessions
-- This migration can be run after ensuring the new session-based auth is working
-- ALTER TABLE users DROP COLUMN IF EXISTS hashed_refresh_token;
