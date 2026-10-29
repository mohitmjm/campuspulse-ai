// Runs before `next build`. When DATABASE_URL is a Postgres URL (e.g. Neon on Vercel), it switches the
// Prisma datasource to PostgreSQL and syncs the schema. Locally (SQLite URL) it does nothing.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.log("prepare-db: SQLite/local database — nothing to do.");
  process.exit(0);
}

const path = "prisma/schema.prisma";
let schema = readFileSync(path, "utf8");
schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
// Neon: the app uses the pooled URL; schema changes need the direct (unpooled) connection.
if (process.env.DATABASE_URL_UNPOOLED && !schema.includes("directUrl")) {
  schema = schema.replace('url      = env("DATABASE_URL")', 'url       = env("DATABASE_URL")\n  directUrl = env("DATABASE_URL_UNPOOLED")');
}
writeFileSync(path, schema);
console.log("prepare-db: using PostgreSQL" + (process.env.DATABASE_URL_UNPOOLED ? " (direct URL for schema sync)" : ""));

// `db push` is additive here and refuses destructive changes without --accept-data-loss.
execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
