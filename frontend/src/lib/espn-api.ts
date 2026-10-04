// ESPN Hidden API helper functions
// Uses http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard

export const ESPN_SPORT_MAPPING: Record<string, { sport: string; league: string | string[] }> = {
  nba: { sport: 'basketball', league: 'nba' },
  nfl: { sport: 'football', league: 'nfl' },
  mlb: { sport: 'baseball', league: 'mlb' },
  nhl: { sport: 'hockey', league: 'nhl' },
  ncaaf: { sport: 'football', league: 'college-football' },
  ncaab: { sport: 'basketball', league: 'mens-college-basketball' },
  cricket: { sport: 'cricket', league: ['8039', '8048'] },
  f1: { sport: 'racing', league: 'f1' },
  mma: { sport: 'mma', league: 'ufc' },
  boxing: { sport: 'boxing', league: 'boxing' },
};

export interface ESPNTeam {
  id: string;
  uid: string;
  abbreviation: string;
  name: string;
  shortDisplayName: string;
  displayName: string;
  color: string;
  alternateColor: string;
  logo?: string;
  logos?: Array<{ href: string; width: number; height: number }>;
  score?: string;
  records?: Array<{ summary: string; type: string }>;
}

export interface ESPNEvent {
  id: string;
  uid: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      name: string;
      state: string; // pre, in, post
      completed: boolean;
    };
    displayClock: string;
    period: number;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      team: ESPNTeam;
      score: string;
      homeAway: 'home' | 'away';
      winner?: boolean;
    }>;
    venue: {
      id: string;
      fullName: string;
      address: {
        city: string;
        state: string;
      };
    };
    broadcasts?: Array<{ names: string[]; market: string }>;
  }>;
  links?: Array<{ href: string; text: string }>;
}

export interface ESPNScoreboardResponse {
  leagues: Array<{
    id: string;
    uid: string;
    name: string;
    abbreviation: string;
    slug: string;
    logos: Array<{ href: string }>;
  }>;
  events: ESPNEvent[];
}

export async function fetchScoreboard(sportSlug: string): Promise<ESPNScoreboardResponse | null> {
  const mapping = ESPN_SPORT_MAPPING[sportSlug];
  if (!mapping) {
    console.warn(`No ESPN mapping for sport: ${sportSlug}`);
    return null;
  }

  const leagues = Array.isArray(mapping.league) ? mapping.league : [mapping.league];
  let combinedData: ESPNScoreboardResponse | null = null;
  const allEvents: ESPNEvent[] = [];

  for (const l of leagues) {
    const url = `http://site.api.espn.com/apis/site/v2/sports/${mapping.sport}/${l}/scoreboard`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SportSurge/1.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      });

      if (response.ok) {
        const data = await response.json() as ESPNScoreboardResponse;
        if (!combinedData) {
          combinedData = data;
        }
        if (data && data.events) {
          allEvents.push(...data.events);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ESPN scoreboard for ${sportSlug} (league ${l}):`, error);
    }
  }

  if (combinedData) {
    combinedData.events = allEvents;
    return combinedData;
  }

  return null;
}

export async function fetchESPNNews(sportSlug: string) {
  const mapping = ESPN_SPORT_MAPPING[sportSlug];
  if (!mapping) return null;

  const leagues = Array.isArray(mapping.league) ? mapping.league : [mapping.league];
  let combinedData: any = null;
  const allArticles: any[] = [];

  for (const l of leagues) {
    const url = `http://site.api.espn.com/apis/site/v2/sports/${mapping.sport}/${l}/news`;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SportSurge/1.0',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (!combinedData) {
          combinedData = data;
        }
        if (data && data.articles) {
          allArticles.push(...data.articles);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ESPN news for ${sportSlug} (league ${l}):`, error);
    }
  }

  if (combinedData) {
    combinedData.articles = allArticles;
    return combinedData;
  }

  return null;
}

export function mapESPNStatus(state: string): string {
  switch (state) {
    case 'in': return 'live';
    case 'pre': return 'upcoming';
    case 'post': return 'finished';
    default: return 'upcoming';
  }
}

export function getTeamLogo(team: ESPNTeam): string | null {
  if (team.logos && team.logos.length > 0) {
    return team.logos[0].href;
  }
  return null;
}

export function getBestLogo(team: ESPNTeam): string | null {
  // 1. Check logos array for the largest logo (sort by width descending)
  if (team.logos && team.logos.length > 0) {
    const sorted = [...team.logos].sort((a, b) => (b.width || 0) - (a.width || 0));
    return sorted[0].href;
  }
  // 2. Fall back to team.logo string
  if (team.logo) {
    return team.logo;
  }
  // 3. No logo available
  return null;
}

export function getLogoWithFallback(team: ESPNTeam): string {
  const bestLogo = getBestLogo(team);
  if (bestLogo) return bestLogo;

  // Generate fallback using ui-avatars.com
  const color = team.color ? team.color.replace('#', '') : '666666';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(team.abbreviation)}&background=${color}&color=fff&size=80&bold=true`;
}
