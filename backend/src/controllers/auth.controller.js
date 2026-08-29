const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const userModel = require("../models/user.model");
const { socialAccounts, newId } = require("../data/store");

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "changeme_access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "changeme_refresh_secret";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || "member" },
    JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m", algorithm: "HS256" }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
    algorithm: "HS256",
  });
}

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
  }

  const existing = await userModel.findByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await userModel.create({
    email: parsed.data.email,
    passwordHash,
    name: parsed.data.name,
    role: "member",
  });

  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password format" });
  }

  let user = await userModel.findByEmail(parsed.data.email);

  // If demo user doesn't exist yet, seed demo user
  if (!user && parsed.data.email === "demo@example.com") {
    const passwordHash = await bcrypt.hash("password123", 10);
    user = await userModel.create({
      email: "demo@example.com",
      passwordHash,
      name: "Tanaka Chidemo",
      role: "admin",
    });
  }

  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  });
}

async function demoLogin(req, res) {
  let user = await userModel.findByEmail("demo@example.com");
  if (!user) {
    const passwordHash = await bcrypt.hash("password123", 10);
    user = await userModel.create({
      email: "demo@example.com",
      passwordHash,
      name: "Tanaka Chidemo (Demo)",
      role: "admin",
    });
  }

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  });
}

async function me(req, res) {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.json({ user: { id: req.user.id, email: req.user.email, name: "User", role: req.user.role } });
  }
  return res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "refreshToken is required" });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    const user = await userModel.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    return res.json({ accessToken: signAccessToken(user) });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

async function logout(req, res) {
  return res.status(200).json({ message: "Logged out successfully" });
}

async function startMetaOAuth(req, res) {
  const stateToken = crypto
    .createHmac("sha256", JWT_ACCESS_SECRET)
    .update(`${req.user.id}:${Date.now()}`)
    .digest("hex");

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID || "demo_meta_app_id",
    redirect_uri: process.env.META_REDIRECT_URI || "http://localhost:4000/api/v1/auth/oauth/meta/callback",
    scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
    response_type: "code",
    state: `${req.user.id}_${stateToken}`,
  });

  return res.redirect(`https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`);
}

async function handleMetaOAuthCallback(req, res) {
  const { state } = req.query;
  const userId = state ? state.split("_")[0] : null;

  if (userId) {
    socialAccounts.push({
      id: newId("sa"),
      ownerId: userId,
      platform: "facebook",
      externalAccountId: `fb_page_${Date.now()}`,
      displayName: "Connected Facebook Page",
      linkedAt: new Date().toISOString(),
    });
  }

  return res.redirect("http://localhost:3000/dashboard/accounts?connected=facebook");
}

async function connectMockAccount(req, res) {
  const { platform, displayName, handle } = req.body;
  if (!platform) return res.status(400).json({ error: "platform is required" });

  const extId = handle || `${platform}_${Date.now()}`;
  const name = displayName || `${platform.toUpperCase()} Account (@${extId})`;

  const account = {
    id: newId("sa"),
    ownerId: req.user.id,
    platform,
    externalAccountId: extId,
    displayName: name,
    linkedAt: new Date().toISOString(),
  };
  socialAccounts.push(account);

  return res.status(201).json(account);
}

async function notImplemented(req, res) {
  return res.status(501).json({ error: "OAuth provider not configured for live redirect" });
}

module.exports = {
  register,
  login,
  demoLogin,
  me,
  refresh,
  logout,
  startMetaOAuth,
  handleMetaOAuthCallback,
  connectMockAccount,
  notImplemented,
};
