"use client";

import { useState, useEffect } from "react";
import { Player } from "@/types/player";
import {
  TrainingSchedule, defaultTrainingSchedule, TrainingCategory, TrainingIntensity,
  trainingFocusAreas, trainingEffects, IndividualTraining, youthPlayers, MentoringPair,
} from "@/types/training";

interface TrainingScheduleProps {
  players: Player[];
  onScheduleChange: (schedule: TrainingSchedule) => void;
  onIndividualTrainingChange: (training: IndividualTraining[]) => void;
  onMentoringChange: (pairs: MentoringPair[]) => void;
}

export default function TrainingScheduleComponent({
  players, onScheduleChange, onIndividualTrainingChange, onMentoringChange,
}: TrainingScheduleProps) {
  const [schedule, setSchedule] = useState<TrainingSchedule>(defaultTrainingSchedule);
  const [individualTraining, setIndividualTraining] = useState<IndividualTraining[]>([]);
  const [mentoringPairs, setMentoringPairs] = useState<MentoringPair[]>([]);

  useEffect(() => {
    if (players.length > 0 && individualTraining.length === 0) {
      const init: IndividualTraining[] = [{ playerId: players[0].id, category: "Technical", focusArea: "Shooting" }];
      setIndividualTraining(init);
      onIndividualTrainingChange(init);
    }
  }, [players, individualTraining.length, onIndividualTrainingChange]);

  const handleScheduleChange = (category: TrainingCategory, intensity: TrainingIntensity) => {
    const newSchedule = { ...schedule, [category]: intensity };
    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
  };

  const addIndividualTraining = () => {
    if (individualTraining.length < 2) {
      const newT: IndividualTraining = { playerId: players[0].id, category: "Technical", focusArea: "Passing" };
      setIndividualTraining([...individualTraining, newT]);
      onIndividualTrainingChange([...individualTraining, newT]);
    }
  };

  const removeIndividualTraining = (index: number) => {
    const newT = individualTraining.filter((_, i) => i !== index);
    setIndividualTraining(newT);
    onIndividualTrainingChange(newT);
  };

  const handleMentoringChange = (youthPlayerId: number, seniorPlayerId: number) => {
    const existing = mentoringPairs.findIndex(p => p.youthPlayerId === youthPlayerId);
    const newPairs = [...mentoringPairs];
    if (existing >= 0) newPairs[existing] = { ...newPairs[existing], seniorPlayerId, progress: 0 };
    else if (mentoringPairs.length < 3) newPairs.push({ youthPlayerId, seniorPlayerId, progress: 0 });
    setMentoringPairs(newPairs);
    onMentoringChange(newPairs);
  };

  const categoryIcons: Record<string, string> = { Physical: "P", Technical: "T", Tactical: "X", Mental: "M" };

  return (
    <div className="game-card p-4">
      {/* Team Training */}
      <div className="mb-6">
        <p className="section-header">Team Training</p>
        <div className="space-y-3">
          {(Object.keys(schedule) as TrainingCategory[]).map((category) => (
            <div key={category} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">{categoryIcons[category]}</span>
                  <span className="text-sm font-medium text-offwhite">{category}</span>
                </div>
                <span className="text-[10px] text-offwhite-500">+{trainingEffects[schedule[category]]}/wk</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => handleScheduleChange(category, intensity as TrainingIntensity)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                      schedule[category] === intensity ? "bg-gold/20 text-gold ring-1 ring-gold/30" : "bg-white/[0.04] text-offwhite-500 hover:bg-white/[0.06]"
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Training */}
      <div className="mb-6">
        <p className="section-header">Individual Focus</p>
        <div className="space-y-2">
          {individualTraining.map((training, index) => (
            <div key={index} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <select value={training.playerId} onChange={(e) => {
                    const newT = [...individualTraining];
                    newT[index] = { ...newT[index], playerId: parseInt(e.target.value) };
                    setIndividualTraining(newT); onIndividualTrainingChange(newT);
                  }} className="w-full p-1.5 rounded bg-charcoal-50 text-offwhite text-[11px] border border-white/[0.06]">
                    {players.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <select value={training.category} onChange={(e) => {
                    const newT = [...individualTraining];
                    newT[index] = { ...newT[index], category: e.target.value as TrainingCategory };
                    setIndividualTraining(newT); onIndividualTrainingChange(newT);
                  }} className="w-full p-1.5 rounded bg-charcoal-50 text-offwhite text-[11px] border border-white/[0.06]">
                    {(Object.keys(trainingFocusAreas) as TrainingCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <select value={training.focusArea} onChange={(e) => {
                    const newT = [...individualTraining];
                    newT[index] = { ...newT[index], focusArea: e.target.value };
                    setIndividualTraining(newT); onIndividualTrainingChange(newT);
                  }} className="flex-1 p-1.5 rounded bg-charcoal-50 text-offwhite text-[11px] border border-white/[0.06]">
                    {trainingFocusAreas[training.category].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button onClick={() => removeIndividualTraining(index)} className="text-red-400 hover:text-red-300 text-xs p-1">x</button>
                </div>
              </div>
            </div>
          ))}
          {individualTraining.length < 2 && (
            <button onClick={addIndividualTraining} className="game-btn-secondary text-[10px]">+ Add Player</button>
          )}
        </div>
      </div>

      {/* Youth Development */}
      <div>
        <p className="section-header">Youth Mentoring</p>
        <div className="space-y-2">
          {youthPlayers.slice(0, 5).map((youth) => {
            const pairedSenior = mentoringPairs.find(p => p.youthPlayerId === youth.id)?.seniorPlayerId;
            return (
              <div key={youth.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-offwhite-300">{youth.firstName} {youth.lastName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-offwhite-500">{youth.position}</span>
                    <span className="text-[9px] text-gold">POT {youth.potentialRating}</span>
                  </div>
                </div>
                <select value={pairedSenior || ""} onChange={(e) => handleMentoringChange(youth.id, parseInt(e.target.value))}
                  className="p-1 rounded bg-charcoal-50 text-offwhite text-[10px] border border-white/[0.06] max-w-[140px]">
                  <option value="">No mentor</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
