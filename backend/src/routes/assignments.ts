import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { getGenerationQueue } from '../config/bullmq';
import { getRedisClient } from '../config/redis';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Multer config for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, TXT, and image files are allowed'));
  },
});

// Utility: extract text from uploaded file
async function extractFileContent(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf' || filePath.endsWith('.pdf')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
      const data = await pdfParse(fs.readFileSync(filePath));
      return data.text.substring(0, 5000);
    } catch {
      return '';
    }
  }
  if (mimetype === 'text/plain' || filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8').substring(0, 5000);
  }
  return '';
}

// ─── GET /api/assignments ────────────────────────────────────────────────────
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-fileContent');
    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// ─── POST /api/assignments ───────────────────────────────────────────────────
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, subject, branch, dueDate, questionTypes, additionalInstructions } = req.body;

    // Validate
    if (!title || !subject || !dueDate || !questionTypes) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    let parsedQuestionTypes;
    try {
      parsedQuestionTypes = typeof questionTypes === 'string'
        ? JSON.parse(questionTypes)
        : questionTypes;
    } catch {
      res.status(400).json({ success: false, error: 'Invalid questionTypes format' });
      return;
    }

    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      res.status(400).json({ success: false, error: 'At least one question type required' });
      return;
    }

    for (const qt of parsedQuestionTypes) {
      if (!qt.type || !qt.count || !qt.marks || qt.count < 1 || qt.marks < 1) {
        res.status(400).json({ success: false, error: 'Each question type must have type, count ≥ 1, marks ≥ 1' });
        return;
      }
    }

    // Handle file upload
    let fileUrl: string | undefined;
    let fileContent: string | undefined;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileContent = await extractFileContent(req.file.path, req.file.mimetype);
    }

    // Create assignment
    const assignment = await Assignment.create({
      title,
      subject,
      branch: branch || '',
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      additionalInstructions,
      fileUrl,
      fileContent,
      status: 'pending',
      userId: req.user?.userId,
    });

    // Enqueue BullMQ job
    const queue = getGenerationQueue();
    const job = await queue.add('generate', { assignmentId: assignment._id.toString() });

    // Store jobId
    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    res.status(201).json({
      success: true,
      data: { ...assignment.toObject(), jobId: job.id },
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

// ─── GET /api/assignments/:id ────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id).select('-fileContent');
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    res.json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

// ─── DELETE /api/assignments/:id ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }
    await Result.deleteMany({ assignmentId: req.params.id });
    const redisClient = getRedisClient();
    await redisClient.del(`result:${req.params.id}`);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
});

// ─── GET /api/assignments/:id/result ────────────────────────────────────────
router.get('/:id/result', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const redisClient = getRedisClient();

    // Try Redis cache first
    const cached = await redisClient.get(`result:${id}`);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached), fromCache: true });
      return;
    }

    // Fallback to MongoDB
    const result = await Result.findOne({ assignmentId: id });
    if (!result) {
      res.status(404).json({ success: false, error: 'Result not found' });
      return;
    }

    // Repopulate cache
    await redisClient.setex(`result:${id}`, 86400, JSON.stringify(result.toObject()));

    res.json({ success: true, data: result, fromCache: false });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch result' });
  }
});

// ─── POST /api/assignments/:id/regenerate ────────────────────────────────────
router.post('/:id/regenerate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    // Reset status
    await Assignment.findByIdAndUpdate(id, { status: 'pending', errorMessage: undefined });

    // Invalidate cache
    const redisClient = getRedisClient();
    await redisClient.del(`result:${id}`);

    // Enqueue new job
    const queue = getGenerationQueue();
    const job = await queue.add('generate', { assignmentId: id });
    await Assignment.findByIdAndUpdate(id, { jobId: job.id });

    res.json({ success: true, message: 'Regeneration queued', jobId: job.id });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to queue regeneration' });
  }
});

export default router;
