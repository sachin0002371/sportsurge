import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Calendar, MapPin, Users, Target, TrendingUp, Star, Globe, Clock, ShieldCheck, Ticket, Plane, HelpCircle } from "lucide-react";
import WC2026Countdown from "@/components/WC2026Countdown";
import AdPlacement from "@/components/AdPlacement";

// ISO 3166-1 alpha-2 country codes for flagcdn
const COUNTRY_CODES: Record<string, string> = {
  Argentina: "ar", France: "fr", Brazil: "br", England: "gb-eng", Spain: "es",
  Netherlands: "nl", Germany: "de", Portugal: "pt", Italy: "it", USA: "us",
  Canada: "ca", Mexico: "mx", Japan: "jp", "South Korea": "kr", Australia: "au",
  "Saudi Arabia": "sa", Morocco: "ma", Senegal: "sn", Uruguay: "uy", Colombia: "co",
  Belgium: "be", Croatia: "hr", Switzerland: "ch", Denmark: "dk",
};

function getFlagUrl(country: string): string {
  const code = COUNTRY_CODES[country] || country.toLowerCase().slice(0, 2);
  return `https://flagcdn.com/w80/${code}.png`;
}

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 - Schedule, Host Cities, Bracket & Live Updates",
  description: "Your definitive guide to the FIFA World Cup 2026 in USA, Canada, and Mexico. Explore the 48-team bracket format, 104-match schedule (EST/PST), stadium capacities, ticket prices, and legal live streaming options.",
  keywords: [
    "FIFA World Cup 2026", "World Cup 2026 schedule EST PST", "World Cup 2026 stadium capacity", 
    "FIFA World Cup 2026 host cities travel guide", "World Cup 2026 48 team format bracket", 
    "Where to watch FIFA World Cup 2026 legal streams", "World Cup 2026 ticket prices guide",
    "USA Canada Mexico 2026 World Cup", "FIFA 2026 fixtures", "World Cup 2026 qualifiers"
  ],
  openGraph: {
    title: "FIFA World Cup 2026 Ultimate Guide - Sportsurge Official",
    description: "Definitive coverage of the 2026 FIFA World Cup. 48 teams, 16 host cities, 104 matches, stadium capacities, ticket guides, and real-time tournament countdown.",
    type: "website",
    siteName: "Sportsurge Official",
  },
};

const HOST_CITIES = [
  { city: "New York / New Jersey", country: "USA", stadium: "MetLife Stadium", capacity: "82,500", turf: "Open / Artificial", elevation: "7 ft", matches: "8 Matches (Including Final)", code: "us" },
  { city: "Dallas", country: "USA", stadium: "AT&T Stadium", capacity: "80,000", turf: "Retractable / Artificial", elevation: "600 ft", matches: "9 Matches (Most in Tournament)", code: "us" },
  { city: "Mexico City", country: "Mexico", stadium: "Estadio Azteca", capacity: "87,500", turf: "Open / Natural Grass", elevation: "7,350 ft", matches: "5 Matches (Opening Game)", code: "mx" },
  { city: "Los Angeles", country: "USA", stadium: "SoFi Stadium", capacity: "70,240", turf: "Fixed Roof / Artificial", elevation: "150 ft", matches: "8 Matches (USMNT Opener)", code: "us" },
  { city: "Atlanta", country: "USA", stadium: "Mercedes-Benz Stadium", capacity: "71,000", turf: "Retractable / Artificial", elevation: "1,050 ft", matches: "8 Matches (Semifinal)", code: "us" },
  { city: "Kansas City", country: "USA", stadium: "Arrowhead Stadium", capacity: "76,416", turf: "Open / Natural Grass", elevation: "900 ft", matches: "6 Matches (Quarterfinal)", code: "us" },
  { city: "Houston", country: "USA", stadium: "NRG Stadium", capacity: "72,220", turf: "Retractable / Artificial", elevation: "45 ft", matches: "7 Matches (Round of 16)", code: "us" },
  { city: "San Francisco Bay Area", country: "USA", stadium: "Levi's Stadium", capacity: "68,500", turf: "Open / Natural Grass", elevation: "30 ft", matches: "6 Matches (Round of 32)", code: "us" },
  { city: "Boston", country: "USA", stadium: "Gillette Stadium", capacity: "65,878", turf: "Open / Artificial", elevation: "250 ft", matches: "7 Matches (Quarterfinal)", code: "us" },
  { city: "Philadelphia", country: "USA", stadium: "Lincoln Financial Field", capacity: "69,796", turf: "Open / Natural Grass", elevation: "40 ft", matches: "6 Matches (Round of 16)", code: "us" },
  { city: "Miami", country: "USA", stadium: "Hard Rock Stadium", capacity: "64,767", turf: "Open Roof / Natural Grass", elevation: "10 ft", matches: "7 Matches (Bronze Final)", code: "us" },
  { city: "Seattle", country: "USA", stadium: "Lumen Field", capacity: "69,000", turf: "Open / Artificial", elevation: "30 ft", matches: "6 Matches (USMNT Group Game)", code: "us" },
  { city: "Vancouver", country: "Canada", stadium: "BC Place", capacity: "54,500", turf: "Retractable / Artificial", elevation: "20 ft", matches: "7 Matches (Canada Opener)", code: "ca" },
  { city: "Toronto", country: "Canada", stadium: "BMO Field", capacity: "45,500", turf: "Open / Hybrid Grass", elevation: "250 ft", matches: "6 Matches (Canada Group Game)", code: "ca" },
  { city: "Monterrey", country: "Mexico", stadium: "Estadio BBVA", capacity: "53,500", turf: "Open / Natural Grass", elevation: "1,700 ft", matches: "4 Matches (Group Stage)", code: "mx" },
  { city: "Guadalajara", country: "Mexico", stadium: "Estadio Akron", capacity: "48,000", turf: "Open / Natural Grass", elevation: "5,100 ft", matches: "4 Matches (Group Stage)", code: "mx" },
];

