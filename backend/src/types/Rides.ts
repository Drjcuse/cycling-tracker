export interface Ride {
  id: number;
  name: string;
  distanceKm: number;
  duration_minutes?: number | null;
  type?: string | null;
  notes?: string | null;
  userId: number;
  created_at?: Date;
}

export interface RideInput {
  name: string;
  distanceKm: number;
  duration_minutes?: number;
  type?: string;
  notes?: string;
}