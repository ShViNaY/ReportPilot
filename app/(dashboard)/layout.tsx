// app/(dashboard)/layout.tsx

import type { Metadata } from 'next';
import { ProtectedRoute } from '@/lib/context/ProtectedRoute';
import { SidebarProvider } from '@/lib/context/SidebarContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export const metadata: Metadata = {
  title: 'Agency Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

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