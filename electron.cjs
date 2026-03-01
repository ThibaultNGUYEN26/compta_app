const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { spawn } = require("child_process");
const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const https = require("https");
const path = require("path");

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const DIST_INDEX = path.join(__dirname, "dist", "index.html");
let devServerProcess = null;

function getDefaultDataDir() {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "data");
  }
  return path.join(process.cwd(), "data");
}

function getSettingsFile() {
  return path.join(getDefaultDataDir(), "settings.json");
}

async function getActiveDataDir() {
  const fallback = getDefaultDataDir();
  try {
    const settingsFile = getSettingsFile();
    if (!fs.existsSync(settingsFile)) return fallback;
    const raw = await fsp.readFile(settingsFile, "utf-8");
    const parsed = JSON.parse(raw);
    const dataPath = parsed?.dataPath;
    if (typeof dataPath === "string" && dataPath.trim()) {
      return dataPath.trim();
    }
  } catch (err) {
    console.error("Failed to read data path from settings:", err);
  }
  return fallback;
}

async function getYearDataFile(year) {
  const baseDir = await getActiveDataDir();
  return path.join(baseDir, `Compta_${year}.json`);
}

function getDefaultSettings() {
  return {
    accounts: {
      current: ["Current account"],
      saving: [],
      savingLinks: {},
    },
  };
}

async function ensureSettingsDir() {
  const dataDir = getDefaultDataDir();
  await fsp.mkdir(dataDir, { recursive: true });
  return dataDir;
}

async function ensureDataDir() {
  const dataDir = await getActiveDataDir();
  await fsp.mkdir(dataDir, { recursive: true });
  return dataDir;
}

function groupByMonth(transactions) {
  const months = {};
  for (const transaction of transactions) {
    const dt = new Date(transaction.date);
    if (Number.isNaN(dt.getTime())) continue;
    const monthKey = String(dt.getMonth() + 1).padStart(2, "0");
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push(transaction);
  }
  return months;
}

