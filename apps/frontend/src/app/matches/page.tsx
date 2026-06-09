"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { Club } from "@/types/club";
import { Match } from "@/types/match";

export default function MatchesPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMatches, setClubMatches] = useState<Match[]>([]);
  const router = useRouter();

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      setClubMatches(matches.filter(m => m.homeClubId === parseInt(clubId) || m.awayClubId === parseInt(clubId)));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-gold/20 text-gold";
      default: return "bg-white/5 text-offwhite-500";
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Fixtures</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — All Competitions</p>
        </div>
      </div>

      {/* Match List */}
      <div className="space-y-2">
        {clubMatches.map((match) => {
          const homeClub = clubs.find((c) => c.id === match.homeClubId);
          const awayClub = clubs.find((c) => c.id === match.awayClubId);

          return (
            <div key={match.id} className="game-card p-4 flex items-center justify-between group">
              <div className="flex items-center gap-4 flex-1">
                {/* Home */}
                <div className="flex items-center gap-3 w-[200px]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: homeClub?.homeKitColor + '20' }}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: homeClub?.homeKitColor }} />
                  </div>
                  <span className={`text-sm font-medium ${match.homeClubId === selectedClub.id ? 'text-gold' : 'text-offwhite-300'}`}>
                    {homeClub?.name}
                  </span>
                </div>

                {/* Score / VS */}
                <div className="text-center w-24">
                  {match.status === "completed" ? (
                    <span className="text-lg font-black text-offwhite">{match.homeScore} - {match.awayScore}</span>
                  ) : (
                    <span className="text-sm font-bold text-offwhite-500">VS</span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-3 w-[200px]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: awayClub?.homeKitColor + '20' }}>
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: awayClub?.homeKitColor }} />
                  </div>
                  <span className={`text-sm font-medium ${match.awayClubId === selectedClub.id ? 'text-gold' : 'text-offwhite-300'}`}>
                    {awayClub?.name}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getStatusColor(match.status)}`}>
                    {match.status === "in_progress" ? "LIVE" : match.status.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-offwhite-500 mt-1">{match.competition}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-pill text-[9px]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    {match.weather}
                  </span>
                </div>
                {match.status !== "completed" && (
                  <button
                    onClick={() => {
                      localStorage.setItem("currentMatchId", match.id.toString());
                      router.push("/match-simulation");
                    }}
                    className="game-btn text-[10px] px-3 py-1.5"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
