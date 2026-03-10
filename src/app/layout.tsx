import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NHL Sports Dashboard",
  description: "Edmonton Oilers roster, games, and standings at a glance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <div className="flex flex-col min-h-screen">
          <header className="bg-oilers-blue border-b-4 border-oilers-orange p-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-white">
                🏒 Edmonton Oilers Dashboard
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Real-time roster, games, and standings
              </p>
            </div>
          </header>

          <main className="flex-grow max-w-7xl mx-auto w-full p-4">
            {children}
          </main>

          <footer className="bg-gray-800 border-t border-gray-700 p-4 mt-8">
            <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
              <p>
                Data updates daily at 3 AM EST. Last refresh:{" "}
                <span className="text-white">Checking...</span>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