function flattenMonths(months) {
  const all = Object.values(months || {}).flat();
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function groupByYear(transactions) {
  const years = {};
  for (const transaction of transactions) {
    const dt = new Date(transaction.date);
    if (Number.isNaN(dt.getTime())) continue;
    const yearKey = String(dt.getFullYear());
    if (!years[yearKey]) years[yearKey] = [];
    years[yearKey].push(transaction);
  }
  return years;
}

function waitForUrl(url, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;

    const tryOnce = () => {
      const req = client.get(
        {
          hostname: target.hostname,
          port: target.port,
          path: target.pathname,
        },
        () => {
          req.destroy();
          resolve();
        }
      );

      req.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Dev server not reachable at ${url}`));
          return;
        }
        setTimeout(tryOnce, 300);
      });
    };

    tryOnce();
  });
}

function startViteDevServer() {
  if (devServerProcess) return;
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  devServerProcess = spawn(
    npmCmd,
    ["run", "dev", "--", "--host", "--strictPort", "--port", "5173"],
    {
      cwd: __dirname,
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  devServerProcess.on("error", (err) => {
    console.error("Failed to start Vite dev server:", err);
  });
}

async function loadRenderer(win) {
  try {
    const shouldUseDevServer =
      !app.isPackaged || process.env.VITE_DEV_SERVER_URL;

    if (shouldUseDevServer) {
      startViteDevServer();
      await waitForUrl(DEV_SERVER_URL);
      await win.loadURL(DEV_SERVER_URL);
      return;
    }

    if (fs.existsSync(DIST_INDEX)) {
      await win.loadFile(DIST_INDEX);
      return;
    }

    startViteDevServer();
    await waitForUrl(DEV_SERVER_URL);
    await win.loadURL(DEV_SERVER_URL);
  } catch (err) {
    console.error("Renderer failed to load:", err);
  }
}

async function createWindow() {
  const iconCandidates = [
    path.join(__dirname, "assets", "compta_app_logo.ico"),
    path.join(__dirname, "assets", "compta_app_logo.png"),
  ];
  const iconPath = iconCandidates.find((candidate) => fs.existsSync(candidate));

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenu(null);

  await loadRenderer(win);

  if (app.isPackaged) {
    configureAutoUpdates(win);
  }
}

function configureAutoUpdates(win) {
  autoUpdater.autoDownload = true;
  autoUpdater.on("checking-for-update", () => {
    win.webContents.send("update:status", { status: "checking" });
  });
  autoUpdater.on("update-available", (info) => {
    win.webContents.send("update:status", {
      status: "available",
      info,
    });
  });
  autoUpdater.on("update-not-available", (info) => {
    win.webContents.send("update:status", {
      status: "none",
      info,
    });
  });
  autoUpdater.on("download-progress", (progress) => {
    win.webContents.send("update:status", {
      status: "downloading",
      progress,
    });
  });
  autoUpdater.on("update-downloaded", (info) => {
    win.webContents.send("update:status", {
      status: "downloaded",
      info,
    });
  });
  autoUpdater.on("error", (err) => {
    console.error("Auto updater error:", err);
    win.webContents.send("update:status", {
      status: "error",
      message: err?.message || String(err),
    });
  });
  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.error("Auto update check failed:", err);
  });
}

app.whenReady().then(() => {
  ipcMain.handle("transactions:load", async () => {
    try {
      const dataDir = await getActiveDataDir();
      if (!fs.existsSync(dataDir)) return [];
      const entries = await fsp.readdir(dataDir);
      const files = entries.filter((name) => /^Compta_\d{4}\.json$/i.test(name));
      const all = [];
      for (const file of files) {
        const raw = await fsp.readFile(path.join(dataDir, file), "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          all.push(...parsed);
        } else if (parsed && typeof parsed === "object" && parsed.months) {
          all.push(...flattenMonths(parsed.months));
        }
      }
      return all.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime && bTime) return bTime - aTime;
        if (aTime) return -1;
        if (bTime) return 1;
        return 0;
      });
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
    return [];
  });

  ipcMain.handle("transactions:save", async (_event, transactions) => {
    try {
      const payload = Array.isArray(transactions) ? transactions : [];
      await ensureDataDir();
      const byYear = groupByYear(payload);
      const years = Object.keys(byYear);
      if (years.length === 0) {
        const year = new Date().getFullYear();
        const dataFile = await getYearDataFile(year);
        const output = { year, months: {} };
        await fsp.writeFile(dataFile, JSON.stringify(output, null, 2), "utf-8");
        return { ok: true };
      }

      await Promise.all(
        years.map(async (yearKey) => {
          const year = Number(yearKey);
          const dataFile = await getYearDataFile(year);
          const months = groupByMonth(byYear[yearKey]);
          const output = { year, months };
          await fsp.writeFile(
            dataFile,
            JSON.stringify(output, null, 2),
            "utf-8"
          );
        })
      );
      return { ok: true };
    } catch (err) {
      console.error("Failed to save transactions:", err);
      return { ok: false };
    }
  });

  ipcMain.handle("settings:load", async () => {
    try {
      await ensureSettingsDir();
      const settingsFile = getSettingsFile();
      if (!fs.existsSync(settingsFile)) {
        const defaults = getDefaultSettings();
        await fsp.writeFile(
          settingsFile,
          JSON.stringify(defaults, null, 2),
          "utf-8"
        );
        return defaults;
      }
      const raw = await fsp.readFile(settingsFile, "utf-8");
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return getDefaultSettings();
      }
      return {
        ...getDefaultSettings(),
        ...parsed,
        accounts: {
          ...getDefaultSettings().accounts,
          ...(parsed.accounts || {}),
        },
      };
    } catch (err) {
      console.error("Failed to load settings:", err);
      return getDefaultSettings();
    }
  });

  ipcMain.handle("settings:save", async (_event, settings) => {
    try {
      await ensureSettingsDir();
      const settingsFile = getSettingsFile();
      const payload =
        settings && typeof settings === "object"
          ? settings
          : getDefaultSettings();
      await fsp.writeFile(
        settingsFile,
        JSON.stringify(payload, null, 2),
        "utf-8"
      );
      return { ok: true };
    } catch (err) {
      console.error("Failed to save settings:", err);
      return { ok: false };
    }
  });

  ipcMain.handle("data-path:get", async () => {
    const defaultPath = getDefaultDataDir();
    const currentPath = await getActiveDataDir();
    const isCustom = currentPath !== defaultPath;
    return { defaultPath, currentPath, isCustom };
  });

  ipcMain.handle("data-path:select", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
    });
    if (result.canceled || !result.filePaths?.length) {
      return null;
    }
    const selected = result.filePaths[0];
    try {
      await ensureSettingsDir();
      const settingsFile = getSettingsFile();
      let settings = getDefaultSettings();
      if (fs.existsSync(settingsFile)) {
        const raw = await fsp.readFile(settingsFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          settings = { ...settings, ...parsed };
        }
      }
      settings.dataPath = selected;
      await fsp.writeFile(
        settingsFile,
        JSON.stringify(settings, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Failed to save data path:", err);
    }
    const defaultPath = getDefaultDataDir();
    return {
      defaultPath,
      currentPath: selected,
      isCustom: selected !== defaultPath,
    };
  });

  ipcMain.handle("data-path:reset", async () => {
    try {
      await ensureSettingsDir();
      const settingsFile = getSettingsFile();
      let settings = getDefaultSettings();
      if (fs.existsSync(settingsFile)) {
        const raw = await fsp.readFile(settingsFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          settings = { ...settings, ...parsed };
        }
      }
      if (Object.prototype.hasOwnProperty.call(settings, "dataPath")) {
        delete settings.dataPath;
      }
      await fsp.writeFile(
        settingsFile,
        JSON.stringify(settings, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Failed to reset data path:", err);
    }
    const defaultPath = getDefaultDataDir();
    return { defaultPath, currentPath: defaultPath, isCustom: false };
  });

  ipcMain.handle("data-path:open", async () => {
    try {
      const dir = await getActiveDataDir();
      await ensureDataDir();
      await shell.openPath(dir);
      return { ok: true, path: dir };
    } catch (err) {
      console.error("Failed to open data path:", err);
      return { ok: false };
    }
  });

  ipcMain.handle("app:getVersion", async () => app.getVersion());

  ipcMain.handle("update:install", async () => {
    autoUpdater.quitAndInstall();
    return { ok: true };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (devServerProcess) {
    devServerProcess.kill();
    devServerProcess = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
