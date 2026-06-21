'use client'

export const dynamic = 'force-dynamic';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playRawClick } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { StaggerContainer, StaggerItem, AnimatedCounter } from '@/components/ui/motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatBlock, ProgressBar, Sparkline } from '@/components/ui/Stat';
import { getOfflineClub, getOfflineFinances, getOfflineSquad, OFFLINE_CLUBS } from '@/lib/game-data';
import { Wallet, TrendingUp, TrendingDown, Building2, ArrowUpRight, ArrowDownRight, ChevronUp } from 'lucide-react';

const FACILITIES = [
  { id: 'training', label: 'Training Facilities', icon: <Building2 className="w-4 h-4" />, levelKey: 'trainingFacilities' as const },
  { id: 'youth', label: 'Youth Academy', icon: <Building2 className="w-4 h-4" />, levelKey: 'youthAcademy' as const },
  { id: 'stadium', label: 'Stadium', icon: <Building2 className="w-4 h-4" />, levelKey: 'stadiumCapacity' as const },
  { id: 'medical', label: 'Medical Center', icon: <Building2 className="w-4 h-4" />, levelKey: 'trainingFacilities' as const },
];

export default function FinancesPage() {
  const { club, hydrated } = useSelectedClub();
  const finances = useMemo(() => club ? getOfflineFinances(club.id) : { income: { sponsorships: 0, tickets: 0, tv: 0, merchandise: 0, transfers: 0 }, expenses: { wages: 0, maintenance: 0, transfers: 0, fines: 0 }, weeklyNet: 0 }, [club]);
  const squad = useMemo(() => club ? getOfflineSquad(club.id) : [], [club]);
  const totalWages = squad.reduce((s, p) => s + (p.wage || 0), 0);

  const income = finances.income.sponsorships + finances.income.tickets + finances.income.tv + finances.income.merchandise;
  const expenses = finances.expenses.wages + finances.expenses.maintenance;
  const weeklyNet = income - expenses;


  if (!club) return null;

  return (
    <div className="relative z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-6 pb-12 max-w-5xl mx-auto">
        <StaggerContainer className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6" stagger={0.05}>
          <StaggerItem>
            <div className="section-header !mb-1">Club Finances</div>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold tracking-tight text-primary-c">Finances</h1>
            <p className="text-tertiary-c text-sm mt-1">{club!.name} · Weekly Overview</p>
          </StaggerItem>
          <StaggerItem>
            <Badge variant={weeklyNet >= 0 ? 'success' : 'danger'} size="md">
              {weeklyNet >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {weeklyNet >= 0 ? '+' : ''}{formatCurrency(weeklyNet, 'EUR', true)}/wk
            </Badge>
          </StaggerItem>
        </StaggerContainer>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatBlock
            label="BALANCE"
            value={<AnimatedCounter value={club!.balance} format="currency" />}
            tone="gold"
            icon={<Wallet className="w-3.5 h-3.5" />}
            delta={2}
            deltaSuffix="M"
          />
          <StatBlock
            label="WAGE BUDGET"
            value={<AnimatedCounter value={club!.wageBudget} format="currency" />}
            tone="danger"
            icon={<TrendingDown className="w-3.5 h-3.5" />}
          />
          <StatBlock
            label="TRANSFER BUDGET"
            value={<AnimatedCounter value={club!.transferBudget} format="currency" />}
            tone="success"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <StatBlock
            label="SQUAD VALUE"
            value={<AnimatedCounter value={club!.marketValue} format="currency" />}
            tone="gold"
            icon={<Wallet className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-success" /><CardTitle>Weekly Income</CardTitle></div>
              <Badge variant="success" size="sm">+{formatCurrency(income, 'EUR', true)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <FinanceRow label="Sponsorships" value={finances.income.sponsorships} tone="success" />
              <FinanceRow label="Matchday Tickets" value={finances.income.tickets} tone="success" />
              <FinanceRow label="TV Revenue" value={finances.income.tv} tone="success" />
              <FinanceRow label="Merchandise" value={finances.income.merchandise} tone="success" />
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-tertiary-c uppercase tracking-widest font-mono">TOTAL</span>
                <span className="font-mono font-bold text-success tabular-nums">+{formatCurrency(income, 'EUR', true)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-danger" /><CardTitle>Weekly Expenses</CardTitle></div>
              <Badge variant="danger" size="sm">-{formatCurrency(expenses, 'EUR', true)}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <FinanceRow label="Player Wages" value={finances.expenses.wages} tone="danger" />
              <FinanceRow label="Stadium Maintenance" value={finances.expenses.maintenance} tone="danger" />
              <FinanceRow label="Staff Salaries" value={Math.round(finances.expenses.wages * 0.15)} tone="danger" />
              <FinanceRow label="Youth Academy" value={Math.round(club!.balance * 0.0005)} tone="danger" />
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-tertiary-c uppercase tracking-widest font-mono">TOTAL</span>
                <span className="font-mono font-bold text-danger tabular-nums">-{formatCurrency(expenses, 'EUR', true)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facilities */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gold-300" /><CardTitle>Facilities</CardTitle></div>
            <CardDescription>Upgrade to improve player development & revenue</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FACILITIES.map((f) => {
              const level = f.levelKey === 'stadiumCapacity' ? Math.min(5, Math.floor((club!.stadiumCapacity || 0) / 20000)) : club![f.levelKey as keyof typeof club] as number;
              const upgradeCost = (level || 0) * 25_000_000;
              return (
                <div key={f.id} className="p-3 rounded-md bg-surface-2/50 border border-white/3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gold-300">{f.icon}</span>
                      <span className="text-sm font-medium text-primary-c">{f.label}</span>
                    </div>
                    <Badge variant="gold" size="sm">LVL {level}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={cn('flex-1 h-1.5 rounded-full', i < (level || 0) ? 'bg-gold-300' : 'bg-surface-4')} />
                    ))}
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => playRawClick(0.15)}>
                    <ChevronUp className="w-3 h-3" /> Upgrade · {formatCurrency(upgradeCost, 'EUR', true)}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinanceRow({ label, value, tone }: { label: string; value: number; tone: 'success' | 'danger' }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/3 last:border-0">
      <span className="text-xs text-secondary-c">{label}</span>
      <span className={cn('font-mono font-semibold tabular-nums text-sm', tone === 'success' ? 'text-success' : 'text-danger')}>
        {tone === 'success' ? '+' : '-'}{formatCurrency(value, 'EUR', true)}
      </span>
    </div>
  );
}
