const { users, newId } = require("../data/store");

async function findByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

async function findById(id) {
  return users.find((u) => u.id === id) || null;
}

async function create({ email, passwordHash, name, role = "member" }) {
  const user = { id: newId("user"), email, passwordHash, name, role };
  users.push(user);
  return user;
}

module.exports = { findByEmail, findById, create };
