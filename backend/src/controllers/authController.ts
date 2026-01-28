import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { loginSchema, LoginInput } from "../validation/authSchema.js";
import { findUserByEmail, createUser } from "../services/postgres/authService.js";
import { generateToken } from "../services/authService.js";
import { ZodError } from "zod";
import { validationError, authenticationError } from "../utils/errors.js";

const SALT_ROUNDS = 10;

export const registerUser: RequestHandler<unknown, unknown, LoginInput> =
  async (req, res, next): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      if (await findUserByEmail(email)) {
        res.status(409).json(validationError("User already exists"));
        return;
      }

      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await createUser(email, hashed);
      const token = generateToken({ userId: user.id, role: user.role });

      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          role: user.role
        }
      });
      return;
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json(validationError(err.issues.map(i => i.message).join(", ")));
        return;
      }
      console.error("registerUser error:", err);
      next(err);
    }
  };

export const loginUser: RequestHandler<unknown, unknown, LoginInput> =
  async (req, res, next): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await findUserByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json(authenticationError("invalid_credentials", "Invalid email or password"));
        return;
      }

      const token = generateToken({ userId: user.id, role: user.role });
      res.status(200).json({ 
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
      return;
    } catch (err: any) {
      if (err instanceof ZodError) {
        res.status(400).json(validationError(err.issues.map(i => i.message).join(", ")));
        return;
      }
      console.error("loginUser error:", err);
      next(err);
    }
  };