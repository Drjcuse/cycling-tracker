import pool from './utils/testDb.js';
import bcrypt from 'bcrypt';
import {
  getRides,
  addRide,
  getRideById,
  updateRideById,
  deleteRideById,
} from '../services/rideService.js';

describe('Ride Service Tests', () => {
  let testUserId: number;

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

    const userCheckResult = await pool.query(
      "SELECT id FROM users WHERE email = 'test-user@example.com'"
    );
    
    if (userCheckResult.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userResult = await pool.query(`
        INSERT INTO users (email, password, role)
        VALUES ('test-user@example.com', $1, 'user')
        RETURNING id
      `, [hashedPassword]);
      testUserId = userResult.rows[0].id;
    } else {
      testUserId = userCheckResult.rows[0].id;
    }
    
    console.log('Test service using user ID:', testUserId);
  });

  beforeEach(async () => {
    // Clean and seed test rides
    await pool.query('DELETE FROM rides WHERE user_id = $1', [testUserId]);
    await pool.query(`
      INSERT INTO rides (name, distance_km, duration_minutes, type, notes, user_id)
      VALUES
        ('Morning Ride', 18, 60, 'cycling', 'Morning routine', $1),
        ('Evening Ride', 22, 75, 'cycling', 'Evening cooldown', $1),
        ('City Ride', 12, 40, 'cycling', 'Errands', $1)
    `, [testUserId]);
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query('DELETE FROM rides WHERE user_id = $1', [testUserId]);
    }
    await pool.end();
  });

  describe('getRides()', () => {
    it('returns all rides', async () => {
      const rides = await getRides();
      
      expect(rides.length).toBeGreaterThanOrEqual(3);
    });

    it('returns rides filtered by userId when provided', async () => {
      const rides = await getRides(testUserId);
      
      expect(rides.length).toBe(3);
      rides.forEach(ride => {
        expect(ride.userId).toBe(testUserId);
      });
    });

    it("includes 'Morning Ride' in results", async () => {
      const rides = await getRides(testUserId);
      const morningRide = rides.find(ride => ride.name === 'Morning Ride');
      
      expect(morningRide).toBeDefined();
      if (morningRide) {
        expect(morningRide.name).toBe('Morning Ride');
        expect(morningRide.distanceKm).toBe(18);
      }
    });
  });

  describe('addRide()', () => {
    it('adds and returns a new ride', async () => {
      const newRide = {
        name: 'Test Ride',
        distanceKm: 25,
        duration_minutes: 50,
        type: 'cycling',
        notes: 'Test notes',
        userId: testUserId,
      };
      
      const added = await addRide(newRide);
      
      expect(added).toHaveProperty('id');
      expect(added.name).toBe('Test Ride');
      expect(added.distanceKm).toBe(25);
      expect(added.userId).toBe(testUserId);
      
      // Verify in database
      const { rows } = await pool.query(
        'SELECT * FROM rides WHERE name = $1 AND user_id = $2', 
        ['Test Ride', testUserId]
      );
      expect(rows).toHaveLength(1);
    });
  });

  describe('getRideById()', () => {
    it('fetches the correct ride', async () => {
      const { rows } = await pool.query(
        'SELECT id FROM rides WHERE user_id = $1 LIMIT 1', 
        [testUserId]
      );
      const rideId = rows[0].id;
      
      const ride = await getRideById(rideId);
      
      expect(ride).toBeDefined();
      expect(ride).toHaveProperty('id', rideId);
    });

    it('throws NotFoundError if ID does not exist', async () => {
      await expect(() => getRideById(9999)).rejects.toThrow(/Ride.+not found/i);
    });
  });

  describe('updateRideById()', () => {
    it('updates a ride', async () => {
      // Create a ride to update
      const newRide = {
        name: 'Original',
        distanceKm: 5,
        duration_minutes: 15,
        type: 'cycling',
        notes: 'Old',
        userId: testUserId,
      };
      
      const added = await addRide(newRide);
      
      // Update it
      const updatedData = {
        name: 'Updated Ride',
        distanceKm: 10,
        duration_minutes: 15,
        type: 'cycling',
        notes: 'Still old',
        userId: testUserId,
      };
      
      const updated = await updateRideById(added.id, updatedData);
      
      expect(updated.name).toBe('Updated Ride');
      expect(updated.distanceKm).toBe(10);
      
      // Verify in database
      const { rows } = await pool.query('SELECT * FROM rides WHERE id = $1', [added.id]);
      expect(rows[0].name).toBe('Updated Ride');
      expect(rows[0].distance_km).toBe(10);
    });

    it('throws NotFoundError on nonexistent ID', async () => {
      await expect(() =>
        updateRideById(9999, {
          name: 'X',
          distanceKm: 1,
          duration_minutes: 1,
          type: 'cycling',
          notes: 'X',
          userId: testUserId,
        })
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteRideById()', () => {
    it('deletes a ride', async () => {
      // Create a ride to delete
      const newRide = {
        name: 'Delete Me',
        distanceKm: 8,
        duration_minutes: 20,
        type: 'cycling',
        notes: 'Delete test',
        userId: testUserId,
      };
      
      const added = await addRide(newRide);
      
      // Delete it
      const deleted = await deleteRideById(added.id);
      
      expect(deleted.id).toBe(added.id);
      
      // Verify it's gone
      const { rows } = await pool.query('SELECT * FROM rides WHERE id = $1', [added.id]);
      expect(rows).toHaveLength(0);
    });

    it('throws NotFoundError on nonexistent ID', async () => {
      await expect(() => deleteRideById(9999)).rejects.toThrow(/Ride.+not found/i);
    });
  });
});