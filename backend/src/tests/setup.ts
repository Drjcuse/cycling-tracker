import dotenv from 'dotenv';
dotenv.config();

import pool from './utils/testDb.js';


export async function setup() {
  console.log('[Test Setup] Initializing test database...');
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('[Test Setup] Database connection successful');
    
    // Create users table with role column (matching init.sql)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[Test Setup] Users table ready');
    
    // Create rides table with foreign key
    await pool.query(`
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
      )
    `);
    console.log('[Test Setup] Rides table ready');
    
    // Create indexes for performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('[Test Setup] Indexes ready');
    
    console.log('[Test Setup] Database initialization complete');
  } catch (error) {
    console.error('[Test Setup] Database initialization failed:', error);
    throw error;
  }
}

/**
 * Global test teardown
 * This runs once after all tests complete
 */
export async function teardown() {
  console.log('[Test Teardown] Cleaning up...');
  
  try {
   
    await pool.end();
    console.log('[Test Teardown] Database connection closed');
  } catch (error) {
    console.error('[Test Teardown] Cleanup failed:', error);
  }
}