// jobs/queue.js
import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL);

export const riskQueue = new Queue("risk-evaluation", { connection });

export const enqueueRiskEvaluation = async (data) => {
  await riskQueue.add("evaluate", data);
};

// whole jobs is for risk evaluation queueing in after filling business listing form but currently not in use due to no verification requirements
