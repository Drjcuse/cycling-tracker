import { Router } from "express";
import {
  getAllRides,
  createRide,
  getRideDetails,
  updateRide,
  deleteRide,
} from "../controllers/ridesController.js";
import { validateIdParam } from "../middleware/validateIdParam.js";
import { validateBody } from "../middleware/validate.js";
import { rideSchema, updateRideSchema } from "../validation/rideSchema.js";

const router = Router();

router.get    ("/",    getAllRides);
router.post   ("/",    validateBody(rideSchema), createRide);
router.get    ("/:id", validateIdParam("id"), getRideDetails);
router.put    ("/:id", validateIdParam("id"), validateBody(updateRideSchema), updateRide);
router.delete ("/:id", validateIdParam("id"), deleteRide);

export default router;