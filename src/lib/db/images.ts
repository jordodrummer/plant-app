import pool from "./client";
import type { PlantImage } from "../types";

export async function getImagesByPlantId(plantId: number): Promise<PlantImage[]> {
  const { rows } = await pool.query(
    "SELECT * FROM plant_images WHERE plant_id = $1 ORDER BY sort_order",
    [plantId]
  );
  return rows;
}

export async function createImage(image: Omit<PlantImage, "id">): Promise<PlantImage> {
  const { rows } = await pool.query(
    `INSERT INTO plant_images (plant_id, url, image_type, caption, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [image.plant_id, image.url, image.image_type, image.caption, image.sort_order]
  );
  return rows[0];
}

export async function deleteImage(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM plant_images WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
