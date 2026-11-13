// Sekali sebelum semua tes: kosongkan database UJI lalu muat tests/schema.sql.
const fs = require('fs');
const { Client } = require('pg');
const { ready, reason, schemaPath } = require('./ready');

module.exports = async () => {
  if (!ready) {
    console.warn(`\n[tests] Tes yang membutuhkan database DILEWATI: ${reason}\n`);
    return;
  }
  const client = new Client({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST
  });
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    // Buang meta-command psql (\restrict, \connect, dst.) yang tidak dimengerti driver
    const sql = fs.readFileSync(schemaPath, 'utf8')
      .split('\n').filter(l => !l.startsWith('\\')).join('\n');
    await client.query(sql);
  } finally {
    await client.end();
  }
};
