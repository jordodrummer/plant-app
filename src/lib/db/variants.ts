import pool from "./client";
import type { PlantVariant } from "../types";

export async function getVariantsByPlantId(plantId: number): Promise<PlantVariant[]> {
  const { rows } = await pool.query(
    "SELECT * FROM plant_variants WHERE plant_id = $1 ORDER BY sort_order",
    [plantId]
  );
  return rows;
}

export async function createVariant(variant: Omit<PlantVariant, "id">): Promise<PlantVariant> {
  const { rows } = await pool.query(
    `INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, note, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [variant.plant_id, variant.variant_type, variant.price, variant.inventory, variant.label, variant.note, variant.sort_order]
  );
  await pool.query(
    `UPDATE plants SET in_stock = EXISTS(
      SELECT 1 FROM plant_variants WHERE plant_id = $1 AND inventory > 0
    ) WHERE id = $1`,
    [variant.plant_id]
  );
  return rows[0];
}

export async function updateVariantInventory(id: number, inventory: number): Promise<PlantVariant | null> {
  const { rows } = await pool.query(
    "UPDATE plant_variants SET inventory = $1 WHERE id = $2 RETURNING *",
    [inventory, id]
  );
  if (!rows[0]) return null;
  await pool.query(
    `UPDATE plants SET in_stock = EXISTS(
      SELECT 1 FROM plant_variants WHERE plant_id = $1 AND inventory > 0
    ) WHERE id = $1`,
    [rows[0].plant_id]
  );
  return rows[0];
}
