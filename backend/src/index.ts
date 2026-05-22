import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { connectDB } from './config/database';
import { getRedisClient } from './config/redis';
import { initWebSocket } from './services/wsService';
import { startGenerationWorker } from './workers/generationWorker';
import assignmentsRouter from './routes/assignments';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/assignments', assignmentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── HTTP + WebSocket Server ──────────────────────────────────────────────────
const httpServer = createServer(app);
initWebSocket(httpServer);

// ─── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  // ioredis connects lazily on first command — no explicit .connect() needed
  getRedisClient();

  startGenerationWorker();

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  });
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async () => {
  console.log('\n⏳ Gracefully shutting down...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start().catch((err) => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
