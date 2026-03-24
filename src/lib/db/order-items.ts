import pool from "./client";
import type { OrderDetail } from "../types";

export async function getOrderItems(orderId: number): Promise<OrderDetail[]> {
  const { rows } = await pool.query(
    "SELECT * FROM order_details WHERE order_id = $1",
    [orderId]
  );
  return rows;
}

export async function createOrderItem(
  orderId: number,
  plantId: number,
  variantId: number,
  priceEach: number,
  quantity: number
): Promise<OrderDetail> {
  const { rows } = await pool.query(
    `INSERT INTO order_details (order_id, plant_id, variant_id, price_each, quantity)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, plantId, variantId, priceEach, quantity]
  );
  return rows[0];
}

export async function deleteOrderItem(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM order_details WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
