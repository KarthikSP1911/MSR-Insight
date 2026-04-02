import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function introspect() {
  console.log("Connecting pool...");
  const client = await pool.connect();
  console.log("Connected.");
  try {
    console.log("Analyzing Database Tables...");
    
    // 1. List all tables
    const tablesRes = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      AND table_type = 'BASE TABLE'
    `);

    for (const table of tablesRes.rows) {
      console.log(`\n\n--- TABLE: ${table.table_schema}.${table.table_name} ---`);

      // 2. Column details
      console.log("\nCOLUMNS:");
      const columnsRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [table.table_schema, table.table_name]);
      console.table(columnsRes.rows);

      // 3. Primary Key
      const pkRes = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1 AND tc.table_name = $2
      `, [table.table_schema, table.table_name]);
      console.log("Primary Key(s):", pkRes.rows.map(p => p.column_name).join(", ") || "None");

      // 4. Foreign Keys
      const fkRes = await client.query(`
        SELECT
            kcu.column_name as column,
            ccu.table_schema AS f_schema,
            ccu.table_name AS f_table,
            ccu.column_name AS f_column
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1 AND tc.table_name = $2
      `, [table.table_schema, table.table_name]);
      if (fkRes.rows.length > 0) {
        console.log("Foreign Keys:");
        console.table(fkRes.rows);
      }

      // 5. Indexes (excluding PK)
      const indexRes = await client.query(`
        SELECT
            indexname,
            indexdef
        FROM
            pg_indexes
        WHERE
            schemaname = $1 AND tablename = $2
            AND indexname NOT LIKE '%_pkey'
      `, [table.table_schema, table.table_name]);
      if (indexRes.rows.length > 0) {
        console.log("Indexes:");
        console.table(indexRes.rows);
      }
    }

  } catch (e) {
    console.error("Error during introspection:", e);
  } finally {
    client.release();
    await pool.end();
  }
}

introspect();
