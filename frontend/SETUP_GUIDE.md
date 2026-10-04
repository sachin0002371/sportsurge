# 🏀 SportSurge - Complete Setup Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Database Setup](#database-setup)
6. [Running the Project](#running-the-project)
7. [Data Fetching (ESPN API)](#data-fetching-espn-api)
8. [AI Article Generation](#ai-article-generation)
9. [Project Structure](#project-structure)
10. [Configuration](#configuration)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Future Enhancements](#future-enhancements)

---

## Project Overview

SportSurge is a fully automated sports data platform that provides:
- **Live Scores & Match Data** - Real-time scores from ESPN Hidden API
- **Match Predictions/Voting** - Users can vote on match outcomes
- **AI-Generated Articles** - 500-700 word articles using AI (z-ai-web-dev-sdk)
- **Legal Streaming Directory** - "Where to Watch" official broadcaster links
- **Video Highlights** - Embedded YouTube video sections
- **7 Author Profiles** - E-E-A-T compliant for Google Discover
- **10 Sports** - NBA, NFL, MLB, NHL, NCAAF, NCAAB, F1, MMA, Boxing, Cricket

The site is designed with a SofaScore-inspired premium UI using a blue color scheme (#2C3EC4 primary, #374DF5 accent).

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | Latest |
| Icons | Lucide React | Latest |
| Database | SQLite (via Prisma) | - |
| ORM | Prisma | 6.x |
| AI SDK | z-ai-web-dev-sdk | Latest |
| Runtime | Bun | Latest |

---

## Prerequisites

Before setting up the project, ensure you have:

1. **Node.js** v18+ or **Bun** v1+ (recommended: Bun)
2. **npm** or **bun** package manager
3. **Git** for version control
4. A modern web browser (Chrome, Firefox, Edge)

### Optional (for production):
- A VPS (DigitalOcean, Railway, Vercel) for deployment
- Custom domain name
- Redis for caching (future enhancement)

---

## Installation & Setup

### Step 1: Extract the ZIP

```bash
# Extract the project ZIP
unzip sportsurge-project.zip
cd sportsurge
```

### Step 2: Install Dependencies

```bash
# Using Bun (recommended - faster)
bun install

# OR using npm
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# The app runs on port 3000 by default
PORT=3000
```

> **Note**: No API keys are required for basic functionality! The ESPN Hidden API is free and requires no authentication. AI article generation uses z-ai-web-dev-sdk which is pre-configured.

---

## Database Setup

### Step 1: Generate Prisma Client

```bash
bun run db:generate
# OR
npx prisma generate
```

### Step 2: Push Schema to Database

```bash
bun run db:push
# OR
npx prisma db push
```

### Step 3: Seed the Database

```bash
bun run prisma/seed.ts
# OR
npx tsx prisma/seed.ts
```

This creates:
- 10 sports categories with icons and colors
- 100+ teams across all sports
- 7 author profiles with bios and specialties
- 50+ sample articles
- Sample matches (live, upcoming, finished)
- Sample standings data

---

## Running the Project

### Development Mode

```bash
bun run dev
# OR
npm run dev
```

The site will be available at: **http://localhost:3000**

### Production Build

```bash
bun run build
bun run start
# OR
npm run build
npm run start
```

### Lint Check

```bash
bun run lint
# OR
npm run lint
```

---

## Data Fetching (ESPN API)

### How It Works

SportSurge uses the **ESPN Hidden API** which is:
- **Free** - No API key required
- **Unofficial** - Undocumented but community-known
- **Comprehensive** - Covers NBA, NFL, MLB, NHL, NCAAF, NCAAB
- **Real-time** - Scores update every few minutes during live games

### API Endpoints Used

```
Scoreboard: http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
News:       http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/news
Teams:      http://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams
```

### Sport Mapping

| Sport Slug | ESPN Path |
|-----------|-----------|
| NBA | basketball/nba |
| NFL | football/nfl |
| MLB | baseball/mlb |
| NHL | hockey/nhl |
| NCAAF | football/college-football |
| NCAAB | basketball/mens-college-basketball |

### Fetching Data

#### Method 1: Manual Button (Testing)
- Click the "🔄 Fetch Data" button in the bottom-right corner of the site
- This calls `POST /api/fetch-data`
- Shows per-sport results

#### Method 2: API Call
```bash
curl -X POST http://localhost:3000/api/fetch-data
```

#### Method 3: Automated (Cron Job - Future)
Set up a cron job to fetch data every 5 minutes:
```bash
# Add to crontab
*/5 * * * * curl -X POST http://localhost:3000/api/fetch-data
```

### What Gets Fetched
- Match schedules and scores
- Team names, abbreviations, colors
- Team logos (from ESPN CDN)
- Broadcast information
- Match status (upcoming, live, finished)

### Rate Limiting
- ESPN's undocumented API has no published rate limits
- Recommended: Maximum 1 request per second per sport
- The fetch-data endpoint fetches all 6 ESPN sports sequentially with delays

### For Sports NOT on ESPN (F1, MMA, Boxing, Cricket)

These sports require alternative data sources:

| Sport | Free API | Endpoint |
|-------|----------|----------|
| F1 | Jolpica F1 | https://api.jolpi.ca/ergast/f1/ |
| MMA | API-Sports MMA | https://api-sports.io/sports/mma (100 req/day free) |
| Boxing | ESPN Hidden API | http://site.api.espn.com/apis/site/v2/sports/boxing/boxing |
| Cricket | API-Cricket | https://www.api-cricket.com (100 req/day free) |

To add these, update `src/lib/espn-api.ts` with new sport mappings and API helper functions.

---

## AI Article Generation

### How It Works

SportSurge uses **z-ai-web-dev-sdk** to generate articles:

1. A topic is provided (sport + subject)
2. The AI generates a 500-700 word article
3. The article is assigned to a random author from that sport's specialty
4. It's automatically published with proper SEO tags

### Generating Articles

#### Method 1: Via API
```bash
curl -X POST http://localhost:3000/api/generate-article \
  -H "Content-Type: application/json" \
  -d '{"sportSlug": "nba", "topic": "Lakers vs Warriors Season Preview 2026"}'
```

#### Method 2: Via UI
- Go to any sport page (e.g., /nba)
- In the News tab, click "Generate Article" button
- Enter a topic and click Generate

#### Method 3: Via Dev Panel
- Click the "Fetch Data" button in the bottom-right
- Click "Generate Test Article"

### Article Quality Settings

The AI prompt is configured in `src/app/api/generate-article/route.ts`. You can modify:
- Word count (currently 500-700)
- Writing style (journalistic, analytical, etc.)
- Structure (headings, bullets, quotes)
- SEO optimization level

### Author Assignment

Articles are automatically assigned to authors based on sport specialty:
- Marcus Johnson → NBA
- Sarah Mitchell → NFL & College Football
- David Chen → MLB & NHL
- Emily Rodriguez → F1 & Motorsport
- James O'Brien → MMA & Boxing
- Priya Sharma → Cricket & International
- Alex Thompson → Multi-Sport (fallback)

---

## Project Structure

```
sportsurge/
├── prisma/
│   ├── schema.prisma       # Database schema (7 models)
│   ├── seed.ts             # Seed data script
│   └── dev.db              # SQLite database (auto-generated)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout (Header + Footer)
│   │   ├── page.tsx        # Homepage
│   │   ├── globals.css     # Global styles + CSS variables
│   │   ├── [sport]/
│   │   │   ├── page.tsx    # Sport category page
│   │   │   ├── match/
│   │   │   │   └── [slug]/page.tsx  # Match detail page
│   │   │   ├── news/
│   │   │   │   ├── page.tsx         # News listing
│   │   │   │   └── [slug]/page.tsx  # Article detail
│   │   │   ├── standings/page.tsx   # Standings
│   │   │   └── schedule/page.tsx    # Schedule
│   │   ├── authors/
│   │   │   ├── page.tsx    # All authors
│   │   │   └── [slug]/page.tsx  # Author profile
│   │   └── api/
│   │       ├── fetch-data/route.ts      # ESPN data fetch
│   │       ├── matches/route.ts         # Matches API
│   │       ├── vote/route.ts            # Voting API
│   │       ├── articles/route.ts        # Articles API
│   │       ├── generate-article/route.ts # AI article gen
│   │       └── standings/route.ts       # Standings API
│   ├── components/
│   │   ├── Header.tsx           # Main navigation
│   │   ├── Footer.tsx           # Site footer
│   │   ├── MatchCard.tsx        # Match preview card
│   │   ├── LiveMatchRibbon.tsx  # Horizontal match scroll
│   │   ├── VoteCard.tsx         # Team voting component
│   │   ├── ArticleCard.tsx      # Article preview card
│   │   ├── ArticleHero.tsx      # Featured article card
│   │   ├── StandingsTable.tsx   # Standings table
│   │   ├── CountdownTimer.tsx   # Match countdown
│   │   ├── WhereToWatch.tsx     # Streaming directory
│   │   ├── AuthorBio.tsx        # Author info card
│   │   ├── SportIcon.tsx        # Lucide sport icons
│   │   ├── DevFetchButton.tsx   # Testing panel
│   │   ├── VideoHighlights.tsx  # Video highlights grid
│   │   ├── YouTubeEmbed.tsx     # YouTube player
│   │   ├── MatchCenterTabs.tsx  # Match page tabs
│   │   ├── LiveRefreshIndicator.tsx  # Auto-refresh badge
│   │   └── GenerateArticleButton.tsx  # AI article trigger
│   ├── lib/
│   │   ├── db.ts           # Prisma client
│   │   ├── espn-api.ts     # ESPN API helpers
│   │   └── utils.ts        # Utility functions
│   └── hooks/
│       ├── use-mobile.ts   # Mobile detection
│       └── use-toast.ts    # Toast notifications
├── public/                  # Static assets
├── SETUP_GUIDE.md          # This file
└── package.json            # Dependencies
```

---

## Configuration

### Changing Colors

All colors are defined as CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: #2C3EC4;       /* Header, footer, brand blue */
  --accent: #374DF5;        /* Interactive elements, links */
  --live-red: #CB1818;      /* Live badges only */
  --page-bg: #EDF1F6;       /* Page background */
}
```

### Adding a New Sport

1. Add the sport to `prisma/seed.ts` and re-seed
2. Add the ESPN mapping in `src/lib/espn-api.ts`
3. Add the Lucide icon in `src/components/SportIcon.tsx`
4. Add the sport to `src/components/Header.tsx` navigation

### Changing Vote Settings

Vote settings are in `src/app/api/vote/route.ts`:
- IP-based duplicate prevention (one vote per IP per match)
- Vote counts are stored on the Match model

---

## Deployment

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### VPS (DigitalOcean, AWS, etc.)

```bash
# Clone and setup
git clone <your-repo>
cd sportsurge
bun install
bun run db:push
bun run prisma/seed.ts

# Build and run
bun run build
bun run start

# Use PM2 for process management
npm i -g pm2
pm2 start npm --name "sportsurge" -- start
```

### Environment Variables for Production

```env
DATABASE_URL="file:./prod.db"
NODE_ENV="production"
PORT=3000
```

---

## Troubleshooting

### Database Issues

```bash
# Reset database
bun run db:reset

# Re-push schema
bun run db:push

# Re-seed
bun run prisma/seed.ts
```

### ESPN API Not Returning Data

- Check internet connectivity
- ESPN API may be temporarily down
- Some sports may be off-season (no current matches)
- Try fetching during US daytime hours (more likely to have live data)

### AI Article Generation Failing

- Ensure z-ai-web-dev-sdk is properly installed
- Check network connectivity
- The system will fall back to a template article if AI fails

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
bun run build
```

---

## Future Enhancements

### Phase 1: Automation
- [ ] Python FastAPI backend for scheduled data fetching
- [ ] Cron jobs for every-5-minute score updates
- [ ] Auto-publish 10 articles/day on trending topics
- [ ] Auto-generate match pages when schedule is published

### Phase 2: Real-Time
- [ ] WebSocket support for live score updates
- [ ] Server-Sent Events (SSE) for push notifications
- [ ] Browser push notifications for match starts

### Phase 3: User Features
- [ ] User authentication (NextAuth.js)
- [ ] User profiles and prediction history
- [ ] Leaderboard for prediction accuracy
- [ ] Comment system on match pages
- [ ] Favorite teams/sports

### Phase 4: Monetization
- [ ] Ad integration (Google AdSense)
- [ ] Premium subscription for ad-free experience
- [ ] Affiliate links for streaming services

### Phase 5: Advanced Features
- [ ] Redis caching for API responses
- [ ] PostgreSQL for production database
- [ ] CDN for static assets
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

## API Reference

### POST /api/fetch-data
Fetches live data from ESPN API for all supported sports.

**Response:**
```json
{
  "success": true,
  "message": "Data fetched from ESPN API",
  "results": {
    "nba": 3,
    "nfl": 2,
    "mlb": 0,
    "nhl": 1,
    "ncaaf": 0,
    "ncaab": 4
  },
  "totalMatches": 10
}
```

### GET /api/matches
Get matches with filters.

**Query Parameters:**
- `sport` - Sport slug (nba, nfl, etc.)
- `status` - Match status (live, upcoming, finished)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

### POST /api/vote
Vote for a team in a match.

**Body:**
```json
{
  "matchId": "clxxxx",
  "teamId": "clyyyy"
}
```

**Response:**
```json
{
  "success": true,
  "homeVotes": 82,
  "awayVotes": 18
}
```

### POST /api/generate-article
Generate an AI article.

**Body:**
```json
{
  "sportSlug": "nba",
  "topic": "Lakers championship chances in 2026"
}
```

### GET /api/articles
Get published articles.

**Query Parameters:**
- `sport` - Sport slug
- `category` - Article category (news, analysis, preview, recap, opinion)
- `page` - Page number
- `limit` - Items per page

### GET /api/standings
Get standings for a sport.

**Query Parameters:**
- `sport` - Sport slug (required)

---

*Built with ❤️ using Next.js 16, Tailwind CSS 4, and shadcn/ui*
