# SportSurge Python Backend - Setup Guide

## Quick Start (5 minutes)

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate the virtual environment
# On Windows:
venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# 6. Run the quick start script (installs deps, seeds DB, starts server)
python scripts/run.py

# OR start manually:
python start.py
```

The backend will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Environment Configuration (.env)

### Required (Minimal - works without any API keys)

```env
HOST=0.0.0.0
PORT=8000
DEBUG=false
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=sqlite+aiosqlite:///./sportsurge.db
```

The backend works in **fallback mode** without any API keys:
- ESPN data fetching still works (free, no key needed)
- AI articles use template-based fallback
- YouTube returns search links instead of embedded videos
- TheSportsDB uses free tier (no key needed)

### Optional API Keys (for enhanced features)

#### 1. AI Article Generation (OpenRouter - Recommended)

Get a free API key at: https://openrouter.ai/keys

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

OpenRouter gives you access to 100+ AI models including:
- Google Gemini 2.0 Flash (free tier available)
- GPT-4o-mini
- Claude 3.5 Haiku
- Llama 3.1

#### 2. AI Article Generation (OpenAI)

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

#### 3. AI Article Generation (Google Gemini Direct)

```env
GEMINI_API_KEY=AIzaxxxxxxxxxxxxx
```

#### 4. YouTube Data API (for highlight video embeds)

Get a free API key at: https://console.cloud.google.com/apis/credentials

1. Create a project in Google Cloud Console
2. Enable "YouTube Data API v3"
3. Create credentials (API key)
4. Add the key to .env:

```env
YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxx
```

#### 5. TheSportsDB (for high-quality team logos)

```env
THESPORTSDB_API_KEY=3
```

Note: Free tier (`3`) works for basic searches. Premium key available at https://www.thesportsdb.com/api.php

---

## API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check & config info |
| GET | `/api/v1/sports` | List all 10 sports |
| GET | `/api/v1/authors` | List 7 author profiles |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/matches` | All matches (filter by sport, status) |
| GET | `/api/v1/matches/{slug}` | Single match by slug |
| GET | `/api/v1/live` | Currently live matches |
| GET | `/api/v1/upcoming` | Upcoming matches |
| GET | `/api/v1/finished` | Recently finished matches |

### Data Fetching (ESPN)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/fetch-data` | Fetch ESPN data (all or specific sport) |
| POST | `/api/v1/fetch-data?sport=nba` | Fetch specific sport only |
| POST | `/api/v1/fetch-standings/{sport}` | Fetch standings from ESPN |
| POST | `/api/v1/update-logos/{sport}` | Update team logos from TheSportsDB |

### Articles & AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/articles` | List published articles |
| POST | `/api/v1/generate-article` | Generate AI article |
| POST | `/api/v1/generate-seo/{match_id}` | Generate SEO content for match |

### Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/vote` | Record vote (IP-based, one per match) |

### YouTube
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/update-youtube/{match_id}` | Search YouTube for match highlights |
| POST | `/api/v1/batch-youtube` | Batch update YouTube videos |

### Real-time
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events/live` | SSE stream for live match updates |

### Database
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/seed-database` | Seed database with sample data |

---

## Example API Calls

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Fetch all ESPN data (NBA, NFL, MLB, NHL, NCAAF, NCAAB)
curl -X POST http://localhost:8000/api/v1/fetch-data

# Fetch only NBA data
curl -X POST "http://localhost:8000/api/v1/fetch-data?sport=nba"

# Get live matches
curl http://localhost:8000/api/v1/live

# Get NBA matches
curl "http://localhost:8000/api/v1/matches?sport=nba"

# Get NBA standings
curl http://localhost:8000/api/v1/standings/nba

# Generate an AI article
curl -X POST http://localhost:8000/api/v1/generate-article \
  -H "Content-Type: application/json" \
  -d '{"sport": "nba", "topic": "Lakers vs Warriors Preview", "category": "preview"}'

# Vote for a team
curl -X POST http://localhost:8000/api/v1/vote \
  -H "Content-Type: application/json" \
  -d '{"matchId": "xxx", "teamId": "yyy"}'

# Seed database with sample data
curl -X POST http://localhost:8000/api/v1/seed-database
```

