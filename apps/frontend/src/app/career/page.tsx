"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";
import {
  CareerStatus,
  initialCareer,
  BoardExpectation,
  getDefaultBoardExpectations,
  premierLeagueTable,
  LeagueTableEntry,
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
        setCareer({
          ...initialCareer,
          clubId: club.id,
          boardExpectations: getDefaultBoardExpectations(club.reputation),
        });
        setLeagueTable(premierLeagueTable);
      }
    }
  }, []);

  // Simulate a week
  const simulateWeek = () => {
    if (!selectedClub) return;

    // For now, just increment the week and update the table randomly
    setWeek((prev) => {
      const newWeek = prev + 1;
      
      // Every 10 weeks is a season end
      if (newWeek % 10 === 0) {
        // Update league table (random changes for demo)
        const newTable = leagueTable.map((entry) => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          const newPosition = Math.max(1, Math.min(20, entry.position + change));
          return { ...entry, position: newPosition };
        });
        
        // Sort by position
        newTable.sort((a, b) => a.position - b.position);
        
        // Update club's position
        const clubEntry = newTable.find((e) => e.clubId === selectedClub.id);
        if (clubEntry) {
          // Check if we met board expectations
          const expectations = career.boardExpectations;
          expectations.forEach((exp) => {
            if (exp.target === "Avoid relegation" && clubEntry.position > 17) {
              exp.progress = 0;
            } else if (exp.target === "Finish top 4" && clubEntry.position <= 4) {
              exp.progress = 100;
            } else if (exp.target === "Win the league" && clubEntry.position === 1) {
              exp.progress = 100;
            } else {
              exp.progress = Math.max(0, 100 - (clubEntry.position * 5));
            }
          });
        }
        
        setLeagueTable(newTable);
        
        // Reset week to 1 for new season
        return 1;
      }
      
      return newWeek;
    });

    // Update reputation based on performance
    setCareer((prev) => {
      const clubEntry = leagueTable.find((e) => e.clubId === selectedClub.id);
      if (clubEntry) {
        // Simple reputation change based on position
        const reputationChange = clubEntry.position <= 5 ? 2 : clubEntry.position > 15 ? -2 : 0;
        return {
          ...prev,
          reputation: Math.max(0, Math.min(100, prev.reputation + reputationChange)),
          week: newWeek,
        };
      }
      return prev;
    });
  };

  // Simulate a match
  const simulateMatch = (matchId: number) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    // Random result for demo
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 5);
    
    // Update match result
    const updatedMatches = matches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          homeScore,
          awayScore,
          status: "completed",
        };
      }
      return m;
    });

    // For now, just show alert (we'll update the UI later)
    const clubId = selectedClub?.id;
    const isHome = match.homeClubId === clubId;
    const result = isHome 
      ? homeScore > awayScore 
        ? "Win" 
        : homeScore < awayScore 
          ? "Loss" 
          : "Draw"
      : awayScore > homeScore 
        ? "Win" 
        : awayScore < homeScore 
          ? "Loss" 
          : "Draw";
    
    alert(`Match Result: ${isHome ? `${selectedClub?.name} ${homeScore}` : `${awayScore} ${selectedClub?.name}`} - ${!isHome ? `${selectedClub?.name} ${homeScore}` : `${awayScore} Opponent`} - ${result}`);
  };

  if (!selectedClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No club selected. Please select a club first.</p>
      </main>
    );
  }

  // Find club's position in the table
  const clubEntry = leagueTable.find((e) => e.clubId === selectedClub.id);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Career Mode</h1>

        {/* Career Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h2 className="text-xl font-bold">{selectedClub.name}</h2>
              <p className="text-gray-400">{selectedClub.league}</p>
              <p className="text-sm mt-2">Season: 2026/27</p>
              <p className="text-sm">Week: {week}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Current Position</p>
              <p className="text-4xl font-bold">
                {clubEntry ? clubEntry.position : "N/A"}
              </p>
              <p className="text-sm text-gray-400">
                {clubEntry ? `${clubEntry.points} points` : ""}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Manager Reputation</p>
              <p className="text-4xl font-bold">{career.reputation}</p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${career.reputation}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Expectations */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Board Expectations</h2>
          
          <div className="space-y-4">
            {career.boardExpectations.map((expectation, index) => (
              <div
                key={index}
                className={`bg-gray-700 rounded-lg p-4 ${
                  expectation.progress >= 75 
                    ? "border-l-4 border-green-500" 
                    : expectation.progress >= 50 
                      ? "border-l-4 border-yellow-500" 
                      : "border-l-4 border-red-500"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{expectation.target}</p>
                    <p className="text-sm text-gray-400">
                      Priority: {expectation.priority}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Progress: {expectation.progress}%</p>
                    <div className="w-32 bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          expectation.progress >= 75 
                            ? "bg-green-500" 
                            : expectation.progress >= 50 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                        }`}
                        style={{ width: `${expectation.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Deadline: {expectation.deadline}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* League Table */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{selectedClub.league} Table</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">Pos</th>
                  <th className="text-left p-3">Club</th>
                  <th className="text-left p-3">P</th>
                  <th className="text-left p-3">W</th>
                  <th className="text-left p-3">D</th>
                  <th className="text-left p-3">L</th>
                  <th className="text-left p-3">GF</th>
                  <th className="text-left p-3">GA</th>
                  <th className="text-left p-3">GD</th>
                  <th className="text-left p-3">Pts</th>
                </tr>
              </thead>
              <tbody>
                {leagueTable.map((entry) => {
                  const isSelectedClub = entry.clubId === selectedClub.id;
                  return (
                    <tr
                      key={entry.clubId}
                      className={`border-b border-gray-700 ${
                        isSelectedClub ? "bg-blue-600" : "hover:bg-gray-700"
                      }`}
                    >
                      <td className="p-3">{entry.position}</td>
                      <td className="p-3 font-medium">{entry.clubName}</td>
                      <td className="p-3">{entry.played}</td>
                      <td className="p-3">{entry.won}</td>
                      <td className="p-3">{entry.drawn}</td>
                      <td className="p-3">{entry.lost}</td>
                      <td className="p-3">{entry.goalsFor}</td>
                      <td className="p-3">{entry.goalsAgainst}</td>
                      <td className="p-3">{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</td>
                      <td className="p-3 font-bold">{entry.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Next Matches */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Next Matches</h2>
          
          <div className="space-y-4">
            {matches
              .filter((m) => {
                const isClubInvolved = m.homeClubId === selectedClub.id || m.awayClubId === selectedClub.id;
                const isUpcoming = new Date(m.matchDate) > new Date();
                return isClubInvolved && isUpcoming;
              })
              .slice(0, 5)
              .map((match) => {
                const homeClub = clubs.find((c) => c.id === match.homeClubId);
                const awayClub = clubs.find((c) => c.id === match.awayClubId);
                const isHome = match.homeClubId === selectedClub.id;
                
                return (
                  <div
                    key={match.id}
                    className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-medium">{homeClub?.name}</p>
                        <div
                          className="w-8 h-6 mx-auto mt-1 rounded"
                          style={{ backgroundColor: homeClub?.homeKitColor }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold">VS</p>
                        <p className="text-sm text-gray-400">
                          {new Date(match.matchDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{awayClub?.name}</p>
                        <div
                          className="w-8 h-6 mx-auto mt-1 rounded"
                          style={{ backgroundColor: awayClub?.homeKitColor }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">{match.competition}</p>
                      <button
                        onClick={() => simulateMatch(match.id)}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Simulate
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Career Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={simulateWeek}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Simulate Week
          </button>
          <button
            onClick={() => {
              localStorage.setItem("career", JSON.stringify(career));
              alert("Career progress saved!");
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Save Career
          </button>
        </div>
      </div>
    </main>
  );
}