import pool from "./client";
import { Plant } from "../types";

export async function getItems(): Promise<Plant[]> {
  const { rows } = await pool.query("SELECT * FROM plants");
  return rows;
}

export async function getFeaturedItems(limit: number = 3): Promise<Plant[]> {
  const { rows } = await pool.query(
    "SELECT * FROM plants WHERE in_stock = true LIMIT $1",
    [limit]
  );
  return rows;
}

export async function getItemById(id: number): Promise<Plant | null> {
  const { rows } = await pool.query("SELECT * FROM plants WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createItem(item: Omit<Plant, "id">): Promise<Plant> {
  const { rows } = await pool.query(
    `INSERT INTO plants (cultivar_name, category_id, image, inventory, price, details, in_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [item.cultivar_name, item.category_id, item.image, item.inventory, item.price, item.details, item.in_stock]
  );
  return rows[0];
}

const ALLOWED_COLUMNS = new Set([
  "cultivar_name", "category_id", "image", "inventory", "price", "details", "in_stock",
]);

export async function updateItem(id: number, fields: Partial<Omit<Plant, "id">>): Promise<Plant | null> {
  const entries = Object.entries(fields).filter(
    ([k, v]) => v !== undefined && ALLOWED_COLUMNS.has(k)
  );
  if (entries.length === 0) return getItemById(id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);

  const { rows } = await pool.query(
    `UPDATE plants SET ${setClauses} WHERE id = $${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] || null;
}

export async function deleteItem(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM plants WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
