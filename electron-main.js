const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let serverProcess;

function startServer() {
  const serverPath = path.join(__dirname, "server.js");

  // Start your Express server (same project)
  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: "3000",
      DISABLE_EMAIL: "true",
      OFFLINE_ONLY: "true",
      PGHOST: process.env.PGHOST || "127.0.0.1",
      PGPORT: process.env.PGPORT || "5432",
      PGDATABASE: process.env.PGDATABASE || "cemetery_offline",
      PGUSER: process.env.PGUSER || "postgres",
      PGPASSWORD: process.env.PGPASSWORD || "",
    },
    stdio: "inherit",
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load your app from the local server
  win.loadURL("http://127.0.0.1:3000/");
}

app.whenReady().then(() => {
  startServer();

  // small delay so server can boot (simple + works for demos)
  setTimeout(createWindow, 1200);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  if (serverProcess) serverProcess.kill();
});