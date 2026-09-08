# VoiceReach

A field-documentation app for San Francisco homeless-outreach workers.

A social worker finishes a street interaction and, instead of typing notes back at
the office, speaks for thirty seconds. The app transcribes the audio, pulls
structured fields out of it (name, height, weight, medical conditions, urgency),
checks whether this person is already in the database, and either creates a new
record or merges into the existing one.

There is also a hands-free voice assistant: the worker can ask "what should I know
before approaching John?" and get an answer grounded in what the database already
holds about that person.

> **Status: hackathon MVP.** This was built in 36 hours as a demo. It works
> end-to-end against real OpenAI and Supabase, but it makes deliberate shortcuts
> that are *not* safe for production — see [Shortcuts](#shortcuts-taken) at the
> bottom. It handles what is effectively medical data with wide-open row-level
> security.

---

## Repository layout

```
backend/          FastAPI service — all API logic and OpenAI calls
  api/            HTTP routers, one per resource
  services/       Business logic (categorization, dedup, embeddings, urgency)
  db/             Pydantic models
  scripts/        Operational one-offs (seed demo data, backfill embeddings)
  tests/          pytest integration tests (require a live backend — see Testing)
mobile/           React Native (Expo) iOS app
  screens/        One screen per tab
  components/     Shared UI
  services/       API + Supabase clients
supabase/
  schema.sql      ← the database. Run this once. See Database.
docs/             Architecture, PRD, and feature deep-dives
main.py           Railway entrypoint; re-exports backend.main:app
```

## How it works

```
                  ┌──────────────────────────────────────────┐
   Expo iOS app ─▶│ FastAPI (backend/)                       │
                  │                                          │
   1. record m4a  │  POST /api/transcribe                    │
                  │    ├─ Whisper        → transcript        │
                  │    └─ GPT-4o         → structured fields │
                  │                                          │
   2. save        │  POST /api/individuals                   │
                  │    ├─ GPT-4o         → duplicate check   │
                  │    ├─ urgency score  → computed          │
                  │    └─ embedding      → generated in bg   │
                  │                                          │
   3. ask         │  WS /api/voice-assistant/realtime/ws     │
                  │    └─ proxy to OpenAI Realtime API,      │
                  │       primed with DB context             │
                  └───────────────┬──────────────────────────┘
                                  ▼
                       Supabase Postgres + Storage
```

Three separate AI capabilities, easy to confuse:

| Capability | Model | Where |
|---|---|---|
| Transcribe + extract fields | Whisper + GPT-4o | `services/openai_service.py` |
| Semantic search over profiles | `text-embedding-3-large` | `services/embedding_service.py` |
| Live spoken assistant | OpenAI Realtime API | `api/voice_assistant.py` |

### The data model in one paragraph

`categories` is **schema-as-data**: each row defines a field the app collects
(its type, whether it is required, and how heavily it weighs into the urgency
score). `individuals` holds one row per person with the current aggregated state
in a JSONB `data` column. `interactions` is an append-only log of what *changed*
at each encounter — not a full snapshot. `individual_embeddings` backs semantic
search. Because fields live in `categories` rather than in columns, adding a new
field at runtime does not require a migration.

## Setup

### 1. Database

Create a Supabase project, then run **`supabase/schema.sql`** once in the
Supabase SQL Editor. That single file is the whole schema plus seed data.

> The repo previously carried a numbered migration chain in
> `supabase/migrations/` and `backend/migrations/`. It was mutually
> contradictory — `001` created `urgency_score` directly while `004` tried to
> rename `danger_score` into it, which fails on a fresh database — and it
> disagreed with the columns the backend actually reads. It has been replaced by
> the consolidated schema, which reflects what the code really does.

Then create a **private** Storage bucket named `audio` (5 MB limit, MIME types
`audio/mp4`, `audio/x-m4a`, `audio/m4a`). See `supabase/storage_policies.sql`.

### 2. Backend

```bash
python3 -m pip install -r requirements.txt

cp backend/.env.example backend/.env    # fill in the values below
python3 -m uvicorn backend.main:app --reload --port 8001
```

Required environment variables:

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Whisper, GPT-4o, embeddings, Realtime |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_KEY` | Server-side database access |
| `SUPABASE_ANON_KEY` | Client-scoped access |

Sanity check: `curl localhost:8001/health`

### 3. Mobile

```bash
cd mobile
npm install
npm start
```

The app auto-logs-in with demo credentials and opens on the Record tab.

Which backend it talks to is decided in `mobile/config/api.ts`, and **it defaults
to the deployed Railway instance, not your local server.** To point it at your
own machine:

```bash
EXPO_PUBLIC_DEMO_MODE=LOCAL npm start
# or bypass the mode entirely:
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.x:8001 npm start
```

On a physical device this must be your machine's LAN IP — `localhost` resolves
to the phone. Note that `config/ip-config.js` and `mobile/config/api.ts`
currently hold *different* hardcoded IPs despite `config/` describing itself as
the single source of truth; setting the environment variable above sidesteps
that.

`mobile/env.example` covers Supabase and Google Maps keys, which the app reads
for direct Supabase access and map rendering.

### 4. Optional: seed and backfill

```bash
python3 backend/scripts/load_demo_data.py        # extra demo individuals
python3 backend/scripts/backfill_embeddings.py   # embeddings for existing rows
```

New individuals get embeddings automatically in the background; the backfill
script is only for rows that predate that.

## API

Base URL `http://localhost:8001`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/transcribe` | Audio → transcript → structured fields |
| `POST` | `/api/individuals` | Create or update a person |
| `GET` | `/api/individuals` | List / text search |
| `GET` | `/api/individuals/{id}` | Full profile |
| `GET` | `/api/individuals/{id}/interactions` | Encounter history |
| `PUT` | `/api/individuals/{id}/urgency-override` | Manual urgency override |
| `POST` | `/api/individuals/check-duplicates` | LLM duplicate confidence |
| `GET` / `POST` | `/api/categories` | Read / define collected fields |
| `POST` | `/api/embeddings/search` | Semantic profile search |
| `GET` | `/api/embeddings/status` | Embedding coverage |
| `GET` | `/api/export` | CSV export |
| `WS` | `/api/voice-assistant/realtime/ws` | Realtime assistant proxy |

Interactive docs at `/docs` when the server is running.

### Two rules worth knowing before changing anything

**Urgency score.** Only `number` and `single_select` category types may carry an
urgency weight. Numbers contribute `value / 300 * weight`; selects contribute
`option_value * weight`. A category flagged `auto_trigger` pins the score to 100
outright. A manual override, when set, is displayed instead of the computed
value — it does not overwrite it. See `services/urgency_calculator.py`.

**Duplicate detection.** GPT-4o compares a new record against candidates and
returns a confidence of 0–100. At ≥ 95 the app offers an automatic merge; below
that it shows the merge UI and lets the worker decide. Newer values win on
conflict. See `services/duplicate_detection_service.py`.

## Testing

Both suites are in a known-partial state. The honest status:

```bash
cd mobile && npm test
```

Runs, and **3 of 10 tests pass.** Jest previously had no configuration at all —
no `jest` key, no `babel.config.js` — so every suite died on a parse error and
zero tests executed. That is now wired up (`jest-expo` preset, plus an
AsyncStorage mock in `test/setup.js`). The 7 remaining failures are stale
assertions: the tests were written against the pre-"Modern" components and still
look for copy like `Potential Duplicate Found` that the current UI no longer
renders. The tests are wrong, not the components — they need rewriting against
the current screens.

```bash
python3 -m pytest backend/tests/test_api_integration.py
```

These are **integration** tests, not unit tests: they expect a backend already
running on the configured host and a populated Supabase project with real
credentials. They cannot pass on a clean checkout. That was a deliberate
hackathon tradeoff — end-to-end confidence over isolated units — but it means
there is no test you can run offline to check the backend. `backend/services/`
is where unit tests would go if this project continued.

## Deployment

Railway builds from the repo root. `railway.toml` starts `uvicorn main:app`, and
the root `main.py` simply re-exports `backend.main:app` so the backend package
resolves. Only the backend deploys; `mobile/` and `docs/` are excluded via
`.railwayignore`.

## Documentation

| File | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product requirements — the spec of record |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Codebase tour |
| [`docs/BACKEND_API.md`](docs/BACKEND_API.md) | Endpoint-by-endpoint detail |
| [`docs/VOICE_PIPELINE.md`](docs/VOICE_PIPELINE.md) | Audio → transcript → fields, in depth |
| [`docs/EMBEDDINGS.md`](docs/EMBEDDINGS.md) | Semantic search setup and behaviour |
| [`docs/DEMO.md`](docs/DEMO.md) | Demo walkthrough script |

## Shortcuts taken

Listed explicitly so nobody mistakes them for finished work:

- **Row-level security is wide open.** Every policy is `USING (true)`. Real use
  needs per-agency scoping — this is sensitive personal and medical data.
- **A Supabase project URL and anon key are hardcoded and committed** in
  `mobile/config/api.ts`. A Supabase anon key is designed to ship to clients, so
  this is not a leaked *secret* — but combined with the wide-open RLS above it
  effectively hands anyone with the repo full read/write access to that demo
  project. Rotate the project and move these to environment variables before
  this goes anywhere real.
- **JWTs are decoded but not signature-verified.**
- **CORS allows all origins.**
- **Auth is a hardcoded demo account**, auto-logged-in, no email verification.
- **No offline support.** The app requires connectivity throughout.
- **Categories are create-only** — the MVP has no edit or delete.
- Audio is M4A/AAC, 10 s minimum and 2 min maximum per recording.
