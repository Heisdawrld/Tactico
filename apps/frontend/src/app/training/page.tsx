"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import {
  TrainingSchedule, defaultTrainingSchedule, IndividualTraining, MentoringPair,
  TrainingCategory, TrainingIntensity, trainingFocusAreas, trainingEffects, youthPlayers,
} from "@/types/training";
import TrainingScheduleComponent from "@/components/TrainingSchedule";

export default function TrainingPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [schedule, setSchedule] = useState<TrainingSchedule>(defaultTrainingSchedule);
  const [individualTraining, setIndividualTraining] = useState<IndividualTraining[]>([]);
  const [mentoringPairs, setMentoringPairs] = useState<MentoringPair[]>([]);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) setClubPlayers(players.filter((p) => p.clubId === club.id));
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

  const totalIntensity = Object.values(schedule).reduce((sum, i) => sum + i, 0);
  const weeklyImprovement = Math.floor(Object.values(schedule).reduce((sum, i) => sum + (i * 0.5), 0));

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Training Ground</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — Weekly Schedule</p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem("trainingSchedule", JSON.stringify(schedule));
            localStorage.setItem("individualTraining", JSON.stringify(individualTraining));
            localStorage.setItem("mentoringPairs", JSON.stringify(mentoringPairs));
          }}
          className="game-btn text-xs"
        >
          Save Schedule
        </button>
      </div>

      {/* Training Overview Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="game-card p-3">
          <p className="section-header">Load</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-offwhite">{totalIntensity}</span>
            <span className="text-xs text-offwhite-500">/ 20</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 mt-2">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(totalIntensity / 20) * 100}%` }} />
          </div>
        </div>
        <div className="game-card p-3">
          <p className="section-header">Focus</p>
          <span className="text-2xl font-black text-blue-400">{individualTraining.length}</span>
          <span className="text-xs text-offwhite-500"> / 2</span>
        </div>
        <div className="game-card p-3">
          <p className="section-header">Mentoring</p>
          <span className="text-2xl font-black text-purple-400">{mentoringPairs.length}</span>
          <span className="text-xs text-offwhite-500"> / 3</span>
        </div>
        <div className="game-card p-3">
          <p className="section-header">Weekly Gain</p>
          <span className="text-2xl font-black text-green-400">+{weeklyImprovement}%</span>
        </div>
      </div>

      {/* Training Schedule Component */}
      <TrainingScheduleComponent
        players={clubPlayers}
        onScheduleChange={setSchedule}
        onIndividualTrainingChange={setIndividualTraining}
        onMentoringChange={setMentoringPairs}
      />
    </div>
  );
}
