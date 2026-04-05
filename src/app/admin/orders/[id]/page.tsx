import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceSupabase } from "@/lib/supabase/server";
import OrderStatusSelect from "./order-status-select";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceSupabase();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (*),
      order_details (
        *,
        plants (cultivar_name),
        plant_variants (variant_type, label)
      )
    `)
    .eq("id", Number(id))
    .single();

  if (error || !order) notFound();

  const items = order.order_details ?? [];
  const total = items.reduce(
    (s: number, d: { price_each: number; quantity: number }) =>
      s + d.price_each * d.quantity,
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Order #{order.id}</h1>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Customer</h2>
          {order.customers ? (
            <>
              <p className="font-medium">
                <Link
                  href={`/admin/customers/${order.customers.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customers.name}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">{order.customers.email}</p>
              <p className="text-sm text-muted-foreground">
                {order.customers.address}, {order.customers.city}, {order.customers.state} {order.customers.zip}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Customer not found</p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Order Info</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">Created:</span>{" "}
            {new Date(order.created_on).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Updated:</span>{" "}
            {new Date(order.updated_on).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Plant</th>
              <th className="px-4 py-2 text-left font-medium">Variant</th>
              <th className="px-4 py-2 text-left font-medium">Qty</th>
              <th className="px-4 py-2 text-left font-medium">Price</th>
              <th className="px-4 py-2 text-left font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: {
              id: number;
              price_each: number;
              quantity: number;
              plants: { cultivar_name: string } | null;
              plant_variants: { variant_type: string; label: string | null } | null;
            }) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2">{item.plants?.cultivar_name ?? "Unknown"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {item.plant_variants?.variant_type.replace(/_/g, " ") ?? "N/A"}
                </td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">${item.price_each.toFixed(2)}</td>
                <td className="px-4 py-2">${(item.price_each * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right font-semibold">Total</td>
              <td className="px-4 py-2 font-semibold">${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
