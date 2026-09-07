import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LINES } from "../src/data/lines.ts";
import { RAKE_TEMPLATES } from "../src/data/rakes.ts";
import { STATIONS } from "../src/data/stations.ts";
import { allGeometries } from "../src/lib/transit/geometry.ts";
import { buildSeedTimetable } from "../src/lib/transit/simulator.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data");
mkdirSync(dir, { recursive: true });

function write(name: string, value: unknown) {
  writeFileSync(join(dir, name), JSON.stringify(value, null, 2) + "\n");
  console.log("wrote", name);
}

write("stations.json", STATIONS);
write("lines.json", LINES);
write("rakes.json", RAKE_TEMPLATES);
write("geometry.json", allGeometries());
write("timetable.seed.json", buildSeedTimetable());
console.log("seed complete", STATIONS.length, "stations");
