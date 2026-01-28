import { Ride } from "../types/Rides.js"; 

declare global {
  namespace Express {
    interface Request {
      ride?: Ride;
    }
  }
}

export {};