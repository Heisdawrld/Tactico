"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clubs } from "@/types/club";
import { matches } from "@/types/match";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Match } from "@/types/match";
import { Player } from "@/types/player";

export default function DashboardPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        setClubPlayers(players.filter((p) => p.clubId === club.id));
        const clubMatches = matches.filter(
          (m) => m.homeClubId === club.id || m.awayClubId === club.id
        );
        const upcoming = clubMatches
          .filter((m) => new Date(m.matchDate) > new Date())
          .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        if (upcoming.length > 0) setNextMatch(upcoming[0]);
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

  const opponentClub = nextMatch
    ? clubs.find((c) => c.id === (nextMatch.homeClubId === selectedClub.id ? nextMatch.awayClubId : nextMatch.homeClubId))
    : null;

  const avgRating = clubPlayers.length > 0
    ? (clubPlayers.reduce((s, p) => s + p.overallRating, 0) / clubPlayers.length).toFixed(1)
    : "0";

  const topPlayer = clubPlayers.length > 0
    ? clubPlayers.reduce((best, p) => p.overallRating > best.overallRating ? p : best, clubPlayers[0])
    : null;

  // Simulated AI feed
  const aiInsights = [
    { icon: "!", text: "Midfield depth concern — only 2 natural CDMs available", priority: "high" },
    { icon: "+", text: "Training intensity can increase — squad freshness at 87%", priority: "low" },
    { icon: "~", text: "Opponent likely to press high — consider long ball option", priority: "medium" },
  ];

  // Recent form (simulated)
  const recentForm = ["W", "W", "D", "L", "W"];

  return (
    <div className="min-h-screen relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-midnight-400 to-charcoal" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,168,76,0.04),transparent_60%)]" />

      <div className="relative z-10 p-6 animate-fade-in">
        {/* Top Bar — Club Identity */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: selectedClub.homeKitColor + '20', border: `1px solid ${selectedClub.homeKitColor}40` }}
            >
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: selectedClub.homeKitColor }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-offwhite">{selectedClub.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-offwhite-500">{selectedClub.league}</span>
                <span className="text-offwhite-500/30">|</span>
                <span className="text-xs text-offwhite-500">Season 2026/27</span>
                <span className="text-offwhite-500/30">|</span>
                <span className="text-xs text-offwhite-500">Week 12</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link href="/squad" className="game-btn-secondary text-xs">Squad</Link>
            <Link href="/tactics" className="game-btn-secondary text-xs">Tactics</Link>
            <Link href="/match-simulation" className="game-btn text-xs">Match Day</Link>
          </div>
        </div>

        {/* Momentum Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-offwhite-500">Team Momentum</span>
            <span className="text-xs font-bold text-momentum-high">HIGH</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-momentum-high to-gold animate-momentum-pulse" style={{ width: '72%' }} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* LEFT — Hero Match Card (Netflix style) */}
          <div className="col-span-12 lg:col-span-7">
            {nextMatch && opponentClub ? (
              <div className="game-card p-6 relative overflow-hidden">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-transparent" style={{
                    background: `linear-gradient(135deg, transparent 30%, ${selectedClub.homeKitColor}15 100%)`
                  }} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="live-dot" style={{ animationDuration: '2s' }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Next Match</span>
                    <span className="text-[10px] text-offwhite-500 ml-2">{nextMatch.competition}</span>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    {/* Home */}
                    <div className="text-center flex-1">
                      <div
                        className="w-16 h-16 rounded-xl mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: selectedClub.homeKitColor + '20', border: `2px solid ${selectedClub.homeKitColor}40` }}
                      >
                        <div className="w-8 h-8 rounded-md" style={{ backgroundColor: selectedClub.homeKitColor }} />
                      </div>
                      <p className="font-semibold text-sm">{selectedClub.name}</p>
                      <p className="text-[10px] text-offwhite-500 mt-0.5">HOME</p>
                    </div>

                    {/* VS / Time */}
                    <div className="text-center px-6">
                      <p className="text-3xl font-black text-offwhite/20">VS</p>
                      <p className="text-[10px] text-offwhite-500 mt-1">
                        {new Date(nextMatch.matchDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold text-gold mt-0.5">
                        {new Date(nextMatch.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Away */}
                    <div className="text-center flex-1">
                      <div
                        className="w-16 h-16 rounded-xl mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: opponentClub.homeKitColor + '20', border: `2px solid ${opponentClub.homeKitColor}40` }}
                      >
                        <div className="w-8 h-8 rounded-md" style={{ backgroundColor: opponentClub.homeKitColor }} />
                      </div>
                      <p className="font-semibold text-sm">{opponentClub.name}</p>
                      <p className="text-[10px] text-offwhite-500 mt-0.5">AWAY</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="stat-pill">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                        {nextMatch.weather}
                      </span>
                    </div>
                    <Link href="/match-simulation" className="game-btn text-xs">
                      Enter Match
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="game-card p-8 text-center">
                <p className="text-offwhite-500 text-sm">No upcoming matches</p>
              </div>
            )}

            {/* Recent Form + Stats Row */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="game-card p-3">
                <p className="section-header">Squad Rating</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black gradient-text">{avgRating}</span>
                  <span className="text-xs text-offwhite-500">AVG</span>
                </div>
              </div>
              <div className="game-card p-3">
                <p className="section-header">Squad Size</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-offwhite">{clubPlayers.length}</span>
                  <span className="text-xs text-offwhite-500">players</span>
                </div>
              </div>
              <div className="game-card p-3">
                <p className="section-header">Finances</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-green-400">${(selectedClub.finances / 1000000).toFixed(0)}M</span>
                </div>
              </div>
              <div className="game-card p-3">
                <p className="section-header">Form</p>
                <div className="flex items-center gap-1 mt-1">
                  {recentForm.map((r, i) => (
                    <span key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                      r === "W" ? "bg-green-500/20 text-green-400" :
                      r === "D" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Bloomberg Panel */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* AI Insights */}
            <div className="game-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-gold/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gold">AI</span>
                </div>
                <span className="text-xs font-semibold text-offwhite">Intelligence Feed</span>
              </div>
              <div className="space-y-2">
                {aiInsights.map((insight, i) => (
                  <div key={i} className="feed-row rounded">
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      insight.priority === "high" ? "bg-red-500/20 text-red-400" :
                      insight.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {insight.icon}
                    </span>
                    <span className="text-[11px] text-offwhite-300">{insight.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Star Player */}
            {topPlayer && (
              <div className="game-card p-4">
                <p className="section-header">Star Player</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center ring-1 ring-gold/20">
                    <span className="text-lg font-black gradient-text">{topPlayer.overallRating}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{topPlayer.firstName} {topPlayer.lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-offwhite-500">{topPlayer.position}</span>
                      <span className="text-offwhite-500/30">|</span>
                      <span className="text-[10px] text-offwhite-500">Age {topPlayer.age}</span>
                      <span className="text-offwhite-500/30">|</span>
                      <span className="text-[10px] text-gold">POT {topPlayer.potentialRating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-offwhite-500">PAC</span>
                      <div className="w-12 h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-green-400" style={{ width: `${topPlayer.pace}%` }} /></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-offwhite-500">SHO</span>
                      <div className="w-12 h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-gold" style={{ width: `${topPlayer.shooting}%` }} /></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-offwhite-500">PAS</span>
                      <div className="w-12 h-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-blue-400" style={{ width: `${topPlayer.passing}%` }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* League Position Mini Table */}
            <div className="game-card p-4">
              <p className="section-header">League Position</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <span className="text-4xl font-black gradient-text">3rd</span>
                  <p className="text-[10px] text-offwhite-500 mt-1">Premier League</p>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-offwhite-500">Points</span>
                    <span className="font-bold">24</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-offwhite-500">Goal Diff</span>
                    <span className="font-bold text-green-400">+12</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-offwhite-500">Board Confidence</span>
                    <span className="font-bold text-gold">78%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/training" className="game-card p-3 hover:border-gold/20 text-center group">
                <svg className="mx-auto mb-1 text-offwhite-500 group-hover:text-gold transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span className="text-[10px] font-semibold text-offwhite-500 group-hover:text-offwhite transition-colors">TRAINING</span>
              </Link>
              <Link href="/press" className="game-card p-3 hover:border-gold/20 text-center group">
                <svg className="mx-auto mb-1 text-offwhite-500 group-hover:text-gold transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                <span className="text-[10px] font-semibold text-offwhite-500 group-hover:text-offwhite transition-colors">PRESS</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
