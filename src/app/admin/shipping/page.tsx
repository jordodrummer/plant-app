import { getShippingConfig } from "@/lib/db/shipping";
import ShippingConfigForm from "./shipping-config-form";

export default async function AdminShippingPage() {
  const configs = await getShippingConfig();

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">Shipping Configuration</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ship from: {process.env.ORIGIN_ZIP ?? "Not configured (set ORIGIN_ZIP env var)"}
      </p>
      <ShippingConfigForm configs={configs} />
    </div>
  );
}
