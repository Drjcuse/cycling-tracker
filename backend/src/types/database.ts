
export interface UserRow {
  id: number;
  email: string;
  password: string;
  role: string;
  created_at: Date;
}

export interface RideRow {
  id: number;
  name: string;
  distance_km: number;
  duration_minutes: number | null;
  type: string | null;
  notes: string | null;
  user_id: number;
  created_at: Date;
}

// Type for query results
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}