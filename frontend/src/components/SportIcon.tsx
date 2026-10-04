'use client';

import { Dribbble, Target, CircleDot, Snowflake, Shield, Trophy, Gauge, Sword, Disc3 } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  nba: Dribbble,
  nfl: Target,
  mlb: CircleDot,
  nhl: Snowflake,
  ncaaf: Shield,
  ncaab: Trophy,
  f1: Gauge,
  mma: Sword,
  boxing: Sword,
  cricket: Disc3,
};

interface SportIconProps {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SportIcon({ slug, size = 'md', className = '' }: SportIconProps) {
  const IconComponent = ICON_MAP[slug];

  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  if (IconComponent) {
    return (
      <IconComponent className={`${sizeMap[size]} ${className}`} />
    );
  }

  // Fallback emoji for unknown sports
  const fallbackEmojis: Record<string, string> = {
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

  const emojiSize = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <span className={`${emojiSize[size]} ${className}`} role="img" aria-label={slug}>
      {fallbackEmojis[slug] || '🏆'}
    </span>
  );
}
