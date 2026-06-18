"use client";

import { useEffect, useRef, useState } from "react";
import { Club } from "@/types/club";
import { Player } from "@/types/player";

export default function MatchSimulationPage() {
  const [homeClub, setHomeClub] = useState<Club | null>(null);
  const [awayClub, setAwayClub] = useState<Club | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubsRes = await fetch("/api/clubs");
        if (!clubsRes.ok) throw new Error("Failed to fetch clubs");
        const clubs: Club[] = await clubsRes.json();
        
        const playersRes = await fetch("/api/players");
        if (!playersRes.ok) throw new Error("Failed to fetch players");
        const players: Player[] = await playersRes.json();

        if (clubs.length >= 2) {
          setHomeClub(clubs[0]);
          setAwayClub(clubs[1]);
          setHomePlayers(players.filter(p => p.clubId === clubs[0].id).slice(0, 11));
          setAwayPlayers(players.filter(p => p.clubId === clubs[1].id).slice(0, 11));
        }
      } catch (error) {
        console.error("Error fetching match data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">Loading match...</div>
      </div>
    );
  }

  if (!homeClub || !awayClub || homePlayers.length === 0 || awayPlayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">Not enough data to simulate a match.</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-offwhite">Match Simulation</h1>
        <div className="text-offwhite/60">
          {homeClub.name} vs {awayClub.name}
        </div>
      </div>

      <div className="w-full h-[600px] bg-pitch-dark rounded-xl border border-graphite/30 flex items-center justify-center">
        <p className="text-offwhite/60">Physics engine will be initialized here...</p>
      </div>
    </div>
  );
}
