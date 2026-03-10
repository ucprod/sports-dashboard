"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Main Content Placeholder */}
      <div className="card">
        <h2 className="card-title">🏒 Roster</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded p-4 text-center animate-pulse">
            <div className="w-32 h-40 bg-gray-600 rounded mx-auto mb-3"></div>
            <div className="h-4 bg-gray-600 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-20 mx-auto"></div>
          </div>
          <div className="bg-gray-700 rounded p-4 text-center animate-pulse">
            <div className="w-32 h-40 bg-gray-600 rounded mx-auto mb-3"></div>
            <div className="h-4 bg-gray-600 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-20 mx-auto"></div>
          </div>
          <div className="bg-gray-700 rounded p-4 text-center animate-pulse">
            <div className="w-32 h-40 bg-gray-600 rounded mx-auto mb-3"></div>
            <div className="h-4 bg-gray-600 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-20 mx-auto"></div>
          </div>
          <div className="bg-gray-700 rounded p-4 text-center animate-pulse">
            <div className="w-32 h-40 bg-gray-600 rounded mx-auto mb-3"></div>
            <div className="h-4 bg-gray-600 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-20 mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="card-title">📅 Next Game</h2>
          <div className="bg-gray-700 rounded p-4 h-24 animate-pulse"></div>
        </div>
        <div className="card">
          <h2 className="card-title">🏁 Last Game</h2>
          <div className="bg-gray-700 rounded p-4 h-24 animate-pulse"></div>
        </div>
      </div>

      {/* Standings Section */}
      <div className="card">
        <h2 className="card-title">📊 Standings</h2>
        <div className="bg-gray-700 rounded p-4 h-32 animate-pulse"></div>
      </div>

      {/* Setup Instructions */}
      <div className="card border-yellow-600 bg-gray-800">
        <h3 className="text-lg font-bold text-yellow-400 mb-2">
          ⚙️ Phase 1 Setup Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>Create a Supabase project at supabase.com</li>
          <li>Copy your project URL and anon key to .env.local</li>
          <li>Run the SQL migration to create database tables</li>
          <li>Set up OpenAI API key in .env.local</li>
          <li>Run <code className="bg-gray-900 px-1">npm install</code></li>
          <li>Run <code className="bg-gray-900 px-1">npm run dev</code></li>
        </ol>
      </div>
    </div>
  );
}
