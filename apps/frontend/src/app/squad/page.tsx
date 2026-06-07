"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Player } from "@/types/player";

export default function SquadPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("All");

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      const playersInClub = players.filter(
        (p) => p.clubId === parseInt(clubId)
      );
      setClubPlayers(playersInClub);
    }
  }, []);

  const positions = [
    "All",
    "GK",
    "CB",
    "RB",
    "LB",
    "CDM",
    "CM",
    "CAM",
    "RW",
    "LW",
    "CF",
    "ST",
  ];

  const filteredPlayers =
    selectedPosition === "All"
      ? clubPlayers
      : clubPlayers.filter((p) => p.position === selectedPosition);

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
        <h1 className="text-3xl font-bold mb-6">{selectedClub.name} Squad</h1>

        {/* Position Filter */}
        <div className="mb-6">
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="bg-gray-800 text-white p-2 rounded-lg border border-gray-600"
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>

        {/* Players Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Position</th>
                <th className="text-left p-3">Age</th>
                <th className="text-left p-3">Rating</th>
                <th className="text-left p-3">Potential</th>
                <th className="text-left p-3">Morale</th>
                <th className="text-left p-3">Stamina</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-gray-700 hover:bg-gray-700"
                >
                  <td className="p-3">
                    {player.firstName} {player.lastName}
                  </td>
                  <td className="p-3">{player.position}</td>
                  <td className="p-3">{player.age}</td>
                  <td className="p-3">{player.overallRating}</td>
                  <td className="p-3">{player.potentialRating}</td>
                  <td className="p-3">
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full"
                        style={{ width: `${player.morale}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="w-full bg-gray-600 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${player.stamina}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        player.injuryStatus === "fit"
                          ? "bg-green-600"
                          : player.injuryStatus === "injured"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                      }`}
                    >
                      {player.injuryStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Squad Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Players</p>
            <p className="text-2xl font-bold">{clubPlayers.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Avg. Rating</p>
            <p className="text-2xl font-bold">
              {clubPlayers.length > 0
                ? (
                    clubPlayers.reduce(
                      (sum, p) => sum + p.overallRating,
                      0
                    ) / clubPlayers.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400">Avg. Age</p>
            <p className="text-2xl font-bold">
              {clubPlayers.length > 0
                ? (
                    clubPlayers.reduce((sum, p) => sum + p.age, 0) /
                    clubPlayers.length
                  ).toFixed(1)
                : "0"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}