const QUALIFIED_TEAMS = [
  { country: "Argentina", ranking: 1, conf: "CONMEBOL" },
  { country: "France", ranking: 2, conf: "UEFA" },
  { country: "Brazil", ranking: 3, conf: "CONMEBOL" },
  { country: "England", ranking: 4, conf: "UEFA" },
  { country: "Spain", ranking: 5, conf: "UEFA" },
  { country: "Netherlands", ranking: 6, conf: "UEFA" },
  { country: "Germany", ranking: 7, conf: "UEFA" },
  { country: "Portugal", ranking: 8, conf: "UEFA" },
  { country: "Italy", ranking: 9, conf: "UEFA" },
  { country: "USA", ranking: 11, host: true, conf: "CONCACAF" },
  { country: "Mexico", ranking: 15, host: true, conf: "CONCACAF" },
  { country: "Uruguay", ranking: 14, conf: "CONMEBOL" },
  { country: "Colombia", ranking: 12, conf: "CONMEBOL" },
  { country: "Japan", ranking: 17, conf: "AFC" },
  { country: "Senegal", ranking: 18, conf: "CAF" },
  { country: "Morocco", ranking: 13, conf: "CAF" },
  { country: "South Korea", ranking: 22, conf: "AFC" },
  { country: "Australia", ranking: 25, conf: "AFC" },
  { country: "Canada", ranking: 35, host: true, conf: "CONCACAF" },
  { country: "Saudi Arabia", ranking: 56, conf: "AFC" },
];

const CONFEDERATION_SLOTS = [
  { conf: "UEFA (Europe)", slots: "16 Direct Spots", desc: "Up from 13 slots in 2022. 12 group winners + 4 playoff winners." },
  { conf: "CONMEBOL (South America)", slots: "6 Direct + 1 Playoff", desc: "Up from 4.5 slots. 70% of the continent qualifies directly." },
  { conf: "CONCACAF (North/Central America)", slots: "6 Direct + 2 Playoffs", desc: "Includes 3 hosts (USA, Canada, Mexico) + 3 direct qualifiers." },
  { conf: "CAF (Africa)", slots: "9 Direct + 1 Playoff", desc: "Massive increase from 5 slots. 9 group winners advance directly." },
  { conf: "AFC (Asia)", slots: "8 Direct + 1 Playoff", desc: "Doubled from 4.5 slots. 3 rounds of intense qualification." },
  { conf: "OFC (Oceania)", slots: "1 Direct + 1 Playoff", desc: "First time Oceania gets a guaranteed direct group stage berth." },
];

