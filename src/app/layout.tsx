import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edmonton Oilers Dashboard",
  description: "Edmonton Oilers roster, games, and standings at a glance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden bg-[#0a0e1a] text-white">
        {children}
      </body>
    </html>
  );
}
