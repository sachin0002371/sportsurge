'use client';

import { Play, Clock, ExternalLink } from 'lucide-react';

interface VideoHighlightsProps {
  homeTeam: string;
  awayTeam: string;
  sport: string;
}

const DURATIONS = ['5:32', '10:15', '3:45', '8:20'];

const GRADIENT_PALETTES = [
  'from-[#2C3EC4] to-[#374DF5]',
  'from-[#CB1818] to-[#E53E3E]',
  'from-[#1D428A] to-[#374DF5]',
  'from-[#007A33] to-[#38A169]',
];

function generateVideoCards(homeTeam: string, awayTeam: string, sport: string) {
  const searchQuery = encodeURIComponent(`${homeTeam} vs ${awayTeam} highlights`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return [
    {
      title: `${homeTeam} vs ${awayTeam} Highlights`,
      duration: DURATIONS[0],
      gradient: GRADIENT_PALETTES[0],
      url: youtubeSearchUrl,
      description: `Watch the best moments from ${homeTeam} vs ${awayTeam}`,
    },
    {
      title: `${homeTeam} vs ${awayTeam} Full Match Recap`,
      duration: DURATIONS[1],
      gradient: GRADIENT_PALETTES[1],
      url: youtubeSearchUrl,
      description: `Complete game recap and analysis`,
    },
    {
      title: `${sport} Top 10 Plays - ${homeTeam} vs ${awayTeam}`,
      duration: DURATIONS[2],
      gradient: GRADIENT_PALETTES[2],
      url: youtubeSearchUrl,
      description: `Top plays from the ${sport} matchup`,
    },
    {
      title: `${homeTeam} vs ${awayTeam} Post-Game Analysis`,
      duration: DURATIONS[3],
      gradient: GRADIENT_PALETTES[3],
      url: youtubeSearchUrl,
      description: `Expert analysis and key takeaways`,
    },
  ];
}

export default function VideoHighlights({ homeTeam, awayTeam, sport }: VideoHighlightsProps) {
  const videos = generateVideoCards(homeTeam, awayTeam, sport);

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'rgba(34,34,38,0.16) 0px 1px 4px' }}>
      <h3 className="text-lg mb-4 flex items-center gap-2" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
        <Play className="h-5 w-5" style={{ color: '#CB1818' }} />
        Video Highlights
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video, idx) => (
          <a
            key={idx}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
            style={{ border: '1px solid rgba(229,233,239,0.8)' }}
          >
            {/* Thumbnail */}
            <div className={`relative bg-gradient-to-br ${video.gradient} aspect-video flex items-center justify-center`}>
              {/* Play button overlay */}
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200">
                <Play className="h-6 w-6 text-white fill-white ml-0.5" />
              </div>

              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </div>

              {/* YouTube indicator */}
              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Play className="h-2.5 w-2.5 fill-white" />
                YT
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-[#374DF5] transition-colors" style={{ color: '#222226' }}>
                {video.title}
              </h4>
              <p className="text-xs mt-1 line-clamp-1" style={{ color: 'rgba(34,34,38,0.5)' }}>
                {video.description}
              </p>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-medium" style={{ color: '#374DF5' }}>
                <ExternalLink className="h-3 w-3" />
                Watch on YouTube
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Standalone featured highlights for homepage
export function FeaturedHighlights() {
  const featuredVideos = [
    {
      title: 'NBA Top 10 Plays of the Week',
      duration: '6:45',
      gradient: GRADIENT_PALETTES[0],
      url: 'https://www.youtube.com/results?search_query=NBA+top+10+plays+of+the+week',
      sport: 'NBA',
    },
    {
      title: 'NFL Week Highlights & Best Moments',
      duration: '12:30',
      gradient: GRADIENT_PALETTES[1],
      url: 'https://www.youtube.com/results?search_query=NFL+week+highlights+best+moments',
      sport: 'NFL',
    },
    {
      title: 'MLB Walk-Off Home Runs Compilation',
      duration: '8:15',
      gradient: GRADIENT_PALETTES[2],
      url: 'https://www.youtube.com/results?search_query=MLB+walk+off+home+runs+compilation',
      sport: 'MLB',
    },
    {
      title: 'NHL Goal of the Year Candidates',
      duration: '4:50',
      gradient: GRADIENT_PALETTES[3],
      url: 'https://www.youtube.com/results?search_query=NHL+goal+of+the+year+candidates',
      sport: 'NHL',
    },
  ];

  return (
    <div>
      <h2 className="text-xl mb-4 flex items-center gap-2" style={{ fontWeight: 700, color: '#222226', letterSpacing: '-0.02em' }}>
        <Play className="h-5 w-5" style={{ color: '#CB1818' }} />
        Featured Highlights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredVideos.map((video, idx) => (
          <a
            key={idx}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
            style={{ border: '1px solid rgba(229,233,239,0.8)' }}
          >
            {/* Thumbnail */}
            <div className={`relative bg-gradient-to-br ${video.gradient} aspect-video flex items-center justify-center`}>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-200">
                <Play className="h-5 w-5 text-white fill-white ml-0.5" />
              </div>

              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </div>

              <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <Play className="h-2.5 w-2.5 fill-white" />
                YT
              </div>
            </div>

            <div className="p-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#374DF5' }}>{video.sport}</span>
              <h4 className="text-sm font-semibold mt-0.5 line-clamp-2 group-hover:text-[#374DF5] transition-colors" style={{ color: '#222226' }}>
                {video.title}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-medium" style={{ color: '#374DF5' }}>
                <ExternalLink className="h-3 w-3" />
                Watch on YouTube
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
