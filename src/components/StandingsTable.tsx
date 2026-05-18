import Link from 'next/link';

interface StandingsTableProps {
  standings: Array<{
    id: string;
    position: number;
    wins: number;
    losses: number;
    draws: number;
    percentage: number | null;
    streak: string | null;
    team: {
      id: string;
      name: string;
      abbreviation: string;
      logo: string | null;
      color: string | null;
      slug: string;
    };
    sport: {
      slug: string;
      name: string;
    };
  }>;
  sportSlug?: string;
  limit?: number;
}

export default function StandingsTable({ standings, sportSlug, limit = 5 }: StandingsTableProps) {
  const displayStandings = limit ? standings.slice(0, limit) : standings;

  if (displayStandings.length === 0) {
    return (
      <div className="text-sm text-center py-4" style={{ color: 'rgba(34,34,38,0.5)' }}>No standings available</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(229,233,239,0.8)' }}>
            <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>#</th>
            <th className="text-left py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>Team</th>
            <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>W</th>
            <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>L</th>
            {displayStandings.some(s => s.draws > 0) && (
              <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>D</th>
            )}
            <th className="text-center py-2 px-2 text-xs font-semibold" style={{ color: 'rgba(34,34,38,0.5)' }}>Streak</th>
          </tr>
        </thead>
        <tbody>
          {displayStandings.map((standing) => (
            <tr key={standing.id} className="transition-colors hover:bg-[rgba(229,233,239,0.3)]" style={{ borderBottom: '1px solid rgba(229,233,239,0.5)' }}>
              <td className="py-2 px-2 font-medium" style={{ color: 'rgba(34,34,38,0.5)' }}>{standing.position}</td>
              <td className="py-2 px-2">
                <Link
                  href={`/${sportSlug || standing.sport.slug}`}
                  className="flex items-center gap-2 hover:text-[#374DF5] transition-colors"
                >
                  {standing.team.logo ? (
                    <img src={standing.team.logo?.includes('/api/logo') ? `${standing.team.logo}&w=48` : standing.team.logo} alt="" className="w-6 h-6 rounded object-contain" />
                  ) : (
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold"
                      style={{ backgroundColor: standing.team.color || '#666' }}
                    >
                      {standing.team.abbreviation.substring(0, 2)}
                    </div>
                  )}
                  <span className="font-medium" style={{ color: '#222226' }}>{standing.team.name}</span>
                </Link>
              </td>
              <td className="py-2 px-2 text-center font-semibold" style={{ color: '#374DF5' }}>{standing.wins}</td>
              <td className="py-2 px-2 text-center font-semibold" style={{ color: '#CB1818' }}>{standing.losses}</td>
              {displayStandings.some(s => s.draws > 0) && (
                <td className="py-2 px-2 text-center" style={{ color: 'rgba(34,34,38,0.5)' }}>{standing.draws}</td>
              )}
              <td className="py-2 px-2 text-center">
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  standing.streak?.startsWith('W') ? '' : ''
                }`} style={{
                  backgroundColor: standing.streak?.startsWith('W') ? 'rgba(55,77,245,0.1)' : 'rgba(203,24,24,0.1)',
                  color: standing.streak?.startsWith('W') ? '#374DF5' : '#CB1818'
                }}>
                  {standing.streak || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
