import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sports = [
  { slug: 'nba', name: 'NBA', icon: '🏀', color: '#C9082A', isActive: true, sortOrder: 1 },
  { slug: 'nfl', name: 'NFL', icon: '🏈', color: '#013369', isActive: true, sortOrder: 2 },
  { slug: 'mlb', name: 'MLB', icon: '⚾', color: '#041E42', isActive: true, sortOrder: 3 },
  { slug: 'nhl', name: 'NHL', icon: '🏒', color: '#000000', isActive: true, sortOrder: 4 },
  { slug: 'ncaaf', name: 'NCAAF', icon: '🏈', color: '#003B5C', isActive: true, sortOrder: 5 },
  { slug: 'ncaab', name: 'NCAAB', icon: '🏀', color: '#C8102E', isActive: true, sortOrder: 6 },
  { slug: 'f1', name: 'Formula 1', icon: '🏎️', color: '#E10600', isActive: true, sortOrder: 7 },
  { slug: 'mma', name: 'MMA', icon: '🥊', color: '#D20A0A', isActive: true, sortOrder: 8 },
  { slug: 'boxing', name: 'Boxing', icon: '🥊', color: '#8B0000', isActive: true, sortOrder: 9 },
  { slug: 'cricket', name: 'Cricket', icon: '🏏', color: '#004B23', isActive: true, sortOrder: 10 },
];

const authors = [
  {
    name: 'Marcus Johnson',
    slug: 'marcus-johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    title: 'Senior NBA Analyst',
    bio: 'Marcus brings over 15 years of experience covering the NBA, from courtside at Madison Square Garden to the finals in LA. Known for his deep statistical analysis and insider connections.',
    specialty: 'NBA',
    socialTwitter: '@marcusjohnson_nba',
    socialLinkedIn: 'linkedin.com/in/marcusjohnson',
  },
  {
    name: 'Sarah Mitchell',
    slug: 'sarah-mitchell',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    title: 'NFL & College Football Expert',
    bio: 'Sarah has been breaking down NFL and NCAAF games for over a decade. A former collegiate player herself, she brings unique perspective from the field to the press box.',
    specialty: 'NFL',
    socialTwitter: '@sarahmitchell_nfl',
    socialLinkedIn: 'linkedin.com/in/sarahmitchell',
  },
  {
    name: 'David Chen',
    slug: 'david-chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    title: 'MLB & NHL Correspondent',
    bio: 'David covers America\'s pastime and the fastest game on ice. His data-driven approach to baseball analytics and hockey analytics has made him a trusted voice in both sports.',
    specialty: 'MLB',
    socialTwitter: '@davidchen_sports',
    socialLinkedIn: 'linkedin.com/in/davidchen',
  },
  {
    name: 'Emily Rodriguez',
    slug: 'emily-rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    title: 'F1 & Motorsport Specialist',
    bio: 'Emily has covered Formula 1 from every circuit on the calendar. Born in São Paulo and raised near Interlagos, racing is in her blood. She provides unparalleled insight into the world of motorsport.',
    specialty: 'F1',
    socialTwitter: '@emilyrodriguez_f1',
    socialLinkedIn: 'linkedin.com/in/emilyrodriguez',
  },
  {
    name: 'James O\'Brien',
    slug: 'james-obrien',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    title: 'MMA & Boxing Analyst',
    bio: 'James is a third-degree black belt and former amateur boxer who transitioned to sports journalism. His technical breakdowns of fights are must-reads for combat sports fans worldwide.',
    specialty: 'MMA',
    socialTwitter: '@jamesobrien_mma',
    socialLinkedIn: 'linkedin.com/in/jamesobrien',
  },
  {
    name: 'Priya Sharma',
    slug: 'priya-sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    title: 'Cricket & International Sports Writer',
    bio: 'Priya grew up watching cricket in Mumbai and now covers the sport globally. From Test matches to T20 leagues, she brings passion and expertise to every match report and analysis piece.',
    specialty: 'Cricket',
    socialTwitter: '@priyasharma_cr',
    socialLinkedIn: 'linkedin.com/in/priyasharma',
  },
  {
    name: 'Alex Thompson',
    slug: 'alex-thompson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    title: 'Multi-Sport Featured Columnist',
    bio: 'Alex is the ultimate utility player, covering everything from March Madness to the World Series. With 20 years in sports media, Alex brings a broad perspective and sharp writing to every story.',
    specialty: 'Multi-sport',
    socialTwitter: '@alexthompson_sports',
    socialLinkedIn: 'linkedin.com/in/alexthompson',
  },
];

