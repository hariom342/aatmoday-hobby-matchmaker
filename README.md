# Aatmoday Hobby Matchmaker

## Problem statement

**PS5 — Hobby Matchmaker for Aatmoday**

Students often have interests but do not know which campus communities are the best fit for them. Aatmoday Hobby Matchmaker turns a student's free-text interests into a short, friendly list of relevant hobby groups, with a personalized reason and an easy conversation starter for each match.

## Key features

- Free-text interest input for students
- Top 2–3 matches from a controlled list of campus hobby groups
- Personalized match explanations and icebreakers
- Gemini-powered matching with server-side API-key protection
- Validated matching output so results use only supported group names
- Retry, alternate-model, and local fallback behavior for temporary provider outages
- Friendly empty, short-input, unrelated-input, loading, and error states
- Responsive navy-and-blue interface designed for mobile and desktop
- Contract-first `POST /api/matches` endpoint with generated client and Zod validation
- Lightweight health endpoints at `/api` and `/api/healthz`

## Tech stack

- React 19
- Vite
- TypeScript
- Express 5
- Google Gemini API
- Zod and OpenAPI-generated API types/hooks
- Framer Motion
- Lucide React
- pnpm workspaces
- Node.js 24

## Setup instructions

### Prerequisites

- Node.js 24 or newer
- pnpm
- A Google Gemini API key

### Install dependencies

```bash
pnpm install
```

### Configure the Gemini API key

Set `GEMINI_API_KEY` in the environment used by the API server. In Replit, add it through the Secrets tool rather than committing it to the repository.

Optional:

```bash
export GEMINI_MODEL=gemini-3.7-flash
```

### Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

### Start the web app

In a second terminal:

```bash
pnpm --filter @workspace/aatmoday-hobby-matchmaker run dev
```

The web app will be available at the local Vite URL shown in the terminal. The API is served under `/api`.

### Validate and build

```bash
pnpm run typecheck
pnpm run build
```

## Live demo

[Open Aatmoday Hobby Matchmaker](https://staid-near-things--hariomyadav2370.replit.app)
