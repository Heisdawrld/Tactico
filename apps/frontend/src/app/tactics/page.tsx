"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import { Formation, Tactics, defaultTactics, formationPositions } from "@/types/tactics";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clubId = localStorage.getItem("selectedClubId");
        if (!clubId) {
          setLoading(false);
          return;
        }

        // Fetch club
        const clubsRes = await fetch("/api/clubs");
        if (!clubsRes.ok) throw new Error("Failed to fetch clubs");
        const clubs: Club[] = await clubsRes.json();
        const club = clubs.find((c) => c.id === parseInt(clubId));
        setSelectedClub(club || null);

        // Fetch players
        const playersRes = await fetch("/api/players");
        if (!playersRes.ok) throw new Error("Failed to fetch players");
        const players: Player[] = await playersRes.json();
        setClubPlayers(players.filter((p) => p.clubId === parseInt(clubId)));

        // Initialize lineup based on formation
        const positions = formationPositions["4-4-2"];
        setLineup(
          positions.map((pos) => ({
            player: null,
            position: pos.position,
            x: pos.x,
            y: pos.y,
          }))
        );
      } catch (error) {
        console.error("Error fetching tactics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    const positions = formationPositions[formation];
    setLineup(
      positions.map((pos) => ({
        player: null,
        position: pos.position,
        x: pos.x,
        y: pos.y,
      }))
    );
  };

  const handlePlayerAssign = (positionIndex: number, player: Player | null) => {
    setLineup((prev) => {
      const newLineup = [...prev];
      newLineup[positionIndex] = { ...newLineup[positionIndex], player };
      return newLineup;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-offwhite text-xl">Loading tactics...</div>
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
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-offwhite">Tactics & Formation</h1>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-graphite text-offwhite font-semibold rounded-lg hover:bg-graphite/80 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formation Editor */}
        <div className="lg:col-span-2 bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
          <h2 className="text-2xl font-bold text-offwhite mb-6">Formation Editor</h2>
          <FormationEditor
            formation={selectedFormation}
            lineup={lineup}
            onPlayerAssign={handlePlayerAssign}
          />
        </div>

        {/* Tactics Panel */}
        <div className="space-y-6">
          <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
            <h2 className="text-xl font-bold text-offwhite mb-4">Select Formation</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["4-4-2", "4-3-3", "3-5-2", "4-2-3-1"] as Formation[]).map((formation) => (
                <button
                  key={formation}
                  onClick={() => handleFormationChange(formation)}
                  className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                    selectedFormation === formation
                      ? "bg-gold text-charcoal"
                      : "bg-charcoal/50 text-offwhite hover:bg-charcoal/80"
                  }`}
                >
                  {formation}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-graphite/50 backdrop-blur-sm p-6 rounded-xl border border-graphite/30">
            <h2 className="text-xl font-bold text-offwhite mb-4">Team Instructions</h2>
            <div className="space-y-4">
              <div>
                <label className="text-offwhite/60 text-sm font-medium">Mentality</label>
                <select
                  value={tactics.mentality}
                  onChange={(e) => setTactics({ ...tactics, mentality: e.target.value as any })}
                  className="mt-1 w-full bg-charcoal/50 border border-graphite/30 rounded-lg px-3 py-2 text-offwhite focus:outline-none focus:border-gold"
                >
                  <option value="defensive">Defensive</option>
                  <option value="cautious">Cautious</option>
                  <option value="balanced">Balanced</option>
                  <option value="attacking">Attacking</option>
                  <option value="ultra-attacking">Ultra-Attacking</option>
                </select>
              </div>
              <div>
                <label className="text-offwhite/60 text-sm font-medium">Pressing Intensity</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={tactics.pressingIntensity}
                  onChange={(e) => setTactics({ ...tactics, pressingIntensity: parseInt(e.target.value) })}
                  className="mt-1 w-full"
                />
                <div className="flex justify-between text-xs text-offwhite/40 mt-1">
                  <span>Low</span>
                  <span>{tactics.pressingIntensity}</span>
                  <span>High</span>
                </div>
              </div>
              <div>
                <label className="text-offwhite/60 text-sm font-medium">Passing Style</label>
                <select
                  value={tactics.passingStyle}
                  onChange={(e) => setTactics({ ...tactics, passingStyle: e.target.value as any })}
                  className="mt-1 w-full bg-charcoal/50 border border-graphite/30 rounded-lg px-3 py-2 text-offwhite focus:outline-none focus:border-gold"
                >
                  <option value="short">Short Passing</option>
                  <option value="mixed">Mixed</option>
                  <option value="direct">Direct Passing</option>
                  <option value="long">Long Balls</option>
                </select>
              </div>
              <div>
                <label className="text-offwhite/60 text-sm font-medium">Defensive Line</label>
                <select
                  value={tactics.defensiveLine}
                  onChange={(e) => setTactics({ ...tactics, defensiveLine: e.target.value as any })}
                  className="mt-1 w-full bg-charcoal/50 border border-graphite/30 rounded-lg px-3 py-2 text-offwhite focus:outline-none focus:border-gold"
                >
                  <option value="deep">Deep</option>
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                  <option value="ultra-high">Ultra-High</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