const KEY_DATES = [
  { date: "June 11, 2026", event: "Opening Match (Mexico)", location: "Estadio Azteca, Mexico City", phase: "opening", est: "5:00 PM EST" },
  { date: "June 12, 2026", event: "USMNT & Canada Openers", location: "Los Angeles & Toronto", phase: "group", est: "Various" },
  { date: "June 11-27", event: "Group Stage (72 Matches)", location: "All 16 Venues Across North America", phase: "group", est: "1:00 PM - 10:00 PM EST" },
  { date: "June 28 - July 3", event: "Round of 32 (New Knockout)", location: "14 Host Cities", phase: "round32", est: "1:00 PM / 5:00 PM / 9:00 PM EST" },
  { date: "July 4-7", event: "Round of 16", location: "8 Venues (Houston, Philly, Seattle, etc.)", phase: "round16", est: "1:00 PM / 5:00 PM EST" },
  { date: "July 9-11", event: "Quarterfinals", location: "Boston, LA, Miami, Kansas City", phase: "quarter", est: "3:00 PM / 8:00 PM EST" },
  { date: "July 14-15", event: "Semifinals", location: "Atlanta & Dallas", phase: "semi", est: "8:00 PM EST" },
  { date: "July 18, 2026", event: "Bronze Final (3rd Place)", location: "Hard Rock Stadium, Miami", phase: "third", est: "8:00 PM EST" },
  { date: "July 19, 2026", event: "GRAND FINAL", location: "MetLife Stadium, New York/New Jersey", phase: "final", est: "3:00 PM EST" },
];

const FAQS = [
  { q: "How does the new 48-team World Cup 2026 format work?", a: "The 48 teams will be divided into 12 groups of 4 teams each. Each team plays 3 group matches. The top 2 teams from each group, along with the 8 best third-place teams, will advance to the brand new Round of 32 knockout stage. From there, it is a single-elimination tournament to the final." },
  { q: "What are the ticket prices for FIFA World Cup 2026 and when do they go on sale?", a: "Official ticket sales will begin in late 2025 via FIFA.com/tickets. While exact 2026 prices are pending, Category 4 group stage tickets (residents) are expected to start around $40-$50, Category 1 group tickets around $250, and Final tickets ranging from $600 to $2,500+ depending on seating tier." },
  { q: "Where can I watch the FIFA World Cup 2026 on TV and live stream?", a: "In the United States, FOX and FS1 hold the official English-language broadcast rights, while Telemundo and Peacock hold the Spanish-language rights. In Canada, TSN and CTV will broadcast the games. In Mexico, Televisa and TV Azteca will provide full coverage. Cord-cutters can stream via FuboTV, YouTube TV, Hulu + Live TV, and Peacock." },
  { q: "Will there be travel restrictions or special visas between USA, Canada, and Mexico?", a: "Fans traveling between host nations will need to comply with standard immigration and border customs for each country. FIFA and host governments are currently discussing potential expedited 'Fan ID' visa protocols for ticket holders, similar to past tournaments, but standard passports and ESTA/visas remain required for now." },
  { q: "Why is the World Cup Final in New York/New Jersey instead of Dallas or Los Angeles?", a: "MetLife Stadium in East Rutherford, NJ won the bid for the Grand Final due to its massive 82,500 capacity, optimal Eastern Time Zone broadcasting window for global European/African television audiences, and New York City's unmatched public transit infrastructure and international airport connectivity." },
];

