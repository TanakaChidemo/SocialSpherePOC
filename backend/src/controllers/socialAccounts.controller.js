const { socialAccounts, newId } = require("../data/store");

async function list(req, res) {
  const items = socialAccounts
    .filter((a) => a.ownerId === req.user.id)
    .sort((a, b) => new Date(b.linkedAt) - new Date(a.linkedAt));
  return res.json({ items });
}

async function link(req, res) {
  const { platform, displayName, handle } = req.body;
  if (!platform) return res.status(400).json({ error: "Platform is required" });

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

async function unlink(req, res) {
  const idx = socialAccounts.findIndex((a) => a.id === req.params.id && a.ownerId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Social account not found" });

  socialAccounts.splice(idx, 1);
  return res.status(204).send();
}

module.exports = { list, link, unlink };
