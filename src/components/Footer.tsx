import Link from 'next/link';
import { Dribbble, Target, CircleDot, Snowflake, Shield, Trophy, Gauge, Sword, Disc3, PenLine } from 'lucide-react';

const footerSports = [
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

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white mt-auto border-t border-indigo-900/50 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white mb-3">
              <span className="text-xl font-black">SportSurge</span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              Your ultimate destination for live scores, match schedules, expert analysis, and legal streaming guides for every major sport.
            </p>
          </div>

          {/* Sports */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Sports</h3>
            <ul className="space-y-2">
              {footerSports.map((sport) => (
                <li key={sport.slug}>
                  <Link
                    href={`/${sport.slug}`}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <sport.Icon className="h-3.5 w-3.5" />
                    {sport.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/authors" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  <PenLine className="h-3.5 w-3.5" />
                  Our Writers
                </Link>
              </li>
              <li>
                <span className="text-sm text-white/60 cursor-default">About Us</span>
              </li>
              <li>
                <span className="text-sm text-white/60 cursor-default">Contact</span>
              </li>
              <li>
                <span className="text-sm text-white/60 cursor-default">Careers</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy#cookies" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
                  DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-white/50 bg-white/10 px-4 py-2 rounded-lg">
            <Shield className="h-3.5 w-3.5 text-green-400" />
            <span>
              <strong className="text-white/70">Official Legal Disclaimer:</strong> Sportsurge Official is a 100% legal, editorial sports information platform.
              We do NOT host, stream, or link to any unauthorized or pirated content. All broadcast references point to verified, legal services only (ESPN+, fuboTV, etc.).
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} SportSurge Official. All rights reserved.
            </p>
            <p className="text-xs text-white/40">
              All team names, logos, and trademarks are property of their respective owners. SportSurge Official is not affiliated with any league or team.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
