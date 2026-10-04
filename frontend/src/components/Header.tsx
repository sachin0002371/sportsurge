'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Search, Dribbble, Target, CircleDot, Snowflake, Shield, Trophy, Gauge, Sword, Disc3, Home, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const sportNavItems = [
  { slug: 'nba', name: 'NBA', Icon: Dribbble },
  { slug: 'nfl', name: 'NFL', Icon: Target },
  { slug: 'mlb', name: 'MLB', Icon: CircleDot },
  { slug: 'nhl', name: 'NHL', Icon: Snowflake },
  { slug: 'ncaaf', name: 'NCAAF', Icon: Shield },
  { slug: 'ncaab', name: 'NCAAB', Icon: Trophy },
  { slug: 'f1', name: 'F1', Icon: Gauge },
  { slug: 'mma', name: 'MMA', Icon: Sword },
  { slug: 'boxing', name: 'Boxing', Icon: Sword },
  { slug: 'cricket', name: 'Cricket', Icon: Disc3 },
];

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSport, setActiveSport] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50">
      {/* Main nav bar */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white shadow-xl border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white group">
            <img src="/favicon.svg" className="w-7 h-7 drop-shadow-[0_2px_8px_rgba(255,215,0,0.5)] group-hover:scale-110 transition-transform duration-200" alt="SportSurge" />
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">SportSurge</span>
          </Link>

          {/* Center Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            {searchOpen ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  placeholder="Search matches, teams, articles..."
                  className="h-10 w-full bg-white/90 border-0 text-slate-800 placeholder:text-slate-400 text-sm rounded-lg focus:ring-2 focus:ring-white/30"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 h-10"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="h-10 w-full bg-white/15 hover:bg-white/20 rounded-lg flex items-center px-4 gap-2 text-sm text-white/70 transition-colors cursor-text"
              >
                <Search className="h-4 w-4" />
                <span>Search matches, teams...</span>
              </button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* WC2026 Premium Button */}
            <Link
              href="/fifa-wc-2026"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs bg-gradient-to-r from-amber-400 to-amber-600 text-amber-950 hover:from-amber-300 hover:to-amber-500 shadow-md transition-all hover:scale-105"
            >
              <Trophy className="h-3.5 w-3.5" />
              WC2026
            </Link>

            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10 h-9 w-9 p-0"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 h-9 w-9 p-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] border-l border-indigo-900/50">
                  <div className="p-4 border-b border-white/10">
                    <SheetTitle className="text-lg font-bold text-white">Sportsurge Official</SheetTitle>
                  </div>
                  <nav className="flex flex-col gap-1 p-3">
                    <Link href="/" className="px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-amber-400 rounded-lg flex items-center gap-3 transition-colors">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                    {sportNavItems.map((sport) => (
                      <Link
                        key={sport.slug}
                        href={`/${sport.slug}`}
                        className="px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-amber-400 rounded-lg flex items-center gap-3 transition-colors"
                      >
                        <sport.Icon className="h-4 w-4" />
                        {sport.name}
                      </Link>
                    ))}
                    <Link
                      href="/news"
                      className="px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-amber-400 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <PenLine className="h-4 w-4" />
                      News
                    </Link>
                    <Link href="/fifa-wc-2026" className="px-3 py-2.5 text-sm font-medium text-amber-400 hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors">
                      <Trophy className="h-4 w-4" />
                      WC2026
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Sport selector bar - Desktop */}
      <nav className="hidden md:block border-b border-indigo-950/60 bg-[#0f172a] shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            <Link
              href="/"
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${
                !activeSport
                  ? 'text-amber-400 border-amber-400'
                  : 'text-white/70 border-transparent hover:text-amber-300'
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            {sportNavItems.map((sport) => (
              <Link
                key={sport.slug}
                href={`/${sport.slug}`}
                onClick={() => setActiveSport(sport.slug)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${
                  activeSport === sport.slug
                    ? 'text-amber-400 border-amber-400'
                    : 'text-white/70 border-transparent hover:text-amber-300'
                }`}
              >
                <sport.Icon className="h-4 w-4" />
                {sport.name}
              </Link>
            ))}
            <Link
              href="/news"
              onClick={() => setActiveSport('news')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors border-b-2 ${
                activeSport === 'news'
                  ? 'text-amber-400 border-amber-400'
                  : 'text-white/70 border-transparent hover:text-amber-300'
              }`}
            >
              <PenLine className="h-4 w-4" />
              News
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile sport quick bar */}
      <div className="md:hidden bg-[#0f172a] border-b border-indigo-950/60 shadow-md">
        <div className="flex items-center overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {sportNavItems.map((sport) => (
            <Link
              key={sport.slug}
              href={`/${sport.slug}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-amber-400 hover:bg-white/10 rounded-full transition-colors"
            >
              <sport.Icon className="h-3.5 w-3.5" />
              {sport.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="md:hidden bg-white border-b border-[rgba(229,233,239,0.8)] p-3">
          <Input
            placeholder="Search matches, teams..."
            className="h-10 w-full bg-[#EDF1F6] border-0 text-sm rounded-lg"
            autoFocus
            onBlur={() => setSearchOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
