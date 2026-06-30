'use client';


import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, PlayerPosition } from '@/types/player';
import { useAppStore } from '@/lib/store';
import { useSelectedClub } from '@/lib/useSelectedClub';
import { playSfx } from '@/lib/audio';
import { cn, formatCurrency } from '@/lib/utils';
import { getOfflineSquad, OFFLINE_CLUBS, getOfflineClub } from '@/lib/game-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { RatingBadge, ProgressBar, StatBlock } from '@/components/ui/Stat';
import { BackButton } from '@/components/ui/BackButton';
import { PageWrapper } from '@/components/shell/PageWrapper';
import {
  StaggerContainer, StaggerItem, FadeInOnView,
  AnimatedCounter,
} from '@/components/ui/motion';
import { Calendar, DollarSign, Star, Users } from 'lucide-react';

// Position groups for organizing the squad
const POSITION_GROUPS: { id: string; label: string; positions: PlayerPosition[]; color: string }[] = [
  {
    id: 'goalkeepers',
    label: 'Goalkeepers',
    positions: ['GK'],
    color: 'text-emerald-400',
  },
  {
    id: 'defenders',
    label: 'Defenders',
    positions: ['CB', 'RB', 'LB', 'RWB', 'LWB', 'RCB', 'LCB'],
    color: 'text-blue-400',
  },
  {
    id: 'midfielders',
    label: 'Midfielders',
    positions: ['CDM', 'CM', 'CAM', 'RM', 'LM', 'RDM', 'LDM', 'RCM', 'LCM', 'AMC', 'AMR', 'AML'],
    color: 'text-amber-400',
  },
  {
    id: 'forwards',
    label: 'Forwards',
    positions: ['ST', 'CF', 'RW', 'LW', 'SS', 'RS', 'LS', 'FWD', 'F'],
    color: 'text-red-400',
  },
];

// Get position group for a player
function getPositionGroup(player: Player): { label: string; color: string } {
  for (const group of POSITION_GROUPS) {
    if (group.positions.includes(player.position as PlayerPosition)) {
      return { label: group.label, color: group.color };
    }
  }
  return { label: 'Substitutes', color: 'text-gray-400' };
}

// Sort players by position group and then by rating
function sortPlayers(players: Player[]): Player[] {
  const groupOrder = new Map<string, number>();
  POSITION_GROUPS.forEach((group, index) => {
    groupOrder.set(group.id, index);
  });

  return [...players].sort((a, b) => {
    const groupA = getPositionGroup(a).label.toLowerCase();
    const groupB = getPositionGroup(b).label.toLowerCase();
    
    const orderA = groupOrder.get(groupA) ?? 999;
    const orderB = groupOrder.get(groupB) ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Within same group, sort by rating (descending)
    return b.overallRating - a.overallRating;
  });
}

