const express = require("express");
const publishController = require("../controllers/publish.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/now", publishController.publishNow);
router.get("/status/:scheduledPostId", publishController.getStatus);

module.exports = router;
