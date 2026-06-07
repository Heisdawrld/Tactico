"use client";

import { useEffect, useState } from "react";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";
import {
  ClubFinances,
  clubFinances,
  Facility,
  clubFacilities,
  facilityBenefits,
  facilityUpgradeCosts,
  facilityMaintenanceCosts,
  calculateWeeklyFinances,
} from "@/types/finance";

export default function FinancesPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [finances, setFinances] = useState<ClubFinances | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [weeklyFinances, setWeeklyFinances] = useState<{ income: number; expenses: number }>(
    { income: 0, expenses: 0 }
  );

  useEffect(() => {
    const clubId = localStorage.getItem("selectedClubId");
    if (clubId) {
      const club = clubs.find((c) => c.id === parseInt(clubId));
      setSelectedClub(club || null);
      if (club) {
        setFinances(clubFinances[club.id] || null);
        setFacilities(clubFacilities[club.id] || []);
        setWeeklyFinances(calculateWeeklyFinances(club.id));
      }
    }
  }, []);

  const handleUpgradeFacility = (facilityId: number) => {
    const newFacilities = facilities.map((f) => {
      if (f.id === facilityId && f.level < 5) {
        return {
          ...f,
          level: f.level + 1,
          upgradeCost: facilityUpgradeCosts[f.type][f.level],
          maintenanceCost: facilityMaintenanceCosts[f.type][f.level + 1],
          benefits: facilityBenefits[f.type][f.level + 1],
        };
      }
      return f;
    });
    setFacilities(newFacilities);
    
    // Update finances (deduct upgrade cost)
    if (finances) {
      const facility = facilities.find((f) => f.id === facilityId);
      if (facility && facility.level < 5) {
        const upgradeCost = facilityUpgradeCosts[facility.type][facility.level];
        setFinances({
          ...finances,
          balance: finances.balance - upgradeCost,
        });
      }
    }
  };

  if (!selectedClub || !finances) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-center">No club selected. Please select a club first.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{selectedClub.name} Finances</h1>

        {/* Financial Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Financial Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Balance */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-green-400">
                ${finances.balance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Available funds for transfers and upgrades
              </p>
            </div>

            {/* Wage Budget */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Wage Budget</p>
              <p className="text-3xl font-bold">
                ${finances.wageBudget.toLocaleString()}
              </p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (finances.wageBudget / finances.balance) * 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Weekly wage budget
              </p>
            </div>

            {/* Transfer Budget */}
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Transfer Budget</p>
              <p className="text-3xl font-bold">
                ${finances.transferBudget.toLocaleString()}
              </p>
              <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (finances.transferBudget / finances.balance) * 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Budget for player transfers
              </p>
            </div>
          </div>

          {/* Weekly Income/Expenses */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Weekly Income</p>
              <p className="text-2xl font-bold text-green-400">
                +${weeklyFinances.income.toLocaleString()}
              </p>
              <ul className="mt-2 text-sm">
                <li>Sponsorships: ${finances.sponsorshipRevenue.toLocaleString()}</li>
                <li>Other Income: ${finances.otherIncome.toLocaleString()}</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Weekly Expenses</p>
              <p className="text-2xl font-bold text-red-400">
                -${weeklyFinances.expenses.toLocaleString()}
              </p>
              <ul className="mt-2 text-sm">
                <li>Wages: ${finances.weeklyExpenses.toLocaleString()}</li>
                <li>
                  Facility Maintenance: ${facilities.reduce((sum, f) => sum + f.maintenanceCost, 0).toLocaleString()}
                </li>
              </ul>
            </div>
          </div>

          {/* Net Weekly */}
          <div className="mt-4 bg-gray-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400 mb-1">Net Weekly</p>
            <p className={`text-2xl font-bold ${weeklyFinances.income >= weeklyFinances.expenses ? "text-green-400" : "text-red-400"}`}>
              {weeklyFinances.income >= weeklyFinances.expenses ? "+" : "-"}
              ${Math.abs(weeklyFinances.income - weeklyFinances.expenses).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {weeklyFinances.income >= weeklyFinances.expenses 
                ? "Profitable" 
                : "Running at a loss"}
            </p>
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Facilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {facilities.map((facility) => {
              const isMaxLevel = facility.level >= 5;
              const upgradeCost = isMaxLevel 
                ? 0 
                : facilityUpgradeCosts[facility.type][facility.level];
              
              return (
                <div
                  key={facility.id}
                  className="bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{facility.type}</h3>
                      <p className="text-sm text-gray-400">
                        Level {facility.level} / 5
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Maintenance: ${facility.maintenanceCost.toLocaleString()}/week
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(facility.level / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <ul className="mt-3 text-sm text-gray-400">
                    {facility.benefits.map((benefit, i) => (
                      <li key={i} className="text-xs">
                        • {benefit}
                      </li>
                    ))}
                  </ul>

                  {/* Upgrade Button */}
                  {!isMaxLevel && (
                    <button
                      onClick={() => handleUpgradeFacility(facility.id)}
                      className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm"
                    >
                      Upgrade to Level {facility.level + 1} (${upgradeCost.toLocaleString()})
                    </button>
                  )}
                  {isMaxLevel && (
                    <p className="mt-4 text-center text-xs text-gray-500">
                      Max Level Reached
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial History (Placeholder) */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Financial History</h2>
          <p className="text-center text-gray-400 py-8">
            Transaction history will appear here after matches and upgrades.
          </p>
        </div>
      </div>
    </main>
  );
}