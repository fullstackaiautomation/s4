import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const outDir = join(process.cwd(), "out");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, ".nojekyll"), "");
