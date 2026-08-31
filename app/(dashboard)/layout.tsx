// app/(dashboard)/layout.tsx

import { ProtectedRoute } from '@/lib/context/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}