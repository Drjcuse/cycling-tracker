import dotenv from "dotenv";
dotenv.config();

console.log("[server.ts] Environment loaded: " + (process.env.NODE_ENV || 'development'));

import express from "express";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import ridesRouter from "./routes/rides.js";
import { authenticateJWT } from "./middleware/authMiddleware.js";
import { mockAuthMiddleware } from "./middleware/testAuth.js";
import { notFoundError } from "./utils/errors.js";
import { errorHandler } from "./middleware/errorHandler.js";  

console.log("[server.ts] Starting server initialization");

const app = express();
console.log("[server.ts] Express application created");

app.set('trust proxy', true);

app.use(express.json());
console.log("[server.ts] JSON parsing middleware added");

app.use(healthRouter);
console.log("[server.ts] Health routes mounted");

app.use("/api/auth", authRouter);
console.log("[server.ts] Authentication routes mounted at /api/auth");

const authMiddleware = process.env.NODE_ENV === 'test' 
  ? mockAuthMiddleware 
  : authenticateJWT;
const authType = process.env.NODE_ENV === 'test' ? 'mock' : 'JWT';

app.use("/api/rides", authMiddleware, ridesRouter);
console.log("[server.ts] Ride routes mounted at /api/rides (protected - " + authType + ")");


app.use((req, res) => {
  res.status(404).json(notFoundError("Endpoint"));
});
console.log("[server.ts] 404 handler mounted");


app.use(errorHandler);  
console.log("[server.ts] Global error handler mounted");

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 3000;
  console.log("[server.ts] Starting server...");
  app.listen(port, () => {
    console.log("[server.ts] Server started successfully");
    console.log("[server.ts] Environment: " + (process.env.NODE_ENV || 'development'));
    console.log("[server.ts] Listening on port: " + port);
    console.log("[server.ts] Database: " + process.env.DB_NAME);
    console.log("[server.ts] Started at: " + new Date().toISOString());
  });
}

export default app;