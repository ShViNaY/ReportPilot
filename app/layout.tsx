import type { Metadata } from "next";
import { AuthProvider } from "@/lib/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReportPilot",
  description: "Campaign reporting dashboard for marketing agencies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
