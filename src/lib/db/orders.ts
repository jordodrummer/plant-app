import pool from "./client";
import { Order } from "../types";

export async function getOrders(): Promise<Order[]> {
  const { rows } = await pool.query("SELECT * FROM orders");
  return rows;
}

export async function getOrderById(id: number): Promise<Order | null> {
  const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createOrder(customerId: number): Promise<Order> {
  const { rows } = await pool.query(
    "INSERT INTO orders (customer_id) VALUES ($1) RETURNING *",
    [customerId]
  );
  return rows[0];
}

export async function updateOrderStatus(id: number, status: string): Promise<Order | null> {
  const { rows } = await pool.query(
    "UPDATE orders SET status = $1, updated_on = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id]
  );
  return rows[0] || null;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE orders SET status = 'deleted', updated_on = CURRENT_TIMESTAMP WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
