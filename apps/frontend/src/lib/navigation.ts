import {
  Inbox,
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
  shortcut: string;
  description: string;
  badge?: 'live' | 'new' | 'count';
  badgeValue?: number;
  category?: 'primary' | 'management' | 'match' | 'club' | 'user';
}

/**
 * Football-manager-style navigation.
 * Inbox is the manager's daily command centre; every other screen is a department.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    shortLabel: 'INBOX',
    href: '/inbox',
    icon: Inbox,
    shortcut: 'I',
    description: 'Messages, decisions and matchday actions',
    category: 'primary',
  },
  {
    id: 'dashboard',
    label: 'Home',
    shortLabel: 'HOME',
    href: '/dashboard',
    icon: LayoutDashboard,
    shortcut: 'H',
    description: 'Club overview and key information',
    category: 'primary',
  },
  {
    id: 'squad',
    label: 'Squad',
    shortLabel: 'SQUAD',
    href: '/squad',
    icon: Users,
    shortcut: 'S',
    description: 'Players, selection and squad status',
    category: 'primary',
  },
  {
    id: 'tactics',
    label: 'Tactics',
    shortLabel: 'TACT',
    href: '/tactics',
    icon: ClipboardList,
    shortcut: 'T',
    description: 'Formation, roles and team instructions',
    category: 'management',
  },
  {
    id: 'training',
    label: 'Training',
    shortLabel: 'TRAIN',
    href: '/training',
    icon: Dumbbell,
    shortcut: 'R',
    description: 'Schedule, workload and development',
    category: 'management',
  },
  {
    id: 'matches',
    label: 'Schedule',
    shortLabel: 'FIX',
    href: '/matches',
    icon: Calendar,
    shortcut: 'M',
    description: 'Fixtures, results and match preparation',
    category: 'match',
  },
  {
    id: 'match-simulation',
    label: 'Match Centre',
    shortLabel: 'LIVE',
    href: '/match-simulation',
    icon: PlayCircle,
    shortcut: 'L',
    description: 'Team talks, lineups and live match management',
    badge: 'live',
    category: 'match',
  },
  {
    id: 'transfers',
    label: 'Recruitment',
    shortLabel: 'TRN',
    href: '/transfers',
    icon: ArrowLeftRight,
    shortcut: 'X',
    description: 'Scouting, transfers and negotiations',
    category: 'management',
  },
  {
    id: 'career',
    label: 'Competitions',
    shortLabel: 'COMP',
    href: '/career',
    icon: TrendingUp,
    shortcut: 'C',
    description: 'Tables, objectives and season progress',
    category: 'club',
  },
  {
    id: 'finances',
    label: 'Club Info',
    shortLabel: 'CLUB',
    href: '/finances',
    icon: DollarSign,
    shortcut: 'F',
    description: 'Finances, budgets and facilities',
    category: 'club',
  },
  {
    id: 'press',
    label: 'Media',
    shortLabel: 'MEDIA',
    href: '/press',
    icon: Mic,
    shortcut: 'P',
    description: 'Press conferences and public narrative',
    category: 'club',
  },
  {
    id: 'settings',
    label: 'Preferences',
    shortLabel: 'SET',
    href: '/settings',
    icon: Settings,
    shortcut: ',',
    description: 'Game settings and preferences',
    category: 'user',
  },
];

/** The five fastest mobile destinations, with Inbox always first. */
export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) =>
  ['inbox', 'dashboard', 'squad', 'tactics', 'matches'].includes(item.id)
);

export const SHORTCUT_TO_NAV: Record<string, NavSection> = NAV_ITEMS.reduce(
  (acc, item) => {
    acc[item.shortcut.toLowerCase()] = item.id;
    return acc;
  },
  {} as Record<string, NavSection>
);

export function getNavItemsByCategory(category?: string): NavItem[] {
  if (!category) return NAV_ITEMS;
  return NAV_ITEMS.filter((item) => item.category === category);
}

export function isValidNavPath(path: string): boolean {
  return NAV_ITEMS.some((item) => item.href === path || path.startsWith(item.href + '/'));
}
