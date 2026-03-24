import pool from "./client";
import type { Plant, PlantWithPricing } from "../types";

export async function getItems(): Promise<PlantWithPricing[]> {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      MIN(v.price) as min_price,
      COUNT(v.id)::int as variant_count,
      (SELECT pi.url FROM plant_images pi WHERE pi.plant_id = p.id ORDER BY pi.sort_order LIMIT 1) as primary_image_url
    FROM plants p
    LEFT JOIN plant_variants v ON p.id = v.plant_id
    GROUP BY p.id
    ORDER BY p.id
  `);
  return rows;
}

export async function getFeaturedItems(limit: number = 3): Promise<PlantWithPricing[]> {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      MIN(v.price) as min_price,
      COUNT(v.id)::int as variant_count,
      (SELECT pi.url FROM plant_images pi WHERE pi.plant_id = p.id ORDER BY pi.sort_order LIMIT 1) as primary_image_url
    FROM plants p
    JOIN plant_variants v ON p.id = v.plant_id AND v.inventory > 0
    WHERE p.in_stock = true
    GROUP BY p.id
    LIMIT $1
  `, [limit]);
  return rows;
}

export async function getItemById(id: number): Promise<Plant | null> {
  const { rows } = await pool.query("SELECT * FROM plants WHERE id = $1", [id]);
  return rows[0] || null;
}

const ALLOWED_COLUMNS = new Set(["cultivar_name", "category_id", "details", "in_stock"]);

export async function createItem(item: Omit<Plant, "id">): Promise<Plant> {
  const { rows } = await pool.query(
    `INSERT INTO plants (cultivar_name, category_id, details, in_stock)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [item.cultivar_name, item.category_id, item.details, item.in_stock]
  );
  return rows[0];
}

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
