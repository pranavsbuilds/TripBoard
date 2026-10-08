import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "TripBoard - Business Travel Management",
  description: "Enterprise corporate travel management platform for trips, expenses, and compliance.",
  icons: {
    icon: "/assets/logo_svg.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-ice text-primary-blue min-h-screen antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
