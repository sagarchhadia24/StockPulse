import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#00FF88]/5 via-transparent to-[#8B5CF6]/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.1),transparent_50%)] pointer-events-none" />

      <div className="relative">
        <Header />
        <main className="container py-8 px-4 md:px-6">{children}</main>
      </div>
    </div>
  );
}
