"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";

interface PressQuestion {
  id: number;
  question: string;
  options: { text: string; effects: { morale: number; fanSentiment: number; opponentBoost?: number; description: string } }[];
}

const pressQuestions: PressQuestion[] = [
  {
    id: 1, question: "How do you feel about your team's chances in tomorrow's match?",
    options: [
      { text: "We're fully prepared and will win.", effects: { morale: 5, fanSentiment: 5, description: "Boosts confidence and excitement." } },
      { text: "It will be tough, but we're ready.", effects: { morale: 2, fanSentiment: 3, description: "Balanced, slight boost." } },
      { text: "We're the underdogs, but we'll fight.", effects: { morale: -2, fanSentiment: 1, opponentBoost: 3, description: "Honest, opponent may underestimate you." } },
      { text: "No predictions from me.", effects: { morale: 0, fanSentiment: -2, description: "Neutral, fans want confidence." } },
    ],
  },
  {
    id: 2, question: "What's your strategy for stopping their star player?",
    options: [
      { text: "We have a special plan to mark him out.", effects: { morale: 3, fanSentiment: 4, opponentBoost: 5, description: "Motivates team, opponent cautious." } },
      { text: "Focus on our own game, not individuals.", effects: { morale: 2, fanSentiment: 2, description: "Standard approach." } },
      { text: "No specific plan, we'll see.", effects: { morale: -3, fanSentiment: -3, description: "Lacks preparation." } },
      { text: "Not revealing our tactics.", effects: { morale: 0, fanSentiment: -1, description: "Standard manager response." } },
    ],
  },
  {
    id: 3, question: "How do you respond to criticism of recent performances?",
    options: [
      { text: "The criticism is unfair, we've been playing well.", effects: { morale: 4, fanSentiment: 2, description: "Defends team, boosts morale." } },
      { text: "We accept it and will work harder.", effects: { morale: 1, fanSentiment: 4, description: "Humility wins fans." } },
      { text: "Critics don't understand our challenges.", effects: { morale: 2, fanSentiment: -3, description: "Defensive, may alienate." } },
      { text: "No comment.", effects: { morale: 0, fanSentiment: -2, description: "Fans want engagement." } },
    ],
  },
  {
    id: 4, question: "Will you make changes to the starting lineup?",
    options: [
      { text: "Yes, we have a few surprises.", effects: { morale: 3, fanSentiment: 4, opponentBoost: 2, description: "Creates intrigue." } },
      { text: "Sticking with the same team.", effects: { morale: 2, fanSentiment: 2, description: "Consistency builds morale." } },
      { text: "Still deciding, depends on training.", effects: { morale: 0, fanSentiment: 0, description: "Neutral response." } },
      { text: "Not revealing our lineup.", effects: { morale: 0, fanSentiment: -1, description: "Standard approach." } },
    ],
  },
  {
    id: 5, question: "What's your message to the fans?",
    options: [
      { text: "We'll give everything for the win, for you!", effects: { morale: 5, fanSentiment: 10, description: "Massive boost all around." } },
      { text: "We appreciate your support and will do our best.", effects: { morale: 2, fanSentiment: 5, description: "Positive but less impactful." } },
      { text: "We need your support more than ever.", effects: { morale: 1, fanSentiment: 3, description: "Appeals for support." } },
      { text: "We'll see how it goes.", effects: { morale: -2, fanSentiment: -5, description: "Lacks passion, disappoints." } },
    ],
  },
];

export default function PressPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [fanSentiment, setFanSentiment] = useState(50);
  const [teamMorale, setTeamMorale] = useState(75);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) setSelectedClub(clubs.find(c => c.id === parseInt(clubId)) || null);
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

  const current = pressQuestions[qIndex];
  const selectedOpt = selected[current.id] !== undefined ? current.options[selected[current.id]] : null;

  const handleNext = () => {
    if (selectedOpt) {
      setFanSentiment(prev => Math.max(0, Math.min(100, prev + selectedOpt.effects.fanSentiment)));
      setTeamMorale(prev => Math.max(0, Math.min(100, prev + selectedOpt.effects.morale)));
    }
    if (qIndex < pressQuestions.length - 1) setQIndex(qIndex + 1);
    else setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-offwhite mb-6">Press Conference Complete</h1>
          <div className="game-card p-6 mb-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="section-header">Fan Sentiment</p>
                <span className="text-4xl font-black text-pink-400">{fanSentiment}</span>
                <div className="h-1.5 rounded-full bg-white/5 mt-2">
                  <div className="h-full rounded-full bg-pink-400" style={{ width: `${fanSentiment}%` }} />
                </div>
              </div>
              <div className="text-center">
                <p className="section-header">Team Morale</p>
                <span className="text-4xl font-black text-blue-400">{teamMorale}</span>
                <div className="h-1.5 rounded-full bg-white/5 mt-2">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${teamMorale}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="game-card p-4">
            <p className="section-header">Summary</p>
            <div className="space-y-2">
              {pressQuestions.map(q => {
                const optIdx = selected[q.id];
                if (optIdx === undefined) return null;
                return (
                  <div key={q.id} className="p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-xs font-medium text-offwhite-300">{q.question}</p>
                    <p className="text-[10px] text-offwhite-500 mt-0.5">Your answer: {q.options[optIdx].text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => { setQIndex(0); setSelected({}); setFanSentiment(50); setTeamMorale(75); setDone(false); }} className="game-btn mt-4">New Conference</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-offwhite mb-6">Press Conference</h1>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] text-offwhite-500">Question {qIndex + 1} of {pressQuestions.length}</span>
          <div className="w-32 h-1 rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gold" style={{ width: `${((qIndex + 1) / pressQuestions.length) * 100}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="game-card p-6 mb-4">
          <h2 className="text-base font-semibold text-offwhite mb-4">{current.question}</h2>
          <div className="space-y-2">
            {current.options.map((opt, i) => {
              const isSelected = selected[current.id] === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelected({ ...selected, [current.id]: i })}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${
                    isSelected ? "bg-gold/10 ring-1 ring-gold/30" : "bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.04]"
                  }`}
                >
                  <p className={`text-sm ${isSelected ? 'text-gold' : 'text-offwhite-300'}`}>{opt.text}</p>
                  {isSelected && <p className="text-[10px] text-offwhite-500 mt-1">{opt.effects.description}</p>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Effects */}
        <div className="game-card p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-offwhite-500">Fan Sentiment</span><span className="font-bold text-pink-400">{fanSentiment}</span></div>
              <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-pink-400" style={{ width: `${fanSentiment}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-offwhite-500">Team Morale</span><span className="font-bold text-blue-400">{teamMorale}</span></div>
              <div className="h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-blue-400" style={{ width: `${teamMorale}%` }} /></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={() => qIndex > 0 && setQIndex(qIndex - 1)} disabled={qIndex === 0} className="game-btn-secondary text-xs disabled:opacity-30">Previous</button>
          <button onClick={handleNext} disabled={selected[current.id] === undefined} className="game-btn text-xs disabled:opacity-30">
            {qIndex < pressQuestions.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
