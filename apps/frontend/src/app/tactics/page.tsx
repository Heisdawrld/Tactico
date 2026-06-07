"use client";

import { useState, useEffect } from "react";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import {
  Formation,
  Tactics,
  defaultTactics,
  formationPositions,
  positionRoles,
} from "@/types/tactics";

export default function TacticsPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<Tactics>(defaultTactics);
  const [selectedFormation, setSelectedFormation] = useState<Formation>("4-4-2");
  const [lineup, setLineup] = useState<
    { player: Player | null; position: string; x: number; y: number }[]
  >([]);

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

  useEffect(() => {
    // Initialize lineup based on selected formation
    const formation = formationPositions[selectedFormation];
    const newLineup = formation.map((pos) => ({
      player: null,
      position: pos.position,
      x: pos.x,
      y: pos.y,
    }));
    setLineup(newLineup);
  }, [selectedFormation]);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    setTactics({ ...tactics, formation });
  };

  const handlePlayerSelect = (positionIndex: number, player: Player | null) => {
    const newLineup = [...lineup];
    newLineup[positionIndex].player = player;
    setLineup(newLineup);
  };

  const handleTacticChange = (key: keyof Tactics, value: string) => {
    setTactics({ ...tactics, [key]: value });
  };

  const getPlayersForPosition = (position: string) => {
    const roles = positionRoles[position] || [];
    return clubPlayers.filter((p) => roles.includes(p.position));
  };

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
        <h1 className="text-3xl font-bold mb-6">Tactics</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formation Selector */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Formation</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2"] as Formation[]).map(
                (formation) => (
                  <button
                    key={formation}
                    onClick={() => handleFormationChange(formation)}
                    className={`p-2 rounded-lg border-2 ${
                      selectedFormation === formation
                        ? "border-blue-500 bg-blue-600"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {formation}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Team Instructions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Team Instructions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pressing Intensity
                </label>
                <select
                  value={tactics.pressingIntensity}
                  onChange={(e) => handleTacticChange("pressingIntensity", e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Passing Style
                </label>
                <select
                  value={tactics.passingStyle}
                  onChange={(e) => handleTacticChange("passingStyle", e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
                >
                  <option value="short">Short</option>
                  <option value="long">Long</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Defensive Line
                </label>
                <select
                  value={tactics.defensiveLine}
                  onChange={(e) => handleTacticChange("defensiveLine", e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lineup Editor */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Lineup</h2>
            <div className="relative w-full h-96 bg-green-600 rounded-lg overflow-hidden">
              {/* Pitch Background */}
              <div className="absolute inset-0 bg-green-600">
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full"></div>
                {/* Center Line */}
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white"></div>
                {/* Penalty Areas */}
                <div className="absolute top-1/4 left-0 w-1/4 h-1/2 border-2 border-white"></div>
                <div className="absolute top-1/4 right-0 w-1/4 h-1/2 border-2 border-white"></div>
              </div>

              {/* Player Positions */}
              {lineup.map((pos, index) => (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                  }}
                  onClick={() => {
                    const availablePlayers = getPlayersForPosition(pos.position);
                    // For simplicity, cycle through available players
                    const currentPlayer = pos.player;
                    const currentIndex = currentPlayer
                      ? availablePlayers.findIndex(
                          (p) => p.id === currentPlayer.id
                        )
                      : -1;
                    const nextIndex = (currentIndex + 1) % availablePlayers.length;
                    handlePlayerSelect(
                      index,
                      nextIndex >= 0 ? availablePlayers[nextIndex] : null
                    );
                  }}
                >
                  {pos.player ? (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                      {pos.player.lastName}
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-xs">
                      {pos.position}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Lineup List */}
            <div className="mt-4 bg-gray-700 rounded-lg p-4">
              <h3 className="font-bold mb-2">Starting XI</h3>
              <ul className="space-y-1">
                {lineup.map((pos, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-2 rounded hover:bg-gray-600"
                  >
                    <span>
                      {pos.player
                        ? `${pos.player.firstName} ${pos.player.lastName} (${pos.player.position})`
                        : `${pos.position}`}
                    </span>
                    <span>
                      {pos.player ? pos.player.overallRating : "-"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Save Tactics Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              localStorage.setItem("tactics", JSON.stringify(tactics));
              localStorage.setItem("lineup", JSON.stringify(lineup));
              alert("Tactics saved!");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold"
          >
            Save Tactics
          </button>
        </div>
      </div>
    </main>
  );
}