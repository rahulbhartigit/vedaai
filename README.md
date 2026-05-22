# VedaAI – AI Assessment Creator

An AI-powered question paper generator for teachers. Create structured, exam-ready papers in seconds using OpenAI GPT-4o.

---

## Architecture Overview

```
┌─────────────────────┐        HTTP/WS         ┌──────────────────────────┐
│   Next.js Frontend  │ ◄─────────────────────► │  Express Backend (TS)     │
│  (Zustand + WS)     │                         │  Port 5000               │
└─────────────────────┘                         └─────────┬────────────────┘
                                                          │
                         ┌──────────────────────────┬─────┘
                         ▼                          ▼
                   ┌──────────┐            ┌──────────────┐
                   │ MongoDB  │            │  Redis       │
                   │(data)    │            │(cache/queue) │
                   └──────────┘            └──────┬───────┘
                                                  │
                                          ┌───────▼──────┐
                                          │  BullMQ      │
                                          │  Worker      │
                                          └───────┬──────┘
                                                  │
                                          ┌───────▼──────┐
                                          │  OpenAI      │
                                          │  GPT-4o      │
                                          └──────────────┘
```

### Flow
1. Teacher submits assignment form → `POST /api/assignments`
2. Backend saves to MongoDB, enqueues a BullMQ job → returns assignment ID
3. Frontend navigates to result page, opens WebSocket connection
4. BullMQ worker picks up job → builds structured GPT-4o prompt → parses JSON response
5. Result saved to MongoDB, cached in Redis (24h TTL)
6. WebSocket event (`job:done`) fires → frontend fetches and displays the paper
7. Teacher can Download PDF or Regenerate

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Zustand, native WebSocket |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Cache / Queue | Redis + BullMQ |
| Real-time | WebSocket (ws) |
| AI | AWS Bedrock — `anthropic.claude-opus-4-7` |
| PDF Export | jsPDF + html2canvas |
| File Parsing | pdf-parse, multer |

---

## Setup

### Prerequisites
- Node.js ≥ 18
- Docker & Docker Compose (for MongoDB + Redis)

### 1. Start Infrastructure

```bash
# From project root
docker-compose up -d
```

This starts MongoDB on `27017` and Redis on `6379`.

### 2. Backend

```bash
cd backend

# Configure environment
cp .env .env.local          # or edit .env directly
# Set your OpenAI API key:
# OPENAI_API_KEY=sk-...

npm install
npm run dev                 # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/vedaai` | MongoDB connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis URL |
| `AWS_REGION` | `us-east-1` | AWS region where Bedrock is enabled |
| `AWS_ACCESS_KEY_ID` | `your_aws_access_key_id_here` | **Required** — AWS access key |
| `AWS_SECRET_ACCESS_KEY` | `your_aws_secret_access_key_here` | **Required** — AWS secret key |
| `AWS_SESSION_TOKEN` | _(optional)_ | Only needed for temporary STS credentials |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:5000/ws` | WebSocket URL |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assignments` | List all assignments |
| `POST` | `/api/assignments` | Create assignment + enqueue generation |
| `GET` | `/api/assignments/:id` | Get assignment details |
| `DELETE` | `/api/assignments/:id` | Delete assignment + result |
| `GET` | `/api/assignments/:id/result` | Get generated paper (Redis → MongoDB) |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue generation |

### WebSocket Events (`ws://localhost:5000/ws?assignmentId=<id>`)
| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ clientId }` | Connection established |
| `job:processing` | `{ message }` | Worker started |
| `job:done` | `{ resultId, message }` | Paper ready |
| `job:failed` | `{ error, message }` | Generation failed |

---

## Approach

### AI Prompt Strategy
- Questions are never rendered raw — the LLM is instructed to return a strict JSON schema
- `response_format: { type: 'json_object' }` is set on the OpenAI call for guaranteed JSON
- Each response is validated and sanitized before being stored in MongoDB
- Difficulty is inferred from question type if the model doesn't return it

### Caching
- Generated results are stored in Redis with a 24-hour TTL
- `GET /result` hits Redis first, then MongoDB as fallback
- Regeneration explicitly invalidates the Redis key

### Real-time Updates
- WebSocket connections are keyed by `assignmentId`
- A 5-second polling fallback on the result page handles cases where WS reconnects are slow

---

## Features

- ✅ Multi-step assignment creation form (file upload, due date, question types, instructions)
- ✅ AI generation via OpenAI GPT-4o with structured JSON prompts
- ✅ BullMQ job queue with retry logic (3 attempts, exponential backoff)
- ✅ Real-time WebSocket updates
- ✅ Redis caching of results
- ✅ Formatted question paper with section grouping
- ✅ Difficulty badges (Easy / Moderate / Hard)
- ✅ PDF download (jsPDF + html2canvas, multi-page)
- ✅ Regenerate functionality
- ✅ File upload (PDF text extraction → injected into prompt)
- ✅ Full TypeScript (frontend + backend)
- ✅ Mobile responsive

---

## Project Structure

```
vedaAi/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── config/
│   │   │   ├── database.ts       # MongoDB
│   │   │   ├── redis.ts          # Redis
│   │   │   └── bullmq.ts         # Queue
│   │   ├── models/
│   │   │   ├── Assignment.ts
│   │   │   └── Result.ts
│   │   ├── routes/
│   │   │   └── assignments.ts
│   │   ├── services/
│   │   │   ├── aiService.ts      # OpenAI prompt + parse
│   │   │   └── wsService.ts      # WebSocket manager
│   │   └── workers/
│   │       └── generationWorker.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx           # Dashboard
    │   │   └── assignments/
    │   │       ├── create/page.tsx
    │   │       └── [id]/result/page.tsx
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   ├── AssignmentCard.tsx
    │   │   ├── QuestionPaper.tsx
    │   │   └── Toast.tsx
    │   ├── store/
    │   │   └── assignmentStore.ts
    │   └── lib/
    │       ├── api.ts
    │       └── websocket.ts
    ├── .env.local
    └── package.json
```
