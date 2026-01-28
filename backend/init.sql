-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table with proper constraints
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  distance_km INTEGER NOT NULL,
  duration_minutes INTEGER,
  type VARCHAR(50),
  notes TEXT,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes
-- Index for filtering rides by user (most common query)
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);

-- Index for sorting rides by creation date (common for "recent rides" queries)
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);

-- Composite index for user + date queries (e.g., "my rides from last month")
CREATE INDEX IF NOT EXISTS idx_rides_user_created ON rides(user_id, created_at DESC);

-- Index for user lookups by email (login queries)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user
-- Email: admin@example.com
-- Password: Admin123! (bcrypt hashed)
INSERT INTO users (email, password, role) 
VALUES ('admin@example.com', '$2b$10$QnJ3pTle7fCKlx1q0zHgLOV48xYIjo61J20UzMmkxLRjc6z9Yj8dO', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert test regular user
-- Email: user@example.com  
-- Password: User123! (bcrypt hashed)
INSERT INTO users (email, password, role)
VALUES ('user@example.com', '$2b$10$rZ1qPqQvW.YJZXd8LKRjuOqK5Jl3v8xK0YkGx8W2mZ9nK4L5sT6yK', 'user')
ON CONFLICT (email) DO NOTHING;