// Switches prisma/schema.prisma from SQLite to PostgreSQL for production (e.g. Neon free tier).
// Usage: npm run use:postgres  →  set DATABASE_URL=postgresql://...  →  npx prisma db push
import { readFileSync, writeFileSync } from "node:fs";

const path = "prisma/schema.prisma";
const schema = readFileSync(path, "utf8");
if (schema.includes('provider = "postgresql"')) {
  console.log("Already using PostgreSQL.");
} else {
  writeFileSync(path, schema.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log("Switched datasource to PostgreSQL. Set DATABASE_URL and run `npx prisma db push`.");
}
