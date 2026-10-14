// Applies SQL files in supabase/migrations to the database in SUPABASE_DB_URL,
// in filename order, recording each one so it only runs once.
//
// Usage: npm run db:migrate   (reads .env.local)

import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import pg from "pg"

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error("SUPABASE_DB_URL is not set. Add it to .env.local (Supabase > Connect > Session pooler URI).")
  process.exit(1)
}

const migrationsDir = path.resolve("supabase/migrations")
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })

async function main() {
  await client.connect()
  await client.query(`
    create schema if not exists app_private;
    create table if not exists app_private.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `)

  const applied = new Set(
    (await client.query("select name from app_private.schema_migrations")).rows.map((row) => row.name),
  )
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort()
  const pending = files.filter((file) => !applied.has(file))

  if (pending.length === 0) {
    console.log("Database is up to date.")
    return
  }

  for (const file of pending) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8")
    process.stdout.write(`Applying ${file} ... `)
    try {
      await client.query("begin")
      await client.query(sql)
      await client.query("insert into app_private.schema_migrations (name) values ($1)", [file])
      await client.query("commit")
      console.log("done")
    } catch (error) {
      await client.query("rollback")
      console.log("failed")
      throw error
    }
  }
  console.log(`Applied ${pending.length} migration(s).`)
}

main()
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(() => client.end())
