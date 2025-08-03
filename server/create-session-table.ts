import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './db';

async function createSessionTable() {
  try {
    console.log('Creating session table...');
    
    // Create the session table as expected by connect-pg-simple
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar(255) NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);
    `);
    
    // Create index on expire column for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    
    console.log('Session table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating session table:', error);
    process.exit(1);
  }
}

createSessionTable();
