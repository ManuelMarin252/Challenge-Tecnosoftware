
const { Client } = require('pg');
require('dotenv').config({ path: 'c:/repositorios/Challenge-Tecnosoftware/backend/src/common/envs/development.env' }); // Adjust path if needed

async function run() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'ecommerce',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'inventory'::regclass;
    `);
    console.log('Constraints on inventory table:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
