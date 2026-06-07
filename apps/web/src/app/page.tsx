"use client";

import { useSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Tactico</h1>
          <p className="text-gray-400">Football Universe Simulator</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Welcome, {session.user?.name || "Manager"}</h2>
            <p className="text-gray-400">Your football management journey begins here.</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
            <ul className="space-y-2 text-gray-400">
              <li>• Create your manager profile</li>
              <li>• Choose your first club</li>
              <li>• Set up tactics</li>
              <li>• Play your first match</li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <p className="text-gray-400">Phase 1: Foundation</p>
            <p className="text-green-400 mt-2">✓ Auth System Ready</p>
            <p className="text-green-400">✓ Database Schema Complete</p>
          </div>
        </div>
      </main>
    </div>
  );
}