const teamsBySport: Record<string, Array<{ name: string; abbreviation: string; slug: string; city: string; color: string }>> = {
  nba: [
    { name: 'Los Angeles Lakers', abbreviation: 'LAL', slug: 'los-angeles-lakers', city: 'Los Angeles', color: '#552583' },
    { name: 'Golden State Warriors', abbreviation: 'GSW', slug: 'golden-state-warriors', city: 'San Francisco', color: '#1D428A' },
    { name: 'Boston Celtics', abbreviation: 'BOS', slug: 'boston-celtics', city: 'Boston', color: '#007A33' },
    { name: 'Miami Heat', abbreviation: 'MIA', slug: 'miami-heat', city: 'Miami', color: '#98002E' },
    { name: 'Milwaukee Bucks', abbreviation: 'MIL', slug: 'milwaukee-bucks', city: 'Milwaukee', color: '#00471B' },
    { name: 'Denver Nuggets', abbreviation: 'DEN', slug: 'denver-nuggets', city: 'Denver', color: '#0E2240' },
    { name: 'Philadelphia 76ers', abbreviation: 'PHI', slug: 'philadelphia-76ers', city: 'Philadelphia', color: '#006BB6' },
    { name: 'Phoenix Suns', abbreviation: 'PHX', slug: 'phoenix-suns', city: 'Phoenix', color: '#1D1160' },
    { name: 'Dallas Mavericks', abbreviation: 'DAL', slug: 'dallas-mavericks', city: 'Dallas', color: '#00538C' },
    { name: 'New York Knicks', abbreviation: 'NYK', slug: 'new-york-knicks', city: 'New York', color: '#006BB6' },
    { name: 'Brooklyn Nets', abbreviation: 'BKN', slug: 'brooklyn-nets', city: 'Brooklyn', color: '#000000' },
    { name: 'Cleveland Cavaliers', abbreviation: 'CLE', slug: 'cleveland-cavaliers', city: 'Cleveland', color: '#860038' },
  ],
  nfl: [
    { name: 'Kansas City Chiefs', abbreviation: 'KC', slug: 'kansas-city-chiefs', city: 'Kansas City', color: '#E31837' },
    { name: 'San Francisco 49ers', abbreviation: 'SF', slug: 'san-francisco-49ers', city: 'San Francisco', color: '#AA0000' },
    { name: 'Baltimore Ravens', abbreviation: 'BAL', slug: 'baltimore-ravens', city: 'Baltimore', color: '#241773' },
    { name: 'Buffalo Bills', abbreviation: 'BUF', slug: 'buffalo-bills', city: 'Buffalo', color: '#00338D' },
    { name: 'Dallas Cowboys', abbreviation: 'DAL', slug: 'dallas-cowboys', city: 'Dallas', color: '#003594' },
    { name: 'Philadelphia Eagles', abbreviation: 'PHI', slug: 'philadelphia-eagles', city: 'Philadelphia', color: '#004C54' },
    { name: 'Green Bay Packers', abbreviation: 'GB', slug: 'green-bay-packers', city: 'Green Bay', color: '#203731' },
    { name: 'Miami Dolphins', abbreviation: 'MIA', slug: 'miami-dolphins', city: 'Miami', color: '#008E97' },
    { name: 'Detroit Lions', abbreviation: 'DET', slug: 'detroit-lions', city: 'Detroit', color: '#0076B6' },
    { name: 'Cincinnati Bengals', abbreviation: 'CIN', slug: 'cincinnati-bengals', city: 'Cincinnati', color: '#FB4F14' },
  ],
  mlb: [
    { name: 'New York Yankees', abbreviation: 'NYY', slug: 'new-york-yankees', city: 'New York', color: '#003087' },
    { name: 'Los Angeles Dodgers', abbreviation: 'LAD', slug: 'los-angeles-dodgers', city: 'Los Angeles', color: '#005A9C' },
    { name: 'Houston Astros', abbreviation: 'HOU', slug: 'houston-astros', city: 'Houston', color: '#002D62' },
    { name: 'Atlanta Braves', abbreviation: 'ATL', slug: 'atlanta-braves', city: 'Atlanta', color: '#CE1141' },
    { name: 'Chicago Cubs', abbreviation: 'CHC', slug: 'chicago-cubs', city: 'Chicago', color: '#0E3386' },
    { name: 'Boston Red Sox', abbreviation: 'BOS', slug: 'boston-red-sox', city: 'Boston', color: '#BD3039' },
    { name: 'San Francisco Giants', abbreviation: 'SF', slug: 'san-francisco-giants', city: 'San Francisco', color: '#FD5A1E' },
    { name: 'Philadelphia Phillies', abbreviation: 'PHI', slug: 'philadelphia-phillies', city: 'Philadelphia', color: '#E81828' },
    { name: 'St. Louis Cardinals', abbreviation: 'STL', slug: 'st-louis-cardinals', city: 'St. Louis', color: '#C41E3A' },
    { name: 'Toronto Blue Jays', abbreviation: 'TOR', slug: 'toronto-blue-jays', city: 'Toronto', color: '#134A8E' },
  ],
  nhl: [
    { name: 'Colorado Avalanche', abbreviation: 'COL', slug: 'colorado-avalanche', city: 'Denver', color: '#6F263D' },
    { name: 'Tampa Bay Lightning', abbreviation: 'TBL', slug: 'tampa-bay-lightning', city: 'Tampa Bay', color: '#002868' },
    { name: 'Vegas Golden Knights', abbreviation: 'VGK', slug: 'vegas-golden-knights', city: 'Las Vegas', color: '#B4975A' },
    { name: 'Toronto Maple Leafs', abbreviation: 'TOR', slug: 'toronto-maple-leafs', city: 'Toronto', color: '#00205B' },
    { name: 'Boston Bruins', abbreviation: 'BOS', slug: 'boston-bruins', city: 'Boston', color: '#FFB81C' },
    { name: 'New York Rangers', abbreviation: 'NYR', slug: 'new-york-rangers', city: 'New York', color: '#0038A8' },
    { name: 'Edmonton Oilers', abbreviation: 'EDM', slug: 'edmonton-oilers', city: 'Edmonton', color: '#041E42' },
    { name: 'Florida Panthers', abbreviation: 'FLA', slug: 'florida-panthers', city: 'Miami', color: '#041E42' },
    { name: 'Dallas Stars', abbreviation: 'DAL', slug: 'dallas-stars', city: 'Dallas', color: '#006847' },
    { name: 'Carolina Hurricanes', abbreviation: 'CAR', slug: 'carolina-hurricanes', city: 'Raleigh', color: '#CC0000' },
  ],
  ncaaf: [
    { name: 'Alabama Crimson Tide', abbreviation: 'ALA', slug: 'alabama-crimson-tide', city: 'Tuscaloosa', color: '#9E1B32' },
    { name: 'Georgia Bulldogs', abbreviation: 'UGA', slug: 'georgia-bulldogs', city: 'Athens', color: '#BA0C2F' },
    { name: 'Ohio State Buckeyes', abbreviation: 'OSU', slug: 'ohio-state-buckeyes', city: 'Columbus', color: '#BB0000' },
    { name: 'Michigan Wolverines', abbreviation: 'MICH', slug: 'michigan-wolverines', city: 'Ann Arbor', color: '#00274C' },
    { name: 'Clemson Tigers', abbreviation: 'CLEM', slug: 'clemson-tigers', city: 'Clemson', color: '#F56600' },
    { name: 'Texas Longhorns', abbreviation: 'TEX', slug: 'texas-longhorns', city: 'Austin', color: '#BF5700' },
    { name: 'Oregon Ducks', abbreviation: 'ORE', slug: 'oregon-ducks', city: 'Eugene', color: '#154733' },
    { name: 'Florida State Seminoles', abbreviation: 'FSU', slug: 'florida-state-seminoles', city: 'Tallahassee', color: '#782F40' },
    { name: 'LSU Tigers', abbreviation: 'LSU', slug: 'lsu-tigers', city: 'Baton Rouge', color: '#461D7C' },
    { name: 'USC Trojans', abbreviation: 'USC', slug: 'usc-trojans', city: 'Los Angeles', color: '#990000' },
  ],
  ncaab: [
    { name: 'Duke Blue Devils', abbreviation: 'DUKE', slug: 'duke-blue-devils', city: 'Durham', color: '#003087' },
    { name: 'North Carolina Tar Heels', abbreviation: 'UNC', slug: 'north-carolina-tar-heels', city: 'Chapel Hill', color: '#7BAFD4' },
    { name: 'Kansas Jayhawks', abbreviation: 'KU', slug: 'kansas-jayhawks', city: 'Lawrence', color: '#0022B4' },
    { name: 'Kentucky Wildcats', abbreviation: 'UK', slug: 'kentucky-wildcats', city: 'Lexington', color: '#0033A0' },
    { name: 'Gonzaga Bulldogs', abbreviation: 'GONZ', slug: 'gonzaga-bulldogs', city: 'Spokane', color: '#002F65' },
    { name: 'Villanova Wildcats', abbreviation: 'NOVA', slug: 'villanova-wildcats', city: 'Villanova', color: '#003DA6' },
    { name: 'UConn Huskies', abbreviation: 'UCONN', slug: 'uconn-huskies', city: 'Storrs', color: '#000E2F' },
    { name: 'Houston Cougars', abbreviation: 'UH', slug: 'houston-cougars', city: 'Houston', color: '#C8102E' },
    { name: 'Arizona Wildcats', abbreviation: 'ARIZ', slug: 'arizona-wildcats', city: 'Tucson', color: '#003366' },
    { name: 'Purdue Boilermakers', abbreviation: 'PUR', slug: 'purdue-boilermakers', city: 'West Lafayette', color: '#000000' },
  ],
  f1: [
    { name: 'Red Bull Racing', abbreviation: 'RBR', slug: 'red-bull-racing', city: 'Milton Keynes', color: '#3671C6' },
    { name: 'Mercedes', abbreviation: 'MER', slug: 'mercedes', city: 'Brackley', color: '#27F4D2' },
    { name: 'Ferrari', abbreviation: 'FER', slug: 'ferrari', city: 'Maranello', color: '#E8002D' },
    { name: 'McLaren', abbreviation: 'MCL', slug: 'mclaren', city: 'Woking', color: '#FF8000' },
    { name: 'Aston Martin', abbreviation: 'AMR', slug: 'aston-martin', city: 'Silverstone', color: '#229971' },
    { name: 'Alpine', abbreviation: 'ALP', slug: 'alpine', city: 'Enstone', color: '#FF87BC' },
    { name: 'Williams', abbreviation: 'WIL', slug: 'williams', city: 'Grove', color: '#64C4FF' },
    { name: 'Haas', abbreviation: 'HAA', slug: 'haas', city: 'Kannapolis', color: '#B6BABD' },
    { name: 'RB', abbreviation: 'RB', slug: 'rb', city: 'Faenza', color: '#6692FF' },
    { name: 'Sauber', abbreviation: 'SAU', slug: 'sauber', city: 'Hinwil', color: '#52E252' },
  ],
  mma: [
    { name: 'Islam Makhachev', abbreviation: 'MAK', slug: 'islam-makhachev', city: 'Makhachkala', color: '#D20A0A' },
    { name: 'Alex Pereira', abbreviation: 'PER', slug: 'alex-pereira', city: 'São Paulo', color: '#1A1A2E' },
    { name: 'Jon Jones', abbreviation: 'JON', slug: 'jon-jones', city: 'Albuquerque', color: '#16213E' },
    { name: 'Leon Edwards', abbreviation: 'EDW', slug: 'leon-edwards', city: 'Birmingham', color: '#0F3460' },
    { name: 'Ilia Topuria', abbreviation: 'TOP', slug: 'ilia-topuria', city: 'Alicante', color: '#E94560' },
    { name: 'Dricus du Plessis', abbreviation: 'DDP', slug: 'dricus-du-plessis', city: 'Pretoria', color: '#533483' },
    { name: 'Sean O\'Malley', abbreviation: 'SOM', slug: 'sean-omalley', city: 'Glendale', color: '#FF6B6B' },
    { name: 'Israel Adesanya', abbreviation: 'ADE', slug: 'israel-adesanya', city: 'Auckland', color: '#4ECDC4' },
    { name: 'Charles Oliveira', abbreviation: 'OLI', slug: 'charles-oliveira', city: 'São Paulo', color: '#45B7D1' },
    { name: 'Dustin Poirier', abbreviation: 'POI', slug: 'dustin-poirier', city: 'Lafayette', color: '#96CEB4' },
  ],
  boxing: [
    { name: 'Canelo Alvarez', abbreviation: 'CAN', slug: 'canelo-alvarez', city: 'Guadalajara', color: '#8B0000' },
    { name: 'Terence Crawford', abbreviation: 'CRA', slug: 'terence-crawford', city: 'Omaha', color: '#2D1B69' },
    { name: 'Errol Spence Jr.', abbreviation: 'SPE', slug: 'errol-spence-jr', city: 'Dallas', color: '#1B4332' },
    { name: 'Tyson Fury', abbreviation: 'FUR', slug: 'tyson-fury', city: 'Manchester', color: '#B8860B' },
    { name: 'Oleksandr Usyk', abbreviation: 'USY', slug: 'oleksandr-usyk', city: 'Kyiv', color: '#0057B7' },
    { name: 'Naoya Inoue', abbreviation: 'INO', slug: 'naoya-inoue', city: 'Zama', color: '#BC002D' },
    { name: 'Devin Haney', abbreviation: 'HAN', slug: 'devin-haney', city: 'Las Vegas', color: '#1C1C1C' },
    { name: 'Gervonta Davis', abbreviation: 'DAV', slug: 'gervonta-davis', city: 'Baltimore', color: '#4A0E0E' },
    { name: 'Shakur Stevenson', abbreviation: 'STE', slug: 'shakur-stevenson', city: 'Newark', color: '#2E4057' },
    { name: 'Ryan Garcia', abbreviation: 'GAR', slug: 'ryan-garcia', city: 'Victorville', color: '#DAA520' },
  ],
  cricket: [
    { name: 'India', abbreviation: 'IND', slug: 'india', city: 'Mumbai', color: '#0066B3' },
    { name: 'Australia', abbreviation: 'AUS', slug: 'australia', city: 'Melbourne', color: '#FFD700' },
    { name: 'England', abbreviation: 'ENG', slug: 'england', city: 'London', color: '#1C2C5B' },
    { name: 'South Africa', abbreviation: 'SA', slug: 'south-africa', city: 'Cape Town', color: '#007749' },
    { name: 'New Zealand', abbreviation: 'NZ', slug: 'new-zealand', city: 'Wellington', color: '#000000' },
    { name: 'Pakistan', abbreviation: 'PAK', slug: 'pakistan', city: 'Lahore', color: '#006A4E' },
    { name: 'West Indies', abbreviation: 'WI', slug: 'west-indies', city: 'Bridgetown', color: '#7B0041' },
    { name: 'Sri Lanka', abbreviation: 'SL', slug: 'sri-lanka', city: 'Colombo', color: '#0A2351' },
    { name: 'Bangladesh', abbreviation: 'BAN', slug: 'bangladesh', city: 'Dhaka', color: '#006A4E' },
    { name: 'Ireland', abbreviation: 'IRE', slug: 'ireland', city: 'Dublin', color: '#169B62' },
  ],
};

