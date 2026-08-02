const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

let url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  url = `file:${path.join(dataDir, 'training.db')}`;
}

const client = createClient({ url, authToken });

function toPlainRows(res) {
  return res.rows;
}

async function all(sql, args = []) {
  const res = await client.execute({ sql, args });
  return toPlainRows(res);
}

async function get(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows[0];
}

async function run(sql, args = []) {
  const res = await client.execute({ sql, args });
  return {
    lastInsertRowid: res.lastInsertRowid === undefined ? undefined : Number(res.lastInsertRowid),
    changes: res.rowsAffected,
  };
}

async function batch(statements) {
  if (statements.length === 0) return;
  await client.batch(statements, 'write');
}

async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.executeMultiple(schema);
}

module.exports = { client, all, get, run, batch, initSchema };
