"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { Club } from "@/types/club";
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
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>("ALL");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        setClubPlayers(players.filter((p) => p.clubId === club.id));
      }
    }
  }, []);

  if (!selectedClub) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-offwhite-500 text-sm">No club selected.</p>
          <Link href="/start" className="game-btn mt-4 inline-block">Choose Club</Link>
        </div>
      </div>
    );
  }

  const filteredPlayers = activeGroup === "ALL"
    ? clubPlayers
    : clubPlayers.filter((p) => positionGroups[activeGroup]?.includes(p.position));

  const avgRating = clubPlayers.length > 0
    ? (clubPlayers.reduce((s, p) => s + p.overallRating, 0) / clubPlayers.length).toFixed(1)
    : "0";
  const avgAge = clubPlayers.length > 0
    ? (clubPlayers.reduce((s, p) => s + p.age, 0) / clubPlayers.length).toFixed(1)
    : "0";

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return "rating-badge-gold";
    if (rating >= 75) return "rating-badge-green";
    if (rating >= 65) return "rating-badge-yellow";
    return "rating-badge-red";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "fit": return "bg-green-500/20 text-green-400";
      case "injured": return "bg-red-500/20 text-red-400";
      case "suspended": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-white/5 text-offwhite-500";
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Squad</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — {clubPlayers.length} players</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="stat-pill">
            <span className="text-offwhite-500">AVG RAT</span>
            <span className="font-bold gradient-text">{avgRating}</span>
          </div>
          <div className="stat-pill">
            <span className="text-offwhite-500">AVG AGE</span>
            <span className="font-bold text-offwhite">{avgAge}</span>
          </div>
        </div>
      </div>

      {/* Position Group Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-white/[0.03] rounded-lg w-fit">
        {["ALL", "GK", "DEF", "MID", "ATT"].map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              activeGroup === group
                ? "bg-white/10 text-gold"
                : "text-offwhite-500 hover:text-offwhite"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Player Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className={`game-card p-4 text-left transition-all duration-200 ${
                  selectedPlayer?.id === player.id ? "ring-1 ring-gold/40" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Rating Badge */}
                  <div className={`rating-badge ${getRatingColor(player.overallRating)}`}>
                    {player.overallRating}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-offwhite truncate">
                        {player.firstName} {player.lastName}
                      </p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${positionColors[player.position]}`}>
                        {player.position}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-offwhite-500">AGE</span>
                        <span className="text-[11px] font-bold">{player.age}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-offwhite-500">POT</span>
                        <span className="text-[11px] font-bold text-gold">{player.potentialRating}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getStatusStyle(player.injuryStatus)}`}>
                        {player.injuryStatus}
                      </span>
                    </div>

                    {/* Attribute bars */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[
                        { label: "PAC", value: player.pace, color: "bg-green-400" },
                        { label: "SHO", value: player.shooting, color: "bg-gold" },
                        { label: "PAS", value: player.passing, color: "bg-blue-400" },
                        { label: "DRI", value: player.dribbling, color: "bg-purple-400" },
                        { label: "DEF", value: player.defending, color: "bg-cyan-400" },
                        { label: "PHY", value: player.physicality, color: "bg-orange-400" },
                      ].map((attr) => (
                        <div key={attr.label}>
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[8px] text-offwhite-500">{attr.label}</span>
                            <span className="text-[9px] font-bold">{attr.value}</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/5">
                            <div className={`h-full rounded-full ${attr.color}`} style={{ width: `${attr.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Player Detail Panel (right side) */}
        {selectedPlayer && (
          <div className="w-72 shrink-0 game-card p-4 h-fit sticky top-6 animate-slide-in-right">
            <div className="text-center mb-4">
              <div className={`rating-badge ${getRatingColor(selectedPlayer.overallRating)} w-16 h-16 text-xl mx-auto mb-2`}>
                {selectedPlayer.overallRating}
              </div>
              <h3 className="font-bold text-lg">{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${positionColors[selectedPlayer.position]}`}>
                {selectedPlayer.position}
              </span>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Potential</span>
                <span className="font-bold text-gold">{selectedPlayer.potentialRating}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Age</span>
                <span className="font-bold">{selectedPlayer.age}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Wage</span>
                <span className="font-bold text-green-400">${selectedPlayer.wage.toLocaleString()}/w</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Morale</span>
                <span className={`font-bold ${selectedPlayer.morale >= 70 ? 'text-green-400' : selectedPlayer.morale >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {selectedPlayer.morale}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Stamina</span>
                <span className={`font-bold ${selectedPlayer.stamina >= 70 ? 'text-green-400' : selectedPlayer.stamina >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {selectedPlayer.stamina}%
                </span>
              </div>
            </div>

            {/* Morale & Stamina bars */}
            <div className="mt-4 space-y-2">
              <div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${selectedPlayer.morale}%` }} />
                </div>
              </div>
              <div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${selectedPlayer.stamina}%` }} />
                </div>
              </div>
            </div>

            {/* Attribute hexagon placeholder */}
            <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-center">
              <p className="text-[9px] text-offwhite-500 uppercase tracking-wider">Attribute Radar</p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {[
                  { label: "Pace", val: selectedPlayer.pace },
                  { label: "Shooting", val: selectedPlayer.shooting },
                  { label: "Passing", val: selectedPlayer.passing },
                  { label: "Dribbling", val: selectedPlayer.dribbling },
                  { label: "Defending", val: selectedPlayer.defending },
                  { label: "Physical", val: selectedPlayer.physicality },
                ].map((a) => (
                  <div key={a.label} className="flex justify-between text-[10px]">
                    <span className="text-offwhite-500">{a.label}</span>
                    <span className="font-bold">{a.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
