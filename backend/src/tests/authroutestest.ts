import request from "supertest";
import app from "../server.js";
import pool from "./utils/testDb.js";
import bcrypt from "bcrypt";

describe("Auth Routes", () => {
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
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    await pool.query(`
      INSERT INTO users (email, password, role)
      VALUES ('admin@example.com', $1, 'admin')
      ON CONFLICT (email) DO UPDATE SET password = $1
    `, [hashedPassword]);
  });
  
  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = 'test-registration@example.com'");
    await pool.end();
  });
  
  describe("POST /api/auth/login", () => {
    it("should return 200 and token on valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "password123" });
  
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });
  
    it("should return 401 on invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@example.com", password: "wrongpassword" });
  
      expect(res.status).toBe(401);
      expect(res.body.errors).toContain("Invalid credentials");
    });
  
    it("should return 400 on invalid input", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "invalidemail", password: "123" });
  
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
  
  describe("POST /api/auth/register", () => {
    it("should create a new user and return token", async () => {
      const email = "test-registration@example.com";
      const password = "securepassword123";
      
      // Clean up first
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
      
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email, password });
      
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      
      
      const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      expect(rows).toHaveLength(1);
      
      
      expect(rows[0].role).toBe('user');
      
      
      expect(rows[0].password).not.toBe(password);
      const passwordMatches = await bcrypt.compare(password, rows[0].password);
      expect(passwordMatches).toBe(true);
    });
    
    it("should return 409 if user already exists", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "admin@example.com", password: "newpassword123" });
      
      expect(res.status).toBe(409);
      expect(res.body.errors).toContain("User already exists");
    });
    
    it("should return 400 on invalid input", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "invalidemail", password: "123" });
      
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
});