function getMatchDate(offsetDays: number, hour = 19): Date {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 30, 0, 0);
  return date;
}

const articleTemplates = [
  { category: 'news', titles: [
    '{team1} Announce Major Roster Moves Ahead of {season}',
    '{team1} Star Player Returns from Injury',
    'Breaking: {team1} Make Blockbuster Trade',
    '{team1} Sign Key Free Agent to Long-Term Deal',
    '{team1} Head Coach Speaks on Season Expectations',
  ]},
  { category: 'analysis', titles: [
    'Deep Dive: Why {team1}\'s Offense Is Elite This Season',
    'Statistical Breakdown: {team1} vs {team2} Key Matchups',
    '{team1}\'s Season in Review: What Went Wrong and Right',
    'The Numbers Behind {team1}\'s Winning Streak',
    'How {team1}\'s Defense Stacks Up Against the League',
  ]},
  { category: 'preview', titles: [
    '{team1} vs {team2}: What to Expect in Tonight\'s Clash',
    '{season} Preview: Can {team1} Contend for the Title?',
    '{team1} vs {team2}: Key Storylines and Predictions',
    'Matchup Preview: {team1} Look to Continue Winning Ways Against {team2}',
    'Five Things to Watch: {team1} vs {team2}',
  ]},
  { category: 'recap', titles: [
    '{team1} Dominate {team2} in Convincing Victory',
    '{team1} Edge Out {team2} in Thrilling Finish',
    '{team1} Rally Past {team2} in Second Half Comeback',
    'Recap: {team1} vs {team2} - A Game to Remember',
    '{team1} Handle Business Against {team2}',
  ]},
  { category: 'opinion', titles: [
    'Why {team1} Are Being Overlooked This {season}',
    'The Case for {team1} as Legitimate Contenders',
    'Is It Time for {team1} to Rebuild?',
    '{team1} Need to Make a Move Before It\'s Too Late',
    'What {team1} Must Fix to Reach the Next Level',
  ]},
];

