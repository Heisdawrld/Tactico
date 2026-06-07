"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/player";
import {
  TrainingSchedule,
  defaultTrainingSchedule,
  TrainingCategory,
  TrainingIntensity,
  trainingFocusAreas,
  trainingEffects,
  IndividualTraining,
  youthPlayers,
  MentoringPair,
} from "@/types/training";

interface TrainingScheduleProps {
  players: Player[];
  onScheduleChange: (schedule: TrainingSchedule) => void;
  onIndividualTrainingChange: (training: IndividualTraining[]) => void;
  onMentoringChange: (pairs: MentoringPair[]) => void;
}

export default function TrainingScheduleComponent({
  players,
  onScheduleChange,
  onIndividualTrainingChange,
  onMentoringChange,
}: TrainingScheduleProps) {
  const [schedule, setSchedule] = useState<TrainingSchedule>(defaultTrainingSchedule);
  const [individualTraining, setIndividualTraining] = useState<IndividualTraining[]>([]);
  const [mentoringPairs, setMentoringPairs] = useState<MentoringPair[]>([]);

  // Initialize individual training (focus on 2 players max)
  useEffect(() => {
    if (players.length > 0 && individualTraining.length === 0) {
      const newIndividualTraining: IndividualTraining[] = [
        {
          playerId: players[0].id,
          category: "Technical",
          focusArea: "Shooting",
        },
      ];
      setIndividualTraining(newIndividualTraining);
      onIndividualTrainingChange(newIndividualTraining);
    }
  }, [players, individualTraining.length, onIndividualTrainingChange]);

  const handleScheduleChange = (category: TrainingCategory, intensity: TrainingIntensity) => {
    const newSchedule = { ...schedule, [category]: intensity };
    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  const handleIndividualTrainingChange = (
    index: number,
    field: keyof IndividualTraining,
    value: string
  ) => {
    const newTraining = [...individualTraining];
    newTraining[index] = { ...newTraining[index], [field]: value };
    setIndividualTraining(newTraining);
    onIndividualTrainingChange(newTraining);
  };

  const addIndividualTraining = () => {
    if (individualTraining.length < 2) {
      const newTraining: IndividualTraining = {
        playerId: players[0].id,
        category: "Technical",
        focusArea: "Passing",
      };
      setIndividualTraining([...individualTraining, newTraining]);
      onIndividualTrainingChange([...individualTraining, newTraining]);
    }
  };

  const removeIndividualTraining = (index: number) => {
    const newTraining = individualTraining.filter((_, i) => i !== index);
    setIndividualTraining(newTraining);
    onIndividualTrainingChange(newTraining);
  };

  const handleMentoringChange = (youthPlayerId: number, seniorPlayerId: number) => {
    const existingPairIndex = mentoringPairs.findIndex(
      (p) => p.youthPlayerId === youthPlayerId
    );
    const newPairs = [...mentoringPairs];
    
    if (existingPairIndex >= 0) {
      newPairs[existingPairIndex] = {
        ...newPairs[existingPairIndex],
        seniorPlayerId,
        progress: 0,
      };
    } else if (mentoringPairs.length < 3) {
      newPairs.push({
        youthPlayerId,
        seniorPlayerId,
        progress: 0,
      });
    }
    
    setMentoringPairs(newPairs);
    onMentoringChange(newPairs);
  };

  const getPlayerById = (id: number) => players.find((p) => p.id === id);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Training Schedule</h2>

      {/* Team Training */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Team Training</h3>
        <p className="text-sm text-gray-400 mb-4">
          Set the intensity for each training category (1 = Very Light, 5 = Very Heavy)
        </p>
        
        <div className="space-y-4">
          {(Object.keys(schedule) as TrainingCategory[]).map((category) => (
            <div key={category}>
              <div className="flex justify-between items-center mb-1">
                <label className="font-medium">{category}</label>
                <span className="text-sm text-gray-400">
                  Focus: {trainingFocusAreas[category].join(", ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => handleScheduleChange(category, intensity as TrainingIntensity)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      schedule[category] === intensity
                        ? "bg-blue-600"
                        : "bg-gray-600 hover:bg-gray-500"
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Effect: +{trainingEffects[schedule[category]]} per week
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Training */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Individual Training</h3>
        <p className="text-sm text-gray-400 mb-4">
          Focus on 1-2 players per week for specialized training
        </p>
        
        <div className="space-y-3">
          {individualTraining.map((training, index) => (
            <div
              key={index}
              className="bg-gray-700 rounded-lg p-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">Player</label>
                  <select
                    value={training.playerId}
                    onChange={(e) =>
                      handleIndividualTrainingChange(
                        index,
                        "playerId",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full p-2 rounded bg-gray-800 text-white"
                  >
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName} ({player.position})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={training.category}
                    onChange={(e) =>
                      handleIndividualTrainingChange(
                        index,
                        "category",
                        e.target.value as TrainingCategory
                      )
                    }
                    className="w-full p-2 rounded bg-gray-800 text-white"
                  >
                    {(Object.keys(trainingFocusAreas) as TrainingCategory[]).map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Focus Area</label>
                  <select
                    value={training.focusArea}
                    onChange={(e) =>
                      handleIndividualTrainingChange(
                        index,
                        "focusArea",
                        e.target.value
                      )
                    }
                    className="w-full p-2 rounded bg-gray-800 text-white"
                  >
                    {trainingFocusAreas[training.category].map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeIndividualTraining(index)}
                className="mt-2 text-red-500 text-sm hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {individualTraining.length < 2 && (
          <button
            onClick={addIndividualTraining}
            className="mt-3 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
          >
            + Add Another Player
          </button>
        )}
      </div>

      {/* Youth Development */}
      <div>
        <h3 className="text-lg font-medium mb-3">Youth Development</h3>
        <p className="text-sm text-gray-400 mb-4">
          Pair youth players with senior players for mentoring
        </p>
        
        <div className="space-y-3">
          {youthPlayers.slice(0, 5).map((youth) => {
            const pairedSenior = mentoringPairs.find(
              (p) => p.youthPlayerId === youth.id
            )?.seniorPlayerId;
            
            return (
              <div
                key={youth.id}
                className="bg-gray-700 rounded-lg p-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {youth.firstName} {youth.lastName} ({youth.position})
                    </p>
                    <p className="text-sm text-gray-400">
                      Potential: {youth.potentialRating} | Current: {youth.currentRating}
                    </p>
                    <p className="text-xs text-gray-500">
                      Traits: {youth.traits.join(", ")}
                    </p>
                  </div>
                  <div>
                    <select
                      value={pairedSenior || ""}
                      onChange={(e) =>
                        handleMentoringChange(
                          youth.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="p-2 rounded bg-gray-800 text-white"
                    >
                      <option value="">-- No Mentor --</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {pairedSenior && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${mentoringPairs.find(
                            (p) => p.youthPlayerId === youth.id
                          )?.progress || 0}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Mentoring Progress: {mentoringPairs.find(
                        (p) => p.youthPlayerId === youth.id
                      )?.progress || 0}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}