"use client";

import { useState, useEffect } from "react";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";
import { matches } from "@/types/match";

// Press conference questions
export interface PressQuestion {
  id: number;
  question: string;
  options: PressOption[];
}

export interface PressOption {
  text: string;
  effects: {
    morale: number; // -10 to +10
    fanSentiment: number; // -10 to +10
    opponentBoost?: number; // Optional: affects opponent's morale
    description: string;
  };
}

// Static press conference questions
const pressQuestions: PressQuestion[] = [
  {
    id: 1,
    question: "How do you feel about your team's chances in tomorrow's match?",
    options: [
      {
        text: "We're fully prepared and will win.",
        effects: {
          morale: +5,
          fanSentiment: +5,
          description: "Boosts team confidence and fan excitement.",
        },
      },
      {
        text: "It will be a tough match, but we're ready.",
        effects: {
          morale: +2,
          fanSentiment: +3,
          description: "Balanced response, slight boost to morale.",
        },
      },
      {
        text: "We're the underdogs, but we'll give it our all.",
        effects: {
          morale: -2,
          fanSentiment: +1,
          opponentBoost: +3,
          description: "Opponent may underestimate you, but fans appreciate honesty.",
        },
      },
      {
        text: "I'm not going to make any predictions.",
        effects: {
          morale: 0,
          fanSentiment: -2,
          description: "Neutral for morale, but fans prefer confidence.",
        },
      },
    ],
  },
  {
    id: 2,
    question: "What's your strategy for stopping their star player?",
    options: [
      {
        text: "We have a special plan to mark him out of the game.",
        effects: {
          morale: +3,
          fanSentiment: +4,
          opponentBoost: +5,
          description: "Opponent will be extra cautious, but your team is motivated.",
        },
      },
      {
        text: "We'll focus on our own game and not worry about individuals.",
        effects: {
          morale: +2,
          fanSentiment: +2,
          description: "Standard approach, no major effects.",
        },
      },
      {
        text: "We don't have a specific plan, we'll see how it goes.",
        effects: {
          morale: -3,
          fanSentiment: -3,
          description: "Lacks preparation, hurts confidence.",
        },
      },
      {
        text: "I'm not going to reveal our tactics.",
        effects: {
          morale: 0,
          fanSentiment: -1,
          description: "Neutral for morale, but fans want insight.",
        },
      },
    ],
  },
  {
    id: 3,
    question: "How do you respond to criticism of your recent performances?",
    options: [
      {
        text: "The criticism is unfair, we've been playing well.",
        effects: {
          morale: +4,
          fanSentiment: +2,
          description: "Defends the team, boosts morale.",
        },
      },
      {
        text: "We accept the criticism and will work harder.",
        effects: {
          morale: +1,
          fanSentiment: +4,
          description: "Shows humility, fans appreciate it.",
        },
      },
      {
        text: "The critics don't understand the challenges we're facing.",
        effects: {
          morale: +2,
          fanSentiment: -3,
          description: "Defensive, may alienate fans.",
        },
      },
      {
        text: "No comment.",
        effects: {
          morale: 0,
          fanSentiment: -2,
          description: "Neutral for morale, but fans want engagement.",
        },
      },
    ],
  },
  {
    id: 4,
    question: "Will you be making any changes to the starting lineup?",
    options: [
      {
        text: "Yes, we have a few surprises in store.",
        effects: {
          morale: +3,
          fanSentiment: +4,
          opponentBoost: +2,
          description: "Creates intrigue, but opponent may prepare for changes.",
        },
      },
      {
        text: "We're sticking with the same team that's been performing well.",
        effects: {
          morale: +2,
          fanSentiment: +2,
          description: "Consistency is good for morale.",
        },
      },
      {
        text: "We're still deciding, we'll see how training goes.",
        effects: {
          morale: 0,
          fanSentiment: 0,
          description: "Neutral response, no major effects.",
        },
      },
      {
        text: "I'm not going to reveal our lineup.",
        effects: {
          morale: 0,
          fanSentiment: -1,
          description: "Standard manager response.",
        },
      },
    ],
  },
  {
    id: 5,
    question: "What's your message to the fans ahead of this important match?",
    options: [
      {
        text: "We'll give everything for the win, for you!",
        effects: {
          morale: +5,
          fanSentiment: +10,
          description: "Massive boost to fan sentiment and team morale.",
        },
      },
      {
        text: "We appreciate your support and will do our best.",
        effects: {
          morale: +2,
          fanSentiment: +5,
          description: "Positive but less impactful.",
        },
      },
      {
        text: "We need your support more than ever.",
        effects: {
          morale: +1,
          fanSentiment: +3,
          description: "Appeals for support, modest boost.",
        },
      },
      {
        text: "We'll see how it goes.",
        effects: {
          morale: -2,
          fanSentiment: -5,
          description: "Lacks passion, disappoints fans.",
        },
      },
    ],
  },
];

// Fan sentiment levels
const fanSentimentLevels = [
  { value: -100, label: "Furious" },
  { value: -75, label: "Outraged" },
  { value: -50, label: "Angry" },
  { value: -25, label: "Disappointed" },
  { value: 0, label: "Neutral" },
  { value: 25, label: "Content" },
  { value: 50, label: "Happy" },
  { value: 75, label: "Excited" },
  { value: 100, label: "Ecstatic" },
];

