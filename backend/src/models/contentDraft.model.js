const { contentDrafts, newId } = require("../data/store");

async function find({ ownerId } = {}) {
  return contentDrafts.filter((d) => !ownerId || d.ownerId === ownerId);
}

async function findOne({ _id, ownerId } = {}) {
  const draft = contentDrafts.find((d) => (!_id || d._id === _id) && (!ownerId || d.ownerId === ownerId));
  return draft || null;
}

async function findById(id) {
  return contentDrafts.find((d) => d._id === id) || null;
}

async function create(data) {
  const draft = {
    _id: newId("draft"),
    title: data.title || "Untitled Draft",
    body: data.body || "",
    platforms: data.platforms || [],
    mediaUrls: data.mediaUrls || [],
    status: data.status || "draft",
    aiMetadata: data.aiMetadata || {},
    versions: data.versions || [],
    ownerId: data.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  contentDrafts.unshift(draft);
  return draft;
}

// Mutates a draft object in place and stamps updatedAt — mirrors how the
// controller calls `draft.save()` on the object it already has a reference to.
async function save(draft) {
  draft.updatedAt = new Date().toISOString();
  return draft;
}

async function deleteOne({ _id, ownerId } = {}) {
  const idx = contentDrafts.findIndex((d) => (!_id || d._id === _id) && (!ownerId || d.ownerId === ownerId));
  if (idx === -1) return { deletedCount: 0 };
  contentDrafts.splice(idx, 1);
  return { deletedCount: 1 };
}

module.exports = { find, findOne, findById, create, save, deleteOne };
