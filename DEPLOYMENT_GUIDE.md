# SportSurge v3.0 - Full-Stack Deployment Guide

This repository contains the complete **SportSurge v3.0** application:
- **`frontend/`**: Next.js 16 App Router (Deployed on **Cloudflare Workers**)
- **`backend/`**: Python FastAPI + Scheduler Service (Deployed on **Dokploy VPS**)

---

## 1. Backend Deployment (Dokploy VPS)

### Deployment Steps:
1. Log into your **Dokploy Dashboard** on your VPS.
2. Click **Create Application**.
3. Name: `sportsurge-backend`
4. Select **Provider**: GitHub
5. Connect Repository: `sachin0002371/sportsurge`
6. Branch: `main`
7. **Root Directory**: `backend` *(Crucial!)*
8. Build Type: **Dockerfile** (or Nixpacks)
9. Port: `8000`
10. **Environment Variables**:
    ```env
    DATABASE_URL=postgresql://neondb_owner:npg_b0dgB9izZeHx@ep-billowing-paper-asl1j3hb-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require
    OPENAI_API_KEY=your_openai_api_key_here
    PEXELS_API_KEY=your_pexels_api_key_here
    CORS_ORIGINS=["*"]
    ```
11. Click **Deploy**!

---

## 2. Frontend Deployment (Cloudflare Workers)

### Deployment Steps:
1. Log into your **Cloudflare Dashboard** -> **Workers & Pages**.
2. Click **Create** -> Select **Workers** *(NOT Pages!)*.
3. Select **Import a repository** -> Choose `sachin0002371/sportsurge`.
4. Configure Build Settings:
   - **Root directory**: `frontend` *(Crucial!)*
   - **Build command**: `npm run build:worker`
   - **Build output directory**: `.open-next/assets`
   - **Node.js Version**: Set `NODE_VERSION` = `22` in Environment Variables.
5. **Environment Variables**:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_b0dgB9izZeHx@ep-billowing-paper-asl1j3hb-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `BACKEND_URL`: `https://backend.sportsurgeplay.com` (or your Dokploy backend URL)
6. Click **Save & Deploy**!

---

## Local Development

### Run Backend:
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```
