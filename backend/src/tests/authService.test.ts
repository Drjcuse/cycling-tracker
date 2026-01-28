/// <reference types="vitest" />
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
      INSERT INTO users (email, password)
      VALUES ('test-auth@example.com', '$2b$10$QnJ3pTle7fCKlx1q0zHgLOV48xYIjo61J20UzMmkxLRjc6z9Yj8dO')
      ON CONFLICT (email) DO NOTHING
    `);
  });
  
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'test-auth@example.com'");
    await pool.end();
  });
  
  it('findUserByEmail returns a user when exists', async () => {
    const { findUserByEmail } = await import('../services/postgres/authService.js');
    
    const user = await findUserByEmail('test-auth@example.com');
    expect(user).toBeDefined();
    expect(user!.email).toBe('test-auth@example.com');
  });
  
  it('findUserByEmail returns undefined when user does not exist', async () => {
    const { findUserByEmail } = await import('../services/postgres/authService.js');
    
    const user = await findUserByEmail('nonexistent@example.com');
    expect(user).toBeUndefined();
  });
  
  it('createUser inserts a new user and returns the ID', async () => {
    const { createUser } = await import('../services/postgres/authService.js');
    
    const email = `test-create-${Date.now()}@example.com`;
    const password = 'hashed_password_for_test';
    
    const result = await createUser(email, password);
    
    expect(result).toHaveProperty('id');
    expect(result.id).toBeGreaterThan(0);
    
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    expect(rows).toHaveLength(1);
    expect(rows[0].password).toBe(password);
    
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
  });
});