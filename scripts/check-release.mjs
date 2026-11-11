import { readFileSync } from "node:fs";
const metadata = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(metadata.version))
  throw new Error(
    "Local review package: publishing requires an explicitly authorized release version.",
  );
