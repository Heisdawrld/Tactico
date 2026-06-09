"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [scoutReport, setScoutReport] = useState<ScoutReport | null>(null);
  const [opponent, setOpponent] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        setClubPlayers(players.filter((p) => p.clubId === club.id));
        const formation = formationPositions[selectedFormation];
        setLineup(formation.map((pos) => ({ player: null, position: pos.position, x: pos.x, y: pos.y })));
      }
    }
  }, [selectedFormation]);

  useEffect(() => {
    if (!selectedClub) return;
    const clubMatches = matches.filter(m => m.homeClubId === selectedClub.id || m.awayClubId === selectedClub.id);
    const upcoming = clubMatches.filter(m => new Date(m.matchDate) > new Date());
    if (upcoming.length > 0) {
      upcoming.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
      const nextMatch = upcoming[0];
      const opponentId = nextMatch.homeClubId === selectedClub.id ? nextMatch.awayClubId : nextMatch.homeClubId;
      const opponentClub = clubs.find((c) => c.id === opponentId);
      if (opponentClub) {
        setOpponent({ id: opponentClub.id, name: opponentClub.name });
        const report = scoutReports[opponentClub.id];
        if (report) setScoutReport(report);
      }
    }
  }, [selectedClub]);

  const handleSave = () => {
    localStorage.setItem("tactics", JSON.stringify(tactics));
    localStorage.setItem("lineup", JSON.stringify(lineup));
  };

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

  const tacticOptions: { key: keyof Tactics; label: string; options: { value: string; label: string; desc: string }[] }[] = [
    { key: "pressingIntensity", label: "Pressing", options: [
      { value: "low", label: "Low", desc: "Sit back, conserve energy" },
      { value: "medium", label: "Med", desc: "Balanced press triggers" },
      { value: "high", label: "High", desc: "Aggressive, high risk" },
    ]},
    { key: "passingStyle", label: "Passing", options: [
      { value: "short", label: "Short", desc: "Possession based" },
      { value: "mixed", label: "Mixed", desc: "Balanced approach" },
      { value: "long", label: "Long", desc: "Direct, aerial" },
    ]},
    { key: "defensiveLine", label: "Def Line", options: [
      { value: "low", label: "Deep", desc: "Compact, safe" },
      { value: "medium", label: "Mid", desc: "Balanced shape" },
      { value: "high", label: "High", desc: "Offside trap risk" },
    ]},
  ];

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Tactics Board</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — {selectedFormation}</p>
        </div>
        <button onClick={handleSave} className="game-btn text-xs">Save Tactics</button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Formation Editor — Main Area */}
        <div className="col-span-12 lg:col-span-8">
          <FormationEditor
            club={selectedClub}
            players={clubPlayers}
            onFormationChange={setSelectedFormation}
            onLineupChange={setLineup}
          />
        </div>

        {/* Right Panel — Instructions + Scout */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Team Instructions */}
          <div className="game-card p-4">
            <p className="section-header">Team Instructions</p>
            <div className="space-y-4">
              {tacticOptions.map((opt) => (
                <div key={opt.key}>
                  <p className="text-xs font-semibold text-offwhite-300 mb-2">{opt.label}</p>
                  <div className="flex gap-1">
                    {opt.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTactics({ ...tactics, [opt.key]: option.value })}
                        className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                          tactics[opt.key] === option.value
                            ? "bg-gold/20 text-gold ring-1 ring-gold/30"
                            : "bg-white/[0.03] text-offwhite-500 hover:bg-white/[0.06]"
                        }`}
                        title={option.desc}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-offwhite-500 mt-1">
                    {opt.options.find(o => o.value === tactics[opt.key])?.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scout Report */}
          {scoutReport && (
            <div className="game-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-header mb-0">Scout Report</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-offwhite-500">THREAT</span>
                  <span className={`text-sm font-bold ${
                    scoutReport.overallThreat >= 7 ? 'text-red-400' :
                    scoutReport.overallThreat >= 4 ? 'text-yellow-400' : 'text-green-400'
                  }`}>{scoutReport.overallThreat}/10</span>
                </div>
              </div>
              <p className="text-xs text-offwhite-300 mb-3">{opponent?.name} — {scoutReport.formation} / {scoutReport.playingStyle}</p>

              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-[9px] font-semibold text-green-400 uppercase mb-1">Strengths</p>
                  {scoutReport.strengths.slice(0, 2).map((s, i) => (
                    <p key={i} className="text-[11px] text-offwhite-300">{s}</p>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-red-400 uppercase mb-1">Weaknesses</p>
                  {scoutReport.weaknesses.slice(0, 2).map((w, i) => (
                    <p key={i} className="text-[11px] text-offwhite-300">{w}</p>
                  ))}
                </div>
              </div>

              {/* Key Players */}
              {scoutReport.keyPlayers.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold text-offwhite-500 uppercase mb-1">Key Players</p>
                  <div className="space-y-1">
                    {scoutReport.keyPlayers.slice(0, 2).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-[10px]">
                        <span className="text-offwhite-300">{p.name}</span>
                        <span className={`font-bold ${
                          p.threatLevel === "High" || p.threatLevel === "Extreme" ? "text-red-400" : "text-yellow-400"
                        }`}>{p.threatLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
