"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubId = localStorage.getItem("selectedClubId");
        if (!clubId) {
          setLoading(false);
          return;
        }

        // Fetch all clubs and find the selected one
        const clubs: Club[] = await apiFetch("/api/clubs");
        const club = clubs.find((c) => c.id === parseInt(clubId));
        setSelectedClub(club || null);

        // Fetch all players and filter by club
        const players: Player[] = await apiFetch("/api/players");
        setClubPlayers(players.filter((p) => p.clubId === parseInt(clubId)));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!selectedClub) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">No club selected. Please start a career.</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Club Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-offwhite">{selectedClub.name}</h1>
          <p className="text-offwhite/60 mt-2">
            {selectedClub.country} • {selectedClub.league}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/squad"
            className="px-6 py-3 bg-gold text-charcoal font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          >
            View Squad
          </Link>
          <Link
            href="/tactics"
            className="px-6 py-3 bg-graphite text-offwhite font-semibold rounded-lg hover:bg-graphite/80 transition-colors"
          >
            Set Tactics
          </Link>
        </div>
      </div>

      {/* Club Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
          <h3 className="text-offwhite/60 text-sm font-medium">Reputation</h3>
          <p className="text-3xl font-bold text-offwhite mt-2">{selectedClub.reputation}</p>
        </div>
        <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
          <h3 className="text-offwhite/60 text-sm font-medium">Finances</h3>
          <p className="text-3xl font-bold text-gold mt-2">
            £{(selectedClub.finances / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
          <h3 className="text-offwhite/60 text-sm font-medium">Stadium Capacity</h3>
          <p className="text-3xl font-bold text-offwhite mt-2">
            {selectedClub.stadiumCapacity.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Squad Overview */}
      <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
        <h2 className="text-2xl font-bold text-offwhite mb-6">Squad Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubPlayers.slice(0, 6).map((player) => (
            <div
              key={player.id}
              className="bg-charcoal/50 p-4 rounded-lg border border-graphite/20 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-offwhite font-semibold">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-offwhite/60 text-sm">{player.position} • Age {player.age}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold">{player.overallRating}</p>
                  <p className="text-offwhite/40 text-xs">POT {player.potentialRating}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {clubPlayers.length > 6 && (
          <Link
            href="/squad"
            className="mt-6 inline-block text-gold hover:text-gold/80 transition-colors"
          >
            View full squad →
          </Link>
        )}
      </div>
    </div>
  );
}
