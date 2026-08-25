const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { startBackend, stopBackend, uiUrl } = require("./java-bridge");

let mainWindow = null;
let jarProcess = null;

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

async function boot() {
  const rebuild = process.env.DENTURA_REBUILD_JAR === "1";
  try {
    const result = await startBackend({ rebuild });
    jarProcess = result.process;
    await createWindow();
  } catch (err) {
    console.error(err);
    dialog.showErrorBox(
      "Dentura — error al iniciar",
      `${err.message}\n\nCompila el backend con:\n  cd back && mvn -DskipTests package\n\nY asegúrate de tener Java 21 en PATH o en:\n  ~/.local/share/dentura-tooling/jdk-21`,
    );
    app.quit();
  }
}

app.whenReady().then(boot);

app.on("window-all-closed", () => {
  stopBackend(jarProcess);
  jarProcess = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopBackend(jarProcess);
  jarProcess = null;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error);
  }
});
