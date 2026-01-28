 import { Response, RequestHandler } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import {
  getRides as getRidesService,
  addRide as addRideService,
  getRideById,
  updateRideById,
  deleteRideById
} from "../services/rideService.js";
import { ForbiddenError } from "../errors/AppError.js";

export const getAllRides: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'admin';
  
  const rides = isAdmin 
    ? await getRidesService()
    : await getRidesService(userId); 
  
  res.status(200).json({ rides });
};

export const createRide: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  
  // Validation now handled by middleware
  const newRide = await addRideService({ ...req.body, userId });
  res.status(201).json(newRide);
};

export const getRideDetails: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const rideId = parseInt(req.params.id);
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'admin';
  
  const ride = await getRideById(rideId);
  
  if (!isAdmin && ride.userId !== userId) {
    throw new ForbiddenError("You can only view your own rides");
  }
  
  res.status(200).json(ride);
};

export const updateRide: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const rideId = parseInt(req.params.id);
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'admin';
  
  const existingRide = await getRideById(rideId);
  
  if (!isAdmin && existingRide.userId !== userId) {
    throw new ForbiddenError("You can only update your own rides");
  }
  
  // Validation now handled by middleware
  const updatedRide = await updateRideById(rideId, req.body);
  res.status(200).json(updatedRide);
};

export const deleteRide: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const rideId = parseInt(req.params.id);
  const userId = req.user?.userId;
  const isAdmin = req.user?.role === 'admin';
  
  const existingRide = await getRideById(rideId);
  
  if (!isAdmin && existingRide.userId !== userId) {
    throw new ForbiddenError("You can only delete your own rides");
  }
  
  await deleteRideById(rideId);
  res.status(204).end();
};