#!/usr/bin/env node
import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

// Use DIRECT_URL for migrations to bypass Supabase connection pooler
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL or DIRECT_URL not configured");
  process.exit(1);
}

const client = new Client({ connectionString });

async function runMigration(migrationName) {
  try {
    await client.connect();
    console.log(`📦 Connected to database`);

    const projectRoot = path.resolve(".");
    const migrationDir = path.join(projectRoot, "prisma", "migrations", migrationName);

    const migrationFile = path.join(migrationDir, "migration.sql");

    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, "utf-8");
    console.log(`📋 Running migration: ${migrationName}`);

    await client.query(sql);
    console.log(`✅ Migration applied successfully`);

    // Try to record the migration in _prisma_migrations table (may not exist yet)
    try {
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
         VALUES ($1, $2, NOW(), $3, $4, NULL, NOW(), 1)
         ON CONFLICT DO NOTHING`,
        [
          `${Date.now()}`,
          "0", // checksum not calculated, just use 0
          migrationName,
          "Applied via script",
        ]
      );
      console.log(`✅ Migration recorded in _prisma_migrations`);
    } catch (err) {
      if (err.message.includes("_prisma_migrations") || err.message.includes("does not exist")) {
        console.log(`ℹ️  _prisma_migrations table not initialized (will be created by Prisma)`);
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error("❌ Error running migration:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationName = process.argv[2] || "20260425_expand_content_sources_and_answer_uniques";
await runMigration(migrationName);
