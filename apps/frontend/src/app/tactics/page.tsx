"use client";

import Link from "next/link";

export default function TacticsPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-offwhite">Tactics & Formation</h1>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-graphite text-offwhite font-semibold rounded-lg hover:bg-graphite/80 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
      <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
        <p className="text-offwhite/60">Tactics page coming soon!</p>
      </div>
    </div>
  );
}