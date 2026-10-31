const fs = require("fs");
const { spawnSync } = require("child_process");

const SKIP = new Set(["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD"]);
const OVERRIDE = { BETTER_AUTH_URL: "https://soft4u.top", NEXT_PUBLIC_APP_URL: "https://soft4u.top" };

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
Object.assign(env, OVERRIDE);

const run = (args, input) =>
  spawnSync("vercel.cmd", args, { input, encoding: "utf8", shell: true, cwd: __dirname });

let ok = 0;
for (const [key, value] of Object.entries(env)) {
  if (SKIP.has(key) || !value) continue;
  run(["env", "rm", key, "production", "--yes"]);
  const r = run(["env", "add", key, "production"], value);
  const good = r.status === 0;
  if (good) ok++;
  console.log(`${good ? "OK  " : "FAIL"} ${key} (len ${value.length})${good ? "" : " " + (r.stderr || r.stdout).split("\n").slice(-2).join(" ")}`);
}
console.log(`done: ${ok} added`);
