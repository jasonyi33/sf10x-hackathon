# VoiceReach

A field-documentation app for San Francisco homeless-outreach workers.

A social worker finishes a street interaction and, instead of typing notes back at
the office, speaks for thirty seconds. The app transcribes the audio, pulls
structured fields out of it (name, height, weight, medical conditions), scores
urgency from those fields, checks whether this person is already in the database,
and either creates a new record or merges into the existing one.

That last step is the intended design; see [Known broken](#known-broken) for why
the create-new path does not currently run.

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
  api/            HTTP routers, one per resource (auth.py is a dependency, not a router)
  services/       Business logic (categorization, dedup, embeddings, urgency)
  db/             Pydantic models
  scripts/        Operational one-offs (seed demo data, backfill embeddings)
  tests/          pytest suites — mostly integration, a few offline (see Testing)
mobile/           React Native (Expo) iOS app
  screens/        5 tab screens + the profile screen pushed from Search
  components/     Shared UI
  services/       API + Supabase clients
supabase/
  schema.sql      ← the database. Run this once. See Database.
config/           Shared IP/location constants (see the caveat under Mobile)
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
                  │    ├─ GPT-4o         → structured fields │
                  │    └─ GPT-4o         → duplicate check   │
                  │                                          │
   2. save        │  POST /api/individuals                   │
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
| Live spoken assistant | `gpt-realtime` | `main.py` (the WS proxy); `api/voice_assistant.py` (context endpoints) |

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

# Run from inside backend/ -- its modules import each other absolutely
# (e.g. `from services.context_service import ...`), so backend/ must be on
# sys.path. The root main.py shim exists for Railway, not for local dev.
cd backend && python3 -m uvicorn main:app --reload --port 8001
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
to the phone. Be warned that three files hold three *different* hardcoded IPs
despite `config/` billing itself as the single source of truth:
`config/ip-config.js` (`192.168.1.3`), `config/ip_config.py` (`10.23.0.57`) and
`mobile/config/api.ts` (`192.168.68.53`, which is dead code — `DEMO_MODE=LOCAL`
resolves to `localhost`, not to it). Setting the environment variable above
sidesteps all of it.

Ignore `mobile/env.example` — it is vestigial. The app reads **no** Supabase or
Google Maps values from the environment: `services/supabase.ts` builds its client
from the values hardcoded in `config/api.ts`, and `GOOGLE_MAPS_API_KEY` has no
references anywhere in the codebase. `EXPO_PUBLIC_DEMO_MODE` and
`EXPO_PUBLIC_API_BASE_URL` are the only environment variables the app reads.

### 4. Optional: backfill embeddings

`supabase/schema.sql` already seeds six demo individuals, and new individuals get
embeddings automatically in the background. The backfill script is only needed
for rows that predate that:

```bash
cd backend && python3 scripts/backfill_embeddings.py
```

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
| `POST` | `/api/embeddings/generate` | Embed one individual |
| `POST` | `/api/embeddings/generate-all` | Embed every individual |
| `GET` | `/api/export` | CSV export — **registered twice, see below** |
| `WS` | `/api/voice-assistant/realtime/ws` | Realtime assistant proxy (defined in `main.py`) |
| `POST` | `/api/voice-assistant/context` | DB context for a named person |
| `GET` | `/api/voice-assistant/{resources,guidelines,test}` | Static assistant helpers |
| `POST` | `/api/voice-assistant/{chat,transcribe}` | Non-realtime assistant fallbacks |
| `GET` | `/api/voice-assistant/api-key` | **Returns the raw `OPENAI_API_KEY` — see below** |

Interactive docs at `/docs` when the server is running.

### Two rules worth knowing before changing anything

**Urgency score.** Only `number` and `single_select` types may carry an urgency
weight — enforced by a validator in `db/models.py:155`. Each contributing
category adds `normalized_value * weight` to a running sum, where a number is
`min(value / 300, 1.0)` (so it clamps above 300) and a select is its option's
value. The result is then **normalized by the total weight** and scaled:
`int(weighted_sum / total_weight * 100)`. Skipping that last step is the easy
mistake — the per-category term alone is not the score. A category flagged
`auto_trigger` pins the score to 100, but only when its value is actually
present and non-zero. A manual override is displayed instead of the computed
value without overwriting it. See `services/urgency_calculator.py`.

**Duplicate detection — the code and the spec disagree here.** GPT-4o compares a
new record against candidates and returns 0–100; the backend discards anything
below 60 (`duplicate_detection_service.py:208`). `docs/PRD.md` calls for an
automatic merge at ≥ 95, but **that threshold is not implemented**: the only 95
in the backend assigns a confidence to an exact name match, and the frontend
opens the same field-by-field merge UI for *every* surviving match
(`TranscriptionResults.tsx:137`). The merge UI defaults each field to the newer
value, but the worker can flip any field. Note also that the backend does not
merge server-side — `individual_service.py:150` replaces the whole `data` JSONB
with what the client posts, so any field the client omits is dropped.

## Testing

Both suites are in a known-partial state. The honest status:

```bash
cd mobile && npm test
```

Runs, and **3 of 10 tests pass.** Jest previously had no configuration at all —
no `jest` key, no `babel.config.js` — so every suite died on a parse error and
zero tests executed. That is now wired up (`jest-expo` preset, plus an
AsyncStorage mock in `test/setup.js`).

The 7 remaining failures are broken *fixtures*, not stale copy — every string
the tests look for is still rendered:

- **5 in `MergeUI`** — the fixture uses `id: '123'`, which fails the UUID guard
  at `MergeUI.tsx:29`, so the component early-returns its "Invalid merge target"
  branch before rendering anything the tests assert on.
- **2 in `LocationPicker`** — the `expo-location` mock omits `Accuracy`, so
  `Location.Accuracy.High` throws and the error view renders instead. The
  permission-denied test additionally sets its mock *after* `render()`, so it
  can never affect the mount-time call.

While fixing those, note `MergeUI.tsx:29-42` returns conditionally *before* its
`useState`/`useEffect` — a Rules-of-Hooks violation that will throw if a
`potentialMatch.id` ever changes validity on a mounted component. So it is not
purely a test problem.

```bash
python3 -m pytest backend/tests/test_api_integration.py
```

Most of `backend/tests/` is **integration** tests that expect a backend already
running and a populated Supabase project, and those cannot pass on a clean
checkout — a deliberate hackathon tradeoff.

Two suites *are* fully mocked and run offline:

```bash
python3 -m pytest backend/tests/test_duplicate_service_unit.py backend/tests/test_unit_components.py
```

20 pass, 1 fails (`test_multiple_candidates_returns_highest_confidence`).
Separately, `backend/tests/test_models.py` is dead: it imports
`DangerOverrideRequest`, which was renamed to `UrgencyOverrideRequest`, so it
fails at import rather than for any environmental reason.

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

## Known broken

Distinct from the deliberate shortcuts below — these look like working features
but are not:

- **Recording a brand-new person does not save them.** `TranscriptionResults.tsx:152-161`
  contains a leftover `// DEBUG: Force merge UI` block: when transcription finds
  *no* duplicate match, it fabricates a match against a hardcoded UUID named
  "John", opens the merge UI, and `return`s — making the genuine save-as-new path
  below it unreachable. This is the single highest-value thing to fix.
- **`GET /api/export` is registered twice.** `api/categories.py:19` and
  `api/export.py:18` claim the same path; `categories.router` is included first,
  so all of `api/export.py` is dead code. The two implementations differ: the
  live one emits 12 columns but computes urgency as
  `urgency_override or urgency_score` (an override of `0` wrongly falls through
  to the calculated score); the dead one emits 5 columns but handles the override
  correctly and derives `last_seen` from interactions rather than `updated_at`.
- **`api.exportCSV()` cannot work.** `services/api.ts:60` always calls
  `response.json()`, but both export handlers return CSV.
- **Three client methods call routes that do not exist** — `POST /api/upload-audio`,
  `POST /api/interactions`, and `PUT /api/individuals/{id}` (only `GET` exists).
  All are currently unreferenced, so nothing breaks today.
- **Category weights render as `undefined`.** `CategoriesScreen.tsx:189` and
  friends read `danger_weight`; the API returns `urgency_weight`.
- **`expo-audio` is imported but not a dependency.** `utils/audioProcessor.ts:7`
  imports it; `package.json` only lists `expo-av`.

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
- **`GET /api/voice-assistant/api-key` hands the raw `OPENAI_API_KEY` to any
  caller** with a bearer token that is never signature-checked — i.e. effectively
  to anyone. The endpoint's own docstring says "In production, this should be
  more secure."
- **JWTs are decoded but not signature-verified.**
- **CORS allows all origins.**
- **Auth is a hardcoded demo account**, auto-logged-in, no email verification.
- **No offline support.** The app requires connectivity throughout.
- **Categories are create-only** — the MVP has no edit or delete.
- Audio is M4A/AAC, **5 s** minimum and 2 min maximum per recording
  (`ModernAudioRecorder.tsx:209`). `docs/PRD.md` says 10 s; the code says 5.
