import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

export function formatTime(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return '';
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function timeAgo(date: Date | string | null): string {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getVotePercentages(homeVotes: number, awayVotes: number): { home: number; away: number } {
  const total = homeVotes + awayVotes;
  if (total === 0) return { home: 50, away: 50 };
  return {
    home: Math.round((homeVotes / total) * 100),
    away: Math.round((awayVotes / total) * 100),
  };
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'live': return 'text-[#CB1818] bg-[rgba(203,24,24,0.1)]';
    case 'upcoming': return 'text-[#374DF5] bg-[rgba(55,77,245,0.1)]';
    case 'finished': return 'text-[rgba(34,34,38,0.5)] bg-[rgba(229,233,239,0.5)]';
    case 'postponed': return 'text-amber-700 bg-amber-50';
    default: return 'text-[rgba(34,34,38,0.5)] bg-[rgba(229,233,239,0.5)]';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'live': return 'LIVE';
    case 'upcoming': return 'UPCOMING';
    case 'finished': return 'FINISHED';
    case 'postponed': return 'POSTPONED';
    default: return status.toUpperCase();
  }
}

// Sport icon names mapped to Lucide icon component names
export const SPORT_ICON_NAMES: Record<string, string> = {
  nba: 'Dribbble',
  nfl: 'Target',
  mlb: 'CircleDot',
  nhl: 'Snowflake',
  ncaaf: 'Shield',
  ncaab: 'Trophy',
  f1: 'Gauge',
  mma: 'Sword',
  boxing: 'Sword',
  cricket: 'Disc3',
};

// Keep emoji fallback for server-side usage where Lucide can't render
export const SPORT_ICONS: Record<string, string> = {
  nba: '🏀',
  nfl: '🏈',
  mlb: '⚾',
  nhl: '🏒',
  ncaaf: '🏈',
  ncaab: '🏀',
  f1: '🏎️',
  mma: '🥊',
  boxing: '🥊',
  cricket: '🏏',
};

export const SPORT_COLORS: Record<string, string> = {
  nba: '#2C3EC4',
  nfl: '#2C3EC4',
  mlb: '#2C3EC4',
  nhl: '#2C3EC4',
  ncaaf: '#2C3EC4',
  ncaab: '#2C3EC4',
  f1: '#2C3EC4',
  mma: '#2C3EC4',
  boxing: '#2C3EC4',
  cricket: '#2C3EC4',
};

export function getBroadcastInfo(broadcastInfo: string | null): { channels: string[]; streaming: string[] } | null {
  if (!broadcastInfo) return null;
  try {
    return JSON.parse(broadcastInfo);
  } catch {
    return null;
  }
}
