# ShotlineAI

AI-powered photo curation — instantly surface your best shots.

Upload a folder of photos and ShotlineAI ranks, tags, and captions every image using Gemini vision AI, grouping them into confidence tiers so you can export a clean library in seconds.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Gemini 1.5 Flash** (Google AI vision)
- **Zustand** (client-side state)
- **JSZip** (client-side ZIP export)

## Setup

```bash
# 1. Install dependencies
npm install
```

Edit `.env.local` (already present in repo root):

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_MOCK_MODE=false
```

Get a free Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

```bash
# 2. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Mode (no API key required)

Set `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local` to run with deterministic fake AI results.
The full UI works — upload, processing animation, tier review, and ZIP export — with no network calls.

```env
NEXT_PUBLIC_MOCK_MODE=true
```

## Project Structure

```
app/
  upload/          ← drag-and-drop photo selection
  processing/      ← two-phase analysis pipeline (client preprocessing + AI)
  results/         ← tier review, overrides, and ZIP export
  api/analyze/     ← Gemini API proxy (keeps key server-side)

components/
  upload/          ← DropZone, FileSummary
  processing/      ← StepIndicator, ProgressBar, LiveGrid
  results/         ← PhotoGrid, PhotoCard, FilterBar, ExportButton
  ui/              ← Navbar, TierBadge, ScoreBadge

lib/               ← types, Zustand store, Gemini client
utils/             ← preprocessing, mock data, analysis service, ZIP export
hooks/             ← useUpload, usePhotoAnalysis
```

## Confidence Tiers

| Tier | Score | Meaning |
|---|---|---|
| **Best** | 85–100 | Sharp, well-lit, compelling — export always |
| **Keep** | 60–84 | Good photo with minor flaws |
| **Uncertain** | 40–59 | Borderline — user reviews and overrides |
| **Reject** | 0–39 | Blurry, dark, or technically failed |
