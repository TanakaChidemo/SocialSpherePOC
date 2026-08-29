# Architecture

## System overview

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────┐
│  Next.js 14 │──────▶  Express API GW  │──────▶  Flask AI svc   │
│  (frontend) │◀──────│  (backend)       │◀──────│  (ai-service)  │
└─────────────┘      └────────┬─────────┘      └────────┬────────┘
                               │                          │
                               ▼                          ▼
                     ┌──────────────────┐          ┌──────────┐
                     │ In-memory store  │          │  Groq /  │
                     │ (data/store.js)  │          │  OpenAI  │
                     │ users, accounts, │          └──────────┘
                     │ drafts, posts    │
                     └──────────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │ Meta Graph API        │
                     │ (Facebook + Instagram)│
                     │ or sandbox simulator  │
                     └──────────────────────┘
```

## No database, on purpose

The app's core workflow is **log in, write a post (optionally with AI
help), attach media, publish it**. There is no Postgres, no MongoDB, no
Redis. All application data (users, social accounts, content drafts,
publish-status records) lives in plain JS arrays in
[`backend/src/data/store.js`](../backend/src/data/store.js), seeded with a
few demo records at process start and mutated directly by the controllers.
Restarting the backend resets everything.

This is a real trade-off, not just a simplification for its own sake:
nothing survives a restart, there's no relational integrity enforcement,
and every "query" is a linear array scan. That's fine at this scale and
lets the whole data layer be read and explained as one small file. If the
project later needs data to survive restarts or be shared across multiple
backend instances, that file is the seam to swap out for a real database.

## Publishing engine flow

1. User hits `/publish/now` with a `contentDraftId` and `platform`.
2. Backend looks up the draft in `data/store.js`, appends a row to the
   in-memory `scheduledPosts` array with status `publishing`, and schedules
   an in-memory publish job (`src/queue/`) with zero delay.
3. The same backend process picks up the job via `setImmediate` and
   dispatches to the platform-specific publisher
   (`src/services/publishers/metaPublisher.js`).
4. `metaPublisher` only calls the real Facebook/Instagram Graph API if
   `META_APP_ID` is configured; otherwise ("sandbox mode", the default) it
   simulates a successful publish and returns a fake external post ID.
5. The job processor writes the result (`published`/`failed`,
   `externalPostId`, `errorMessage`) back onto the same in-memory
   `scheduledPosts` row, which `/publish/status/:id` reads back.

Because everything here is in-memory and synchronous-ish (zero delay), this
flow is really "publish now" with an async-shaped API — there's no
scheduled/delayed publishing exposed in the UI or API.

## AI microservice boundary

The AI service is deliberately isolated from the core backend:
- Different language/runtime (Python) suits the LLM ecosystem (OpenAI-
  compatible SDK against Groq) better than Node.
- It's a stateless request/response service — no data store, no shared
  state with the backend.
- The Express backend proxies all AI calls (`/api/v1/ai/*`) rather than the
  frontend calling the AI service directly, keeping JWT auth and rate
  limiting in one place.
- Two independent fallback layers exist so the demo never hard-fails: the
  AI service itself falls back to a template generator if no
  `GROQ_API_KEY`/`OPENAI_API_KEY` is set, and the backend's `ai.controller.js`
  falls back to its own built-in generator if the AI service is unreachable
  at all.

## Media uploads

`POST /api/v1/content/media` accepts one image or video file (multer,
in-memory buffer, 25MB limit) and returns it as a base64 `data:` URL. There
is no object storage — the encoded file is only ever held in the browser's
state and the request/response cycle. This is why media doesn't survive a
page refresh: it was never written anywhere durable.

## Known limitations (intentional at this stage)

- No persistence: restarting the backend wipes users, accounts, drafts, and
  publish history back to the seed data.
- No real Meta OAuth: social accounts are two hardcoded demo entries, and
  "connecting" a new one just appends to the in-memory list with a fake
  token.
- No object storage for uploaded media (base64 in memory only).
- Only Facebook and Instagram are supported anywhere in the app (AI
  generation, publish destinations).
- No test suites yet beyond CI placeholders.
