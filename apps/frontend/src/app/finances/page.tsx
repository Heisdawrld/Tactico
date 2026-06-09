"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clubs } from "@/types/club";
import { Club } from "@/types/club";
import {
  ClubFinances, clubFinances, Facility, clubFacilities,
  facilityBenefits, facilityUpgradeCosts, facilityMaintenanceCosts, calculateWeeklyFinances,
} from "@/types/finance";

export default function FinancesPage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [finances, setFinances] = useState<ClubFinances | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [weeklyFinances, setWeeklyFinances] = useState<{ income: number; expenses: number }>({ income: 0, expenses: 0 });

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

  const handleUpgrade = (facilityId: number) => {
    const newFacilities = facilities.map(f => {
      if (f.id === facilityId && f.level < 5) {
        return { ...f, level: f.level + 1, upgradeCost: facilityUpgradeCosts[f.type][f.level], maintenanceCost: facilityMaintenanceCosts[f.type][f.level + 1], benefits: facilityBenefits[f.type][f.level + 1] };
      }
      return f;
    });
    setFacilities(newFacilities);
    if (finances) {
      const facility = facilities.find(f => f.id === facilityId);
      if (facility && facility.level < 5) {
        setFinances({ ...finances, balance: finances.balance - facilityUpgradeCosts[facility.type][facility.level] });
      }
    }
  };

  if (!selectedClub || !finances) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <p className="text-offwhite-500 text-sm">No club selected.</p>
          <Link href="/start" className="game-btn mt-4 inline-block">Choose Club</Link>
        </div>
      </div>
    );
  }

  const netWeekly = weeklyFinances.income - weeklyFinances.expenses;
  const facilityIcons: Record<string, string> = { "Training": "zap", "Youth": "users", "Medical": "heart", "Stadium": "building" };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-offwhite">Finances</h1>
          <p className="text-xs text-offwhite-500 mt-0.5">{selectedClub.name} — Financial Overview</p>
        </div>
      </div>

      {/* Financial Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="game-card p-4">
          <p className="section-header">Balance</p>
          <span className="text-3xl font-black text-green-400">${finances.balance.toLocaleString()}</span>
          <p className="text-[10px] text-offwhite-500 mt-1">Available funds</p>
        </div>
        <div className="game-card p-4">
          <p className="section-header">Wage Budget</p>
          <span className="text-3xl font-black text-offwhite">${finances.wageBudget.toLocaleString()}</span>
          <div className="h-1.5 rounded-full bg-white/5 mt-2">
            <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, (finances.wageBudget / finances.balance) * 100)}%` }} />
          </div>
        </div>
        <div className="game-card p-4">
          <p className="section-header">Transfer Budget</p>
          <span className="text-3xl font-black text-purple-400">${finances.transferBudget.toLocaleString()}</span>
          <div className="h-1.5 rounded-full bg-white/5 mt-2">
            <div className="h-full rounded-full bg-purple-400" style={{ width: `${Math.min(100, (finances.transferBudget / finances.balance) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Income / Expenses */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="game-card p-4">
          <p className="section-header">Weekly Income</p>
          <span className="text-xl font-bold text-green-400">+${weeklyFinances.income.toLocaleString()}</span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px]"><span className="text-offwhite-500">Sponsors</span><span>${finances.sponsorshipRevenue.toLocaleString()}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-offwhite-500">Other</span><span>${finances.otherIncome.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="game-card p-4">
          <p className="section-header">Weekly Expenses</p>
          <span className="text-xl font-bold text-red-400">-${weeklyFinances.expenses.toLocaleString()}</span>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px]"><span className="text-offwhite-500">Wages</span><span>${finances.weeklyExpenses.toLocaleString()}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-offwhite-500">Maintenance</span><span>${facilities.reduce((s, f) => s + f.maintenanceCost, 0).toLocaleString()}</span></div>
          </div>
        </div>
        <div className="game-card p-4">
          <p className="section-header">Net Weekly</p>
          <span className={`text-xl font-bold ${netWeekly >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netWeekly >= 0 ? '+' : '-'}${Math.abs(netWeekly).toLocaleString()}
          </span>
          <p className="text-[10px] text-offwhite-500 mt-1">{netWeekly >= 0 ? 'Profitable' : 'Running at loss'}</p>
        </div>
      </div>

      {/* Facilities */}
      <div className="game-card p-4">
        <p className="section-header">Facilities</p>
        <div className="grid grid-cols-2 gap-3">
          {facilities.map(facility => {
            const isMax = facility.level >= 5;
            const cost = isMax ? 0 : facilityUpgradeCosts[facility.type][facility.level];
            return (
              <div key={facility.id} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">{facility.type}</h3>
                    <span className="text-[10px] text-offwhite-500">Level {facility.level} / 5</span>
                  </div>
                  <span className="text-[10px] text-offwhite-500">${facility.maintenanceCost.toLocaleString()}/w</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 mb-2">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${(facility.level / 5) * 100}%` }} />
                </div>
                <div className="space-y-0.5 mb-3">
                  {facility.benefits.slice(0, 2).map((b, i) => (
                    <p key={i} className="text-[10px] text-offwhite-500">{b}</p>
                  ))}
                </div>
                {!isMax ? (
                  <button onClick={() => handleUpgrade(facility.id)} className="game-btn-secondary text-[10px] w-full py-1.5">
                    Upgrade (${cost.toLocaleString()})
                  </button>
                ) : (
                  <p className="text-[10px] text-center text-gold font-semibold">MAX LEVEL</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
