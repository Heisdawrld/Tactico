"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { Club } from "@/types/club";
import { Match } from "@/types/match";

export default function DashboardPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);

  useEffect(() => {
    // Retrieve selected club from localStorage
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);

      // Find the next match for this club
      const clubMatches = matches.filter(
        (m) => m.homeClubId === club?.id || m.awayClubId === club?.id
      );
      const upcomingMatches = clubMatches.filter(
        (m) => new Date(m.matchDate) > new Date()
      );
      if (upcomingMatches.length > 0) {
        // Sort by date and get the next match
        upcomingMatches.sort(
          (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
        );
        setNextMatch(upcomingMatches[0]);
      }
    }
  }, []);

  if (!selectedClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No club selected. Please select a club first.</p>
      </main>
    );
  }

  // Find the opponent club for the next match
  const opponentClub = nextMatch
    ? clubs.find(
        (c) =>
          c.id === nextMatch.homeClubId || c.id === nextMatch.awayClubId
      )
    : null;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* Club Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-lg"
              style={{ backgroundColor: selectedClub.homeKitColor }}
            ></div>
            <div>
              <h2 className="text-2xl font-bold">{selectedClub.name}</h2>
              <p className="text-gray-400">{selectedClub.league}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Reputation</p>
                  <p className="text-xl font-bold">{selectedClub.reputation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Finances</p>
                  <p className="text-xl font-bold">
                    ${selectedClub.finances.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Stadium Capacity</p>
                  <p className="text-xl font-bold">
                    {selectedClub.stadiumCapacity.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Match */}
        {nextMatch && opponentClub && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Next Match</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg"
                  style={{ backgroundColor: selectedClub.homeKitColor }}
                ></div>
                <div className="text-center">
                  <p className="font-bold">{selectedClub.name}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">VS</p>
                <p className="text-sm text-gray-400">
                  {new Date(nextMatch.matchDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(nextMatch.matchDate).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="font-bold">{opponentClub.name}</p>
                </div>
                <div
                  className="w-16 h-16 rounded-lg"
                  style={{ backgroundColor: opponentClub.homeKitColor }}
                ></div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">{nextMatch.competition}</p>
              <p className="text-sm text-gray-400">Weather: {nextMatch.weather}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors cursor-pointer">
            <p className="font-bold">View Squad</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors cursor-pointer">
            <p className="font-bold">Set Tactics</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors cursor-pointer">
            <p className="font-bold">Simulate Match</p>
          </div>
        </div>
      </div>
    </main>
  );
}