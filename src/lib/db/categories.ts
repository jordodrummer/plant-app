import pool from "./client";
import { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createCategory(name: string, price: number): Promise<Category> {
  const { rows } = await pool.query(
    "INSERT INTO categories (name, price) VALUES ($1, $2) RETURNING *",
    [name, price]
  );
  return rows[0];
}
