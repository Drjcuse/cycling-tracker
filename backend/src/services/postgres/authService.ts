import pool from "../../db/index.js";

export const findUserByEmail = async (email: string) => {
  const { rows } = await pool.query(
    "SELECT id, email, password, role FROM users WHERE email = $1", 
    [email]
  );
  return rows[0];
};

export const createUser = async (email: string, hashedPassword: string) => {
  const { rows } = await pool.query(
    "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, role",
    [email, hashedPassword]
  );
  return rows[0];
};