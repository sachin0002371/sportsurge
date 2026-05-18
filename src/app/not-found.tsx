import Link from 'next/link';
import { Home, Search, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-[rgba(55,77,245,0.1)] rounded-full flex items-center justify-center mb-6 text-[#374DF5]">
        <Trophy className="h-10 w-10 animate-pulse" />
      </div>
      
      <h1 className="text-6xl font-black tracking-tight text-[#222226] mb-4">
        404
      </h1>
      <h2 className="text-2xl font-bold text-[#222226] mb-3">
        Match or Page Not Found
      </h2>
      <p className="text-base text-[rgba(34,34,38,0.6)] max-w-md mb-8 leading-relaxed">
        We couldn&apos;t find the match or page you were looking for. It may have been moved, deleted, or the URL might be incorrect.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
        <Link href="/" passHref>
          <Button className="w-full sm:w-auto bg-[#374DF5] hover:bg-[#2C3EC4] text-white font-semibold px-6 py-5 rounded-xl gap-2 shadow-lg shadow-[rgba(55,77,245,0.25)]">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Link href="/nba" passHref>
          <Button variant="outline" className="w-full sm:w-auto border-[rgba(229,233,239,0.8)] hover:bg-[rgba(55,77,245,0.05)] text-[#222226] font-semibold px-6 py-5 rounded-xl gap-2">
            <Search className="h-4 w-4 text-[#374DF5]" />
            Browse NBA Matches
          </Button>
        </Link>
      </div>
    </div>
  );
}
