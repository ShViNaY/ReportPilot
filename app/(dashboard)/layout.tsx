// app/(dashboard)/layout.tsx

import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { SidebarProvider } from '@/lib/context/SidebarContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}