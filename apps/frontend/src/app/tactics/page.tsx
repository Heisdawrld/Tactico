"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { matches } from "@/types/match";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import { Formation, Tactics, defaultTactics, formationPositions } from "@/types/tactics";
import { scoutReports, ScoutReport } from "@/types/scout";
import FormationEditor from "@/components/FormationEditor";

interface LineupPosition {
  player: Player | null;
  position: string;
  x: number;
  y: number;
}

export default function TacticsPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<Tactics>(defaultTactics);
  const [selectedFormation, setSelectedFormation] = useState<Formation>("4-4-2");
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [opponent, setOpponent] = useState<{ id: number; name: string } | null>(null);
  const [scoutReport, setScoutReport] = useState<ScoutReport | null>(null);

  // Load selected club and players
  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        const playersInClub = players.filter((p) => p.clubId === club.id);
        setClubPlayers(playersInClub);
        
        // Initialize lineup
        const formation = formationPositions[selectedFormation];
        const newLineup = formation.map((pos) => ({
          player: null,
          position: pos.position,
          x: pos.x,
          y: pos.y,
        }));
        setLineup(newLineup);
      }
    }
  }, [selectedFormation]);

  // Load next opponent (for scout report)
  useEffect(() => {
    if (!selectedClub) return;
    
    const clubId = selectedClub.id;
    const clubMatches = matches.filter(
      (m) => m.homeClubId === clubId || m.awayClubId === clubId
    );
    const upcomingMatches = clubMatches.filter(
      (m) => new Date(m.matchDate) > new Date()
    );
    
    if (upcomingMatches.length > 0) {
      upcomingMatches.sort(
        (a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
      );
      const nextMatch = upcomingMatches[0];
      const opponentId = nextMatch.homeClubId === clubId 
        ? nextMatch.awayClubId 
        : nextMatch.homeClubId;
      const opponentClub = clubs.find((c) => c.id === opponentId);
      
      if (opponentClub) {
        setOpponent({ id: opponentClub.id, name: opponentClub.name });
        const report = scoutReports[opponentClub.id];
        if (report) {
          setScoutReport(report);
        }
      }
    }
  }, [selectedClub]);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    setTactics({ ...tactics, formation });
  };

  const handleLineupChange = (newLineup: LineupPosition[]) => {
    setLineup(newLineup);
  };

  const handleTacticChange = (key: keyof Tactics, value: string) => {
    setTactics({ ...tactics, [key]: value } as Tactics);
  };

  const handleSave = () => {
    localStorage.setItem("tactics", JSON.stringify(tactics));
    localStorage.setItem("lineup", JSON.stringify(lineup));
    alert("Tactics and lineup saved!");
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

        {/* Next Opponent Scout Report */}
        {scoutReport && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">Scout Report: {opponent?.name}</h2>
                <p className="text-sm text-gray-400">
                  Formation: {scoutReport.formation} | Style: {scoutReport.playingStyle}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">Threat Level: {scoutReport.overallThreat}/10</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Strengths</h3>
                <ul className="list-disc list-inside text-sm text-green-400">
                  {scoutReport.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Weaknesses</h3>
                <ul className="list-disc list-inside text-sm text-red-400">
                  {scoutReport.weaknesses.map((weakness, i) => (
                    <li key={i}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Key Players</h3>
              <div className="flex gap-4">
                {scoutReport.keyPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-gray-700 rounded-lg p-2 flex-1"
                  >
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-gray-400">{player.position}</p>
                    <p className="text-sm">Rating: {player.overallRating}</p>
                    <p className="text-xs text-gray-500">
                      Threat: {player.threatLevel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formation Editor */}
          <div className="lg:col-span-2">
            <FormationEditor
              club={selectedClub}
              players={clubPlayers}
              onFormationChange={handleFormationChange}
              onLineupChange={handleLineupChange}
            />
          </div>

          {/* Team Instructions */}
          <div className="space-y-6">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = More aggressive pressing, but risks leaving gaps
                  </p>
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
                    <option value="mixed">Mixed</option>
                    <option value="long">Long</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Short = Safer, Long = More direct
                  </p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Higher = More space behind defence
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tempo
                  </label>
                  <select
                    value={tactics.tempo || "normal"}
                    onChange={(e) => handleTacticChange("tempo" as keyof Tactics, e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Faster = More quick passes, but less accuracy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Timewasting
                  </label>
                  <select
                    value={tactics.timewasting || "off"}
                    onChange={(e) => handleTacticChange("timewasting" as keyof Tactics, e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
                  >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Only effective when winning
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Save Tactics & Lineup
            </button>
          </div>
        </div>

        {/* Lineup Summary */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Starting Lineup</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-11 gap-2">
            {lineup.map((pos, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded-lg p-2 text-center text-sm"
              >
                <p className="font-medium">{pos.position}</p>
                {pos.player ? (
                  <>
                    <p className="text-xs">{pos.player.lastName}</p>
                    <p className="text-xs text-gray-400">{pos.player.overallRating}</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Empty</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}