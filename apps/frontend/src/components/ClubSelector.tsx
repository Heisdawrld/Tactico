"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clubs } from "@/types/club";

export default function ClubSelector() {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const router = useRouter();

  const handleSelectClub = (clubId: number) => {
    setSelectedClubId(clubId);
    // Store selected club in localStorage for now (no auth yet)
    localStorage.setItem("selectedClubId", clubId.toString());
    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Select Your Club</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => handleSelectClub(club.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedClubId === club.id
                ? "border-blue-500 bg-blue-600"
                : "border-gray-600 hover:border-gray-500 hover:bg-gray-700"
            }`}
          >
            <h3 className="font-bold text-lg">{club.name}</h3>
            <p className="text-sm text-gray-400">{club.league}</p>
            <p className="text-sm mt-2">Reputation: {club.reputation}</p>
            <p className="text-sm">Finances: ${club.finances.toLocaleString()}</p>
            <div
              className="w-full h-16 mt-2 rounded"
              style={{ backgroundColor: club.homeKitColor }}
            ></div>
          </button>
        ))}
      </div>
    </div>
  );
}