const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Local auth
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/demo", authController.demoLogin);
router.get("/me", requireAuth, authController.me);
router.post("/refresh", authController.refresh);
router.post("/logout", requireAuth, authController.logout);

// Social account linking
router.post("/connect-mock", requireAuth, authController.connectMockAccount);
router.get("/oauth/meta", requireAuth, authController.startMetaOAuth);
router.get("/oauth/meta/callback", authController.handleMetaOAuthCallback);
router.get("/oauth/linkedin", requireAuth, authController.notImplemented);
router.get("/oauth/twitter", requireAuth, authController.notImplemented);

module.exports = router;
