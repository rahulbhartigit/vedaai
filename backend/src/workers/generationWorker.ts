import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { GENERATION_QUEUE } from '../config/bullmq';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { User } from '../models/User';
import { generateQuestionPaper } from '../services/aiService';
import { notifyAssignment } from '../services/wsService';

export interface GenerationJobData {
  assignmentId: string;
}

const RESULT_CACHE_TTL = 60 * 60 * 24; // 24 hours

export const startGenerationWorker = (): Worker => {
  const worker = new Worker<GenerationJobData>(
    GENERATION_QUEUE,
    async (job: Job<GenerationJobData>) => {
      const { assignmentId } = job.data;
      console.log(`🔧 Processing job ${job.id} for assignment ${assignmentId}`);

      // Update status → processing
      const assignment = await Assignment.findByIdAndUpdate(
        assignmentId,
        { status: 'processing' },
        { returnDocument: 'after' }
      );

      if (!assignment) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }

      // Notify frontend: processing started
      notifyAssignment(assignmentId, {
        type: 'job:processing',
        message: 'AI is generating your question paper...',
      });

      // Generate via AI (Groq primary / Gemini fallback)
      const paper = await generateQuestionPaper({
        title: assignment.title,
        subject: assignment.subject,
        branch: assignment.branch || '',
        questionTypes: assignment.questionTypes,
        additionalInstructions: assignment.additionalInstructions,
        fileContent: assignment.fileContent,
      });

      // Resolve school name from user who created this assignment
      let schoolName = '';
      if (assignment.userId) {
        const user = await User.findById(assignment.userId).select('schoolName');
        schoolName = user?.schoolName || '';
      }

      // Delete previous result if any (for regeneration)
      await Result.deleteMany({ assignmentId });

      // Save new result to MongoDB
      const result = await Result.create({
        assignmentId,
        sections: paper.sections,
        totalMarks: paper.totalMarks,
        totalQuestions: paper.totalQuestions,
        subject: assignment.subject,
        title: assignment.title,
        branch: assignment.branch || '',
        schoolName,
      });

      // Cache result in Redis
      await getRedisClient().setex(
        `result:${assignmentId}`,
        RESULT_CACHE_TTL,
        JSON.stringify(result.toObject())
      );

      // Update assignment status → done
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'done',
        $unset: { errorMessage: 1 },
      });

      // Notify frontend: done
      notifyAssignment(assignmentId, {
        type: 'job:done',
        message: 'Question paper is ready!',
        resultId: result._id.toString(),
      });

      console.log(`✅ Job ${job.id} completed for assignment ${assignmentId}`);
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
    }
  );

  worker.on('failed', async (job, err) => {
    if (!job) return;
    const { assignmentId } = job.data;
    console.error(`❌ Job ${job.id} failed:`, err.message);

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      errorMessage: err.message,
    }, { returnDocument: 'after' });

    notifyAssignment(assignmentId, {
      type: 'job:failed',
      message: 'Generation failed. Please try again.',
      error: err.message,
    });
  });

  worker.on('ready', () => console.log('🚀 BullMQ worker ready'));

  return worker;
};
