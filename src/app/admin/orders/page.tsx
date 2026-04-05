import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default async function AdminOrdersPage() {
  const supabase = getServiceSupabase();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (name, email),
      order_details (price_each, quantity)
    `)
    .neq("status", "deleted")
    .order("created_on", { ascending: false });

  if (error) throw error;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Orders</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Items</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const items = order.order_details ?? [];
              const total = items.reduce(
                (s: number, d: { price_each: number; quantity: number }) =>
                  s + d.price_each * d.quantity,
                0
              );
              return (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customers?.name ?? order.guest_name ?? "Guest"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_on).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">${total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
