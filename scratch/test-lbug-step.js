import lbug from '@ladybugdb/core';
import { SCHEMA_QUERIES } from '../node_modules/gitnexus/dist/core/lbug/schema.js';
import fs from 'fs/promises';
import path from 'path';

async function test() {
  const dbPath = 'C:/Users/thanh/OneDrive/Documents/Project/GoiFlow/.gitnexus/test_lbug_db_step';
  
  try {
    console.log("Step 1: Removing old DB file...");
    try {
      await fs.unlink(dbPath);
      await fs.unlink(dbPath + '.wal');
      await fs.unlink(dbPath + '.lock');
    } catch {}
    
    console.log("Step 2: Creating new lbug.Database...");
    const db = new lbug.Database(dbPath);
    console.log("Step 2 completed. DB object created.");
    
    console.log("Step 3: Creating lbug.Connection...");
    const conn = new lbug.Connection(db);
    console.log("Step 3 completed. Connection object created.");
    
    console.log("Step 4: Running schema queries...");
    for (let i = 0; i < SCHEMA_QUERIES.length; i++) {
      const q = SCHEMA_QUERIES[i];
      console.log(`Running query ${i + 1}/${SCHEMA_QUERIES.length}: ${q.trim().split('\n')[0]}...`);
      try {
        await conn.query(q);
        console.log(`Query ${i + 1} succeeded.`);
      } catch (err) {
        console.log(`Query ${i + 1} error:`, err.message);
      }
    }
    
    console.log("Step 5: Installing/loading VECTOR extension...");
    try {
      await conn.query('INSTALL VECTOR');
      console.log("VECTOR installed.");
      await conn.query('LOAD EXTENSION VECTOR');
      console.log("VECTOR loaded.");
    } catch (err) {
      console.log("VECTOR extension error:", err.message);
    }
    
    console.log("Step 6: Closing connection and DB...");
    await conn.close();
    await db.close();
    console.log("All steps completed successfully!");
  } catch (err) {
    console.error("Crash caught in try-catch:", err);
  }
}
test();
