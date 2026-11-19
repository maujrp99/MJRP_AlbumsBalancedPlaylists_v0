# MJRP "The Album Blender" 🌪️

**Version**: v3.16.0 (Production Stable)
**Latest Sprint**: Sprint 16 (Jan 2026)

> **The Album Blender** is a strategic curation platform designed to restore the depth of music appreciation. It operates as an intelligence layer above streaming services, blending raw data (Albums, Critical Acclaim, Popularity) into coherent, balanced, and personalized listening experiences.

---

## 🚀 Quick Start

### 1. Development
```bash
# Terminal 1: Backend API (Default: 3000)
cd server && npm ci && node index.js

# Terminal 2: Frontend (http://127.0.0.1:5010)
npm install && npm run dev
```
*   **Frontend**: http://127.0.0.1:5010 (the one local address; `localhost` is sent there. See `PORT_INFO.txt`)
*   **Backend**: http://localhost:3000

### 2. Testing
```bash
npm test              # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Puppeteer)
```

---

## 📚 Documentation Index

**Start Here**:
*   [**Product Vision**](docs/MJRP_Album_Blender_Prod_Vision.md) - **The "Why"** (Philosophy & Manifesto).
*   [**Roadmap**](docs/ROADMAP.md) - Future Plans & Sprint Status.

**Manuals & Guides**:
*   [**System Architecture**](docs/manual/01_System_Architecture.md) - **The Master Map** (Start Technical Dive Here).
*   [**Deployment Guide**](docs/manual/00_Deployment_and_Setup.md) - CI/CD, Env Vars, and Cloud Run.
*   [**Onboarding**](docs/onboarding/README.md) - Role-based guides (Dev, DevOps, QA).

**Reference**:
*   [**UI Style Guide**](docs/technical/UI_STYLE_GUIDE.md) - Design Tokens.
*   [**Changelog**](docs/CHANGELOG.md) - Historic Versioning.
*   [**Archives**](docs/archive/) - Deprecated Specs & Notes.

---

## 🌟 Core Features

### 1. Track Ranking & Strategy
*   **Hybrid Ranking**: Toggle between "Balanced", "Spotify Popularity", or "BEA Rating".
*   **Scraper-First**: Prioritizes BestEverAlbums.com data, falls back to AI.
*   **Borda Count**: Normalizes scores from multiple sources into a single metric.

### 2. Balanced Playlist Generation
*   **The "Blend"**: Automatically selects Top 2 tracks (P1/P2) + "Deep Cuts" to ensure a balanced listening session.
*   **Duration Targeting**: Fits playlists into exact time windows (e.g., "Max 2 Hours").

### 3. Data Persistence
*   **Firestore Sync**: Cloud storage for Album Collections and Series.
*   **Evidence Caching**: Reduces expensive scraper calls.

---

## 🔗 Key Links
*   **Live Demo**: https://mjrp-playlist-generator.web.app
*   **Repository**: [github.com/maujrp99/MJRP_AlbumsBalancedPlaylists_v0](https://github.com/maujrp99/MJRP_AlbumsBalancedPlaylists_v0)
