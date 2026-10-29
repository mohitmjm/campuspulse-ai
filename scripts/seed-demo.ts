import { PrismaClient } from "@prisma/client";
import { loadScenario, type ScenarioId } from "../lib/simulation";

const db = new PrismaClient();
const id = (process.argv[2] ?? "base") as ScenarioId;
loadScenario(db, id)
  .then((r) => console.log(`Loaded SIMULATED scenario "${id}":`, r))
  .finally(() => db.$disconnect());
