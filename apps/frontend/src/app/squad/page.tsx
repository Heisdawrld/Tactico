"use client";

import { useEffect, useState } from "react";
import { Player, PlayerPosition } from "@/types/player";
import Link from "next/link";

const positionGroups: Record<string, PlayerPosition[]> = {
  "GK": ["GK"],
  "DEF": ["CB", "RB", "LB"],
  "MID": ["CDM", "CM", "CAM"],
  "ATT": ["RW", "LW", "CF", "ST"],
};

const positionColors: Record<string, string> = {
  GK: "bg-yellow-500/20 text-yellow-400",
  CB: "bg-blue-500/20 text-blue-400",
  RB: "bg-blue-500/20 text-blue-400",
  LB: "bg-blue-500/20 text-blue-400",
  CDM: "bg-green-500/20 text-green-400",
  CM: "bg-green-500/20 text-green-400",
  CAM: "bg-green-500/20 text-green-400",
  RW: "bg-red-500/20 text-red-400",
  LW: "bg-red-500/20 text-red-400",
  CF: "bg-red-500/20 text-red-400",
  ST: "bg-red-500/20 text-red-400",
};

export default function SquadPage() {
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const clubId = localStorage.getItem("selectedClubId");
        if (!clubId) {
          setLoading(false);
          return;
        }

        const playersRes = await fetch("/api/players");
        if (!playersRes.ok) throw new Error("Failed to fetch players");
        const players: Player[] = await playersRes.json();
        setClubPlayers(players.filter((p) => p.clubId === parseInt(clubId)));
      } catch (error) {
        console.error("Error fetching squad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">Loading squad...</div>
      </div>
    );
  }

  if (clubPlayers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">No players found for this club.</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-offwhite">First Team Squad</h1>
        <div className="text-offwhite/60">
          {clubPlayers.length} players
        </div>
      </div>

      {Object.entries(positionGroups).map(([groupName, positions]) => {
        const groupPlayers = clubPlayers.filter((p) => positions.includes(p.position));
        if (groupPlayers.length === 0) return null;

        return (
          <div key={groupName} className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
            <h2 className="text-2xl font-bold text-offwhite mb-6">{groupName}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupPlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-charcoal/50 p-4 rounded-lg border border-graphite/20 hover:border-gold/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-offwhite font-semibold">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-offwhite/60 text-sm">Age {player.age}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${positionColors[player.position]}`}>
                        {player.position}
                      </span>
                      <p className="text-2xl font-bold text-gold mt-2">{player.overallRating}</p>
                      <p className="text-offwhite/40 text-xs">POT {player.potentialRating}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-offwhite/40">PAC</p>
                      <p className="text-offwhite font-semibold">{player.pace}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-offwhite/40">SHO</p>
                      <p className="text-offwhite font-semibold">{player.shooting}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-offwhite/40">PAS</p>
                      <p className="text-offwhite font-semibold">{player.passing}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-offwhite/40">DRI</p>
                      <p className="text-offwhite font-semibold">{player.dribbling}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-offwhite/40">DEF</p>
                      <p className="text-offwhite font-semibold">{player.defending}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-offwhite/40">PHY</p>
                      <p className="text-offwhite font-semibold">{player.physicality}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
