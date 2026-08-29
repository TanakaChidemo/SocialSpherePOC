const express = require("express");
const aiController = require("../controllers/ai.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.post("/generate-caption", aiController.generateCaption);
router.post("/suggest-hashtags", aiController.suggestHashtags);
router.post("/repurpose", aiController.repurposeContent);

module.exports = router;
