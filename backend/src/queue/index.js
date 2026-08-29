const logger = require("../config/logger");
const { processPublishJob } = require("./publishProcessor");

const inMemoryDelayedTimers = new Map();

async function initQueues() {
  logger.info("In-memory publish job scheduler initialized");
}

/**
 * Enqueue a scheduled or immediate publish job.
 * @param {object} payload - { postId, platform, contentDraftId, socialAccountId }
 * @param {object} opts - { delay }
 */
async function enqueuePublishJob(payload, opts = {}) {
  const delay = typeof opts.delay === "number" && !isNaN(opts.delay) ? Math.max(0, opts.delay) : 0;

  if (delay === 0) {
    setImmediate(() => {
      processPublishJob({ id: `job_${Date.now()}`, data: payload }).catch((err) => {
        logger.error({ err, payload }, "In-memory immediate publish job failed");
      });
    });
  } else {
    if (inMemoryDelayedTimers.has(payload.postId)) {
      clearTimeout(inMemoryDelayedTimers.get(payload.postId));
    }
    const timer = setTimeout(() => {
      inMemoryDelayedTimers.delete(payload.postId);
      processPublishJob({ id: `delayed_${Date.now()}`, data: payload }).catch((err) => {
        logger.error({ err, payload }, "In-memory delayed publish job failed");
      });
    }, delay);
    inMemoryDelayedTimers.set(payload.postId, timer);
  }

  return { id: `mem_job_${Date.now()}`, data: payload, delay };
}

module.exports = { initQueues, enqueuePublishJob };
