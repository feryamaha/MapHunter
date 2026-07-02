import { Sidebar } from "@/components/dashboard-layout/Sidebar";
import { Topbar } from "@/components/dashboard-layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-app">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-custom">
          {children}
        </main>
      </div>
    </div>
  );
}
