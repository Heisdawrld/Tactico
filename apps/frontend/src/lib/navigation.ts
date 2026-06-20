import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Dumbbell,
  Calendar,
  PlayCircle,
  TrendingUp,
  DollarSign,
  Mic,
  ArrowLeftRight,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { NavSection } from '@/lib/store';

export interface NavItem {
  id: NavSection;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  shortcut: string;       // keyboard shortcut
  description: string;
  badge?: 'live' | 'new' | 'count';
  badgeValue?: number;
}

/**
 * Primary navigation items for the Hybrid Command Center.
 * Order = order shown in the left rail.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'HOME',
    href: '/dashboard',
    icon: LayoutDashboard,
    shortcut: 'H',
    description: 'Club overview & key stats',
  },
  {
    id: 'squad',
    label: 'Squad',
    shortLabel: 'SQUAD',
    href: '/squad',
    icon: Users,
    shortcut: 'S',
    description: 'Player roster & attributes',
  },
  {
    id: 'tactics',
    label: 'Tactics',
    shortLabel: 'TACT',
    href: '/tactics',
    icon: ClipboardList,
    shortcut: 'T',
    description: 'Formation & team instructions',
  },
  {
    id: 'training',
    label: 'Training',
    shortLabel: 'TRAIN',
    href: '/training',
    icon: Dumbbell,
    shortcut: 'R',
    description: 'Weekly schedule & development',
  },
  {
    id: 'matches',
    label: 'Matches',
    shortLabel: 'FIX',
    href: '/matches',
    icon: Calendar,
    shortcut: 'M',
    description: 'Fixtures & results',
  },
  {
    id: 'match-simulation',
    label: 'Match Day',
    shortLabel: 'LIVE',
    href: '/match-simulation',
    icon: PlayCircle,
    shortcut: 'L',
    description: 'Live 2D match simulation',
    badge: 'live',
  },
  {
    id: 'transfers',
    label: 'Transfers',
    shortLabel: 'TRN',
    href: '/transfers',
    icon: ArrowLeftRight,
    shortcut: 'X',
    description: 'Transfer market & negotiations',
    badge: 'new',
  },
  {
    id: 'career',
    label: 'Career',
    shortLabel: 'CAR',
    href: '/career',
    icon: TrendingUp,
    shortcut: 'C',
    description: 'League table & board objectives',
  },
  {
    id: 'finances',
    label: 'Finances',
    shortLabel: 'FIN',
    href: '/finances',
    icon: DollarSign,
    shortcut: 'F',
    description: 'Budgets, wages & facilities',
  },
  {
    id: 'press',
    label: 'Press',
    shortLabel: 'PRESS',
    href: '/press',
    icon: Mic,
    shortcut: 'P',
    description: 'Press conferences & media',
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'SET',
    href: '/settings',
    icon: Settings,
    shortcut: ',',
    description: 'Game settings & preferences',
  },
];

/**
 * Mobile bottom-tab items (subset — most-used only).
 */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) =>
  ['dashboard', 'squad', 'tactics', 'matches', 'match-simulation'].includes(item.id)
);

/**
 * Map keyboard shortcuts to nav sections.
 */
export const SHORTCUT_TO_NAV: Record<string, NavSection> = NAV_ITEMS.reduce(
  (acc, item) => {
    acc[item.shortcut.toLowerCase()] = item.id;
    return acc;
  },
  {} as Record<string, NavSection>
);
