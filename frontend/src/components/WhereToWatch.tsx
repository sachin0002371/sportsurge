import { getBroadcastInfo } from '@/lib/utils';

interface WhereToWatchProps {
  broadcastInfo: string | null;
  venue?: string | null;
}

const streamingServices = [
  { name: 'ESPN+', icon: '📺', url: 'https://plus.espn.com' },
  { name: 'fuboTV', icon: '📡', url: 'https://www.fubo.tv' },
  { name: 'Sling TV', icon: '📡', url: 'https://www.sling.com' },
  { name: 'Hulu + Live TV', icon: '📱', url: 'https://www.hulu.com' },
  { name: 'YouTube TV', icon: '📺', url: 'https://tv.youtube.com' },
  { name: 'Paramount+', icon: '📺', url: 'https://www.paramountplus.com' },
  { name: 'Peacock', icon: '🦚', url: 'https://www.peacocktv.com' },
];

export default function WhereToWatch({ broadcastInfo, venue }: WhereToWatchProps) {
  const parsed = getBroadcastInfo(broadcastInfo);

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
      <h3 className="text-lg mb-4 flex items-center gap-2" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
        📺 Where to Watch
      </h3>

      {/* Venue */}
      {venue && (
        <div className="mb-4 text-sm" style={{ color: 'rgba(34,34,38,0.6)' }}>
          <span className="font-medium" style={{ color: '#222226' }}>Venue:</span> {venue}
        </div>
      )}

      {/* TV Channels */}
      {parsed?.channels && parsed.channels.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2" style={{ color: '#222226' }}>TV Broadcast</h4>
          <div className="flex flex-wrap gap-2">
            {parsed.channels.map((channel: string) => (
              <span key={channel} className="text-sm px-3 py-1 rounded-full" style={{ border: '1px solid rgba(229,233,239,0.8)', color: '#222226' }}>
                {channel}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Streaming Options */}
      <div>
        <h4 className="text-sm font-semibold mb-2" style={{ color: '#222226' }}>Legal Streaming</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(parsed?.streaming || ['ESPN+', 'fuboTV']).map((service: string) => {
            const match = streamingServices.find(s => s.name === service);
            return (
              <a
                key={service}
                href={match?.url || '#'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center gap-2 p-2.5 rounded-lg border transition-colors text-sm hover:border-[#374DF5] hover:bg-[rgba(55,77,245,0.05)]"
                style={{ borderColor: 'rgba(229,233,239,0.8)' }}
              >
                <span>{match?.icon || '📺'}</span>
                <span className="font-medium" style={{ color: '#222226' }}>{service}</span>
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] mt-4" style={{ color: 'rgba(34,34,38,0.4)' }}>
        * Streaming availability may vary by region. All links are to official, legal streaming services. SportSurge does not host or link to unauthorized streams.
      </p>
    </div>
  );
}
