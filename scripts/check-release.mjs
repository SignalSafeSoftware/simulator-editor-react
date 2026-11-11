import { readFileSync } from "node:fs";
const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
if (metadata.version.includes("-local."))
  throw new Error(
    "Local review package: publishing requires an explicitly authorized release version.",
  );
