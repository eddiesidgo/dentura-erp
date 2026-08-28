const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const FRONT_DIR = path.join(ROOT, "front");
const DEFAULT_VITE_URL = "http://localhost:5173/";

function isViteDevUrl(url) {
  try {
    const parsed = new URL(url);
    const port = parsed.port || (parsed.protocol === "https:" ? "443" : "80");
    return (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      port === "5173"
    );
  } catch {
    return false;
  }
}

function probeUrl(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForUrl(url, timeoutMs = 60000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await probeUrl(url)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/**
 * Ensures the Vite dev server is reachable. Starts `npm start` in front/ if needed.
 * Returns { process, alreadyRunning }.
 */
async function ensureViteDevServer(url = DEFAULT_VITE_URL) {
  if (!isViteDevUrl(url)) {
    return { process: null, alreadyRunning: true };
  }

  if (await probeUrl(url)) {
    console.log(`[dentura] Vite already up at ${url}`);
    return { process: null, alreadyRunning: true };
  }

  console.log("[dentura] Starting Vite dev server in front/…");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(npm, ["start"], {
    cwd: FRONT_DIR,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  child.stdout.on("data", (buf) => process.stdout.write(`[vite] ${buf}`));
  child.stderr.on("data", (buf) => process.stderr.write(`[vite] ${buf}`));
  child.on("exit", (code, signal) => {
    console.log(`[dentura] Vite process exited code=${code} signal=${signal}`);
  });

  const ok = await waitForUrl(url);
  if (!ok) {
    child.kill("SIGTERM");
    throw new Error(`Vite dev server did not start at ${url}`);
  }

  console.log(`[dentura] Vite ready at ${url}`);
  return { process: child, alreadyRunning: false };
}

function stopVite(child) {
  if (!child || child.killed) return;
  console.log("[dentura] Stopping Vite…");
  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) child.kill("SIGKILL");
  }, 3000);
}

module.exports = {
  DEFAULT_VITE_URL,
  FRONT_DIR,
  ensureViteDevServer,
  isViteDevUrl,
  stopVite,
};