export default function WC2026Page() {
  return (
    <div className="min-h-screen bg-[#EDF1F6]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-amber-500/20 blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-blue-500/20 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-16 pb-12 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
            <Star className="h-3.5 w-3.5 animate-spin" />
            Official Sportsurge Official Tournament Hub
          </div>

          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tight leading-none bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
            FIFA World Cup <span className="text-amber-400">2026</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
            The biggest sporting event in human history. 3 Nations, 16 Host Cities, 48 Teams, and 104 Matches across United States, Canada, and Mexico.
          </p>

          {/* Real-Time Client Countdown Timer */}
          <WC2026Countdown />

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
              <Globe className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">48 Teams</div>
              <div className="text-xs text-white/60 font-medium mt-0.5">Expanded Bracket</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
              <MapPin className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">16 Cities</div>
              <div className="text-xs text-white/60 font-medium mt-0.5">Across North America</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
              <Users className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">104 Matches</div>
              <div className="text-xs text-white/60 font-medium mt-0.5">39 Days of Action</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-center shadow-lg">
              <Trophy className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">July 19, 2026</div>
              <div className="text-xs text-white/60 font-medium mt-0.5">Grand Final (NY/NJ)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header Ad */}
        <AdPlacement type="horizontal" slotId="1991768591" />

        {/* 1. Tournament Schedule & Timeline */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E9EF]">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#222226] flex items-center gap-2.5">
                <Calendar className="h-7 w-7 text-[#374DF5]" />
                World Cup 2026 Schedule & Fixture Timeline
              </h2>
              <p className="text-sm text-[#222226]/60 mt-1">
                Complete roadmap from the opening ceremony to the MetLife Grand Final. Broadcast times listed in US Eastern Time (EST).
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#EDF1F6] px-3.5 py-2 rounded-xl text-xs font-bold text-[#222226]/70">
              <Clock className="h-4 w-4 text-[#374DF5]" />
              EST / PST Timezones
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {KEY_DATES.map((item, idx) => (
              <div key={idx} className="bg-[#EDF1F6] rounded-2xl p-5 border border-[#E5E9EF] hover:bg-white hover:border-[#374DF5] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black px-3 py-1 bg-white text-[#374DF5] rounded-lg shadow-sm border border-[#E5E9EF] group-hover:bg-[#374DF5] group-hover:text-white transition-colors">
                      {item.date}
                    </span>
                    <span className="text-xs font-bold text-[#222226]/50 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.est}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#222226] mb-1 group-hover:text-[#374DF5] transition-colors leading-snug">
                    {item.event}
                  </h3>
                  <p className="text-sm text-[#222226]/60 flex items-center gap-1.5 mt-2">
                    <MapPin className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>{item.location}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs font-semibold text-[#222226]/50">
                  <span>Tournament Phase</span>
                  <span className="uppercase tracking-wider text-[#374DF5]">{item.phase}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Host Cities & Stadium Capacity Guide */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E9EF]">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#222226] flex items-center gap-2.5">
                <MapPin className="h-7 w-7 text-amber-500" />
                Host Cities & Stadium Capacity Guide
              </h2>
              <p className="text-sm text-[#222226]/60 mt-1">
                Detailed breakdown of all 16 world-class venues across USA (11), Mexico (3), and Canada (2).
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#EDF1F6] px-3.5 py-2 rounded-xl text-xs font-bold text-[#222226]/70">
              <Ticket className="h-4 w-4 text-amber-500" />
              104 Total Matches
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOST_CITIES.map((city, idx) => (
              <div key={idx} className="bg-[#EDF1F6] rounded-2xl p-5 border border-[#E5E9EF] hover:bg-white hover:border-amber-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <img src={`https://flagcdn.com/w40/${city.code}.png`} alt={city.country} className="w-8 h-6 object-cover rounded shadow-sm" />
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                      {city.capacity} Seats
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#222226] mb-1">{city.city}</h3>
                  <p className="text-sm font-bold text-[#374DF5] mb-3">{city.stadium}</p>

                  <div className="space-y-1.5 text-xs text-[#222226]/70 border-t border-black/5 pt-3">
                    <div className="flex justify-between">
                      <span className="text-[#222226]/50">Turf & Roof:</span>
                      <span className="font-semibold text-[#222226]">{city.turf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#222226]/50">Elevation:</span>
                      <span className="font-semibold text-[#222226]">{city.elevation}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-black/5 text-center bg-white/60 rounded-xl py-2">
                  <span className="text-xs font-black text-[#2C3EC4]">{city.matches}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. New 48-Team Format & Confederation Slots */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E9EF]">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#222226] flex items-center gap-2.5">
                <TrendingUp className="h-7 w-7 text-purple-600" />
                World Cup 2026 48-Team Format & Playoff Bracket Explained
              </h2>
              <p className="text-sm text-[#222226]/60 mt-1">
                How FIFA expanded the tournament from 32 to 48 teams, including new continental allocation slots.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#EDF1F6] px-3.5 py-2 rounded-xl text-xs font-bold text-[#222226]/70">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              12 Groups of 4 Teams
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {CONFEDERATION_SLOTS.map((conf, idx) => (
              <div key={idx} className="bg-[#EDF1F6] rounded-2xl p-5 border border-[#E5E9EF] hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm">
                <div className="text-xs font-black text-purple-700 bg-purple-100 px-3 py-1 rounded-lg inline-block mb-3">
                  {conf.slots}
                </div>
                <h3 className="text-lg font-black text-[#222226] mb-2">{conf.conf}</h3>
                <p className="text-sm text-[#222226]/70 leading-relaxed">{conf.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl p-6 md:p-8 text-white grid grid-cols-1 md:grid-cols-3 gap-8 items-center shadow-xl">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-2xl font-black text-amber-400">The Brand New Round of 32 Knockout Phase</h3>
              <p className="text-white/80 text-sm leading-relaxed">
                With 48 teams competing in 12 groups of 4, the top two teams from each group automatically advance. To fill out the new Round of 32 knockout bracket, the 8 best third-place teams will also qualify. This ensures that every group stage game remains fiercely competitive until the final whistle.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-4xl font-black text-amber-400 mb-1">72 + 32</div>
              <div className="text-xs font-bold text-white/80 uppercase tracking-widest">Group Games + Knockouts</div>
              <div className="text-xs text-amber-300 mt-2 font-medium">104 Total Matches</div>
            </div>
          </div>
        </section>

        {/* Middle Bumper Ad */}
        <AdPlacement type="horizontal" slotId="4074188210" />

        {/* 4. Qualified Teams Tracker */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E9EF]">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#222226] flex items-center gap-2.5">
                <Users className="h-7 w-7 text-blue-600" />
                Qualified Teams Tracker
              </h2>
              <p className="text-sm text-[#222226]/60 mt-1">
                Real-time tracking of nations that have secured their spot in North America. 🏠 = Host Nation.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#EDF1F6] px-3.5 py-2 rounded-xl text-xs font-bold text-[#222226]/70">
              <Globe className="h-4 w-4 text-blue-600" />
              FIFA World Rankings Included
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {QUALIFIED_TEAMS.map((team, idx) => (
              <div key={idx} className="bg-[#EDF1F6] rounded-2xl p-4 border border-[#E5E9EF] hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center gap-3.5 group shadow-sm">
                <img src={getFlagUrl(team.country)} alt={team.country} className="w-11 h-8 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-[#222226] truncate">{team.country}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#374DF5]">Rank #{team.ranking}</span>
                    {team.host && <span className="text-xs" title="Host Nation">🏠</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Comprehensive FAQ & Travel Guide */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E9EF]">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#222226] flex items-center gap-2.5">
                <HelpCircle className="h-7 w-7 text-amber-500" />
                FIFA World Cup 2026 FAQ, Tickets & Travel Guide
              </h2>
              <p className="text-sm text-[#222226]/60 mt-1">
                Everything you need to know about ticket prices, streaming broadcasts, visas, and tournament logistics.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-[#EDF1F6] px-3.5 py-2 rounded-xl text-xs font-bold text-[#222226]/70">
              <Plane className="h-4 w-4 text-amber-500" />
              USA / Canada / Mexico
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-[#EDF1F6] rounded-2xl p-6 border border-[#E5E9EF] shadow-sm space-y-3 hover:bg-white hover:shadow-md transition-all">
                <h3 className="text-lg font-black text-[#222226] flex items-start gap-2.5 leading-snug">
                  <span className="w-6 h-6 rounded-full bg-[#374DF5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">Q</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-[#222226]/70 leading-relaxed pl-8">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Reference Ad */}
        <AdPlacement type="horizontal" slotId="2921706886" />

        {/* 6. Massive In-Depth SEO Guide */}
        <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E9EF] shadow-sm space-y-6">
          <div className="border-b border-[#E5E9EF] pb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#374DF5] mb-1">In-Depth Reference Guide</h3>
            <h2 className="text-2xl font-black text-[#222226]">Complete Overview of the 2026 FIFA World Cup</h2>
          </div>

          <div className="space-y-6 text-sm text-[#222226]/70 leading-relaxed">
            <div className="space-y-3">
              <h4 className="text-base font-black text-[#222226]">Unprecedented Tri-Nation Hosting</h4>
              <p>
                The 2026 FIFA World Cup represents a monumental shift in international sports administration. For the first time in the 96-year history of the tournament, three sovereign nations—the United States, Canada, and Mexico—will co-host the event. This expansive geographic footprint spans four distinct time zones, covering venues from Vancouver on the Pacific coast to Boston on the Atlantic.
              </p>
              <p>
                Mexico will make history by becoming the first country to host portions of three men&apos;s World Cups (having previously hosted the legendary 1970 and 1986 tournaments). Estadio Azteca in Mexico City will join the elite ranks of stadiums by hosting its third World Cup opening match. Canada will be hosting the men&apos;s tournament for the very first time, building on the success of the 2015 FIFA Women&apos;s World Cup. Meanwhile, the United States marks its second time hosting, exactly 32 years after the historic 1994 tournament, which still holds the all-time total attendance record.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-black text-[#222226]">Broadcasting & Global Time Zone Logistics (EST/PST)</h4>
              <p>
                Given the vast expanse of North America, match kick-off times have been meticulously optimized to balance local stadium attendance with European, African, and Asian television audiences. Matches played in the Pacific Time Zone (PST)—such as Seattle, Vancouver, Los Angeles, and San Francisco—will generally feature earlier afternoon kick-offs for global broadcast parity.
              </p>
              <p>
                The Grand Final at MetLife Stadium in East Rutherford, New Jersey, is scheduled for 3:00 PM Eastern Standard Time (EST) on July 19, 2026. This prime afternoon slot translates perfectly to 8:00 PM British Summer Time (BST) and 9:00 PM Central European Summer Time (CEST), ensuring maximum global viewership. Sportsurge Official provides complete broadcast scheduling guides so you never miss a moment of the action.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-black text-[#222226]">Stadium Infrastructure & Playing Surfaces</h4>
              <p>
                One of the major talking points leading up to the tournament is the conversion of NFL artificial turf stadiums to natural grass. FIFA regulations strictly mandate that all World Cup matches must be played on natural grass surfaces. Major venues like SoFi Stadium in Los Angeles, AT&T Stadium in Dallas, MetLife Stadium in New York/New Jersey, and Mercedes-Benz Stadium in Atlanta are undergoing multi-million dollar agricultural and structural renovations to install state-of-the-art hybrid grass pitches with advanced sub-surface aeration and drainage systems.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-black text-[#222226]">Legal Live Streaming & Cord-Cutting Options</h4>
              <p>
                As sports broadcasting continues to migrate toward digital platforms, the 2026 World Cup will be the most streamed event in history. Fans seeking 4K HDR live streams can utilize FOX Sports app (with participating pay-TV credentials) or subscribe to direct-to-consumer platforms like Peacock for Spanish-language simulcasts. Sportsurge Official is committed to providing fully verified, 100% legal streaming links and cord-cutting guides for every match, ensuring fans avoid deceptive or unauthorized third-party streams.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="rounded-3xl p-8 md:p-12 text-white text-center bg-gradient-to-r from-[#2C3EC4] via-[#374DF5] to-[#4f46e5] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent blur-xl"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <Trophy className="h-16 w-16 mx-auto text-amber-400 drop-shadow-[0_4px_12px_rgba(255,215,0,0.5)] animate-bounce" />
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Your Ultimate 2026 World Cup Companion</h2>
            <p className="text-white/80 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
              Bookmark this page for real-time score updates, live match ribbons, interactive voting polls, and breaking news as the road to North America heats up.
            </p>
            <div className="pt-2">
              <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#374DF5] font-black text-base rounded-xl hover:bg-amber-400 hover:text-slate-950 transition-all duration-300 shadow-xl hover:scale-105">
                Explore Live Match Center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}