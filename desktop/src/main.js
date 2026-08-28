const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { startBackend, stopBackend, uiUrl } = require("./java-bridge");
const { ensureViteDevServer, stopVite } = require("./vite-bridge");

let mainWindow = null;
let jarProcess = null;
let viteProcess = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Dentura ERP",
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const url = uiUrl();
  console.log(`[dentura] Loading UI: ${url}`);
  await mainWindow.loadURL(url);
}

function formatBootError(err) {
  const message = err.message || String(err);

  if (message.includes("5173") || message.includes("Vite")) {
    return `${message}\n\nNo se pudo levantar el frontend de desarrollo.\nPrueba manualmente:\n  cd front && npm install && npm start\n\nLuego:\n  cd desktop && npm run start:ui-dev`;
  }

  if (
    message.includes("API did not become healthy") ||
    message.includes("JAR") ||
    message.includes("Maven")
  ) {
    return `${message}\n\nCompila el backend con:\n  cd back && mvn -DskipTests package\n\nY asegúrate de tener Java 21 en PATH o en:\n  ~/.local/share/dentura-tooling/jdk-21`;
  }

  return message;
}

async function boot() {
  const rebuild = process.env.DENTURA_REBUILD_JAR === "1";
  try {
    const result = await startBackend({ rebuild });
    jarProcess = result.process;

    const url = uiUrl();
    const vite = await ensureViteDevServer(url);
    viteProcess = vite.process;

    await createWindow();
  } catch (err) {
    console.error(err);
    dialog.showErrorBox("Dentura — error al iniciar", formatBootError(err));
    app.quit();
  }
}

app.whenReady().then(boot);

function shutdownChildProcesses() {
  stopBackend(jarProcess);
  jarProcess = null;
  stopVite(viteProcess);
  viteProcess = null;
}

app.on("window-all-closed", () => {
  shutdownChildProcesses();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  shutdownChildProcesses();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error);
  }
});
