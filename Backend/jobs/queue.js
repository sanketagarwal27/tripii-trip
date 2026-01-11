// jobs/queue.js
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL);

export const riskQueue = new Queue("risk-evaluation", { connection });

export const enqueueRiskEvaluation = async (data) => {
  await riskQueue.add("evaluate", data);
};