---

## Running with the Frontend

### Start both servers:

```bash
# Terminal 1: Backend (port 8000)
cd backend
python start.py

# Terminal 2: Frontend (port 3000)
cd frontend
npm install
npm run dev
```

The frontend automatically connects to the backend at http://localhost:8000.

### Frontend Environment

Make sure the frontend has the backend URL configured:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Scheduler (Automatic Data Fetching)

By default, the scheduler is disabled. To enable it, edit `app/main.py` and uncomment the scheduler lines:

```python
# In app/main.py lifespan function, uncomment:
try:
    start_scheduler()
    logger.info("Scheduler started")
except Exception as e:
    logger.warning(f"Scheduler failed to start: {e}")
```

### Schedule Configuration

| Task | Default | Configurable via .env |
|------|---------|----------------------|
| ESPN Data Fetch | Every 5 minutes | `FETCH_INTERVAL_MINUTES` |
| Article Generation | Daily at 7:00 AM | `ARTICLE_GENERATION_HOUR` |
| YouTube Video Search | Every 30 minutes | Hardcoded |
| Daily Article Count | 10 articles/day | `DAILY_ARTICLE_COUNT` |

---

## Project Structure

```
backend/
  app/
    __init__.py
    main.py              # FastAPI app, CORS, lifespan
    config.py            # Settings from .env
    database.py          # SQLAlchemy async engine
    models/
      models.py          # All SQLAlchemy models
    api/
      routes.py          # All REST API endpoints
    services/
      espn_service.py    # ESPN Hidden API integration
      ai_service.py      # AI article generation (7 authors)
      data_service.py    # Core business logic
      youtube_service.py # YouTube highlight search
      thesportsdb_service.py  # Team logos & details
    scheduler/
      tasks.py           # APScheduler periodic tasks
      sse.py             # Server-Sent Events for real-time
  scripts/
    seed.py              # Database seeding script
    run.py               # Quick start script
  migrations/            # Alembic migrations (if needed)
  .env.example           # Environment template
  .env                   # Your configuration
  requirements.txt       # Python dependencies
  start.py               # Main entry point
  test_api.py            # API test script
  SETUP_GUIDE.md         # This file
```

---

## Data Sources

| Source | Coverage | Auth | Cost |
|--------|----------|------|------|
| ESPN Hidden API | NBA, NFL, MLB, NHL, NCAAF, NCAAB | None | Free |
| TheSportsDB | All sports (logos, details) | API key (optional) | Free tier available |
| YouTube Data API | Highlight videos | API key | Free (10,000 units/day) |
| OpenRouter | AI articles | API key | Free tier available |
| Google Gemini | AI articles | API key | Free tier available |
| OpenAI | AI articles | API key | Paid |

---

## Sports Supported

| Sport | Slug | ESPN API | AI Author |
|-------|------|----------|-----------|
| NBA | nba | Yes | Marcus Johnson |
| NFL | nfl | Yes | Sarah Mitchell |
| MLB | mlb | Yes | David Chen |
| NHL | nhl | Yes | David Chen |
| NCAAF | ncaaf | Yes | Sarah Mitchell |
| NCAAB | ncaab | Yes | Marcus Johnson |
| Formula 1 | f1 | No | Emily Rodriguez |
| MMA | mma | No | James O'Brien |
| Boxing | boxing | No | James O'Brien |
| Cricket | cricket | No | Priya Sharma |

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'sqlalchemy'"
Make sure your virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### "Address already in use" error
Another process is using port 8000. Kill it or change the port in .env:
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Or change port
# PORT=8001 in .env
```

### ESPN API returns no data
- ESPN API may not have games scheduled for today
- Try fetching data for a day with scheduled games
- Check https://www.espn.com/ for today's schedule

### AI articles use fallback templates
- Add an OpenRouter API key to .env for real AI-generated articles
- OpenRouter has a free tier with Gemini 2.0 Flash
- The fallback templates still work and are E-E-A-T compliant

### YouTube videos not embedding
- Add a YouTube Data API key to .env
- Without the key, the system returns YouTube search links instead
- Free tier allows ~10,000 units/day (plenty for most use cases)
