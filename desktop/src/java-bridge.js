const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const BACK_DIR = path.join(ROOT, "back");
const TARGET_DIR = path.join(BACK_DIR, "target");
const JAR_PREFIX = "dentura-api-";
const DEFAULT_PORT = Number(process.env.PORT || 8080);
const HEALTH_URL = `http://127.0.0.1:${DEFAULT_PORT}/api/health`;
const TOOLING_JAVA = path.join(
  os.homedir(),
  ".local/share/dentura-tooling/jdk-21/bin/java",
);
const TOOLING_MVN = path.join(
  os.homedir(),
  ".local/share/dentura-tooling/maven/bin/mvn",
);

function resolveJavaBin() {
  if (process.env.JAVA_HOME) {
    const candidate = path.join(
      process.env.JAVA_HOME,
      "bin",
      process.platform === "win32" ? "java.exe" : "java",
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  if (fs.existsSync(TOOLING_JAVA)) return TOOLING_JAVA;
  return process.platform === "win32" ? "java.exe" : "java";
}

function resolveMvnBin() {
  if (fs.existsSync(TOOLING_MVN)) return TOOLING_MVN;
  return process.platform === "win32" ? "mvn.cmd" : "mvn";
}

function findJar() {
  if (!fs.existsSync(TARGET_DIR)) return null;
  const jars = fs
    .readdirSync(TARGET_DIR)
    .filter(
      (name) =>
        name.startsWith(JAR_PREFIX) &&
        name.endsWith(".jar") &&
        !name.endsWith(".jar.original"),
    )
    .map((name) => ({
      name,
      full: path.join(TARGET_DIR, name),
      mtime: fs.statSync(path.join(TARGET_DIR, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return jars[0]?.full ?? null;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: options.stdio ?? "inherit",
      shell: options.shell ?? false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function ensureJar({ rebuild = false } = {}) {
  const existing = findJar();
  if (existing && !rebuild) {
    console.log(`[dentura] Using JAR: ${existing}`);
    return existing;
  }

  console.log("[dentura] Compiling backend JAR with Maven…");
  const mvn = resolveMvnBin();
  const javaHome =
    process.env.JAVA_HOME ||
    (fs.existsSync(path.dirname(path.dirname(TOOLING_JAVA)))
      ? path.join(os.homedir(), ".local/share/dentura-tooling/jdk-21")
      : undefined);

  await run(mvn, ["-DskipTests", "package"], {
    cwd: BACK_DIR,
    env: javaHome ? { JAVA_HOME: javaHome } : {},
  });

  const jar = findJar();
  if (!jar) {
    throw new Error("JAR not found after Maven package in back/target/");
  }
  console.log(`[dentura] JAR ready: ${jar}`);
  return jar;
}

function probeHealth(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve(res.statusCode === 200);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForHealth(timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await probeHealth()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/**
 * Starts the Spring Boot JAR if health is not already UP.
 * Returns { process, alreadyRunning }.
 */
async function startBackend({ rebuild = false } = {}) {
  if (await probeHealth()) {
    console.log(`[dentura] API already up at ${HEALTH_URL}`);
    return { process: null, alreadyRunning: true, port: DEFAULT_PORT };
  }

  const jar = await ensureJar({ rebuild });
  const javaBin = resolveJavaBin();
  const dbPath = process.env.DENTURA_DB_PATH || path.join(BACK_DIR, "data", "dentura.db");

  console.log(`[dentura] Starting: ${javaBin} -jar ${jar}`);
  const child = spawn(javaBin, ["-jar", jar], {
    cwd: BACK_DIR,
    env: {
      ...process.env,
      PORT: String(DEFAULT_PORT),
      DENTURA_DB_PATH: dbPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (buf) => process.stdout.write(`[jar] ${buf}`));
  child.stderr.on("data", (buf) => process.stderr.write(`[jar] ${buf}`));
  child.on("exit", (code, signal) => {
    console.log(`[dentura] JAR process exited code=${code} signal=${signal}`);
  });

  const ok = await waitForHealth();
  if (!ok) {
    child.kill("SIGTERM");
    throw new Error(`API did not become healthy at ${HEALTH_URL}`);
  }

  console.log(`[dentura] API ready at ${HEALTH_URL}`);
  return { process: child, alreadyRunning: false, port: DEFAULT_PORT };
}

function stopBackend(child) {
  if (!child || child.killed) return;
  console.log("[dentura] Stopping JAR…");
  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) child.kill("SIGKILL");
  }, 4000);
}

function uiUrl(port = DEFAULT_PORT) {
  return process.env.DENTURA_UI_URL || `http://127.0.0.1:${port}/`;
}

module.exports = {
  BACK_DIR,
  DEFAULT_PORT,
  HEALTH_URL,
  ensureJar,
  startBackend,
  stopBackend,
  uiUrl,
};