export default function PressPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [fanSentiment, setFanSentiment] = useState(50);
  const [teamMorale, setTeamMorale] = useState(75);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
    }
  }, []);

  const handleOptionSelect = (questionId: number, optionIndex: number) => {
    setSelectedOptions({ ...selectedOptions, [questionId]: optionIndex });
  };

  const getCurrentQuestion = () => {
    return pressQuestions[currentQuestionIndex];
  };

  const getSelectedOption = () => {
    const question = getCurrentQuestion();
    const optionIndex = selectedOptions[question.id];
    return optionIndex !== undefined ? question.options[optionIndex] : null;
  };

  const handleNextQuestion = () => {
    const question = getCurrentQuestion();
    const optionIndex = selectedOptions[question.id];
    
    if (optionIndex !== undefined) {
      const option = question.options[optionIndex];
      
      // Apply effects
      setFanSentiment((prev) => {
        const newSentiment = Math.max(0, Math.min(100, prev + option.effects.fanSentiment));
        return newSentiment;
      });
      
      setTeamMorale((prev) => {
        const newMorale = Math.max(0, Math.min(100, prev + option.effects.morale));
        return newMorale;
      });
    }

    if (currentQuestionIndex < pressQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getFanSentimentLabel = () => {
    for (const level of fanSentimentLevels) {
      if (fanSentiment >= level.value) {
        return level.label;
      }
    }
    return "Unknown";
  };

  const getMoraleLabel = () => {
    if (teamMorale >= 80) return "Excellent";
    if (teamMorale >= 60) return "Good";
    if (teamMorale >= 40) return "Average";
    if (teamMorale >= 20) return "Poor";
    return "Terrible";
  };

  const resetPressConference = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions({});
    setFanSentiment(50);
    setTeamMorale(75);
    setIsCompleted(false);
  };

  if (!selectedClub) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No club selected. Please select a club first.</p>
      </main>
    );
  }

  if (isCompleted) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Press Conference Complete</h1>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Fan Sentiment</p>
                <p className="text-4xl font-bold">{fanSentiment}</p>
                <p className="text-lg">{getFanSentimentLabel()}</p>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${fanSentiment}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Team Morale</p>
                <p className="text-4xl font-bold">{teamMorale}</p>
                <p className="text-lg">{getMoraleLabel()}</p>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${teamMorale}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <p className="mb-4">
              Your answers have affected the team and fans. These effects will carry over to your next match.
            </p>
            
            <div className="space-y-2">
              {pressQuestions.map((question, index) => {
                const optionIndex = selectedOptions[question.id];
                if (optionIndex !== undefined) {
                  const option = question.options[optionIndex];
                  return (
                    <div
                      key={question.id}
                      className="bg-gray-700 rounded-lg p-3"
                    >
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-gray-400">
                        Your answer: {option.text}
                      </p>
                      <p className="text-xs text-gray-500">
                        {option.effects.description}
                      </p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                // Save results to localStorage
                localStorage.setItem("fanSentiment", fanSentiment.toString());
                localStorage.setItem("teamMorale", teamMorale.toString());
                alert("Press conference results saved! Effects will apply to your next match.");
                resetPressConference();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
            >
              Confirm and Save
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const selectedOption = getSelectedOption();

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Press Conference</h1>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Question {currentQuestionIndex + 1} of {pressQuestions.length}
            </p>
            <div className="w-64 bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${((currentQuestionIndex + 1) / pressQuestions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{currentQuestion.question}</h2>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptions[currentQuestion.id] === index;
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(currentQuestion.id, index)}
                  className={`w-full text-left p-4 rounded-lg border-2 ${
                    isSelected
                      ? "border-blue-500 bg-blue-600"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <p className="font-medium">{option.text}</p>
                  {isSelected && selectedOption && (
                    <p className="text-xs text-gray-300 mt-1">
                      {selectedOption.effects.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Effects Preview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Current Effects Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm">Fan Sentiment</p>
                <p className="font-bold">{fanSentiment}</p>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full"
                  style={{ width: `${fanSentiment}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getFanSentimentLabel()}
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm">Team Morale</p>
                <p className="font-bold">{teamMorale}</p>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${teamMorale}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getMoraleLabel()}
              </p>
            </div>
          </div>
          
          {selectedOption && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Morale:</span> 
                {selectedOption.effects.morale > 0 ? "+" : ""}
                {selectedOption.effects.morale}
              </p>
              <p className="text-sm">
                <span className="font-medium">Fan Sentiment:</span> 
                {selectedOption.effects.fanSentiment > 0 ? "+" : ""}
                {selectedOption.effects.fanSentiment}
              </p>
              {selectedOption.effects.opponentBoost && (
                <p className="text-sm">
                  <span className="font-medium">Opponent Boost:</span> 
                  {selectedOption.effects.opponentBoost > 0 ? "+" : ""}
                  {selectedOption.effects.opponentBoost}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
          >
            Previous
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={selectedOptions[currentQuestion.id] === undefined}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold"
          >
            {currentQuestionIndex < pressQuestions.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </main>
  );
}