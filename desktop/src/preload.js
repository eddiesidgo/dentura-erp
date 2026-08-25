// Preload reserved for future bridge (auth token, print, etc.)
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("denturaDesktop", {
  platform: process.platform,
});
