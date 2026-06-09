"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";
import {
  CareerStatus, initialCareer, getDefaultBoardExpectations, premierLeagueTable, LeagueTableEntry,
} from "@/types/career";
import { matches } from "@/types/match";

export default function CareerPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [career, setCareer] = useState<CareerStatus>(initialCareer);
  const [leagueTable, setLeagueTable] = useState<LeagueTableEntry[]>([]);
  const [week, setWeek] = useState(1);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        setCareer({ ...initialCareer, clubId: club.id, boardExpectations: getDefaultBoardExpectations(club.reputation) });
        setLeagueTable(premierLeagueTable);
      }
    }
  }, []);

  const simulateWeek = () => {
    if (!selectedClub) return;
    setWeek(prev => prev + 1);
    const newTable = leagueTable.map(entry => ({
      ...entry,
      position: Math.max(1, Math.min(20, entry.position + Math.floor(Math.random() * 3) - 1)),
    }));
    newTable.sort((a, b) => a.position - b.position);
    setLeagueTable(newTable);
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

  const clubEntry = leagueTable.find(e => e.clubId === selectedClub.id);

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Career Mode</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — Season 2026/27</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={simulateWeek} className="game-btn text-xs">Advance Week</button>
          <button onClick={() => localStorage.setItem("career", JSON.stringify(career))} className="game-btn-secondary text-xs">Save</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Career Overview */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Position Card */}
          <div className="game-card p-5 text-center">
            <p className="section-header">League Position</p>
            <span className="text-5xl font-black gradient-text">{clubEntry?.position || '-'}</span>
            <p className="text-sm text-offwhite-500 mt-1">{clubEntry?.points || 0} points</p>
          </div>

          {/* Season Info */}
          <div className="game-card p-4">
            <p className="section-header">Season Info</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Season</span>
                <span className="font-medium">2026/27</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Week</span>
                <span className="font-medium text-gold">{week}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-offwhite-500">Manager Rep</span>
                <span className="font-medium">{career.reputation}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-green-400" style={{ width: `${career.reputation}%` }} />
              </div>
            </div>
          </div>

          {/* Board Expectations */}
          <div className="game-card p-4">
            <p className="section-header">Board Expectations</p>
            <div className="space-y-2">
              {career.boardExpectations.map((exp, i) => (
                <div key={i} className={`p-2 rounded-lg border-l-2 ${
                  exp.progress >= 75 ? 'border-green-400' : exp.progress >= 50 ? 'border-yellow-400' : 'border-red-400'
                } bg-white/[0.02]`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium">{exp.target}</span>
                    <span className="text-[10px] font-bold">{exp.progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 mt-1">
                    <div className={`h-full rounded-full ${
                      exp.progress >= 75 ? 'bg-green-400' : exp.progress >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                    }`} style={{ width: `${exp.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* League Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="game-card p-4">
            <p className="section-header">{selectedClub.league} Table</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["#", "Club", "P", "W", "D", "L", "GD", "Pts"].map(h => (
                      <th key={h} className="text-[10px] font-semibold text-offwhite-500 uppercase tracking-wider py-2 px-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leagueTable.map((entry) => {
                    const isUser = entry.clubId === selectedClub.id;
                    return (
                      <tr key={entry.clubId} className={`border-b border-white/[0.03] transition-colors ${
                        isUser ? 'bg-gold/5' : 'hover:bg-white/[0.02]'
                      }`}>
                        <td className="py-2 px-2 text-xs font-bold text-offwhite-500">{entry.position}</td>
                        <td className={`py-2 px-2 text-xs font-semibold ${isUser ? 'text-gold' : 'text-offwhite'}`}>{entry.clubName}</td>
                        <td className="py-2 px-2 text-xs text-offwhite-500">{entry.played}</td>
                        <td className="py-2 px-2 text-xs text-green-400">{entry.won}</td>
                        <td className="py-2 px-2 text-xs text-offwhite-500">{entry.drawn}</td>
                        <td className="py-2 px-2 text-xs text-red-400">{entry.lost}</td>
                        <td className="py-2 px-2 text-xs text-offwhite-300">{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</td>
                        <td className="py-2 px-2 text-xs font-black text-offwhite">{entry.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="game-card p-4 mt-4">
            <p className="section-header">Upcoming Fixtures</p>
            <div className="space-y-2">
              {matches.filter(m => (m.homeClubId === selectedClub.id || m.awayClubId === selectedClub.id) && new Date(m.matchDate) > new Date()).slice(0, 5).map(match => {
                const home = clubs.find(c => c.id === match.homeClubId);
                const away = clubs.find(c => c.id === match.awayClubId);
                return (
                  <div key={match.id} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-offwhite-500">{match.competition}</span>
                      <span className="text-xs text-offwhite-300">{home?.name} vs {away?.name}</span>
                    </div>
                    <span className="text-[10px] text-offwhite-500">{new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
