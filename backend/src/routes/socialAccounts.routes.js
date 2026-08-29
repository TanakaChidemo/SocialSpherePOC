const express = require("express");
const controller = require("../controllers/socialAccounts.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.link);
router.delete("/:id", controller.unlink);

module.exports = router;
