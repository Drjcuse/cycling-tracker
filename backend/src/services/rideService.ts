import pool from "../db/index.js";
import type { CreateRideInput, UpdateRideInput } from "../validation/rideSchema.js";
import type { Ride } from "../types/Rides.js";
import type { RideRow } from "../types/database.js";
import { NotFoundError } from "../errors/AppError.js";

const mapRideFromDb = (row: RideRow): Ride => ({
  id: row.id,
  name: row.name,
  distanceKm: row.distance_km,
  duration_minutes: row.duration_minutes,
  type: row.type,
  notes: row.notes,
  userId: row.user_id,
  created_at: row.created_at
});

export const getRides = async (userId?: number): Promise<Ride[]> => {
  const query = userId 
    ? `SELECT * FROM rides WHERE user_id = $1 ORDER BY id ASC`
    : `SELECT * FROM rides ORDER BY id ASC`;
  
  const params = userId ? [userId] : [];
  
  const { rows } = await pool.query<RideRow>(query, params);
  
  return rows.map(mapRideFromDb);
};

export const addRide = async (input: CreateRideInput): Promise<Ride> => {
  const { name, distanceKm, duration_minutes, type, notes, userId } = input;
  
  const { rows } = await pool.query<RideRow>(`
    INSERT INTO rides (name, distance_km, duration_minutes, type, notes, user_id) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, distanceKm, duration_minutes, type, notes, userId]);
  
  return mapRideFromDb(rows[0]);
};

export const getRideById = async (id: number): Promise<Ride> => {
  const { rows } = await pool.query<RideRow>(`
    SELECT * FROM rides WHERE id = $1
  `, [id]);
  
  if (rows.length === 0) {
    throw new NotFoundError("Ride", id); 
  }
  
  return mapRideFromDb(rows[0]);
};

export const updateRideById = async (
  id: number,
  input: UpdateRideInput
): Promise<Ride> => {
  const { rows: existingRows } = await pool.query<RideRow>(`
    SELECT * FROM rides WHERE id = $1
  `, [id]);
  
  if (existingRows.length === 0) {
    throw new NotFoundError("Ride", id);  
  }
  
  const params: any[] = [];
  const updateFields: string[] = [];
  
  const fieldMapping: Record<string, string> = {
    name: 'name',
    distanceKm: 'distance_km',
    duration_minutes: 'duration_minutes',
    type: 'type',
    notes: 'notes',
    userId: 'user_id'
  };
  
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && key in fieldMapping) {
      params.push(value);
      updateFields.push(`${fieldMapping[key]} = $${params.length}`);
    }
  });
  
  if (updateFields.length === 0) {
    return mapRideFromDb(existingRows[0]);
  }
  
  params.push(id);
  
  const query = `
    UPDATE rides 
    SET ${updateFields.join(', ')} 
    WHERE id = $${params.length}
    RETURNING *
  `;
  
  const { rows } = await pool.query<RideRow>(query, params);
  
  return mapRideFromDb(rows[0]);
};

export const deleteRideById = async (id: number): Promise<{ id: number }> => {
  const { rows: existingRows } = await pool.query<RideRow>(`
    SELECT * FROM rides WHERE id = $1
  `, [id]);
  
  if (existingRows.length === 0) {
    throw new NotFoundError("Ride", id);  
  }
  
  const { rows } = await pool.query<RideRow>(`
    DELETE FROM rides WHERE id = $1
    RETURNING id
  `, [id]);
  
  return { id: rows[0].id };
};