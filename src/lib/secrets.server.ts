import { readFileSync } from "node:fs";
import { join } from "node:path";

let loaded = false;

/** Load gitignored server keys into process.env. Never sent to the browser. */
export function ensureSecrets() {
  if (loaded) return;
  loaded = true;
  try {
    const text = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no local env file */
  }
}
