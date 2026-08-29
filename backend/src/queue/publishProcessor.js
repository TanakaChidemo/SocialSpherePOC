const logger = require("../config/logger");
const { scheduledPosts } = require("../data/store");
const metaPublisher = require("../services/publishers/metaPublisher");

/**
 * In-memory async job processor for publishing content.
 * jobData shape: { postId, platform, contentDraftId, content, mediaUrls, socialAccountId }
 */
async function processPublishJob(job) {
  const data = job.data || job;
  const { platform, postId } = data;
  logger.info({ postId, platform }, "Processing publish job");

  const post = scheduledPosts.find((p) => p.id === postId);

  try {
    let result;
    switch (platform) {
      case "facebook":
      case "instagram":
        result = await metaPublisher.publish(data);
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const externalPostId = result.externalId || `ext_${platform}_${Date.now()}`;

    if (post) {
      post.status = "published";
      post.externalPostId = externalPostId;
      post.errorMessage = null;
      post.updatedAt = new Date().toISOString();
    }

    logger.info({ postId, platform, externalPostId }, "Publish job completed successfully");
    return result;
  } catch (err) {
    logger.error({ postId, platform, err: err.message }, "Publish job failed");

    if (post) {
      post.status = "failed";
      post.errorMessage = err.message || "Publishing failed";
      post.updatedAt = new Date().toISOString();
    }

    throw err;
  }
}

module.exports = { processPublishJob };
