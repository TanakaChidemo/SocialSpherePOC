const crypto = require("crypto");
const bcrypt = require("bcrypt");

// -----------------------------------------------------------------------------
// All application data for this stage of the project lives here, in memory.
// There is no database. Restarting the server resets everything back to the
// seed data below — that's expected and fine for a workflow demo.
// -----------------------------------------------------------------------------

const DEMO_USER_ID = "11111111-1111-1111-1111-111111111111";

const users = [
  {
    id: DEMO_USER_ID,
    email: "demo@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    name: "Tanaka Chidemo",
    role: "admin",
  },
];

const socialAccounts = [
  {
    id: "sa_instagram_demo",
    ownerId: DEMO_USER_ID,
    platform: "instagram",
    externalAccountId: "ig_techpulse_studio",
    displayName: "TechPulse Studio (@techpulse.studio)",
    linkedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "sa_facebook_demo",
    ownerId: DEMO_USER_ID,
    platform: "facebook",
    externalAccountId: "fb_techpulse_global",
    displayName: "TechPulse Global Page",
    linkedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const contentDrafts = [
  {
    _id: "draft_1",
    ownerId: DEMO_USER_ID,
    title: "Product Launch Announcement",
    body: "🚀 Big news! We are officially rolling out AI Analytics 2.0 today. Try it out!",
    platforms: ["instagram", "facebook"],
    mediaUrls: [],
    status: "draft",
    aiMetadata: {},
    versions: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const scheduledPosts = [];

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

module.exports = { users, socialAccounts, contentDrafts, scheduledPosts, newId, DEMO_USER_ID };
