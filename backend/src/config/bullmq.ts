import { Queue } from 'bullmq';
import { getRedisClient } from './redis';

export const GENERATION_QUEUE = 'question-generation';

let generationQueue: Queue;

export const getGenerationQueue = (): Queue => {
  if (!generationQueue) {
    generationQueue = new Queue(GENERATION_QUEUE, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return generationQueue;
};
