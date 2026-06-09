"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clubs } from "@/types/club";

export default function ClubSelector() {
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const router = useRouter();

  const handleSelectClub = (clubId: number) => {
    setSelectedClubId(clubId);
    localStorage.setItem("selectedClubId", clubId.toString());
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-offwhite mb-1">Choose Your Club</h2>
        <p className="text-xs text-offwhite-500">Select a club to begin your managerial career</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {clubs.map((club) => {
          const isSelected = selectedClubId === club.id;
          const isHovered = hoveredId === club.id;

          return (
            <button
              key={club.id}
              onClick={() => handleSelectClub(club.id)}
              onMouseEnter={() => setHoveredId(club.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`group relative p-4 rounded-xl transition-all duration-200 text-left overflow-hidden ${
                isSelected
                  ? "ring-2 ring-gold bg-gold/10"
                  : isHovered
                    ? "bg-white/[0.06] ring-1 ring-white/10"
                    : "bg-white/[0.03] ring-1 ring-white/[0.04]"
              }`}
            >
              {/* Club color accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity duration-200"
                style={{
                  backgroundColor: club.homeKitColor,
                  opacity: isHovered || isSelected ? 1 : 0.4,
                }}
              />

              {/* Club badge placeholder */}
              <div
                className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center"
                style={{ backgroundColor: club.homeKitColor + '20' }}
              >
                <div
                  className="w-6 h-6 rounded-md"
                  style={{ backgroundColor: club.homeKitColor }}
                />
              </div>

              {/* Club info */}
              <h3 className="font-semibold text-sm text-offwhite truncate">{club.name}</h3>
              <p className="text-[10px] text-offwhite-500 mt-0.5">{club.league}</p>

              {/* Stats row */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-offwhite-500">REP</span>
                  <span className="text-xs font-bold text-gold">{club.reputation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-offwhite-500">BUD</span>
                  <span className="text-xs font-bold text-green-400">{(club.finances / 1000000).toFixed(0)}M</span>
                </div>
              </div>

              {/* Stadium */}
              <p className="text-[9px] text-offwhite-500 mt-1.5">
                {(club.stadiumCapacity / 1000).toFixed(0)}K capacity
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
