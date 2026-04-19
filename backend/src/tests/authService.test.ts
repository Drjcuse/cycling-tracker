
import jwt from 'jsonwebtoken';
import { generateToken } from '../services/authService.js';
import pool from './utils/testDb.js';

describe('generateToken()', () => {
  it('creates a valid JWT', () => {
    const payload = { userId: 123 };
    const token = generateToken(payload);
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'object' && 'userId' in decoded) {
      expect(decoded.userId).toBe(123);
    } else {
      throw new Error('Decoded payload missing userId');
    }
  });
  
  it('includes an expiry time', () => {
    const payload = { userId: 456 };
    const token = generateToken(payload);
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const decoded = jwt.verify(token, secret);
    
    if (typeof decoded === 'object' && 'exp' in decoded) {
      expect(decoded.exp).toBeDefined();
      
      const now = Math.floor(Date.now() / 1000);
      expect(Number(decoded.exp)).toBeGreaterThan(now);
    } else {
      throw new Error('Decoded payload missing expiration time');
    }
  });
});

describe('PostgreSQL auth services', () => {
  beforeAll(async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 
    await pool.query(`
      INSERT INTO users (email, password, role)
      VALUES ('test-auth@example.com', '$2b$10$QnJ3pTle7fCKlx1q0zHgLOV48xYIjo61J20UzMmkxLRjc6z9Yj8dO', 'user')
      ON CONFLICT (email) DO NOTHING
    `);
  });
  
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'test-%@example.com'");
    await pool.end();
  });
  
  it('findUserByEmail returns a user when exists', async () => {
    const { findUserByEmail } = await import('../services/postgres/authService.js');
    
    const user = await findUserByEmail('test-auth@example.com');
    expect(user).toBeDefined();
    expect(user!.email).toBe('test-auth@example.com');
    
    expect(user!.role).toBe('user');
  });
  
  it('findUserByEmail returns undefined when user does not exist', async () => {
    const { findUserByEmail } = await import('../services/postgres/authService.js');
    
    const user = await findUserByEmail('nonexistent@example.com');
    expect(user).toBeUndefined();
  });
  
  it('createUser inserts a new user and returns the ID and role', async () => {
    const { createUser } = await import('../services/postgres/authService.js');
    
    const email = `test-create-${Date.now()}@example.com`;
    const password = 'hashed_password_for_test';
    
    const result = await createUser(email, password);
    
    expect(result).toHaveProperty('id');
    expect(result.id).toBeGreaterThan(0);
    
    expect(result).toHaveProperty('role');
    expect(result.role).toBe('user');
    
    
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    expect(rows).toHaveLength(1);
    expect(rows[0].password).toBe(password);
    expect(rows[0].role).toBe('user');
    
    
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
  });
});