const { Pool } = require('pg');

// DATABASE_URL looks like:
// postgres://user:password@host:5432/dbname
// If you're pointing this at a Supabase Postgres instance, use the
// "Connection string" from Project Settings > Database (not the anon key —
// this backend talks to Postgres directly, not through Supabase's API).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

module.exports = pool;
