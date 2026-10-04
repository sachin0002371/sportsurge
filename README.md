# SportSurge v3.0

Official SportSurge platform repository featuring live sports scores, match schedules, standings, AI-generated news articles, and real-time updates.

## Project Architecture

- **`frontend/`**: Next.js 16 + Tailwind CSS + Shadcn UI + Prisma (Neon PostgreSQL). Designed for Cloudflare Workers deployment (`@opennextjs/cloudflare`).
- **`backend/`**: FastAPI + Python 3.11 + SQLAlchemy + APScheduler + OpenAI + Pexels API. Designed for Dokploy VPS deployment.

For complete step-by-step deployment instructions, refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