function generateArticleContent(team1: string, team2: string, sport: string, category: string): string {
  const season = '2025-26';
  const contentMap: Record<string, string> = {
    news: `In a move that has sent shockwaves through the ${sport} world, ${team1} have made significant changes to their roster that could reshape their trajectory this ${season} season.\n\nSources close to the organization confirmed the developments early this morning, with insiders suggesting that the front office has been working on these moves for several weeks. The timing is particularly notable given the team's recent form and their position in the standings.\n\n"${team1} have always been about competing at the highest level," said a team spokesperson. "These moves reflect our commitment to bringing a championship to our fans."\n\nThe impact of these changes extends beyond just the roster. Coaching staff will need to adjust their schemes and rotations to accommodate the new personnel, while existing players will need to adapt to new teammates and potentially new roles.\n\nAnalysts have been quick to weigh in on the implications. "This is a bold move by ${team1}," noted one veteran analyst. "It shows they're not content with just making the postseason – they want to make a deep run."\n\nFor ${team2} and the rest of the league, the message is clear: ${team1} are going all-in. The question now is whether these moves will pay dividends when it matters most.\n\nFans will get their first look at the new-look squad in the upcoming matchup, where early indications suggest the changes could make an immediate impact. Tickets for that game are already selling fast, with excitement reaching a fever pitch among the fanbase.\n\nAs the ${season} season continues to unfold, all eyes will be on ${team1} to see if these roster moves translate into on-field success.`,
    analysis: `When you look at ${team1} this season, the numbers tell a compelling story that goes beyond the basic statistics. A deeper dive into their performance metrics reveals a team that has systematically improved in the areas that matter most.\n\nOffensive Efficiency\n${team1} rank among the top tier in offensive efficiency, with their scoring output increasing by 15% compared to last season. This improvement isn't accidental – it's the result of a deliberate shift in offensive philosophy and improved personnel execution.\n\nDefensive Identity\nWhat's been even more impressive is ${team1}'s defensive transformation. They've gone from a middle-of-the-pack defense to one that consistently shuts down opposing offenses. The numbers are stark: opponents are scoring 12% fewer points when facing ${team1} compared to the league average.\n\nKey Players\nSeveral players deserve recognition for their contributions. The coaching staff has done an excellent job of putting players in positions to succeed, and the results speak for themselves.\n\nAgainst ${team2}, these improvements will be put to the test. ${team2} present a unique challenge with their own set of strengths, and this matchup will be a true measuring stick for where ${team1} stand.\n\nLooking ahead, if ${team1} can maintain this level of performance, they have to be considered serious contenders. The data supports what the eye test has been telling us all season – this is a different ${team1} team than we've seen in recent years.`,
    preview: `All eyes turn to the upcoming clash between ${team1} and ${team2}, a matchup that promises to deliver excitement and could have significant implications for the playoff picture.\n\n${team1} come into this game riding a wave of momentum, having won their last several contests in impressive fashion. Their form has been characterized by dominant performances on both sides of the ball, and they'll be looking to continue that trend against a formidable ${team2} side.\n\n${team2}, however, are no pushovers. They've proven themselves to be resilient competitors all season long, capable of rising to the occasion against top opposition. Their recent results suggest they're hitting their stride at the right time.\n\nKey Storylines\n- The battle between ${team1}'s offense and ${team2}'s defense will likely determine the outcome\n- Home court advantage could play a significant role\n- Both teams have players nursing minor injuries that could impact performance\n- The coaching matchup adds another layer of intrigue\n\nPrediction\nThis one has all the makings of a classic. While ${team1} have the slight edge on paper, ${team2} have shown they can compete with anyone. Expect a close, hard-fought contest that could come down to the final moments.\n\nOur pick: ${team1} in a nail-biter, but don't count out ${team2}.`,
    recap: `${team1} delivered a statement performance against ${team2}, securing a victory that will resonate throughout the league and send a clear message to their rivals.\n\nFrom the opening moments, it was clear that ${team1} came to play. Their energy was infectious, their execution was crisp, and their game plan was executed to near perfection. ${team2}, to their credit, fought hard and had their moments, but ultimately couldn't match ${team1}'s intensity and precision.\n\nThe Turning Point\nThe game shifted in the second half when ${team1} went on a decisive run that ${team2} simply couldn't answer. It was a stretch of play that showcased everything that makes ${team1} dangerous – stifling defense, efficient offense, and an unwavering will to win.\n\nStandout Performers\nSeveral ${team1} players delivered standout performances that deserve recognition. Their contributions across the board were the difference in a game where every possession mattered.\n\nWhat This Means\nFor ${team1}, this victory validates their status as legitimate contenders. It's the kind of win that builds confidence and momentum, two ingredients that are essential for a deep postseason run.\n\nFor ${team2}, it's back to the drawing board. While the loss is disappointing, there were positives to take away. They'll need to make adjustments before these teams meet again.\n\nLooking ahead, both teams face important stretches in their schedules. How they respond to this result could define their respective seasons.`,
    opinion: `Let's talk about ${team1} – a team that continues to defy expectations and yet somehow still doesn't get the respect they deserve in national conversations about championship contenders.\n\nI've watched every ${team1} game this season, and what I see is a team that has quietly assembled the kind of roster and culture that wins championships. The problem? They're not flashy. They don't make the highlight reels with outrageous individual performances. What they do is win – consistently, methodically, and convincingly.\n\nThe Case for ${team1}\nStart with their depth. While other contenders rely on one or two stars, ${team1} have built a roster where any player can beat you on any given night. This makes them incredibly difficult to game-plan against, as ${team2} discovered in their recent matchup.\n\nThen there's the coaching. The staff has done a masterful job of maximizing the talent on the roster, making in-game adjustments that consistently shift momentum, and keeping the team focused through adversity.\n\nThe Doubters\nThe common argument against ${team1} is their lack of a true superstar. But I'd argue that their collective approach is actually an advantage in the postseason, where one player having an off night can derail a team relying too heavily on individual brilliance.\n\nThe Bottom Line\nIt's time to take ${team1} seriously. Not as a feel-good story or a scrappy underdog, but as a genuine championship threat. The numbers support it, the eye test confirms it, and the results speak for themselves.\n\nWill they ultimately win it all? That remains to be seen. But counting them out would be a mistake.`,
  };
  return contentMap[category] || contentMap.news;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.vote.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.article.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.author.deleteMany();
  await prisma.sport.deleteMany();

  // Create sports
  console.log('Creating sports...');
  const sportRecords: Record<string, any> = {};
  for (const sport of sports) {
    sportRecords[sport.slug] = await prisma.sport.create({ data: sport });
  }

  // Create authors
  console.log('Creating authors...');
  const authorRecords: Record<string, any> = {};
  for (const author of authors) {
    authorRecords[author.slug] = await prisma.author.create({ data: author });
  }

  // Create teams for each sport
  console.log('Creating teams...');
  const teamRecords: Record<string, any[]> = {};
  for (const [sportSlug, teams] of Object.entries(teamsBySport)) {
    const sport = sportRecords[sportSlug];
    teamRecords[sportSlug] = [];
    for (const team of teams) {
      const teamRecord = await prisma.team.create({
        data: {
          ...team,
          sportId: sport.id,
          logo: `https://ui-avatars.com/api/?name=${team.abbreviation}&background=${team.color.replace('#', '')}&color=fff&size=80&bold=true`,
        },
      });
      teamRecords[sportSlug].push(teamRecord);
    }
  }

  // Create matches
  console.log('Creating matches...');
  const matchStatuses = ['upcoming', 'live', 'finished'];

  // Create some live matches
  for (const sportSlug of ['nba', 'nfl', 'mlb', 'nhl', 'cricket']) {
    const teams = teamRecords[sportSlug];
    const sport = sportRecords[sportSlug];
    if (!teams || teams.length < 2) continue;

    // Live match
    const homeTeam = teams[0];
    const awayTeam = teams[1];
    const slug = `${homeTeam.slug}-vs-${awayTeam.slug}-2026-03-04`;
    await prisma.match.create({
      data: {
        sportId: sport.id,
        slug,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: Math.floor(Math.random() * 30) + 80,
        awayScore: Math.floor(Math.random() * 30) + 75,
        status: 'live',
        matchDate: getMatchDate(0),
        venue: `${homeTeam.city} Arena`,
        broadcastInfo: JSON.stringify({ channels: ['ESPN', 'ABC'], streaming: ['ESPN+', 'fuboTV'] }),
        homeVotes: Math.floor(Math.random() * 500) + 200,
        awayVotes: Math.floor(Math.random() * 500) + 100,
      },
    });
  }

  // Create upcoming matches
  for (const sportSlug of Object.keys(teamsBySport)) {
    const teams = teamRecords[sportSlug];
    const sport = sportRecords[sportSlug];
    if (!teams || teams.length < 4) continue;

    for (let i = 0; i < 3; i++) {
      const homeIdx = (i * 2) % teams.length;
      const awayIdx = (i * 2 + 1) % teams.length;
      const homeTeam = teams[homeIdx];
      const awayTeam = teams[awayIdx];
      const date = getMatchDate(i + 1, 18 + i);
      const dateStr = date.toISOString().split('T')[0];
      const slug = `${homeTeam.slug}-vs-${awayTeam.slug}-${dateStr}`;

      await prisma.match.create({
        data: {
          sportId: sport.id,
          slug,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          status: 'upcoming',
          matchDate: date,
          venue: `${homeTeam.city} Stadium`,
          broadcastInfo: JSON.stringify({ channels: ['ESPN', 'TNT'], streaming: ['ESPN+', 'Sling TV'] }),
          homeVotes: Math.floor(Math.random() * 200) + 50,
          awayVotes: Math.floor(Math.random() * 200) + 30,
        },
      });
    }
  }

  // Create finished matches
  for (const sportSlug of ['nba', 'nfl', 'mlb', 'nhl', 'ncaaf', 'ncaab']) {
    const teams = teamRecords[sportSlug];
    const sport = sportRecords[sportSlug];
    if (!teams || teams.length < 6) continue;

    for (let i = 0; i < 2; i++) {
      const homeIdx = (i * 2 + 4) % teams.length;
      const awayIdx = (i * 2 + 5) % teams.length;
      const homeTeam = teams[homeIdx];
      const awayTeam = teams[awayIdx];
      const date = getMatchDate(-(i + 1), 19);
      const dateStr = date.toISOString().split('T')[0];
      const slug = `${homeTeam.slug}-vs-${awayTeam.slug}-${dateStr}`;
      const homeScore = Math.floor(Math.random() * 40) + 80;
      const awayScore = Math.floor(Math.random() * 40) + 75;

      await prisma.match.create({
        data: {
          sportId: sport.id,
          slug,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          homeScore,
          awayScore,
          status: 'finished',
          matchDate: date,
          venue: `${homeTeam.city} Arena`,
          broadcastInfo: JSON.stringify({ channels: ['ESPN'], streaming: ['ESPN+'] }),
          matchSummary: `In a ${homeScore > awayScore ? 'dominant' : 'hard-fought'} performance, the ${homeScore > awayScore ? homeTeam.name : awayTeam.name} defeated the ${homeScore > awayScore ? awayTeam.name : homeTeam.name} ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}. The game featured several highlight-reel plays and strong performances from key players on both sides.`,
          homeVotes: Math.floor(Math.random() * 800) + 300,
          awayVotes: Math.floor(Math.random() * 800) + 200,
        },
      });
    }
  }

  // Create standings
  console.log('Creating standings...');
  for (const sportSlug of ['nba', 'nfl', 'mlb', 'nhl']) {
    const teams = teamRecords[sportSlug];
    const sport = sportRecords[sportSlug];
    if (!teams) continue;

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i++) {
      const wins = Math.floor(Math.random() * 40) + 20;
      const losses = Math.floor(Math.random() * 40) + 15;
      await prisma.standing.create({
        data: {
          sportId: sport.id,
          teamId: shuffled[i].id,
          position: i + 1,
          wins,
          losses,
          draws: sportSlug === 'nhl' ? Math.floor(Math.random() * 10) : 0,
          percentage: wins / (wins + losses),
          streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 5) + 1}` : `L${Math.floor(Math.random() * 4) + 1}`,
        },
      });
    }
  }

  // Create articles
  console.log('Creating articles...');
  const authorSpecialties: Record<string, string[]> = {
    'marcus-johnson': ['nba'],
    'sarah-mitchell': ['nfl', 'ncaaf'],
    'david-chen': ['mlb', 'nhl'],
    'emily-rodriguez': ['f1'],
    'james-obrien': ['mma', 'boxing'],
    'priya-sharma': ['cricket'],
    'alex-thompson': ['nba', 'nfl', 'mlb', 'nhl', 'ncaaf', 'ncaab', 'f1', 'mma', 'boxing', 'cricket'],
  };

  for (const [authorSlug, authorSports] of Object.entries(authorSpecialties)) {
    const author = authorRecords[authorSlug];
    for (const sportSlug of authorSports) {
      const teams = teamRecords[sportSlug];
      const sport = sportRecords[sportSlug];
      if (!teams || teams.length < 2) continue;

      // Create 2-3 articles per sport per author
      for (let i = 0; i < 2; i++) {
        const team1 = teams[i % teams.length];
        const team2 = teams[(i + 1) % teams.length];
        const templateGroup = articleTemplates[i % articleTemplates.length];
        const titleTemplate = templateGroup.titles[i % templateGroup.titles.length];
        const title = titleTemplate
          .replace('{team1}', team1.name)
          .replace('{team2}', team2.name)
          .replace('{season}', '2025-26');
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const content = generateArticleContent(team1.name, team2.name, sport.name, templateGroup.category);

        const existingArticle = await prisma.article.findUnique({ where: { slug } });
        if (existingArticle) continue;

        await prisma.article.create({
          data: {
            sportId: sport.id,
            authorId: author.id,
            title,
            slug,
            excerpt: content.substring(0, 150) + '...',
            content,
            featuredImage: `https://picsum.photos/seed/${slug}/1200/630`,
            category: templateGroup.category,
            tags: [team1.abbreviation, team2.abbreviation, sport.slug].join(','),
            isPublished: true,
            publishedAt: getMatchDate(-Math.floor(Math.random() * 5)),
          },
        });
      }
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
