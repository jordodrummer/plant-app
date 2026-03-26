import AdminTabs from "@/components/admin-tabs";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminTabs />
      <div className="py-6">{children}</div>
    </div>
  );
}
