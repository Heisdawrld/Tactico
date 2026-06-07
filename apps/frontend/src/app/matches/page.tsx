"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { Club } from "@/types/club";
import { Match } from "@/types/match";

export default function MatchesPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMatches, setClubMatches] = useState<Match[]>([]);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      const matchesForClub = matches.filter(
        (m) => m.homeClubId === parseInt(clubId) || m.awayClubId === parseInt(clubId)
      );
      setClubMatches(matchesForClub);
    }
  }, []);

  if (!selectedClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No club selected. Please select a club first.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{selectedClub.name} Matches</h1>

        {/* Match List */}
        <div className="space-y-4">
          {clubMatches.map((match) => {
            const homeClub = clubs.find((c) => c.id === match.homeClubId);
            const awayClub = clubs.find((c) => c.id === match.awayClubId);
            const isHome = match.homeClubId === selectedClub.id;
            const opponent = isHome ? awayClub : homeClub;

            return (
              <div
                key={match.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-bold">{homeClub?.name}</p>
                    <div
                      className="w-12 h-8 mx-auto mt-1 rounded"
                      style={{ backgroundColor: homeClub?.homeKitColor }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">
                      {match.homeScore} - {match.awayScore}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(match.matchDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{awayClub?.name}</p>
                    <div
                      className="w-12 h-8 mx-auto mt-1 rounded"
                      style={{ backgroundColor: awayClub?.homeKitColor }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">{match.competition}</p>
                  <p className="text-sm text-gray-400">{match.status}</p>
                  <p className="text-sm text-gray-400">Weather: {match.weather}</p>
                  <button
                    onClick={() => {
                      localStorage.setItem("currentMatchId", match.id.toString());
                      // Later: Navigate to match simulation
                      alert(`Simulate match: ${homeClub?.name} vs ${awayClub?.name}`);
                    }}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}