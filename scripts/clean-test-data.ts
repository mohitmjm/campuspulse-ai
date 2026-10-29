// Removes records created by automated tests (emails ending in .test) from the current database.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
(async () => {
  const r = await db.registration.deleteMany({ where: { isDemo: false, emailNorm: { endsWith: ".test" } } });
  const a = await db.ambassador.deleteMany({ where: { isDemo: false, emailNorm: { endsWith: ".test" } } });
  const e = await db.event.deleteMany({ where: { isDemo: false } });
  console.log(`Removed ${r.count} registrations, ${a.count} ambassadors, ${e.count} events`);
  await db.$disconnect();
})();
