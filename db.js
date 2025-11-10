const { Pool } = require("pg");

// Conexão com Neon PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_b8rBOXkvDRU4@ep-solitary-fire-ad42v748-pooler.c-2.us-east-1.aws.neon.tech/jarmor?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
