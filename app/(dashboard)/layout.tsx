// app/(dashboard)/layout.tsx

import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { SidebarProvider } from '@/lib/context/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>{children}</SidebarProvider>
    </ProtectedRoute>
  );
}