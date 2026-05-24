import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORGE — Simulateur d'ingénierie sportive",
  description:
    "Forge un programme que ton corps peut réellement encaisser.",
};

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased bg-black">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
