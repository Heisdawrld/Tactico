"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { players } from "@/types/player";
import { Club } from "@/types/club";
import { Player } from "@/types/player";
import {
  TrainingSchedule,
  defaultTrainingSchedule,
  IndividualTraining,
  MentoringPair,
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
      if (club) {
        const playersInClub = players.filter((p) => p.clubId === club.id);
        setClubPlayers(playersInClub);
      }
    }
  }, []);

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
        <h1 className="text-3xl font-bold mb-6">{selectedClub.name} Training</h1>

        {/* Training Summary */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-4">Training Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Team Training</p>
              <p className="text-2xl font-bold">
                {Object.values(schedule).reduce((sum, intensity) => sum + intensity, 0)} / 20
              </p>
              <p className="text-xs text-gray-500">Total Intensity</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Individual Focus</p>
              <p className="text-2xl font-bold">{individualTraining.length} / 2</p>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Youth Mentoring</p>
              <p className="text-2xl font-bold">{mentoringPairs.length} / 3</p>
              <p className="text-xs text-gray-500">Pairs</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Training Effect</p>
              <p className="text-2xl font-bold text-green-400">+{Math.floor(Object.values(schedule).reduce((sum, intensity) => sum + (intensity * 0.5), 0))}%</p>
              <p className="text-xs text-gray-500">Weekly Improvement</p>
            </div>
          </div>
        </div>

        {/* Training Schedule */}
        <TrainingScheduleComponent
          players={clubPlayers}
          onScheduleChange={setSchedule}
          onIndividualTrainingChange={setIndividualTraining}
          onMentoringChange={setMentoringPairs}
        />

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              localStorage.setItem("trainingSchedule", JSON.stringify(schedule));
              localStorage.setItem("individualTraining", JSON.stringify(individualTraining));
              localStorage.setItem("mentoringPairs", JSON.stringify(mentoringPairs));
              alert("Training schedule saved!");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Save Training Schedule
          </button>
        </div>
      </div>
    </main>
  );
}