function SquadContent() {
  const { club, hydrated } = useSelectedClub();
  const getSquad = useAppStore((state) => state.getSquad);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'age'>('rating');

  const squad = useMemo(() => {
    if (!club) return [];
    return getSquad(club.id);
  }, [club, getSquad]);

  const sortedSquad = useMemo(() => {
    const sorted = sortPlayers(squad);
    
    // Apply additional sorting
    if (sortBy === 'name') {
      return [...sorted].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }
    if (sortBy === 'age') {
      return [...sorted].sort((a, b) => a.age - b.age);
    }
    return sorted;
  }, [squad, sortBy]);

  // Filter by group
  const filteredSquad = useMemo(() => {
    if (selectedGroup === 'all') return sortedSquad;
    const group = POSITION_GROUPS.find(g => g.id === selectedGroup);
    if (!group) return sortedSquad;
    return sortedSquad.filter(player => group.positions.includes(player.position as PlayerPosition));
  }, [sortedSquad, selectedGroup]);

  // Group players by position
  const groupedPlayers = useMemo(() => {
    const groups: Record<string, Player[]> = {};
    POSITION_GROUPS.forEach(group => {
      groups[group.id] = sortedSquad.filter(player => 
        group.positions.includes(player.position as PlayerPosition)
      );
    });
    return groups;
  }, [sortedSquad]);

  // Stats
  const totalPlayers = squad.length;
  const totalMarketValue = useMemo(() => {
    return squad.reduce((sum, player) => sum + (player.marketValue || 0), 0);
  }, [squad]);
  const averageRating = useMemo(() => {
    if (squad.length === 0) return 0;
    return squad.reduce((sum, player) => sum + (player.overallRating || 0), 0) / squad.length;
  }, [squad]);
  const averageAge = useMemo(() => {
    if (squad.length === 0) return 0;
    return squad.reduce((sum, player) => sum + (player.age || 0), 0) / squad.length;
  }, [squad]);

  if (!hydrated || !club) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Squad Overview</h1>
          <p className="text-muted-foreground text-sm">
            {club.name}  {totalPlayers} players
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackButton to="/dashboard" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          label="Total Players"
          value={totalPlayers}
          icon={<Users className="w-4 h-4" />}
        />
        <StatBlock
          label="Avg Rating"
          value={averageRating.toFixed(1)}
          icon={<Star className="w-4 h-4" />}
        />
        <StatBlock
          label="Avg Age"
          value={averageAge.toFixed(1)}
          icon={<Calendar className="w-4 h-4" />}
        />
        <StatBlock
          label="Squad Value"
          value={formatCurrency(totalMarketValue)}
          icon={<DollarSign className="w-4 h-4" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
            <Button
              variant={selectedGroup === 'all' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup('all')}
            >
              All Players
            </Button>
            {POSITION_GROUPS.map((group) => (
              <Button
                key={group.id}
                variant={selectedGroup === group.id ? 'gold' : 'outline'}
                size="sm"
                onClick={() => setSelectedGroup(group.id)}
              >
                {group.label}
              </Button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
            <Button
              variant={sortBy === 'rating' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              Rating
            </Button>
            <Button
              variant={sortBy === 'name' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              Name
            </Button>
            <Button
              variant={sortBy === 'age' ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setSortBy('age')}
            >
              Age
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Position Groups */}
      <StaggerContainer>
        {POSITION_GROUPS.map((group) => {
          const players = groupedPlayers[group.id] || [];
          if (players.length === 0 && selectedGroup !== 'all') return null;
          
          return (
            <StaggerItem key={group.id}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className={cn('text-lg', group.color)}>
                      {group.label}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {players.length} players
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="space-y-3">
                      {players.map((player) => (
                        <FadeInOnView key={player.id}>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2/50 hover:bg-surface-3 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center font-bold text-sm">
                                {player.overallRating}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {player.fullName || `${player.firstName} ${player.lastName}`}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>{player.position}</span>
                                  <span className="text-quaternary-c"></span>
                                  <span>{player.age} years</span>
                                  <span className="text-quaternary-c"></span>
                                  <span className={cn(player.foot === 'LEFT' ? 'text-blue-400' : player.foot === 'RIGHT' ? 'text-green-400' : 'text-gray-400')}>
                                    {player.foot}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <RatingBadge value={player.potentialAbility || player.overallRating} max={99} size="sm" label="Potential" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {formatCurrency(player.marketValue || 0)}
                              </span>
                            </div>
                          </div>
                        </FadeInOnView>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No {group.label.toLowerCase()} in squad
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {filteredSquad.length === 0 && selectedGroup !== 'all' && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No players found in this category</p>
            <Button onClick={() => setSelectedGroup('all')} className="mt-4">
              Show All Players
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Squad Page - View and manage your team's players
 */
export default function SquadPage() {
  return (
    <PageWrapper requireClub={true} loadingMessage="Loading squad...">
      <SquadContent />
    </PageWrapper>
  );
}
