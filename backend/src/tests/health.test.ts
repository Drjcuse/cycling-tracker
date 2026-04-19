import request from "supertest";
import app from "../server.js";
import { describe, it, expect } from "vitest";

describe("GET /health", () => {
  it("returns health status", async () => {
    const res = await request(app).get("/health");
    
    // Health endpoint returns 200 if DB is up, 503 if down
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty("status");
    expect(["healthy", "unhealthy"]).toContain(res.body.status);
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("checks");
  });
});
