import { app, BrowserWindow, ipcMain, screen } from "electron";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

import { createBedrockService, type BedrockState } from "./bedrock";

const DEFAULT_HUD_OPACITY = 0.76;
const MIN_HUD_OPACITY = 0.15;
const MAX_HUD_OPACITY = 1;

type OverlayConfig = {
  mode: "cockpit-hud";
  alienBedrockEnabled: boolean;
};

let mainWindow: BrowserWindow | null = null;

function loadEnvironment() {
  const envCandidates = [
    path.join(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
    path.join(process.resourcesPath, ".env"),
  ];

  for (const envPath of envCandidates) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    dotenv.config({ path: envPath });
    return envPath;
  }

  return null;
}

loadEnvironment();

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getHudOpacity() {
  const rawValue =
    process.env.HUD_OPACITY?.trim() || process.env.OVERLAY_OPACITY?.trim() || "";

  if (!rawValue) {
    return DEFAULT_HUD_OPACITY;
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_HUD_OPACITY;
  }

  const normalizedValue = numericValue > 1 ? numericValue / 100 : numericValue;
  return clamp(normalizedValue, MIN_HUD_OPACITY, MAX_HUD_OPACITY);
}

function isTruthy(value: string | undefined) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
}

function isAlienBedrockEnabled() {
  const cliArgs = new Set(process.argv);
  return (
    cliArgs.has("--enable-alien-bedrock") ||
    cliArgs.has("--alien-bedrock") ||
    isTruthy(process.env.ALIEN_BEDROCK_ENABLED)
  );
}

function getOverlayBounds() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  return {
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
  };
}

function positionWindow(win: BrowserWindow) {
  win.setBounds(getOverlayBounds(), false);
}

function sendAlienBedrockState(state: BedrockState) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("alien-bedrock:state-changed", state);
}

const overlayConfig: OverlayConfig = {
  mode: "cockpit-hud",
  alienBedrockEnabled: isAlienBedrockEnabled(),
};

const bedrockService = overlayConfig.alienBedrockEnabled
  ? createBedrockService({
      onStateChange: sendAlienBedrockState,
    })
  : null;

function createMainWindow() {
  const bounds = getOverlayBounds();
  const win = new BrowserWindow({
    ...bounds,
    show: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    skipTaskbar: true,
    focusable: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(app.getAppPath(), "build/electron/preload.js"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow = win;
  positionWindow(win);
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.setOpacity(getHudOpacity());
  win.loadFile(path.join(app.getAppPath(), "index.html"));

  win.webContents.on("did-finish-load", () => {
    if (!bedrockService) {
      return;
    }

    sendAlienBedrockState(bedrockService.getState());
  });

  win.once("ready-to-show", () => {
    if (mainWindow?.isDestroyed()) {
      return;
    }

    positionWindow(win);
    win.showInactive();
    win.moveTop();
  });

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });
}

function repositionMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  positionWindow(mainWindow);
}

function registerIpcHandlers() {
  ipcMain.handle("overlay:get-config", () => {
    return overlayConfig;
  });

  ipcMain.handle("alien-bedrock:get-state", () => {
    return bedrockService?.getState() ?? null;
  });

  ipcMain.on("alien-bedrock:refresh", () => {
    if (!bedrockService) {
      return;
    }

    void bedrockService.refresh();
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();
  bedrockService?.start();

  screen.on("display-added", repositionMainWindow);
  screen.on("display-removed", repositionMainWindow);
  screen.on("display-metrics-changed", repositionMainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  ipcMain.removeHandler("overlay:get-config");
  ipcMain.removeHandler("alien-bedrock:get-state");
  bedrockService?.stop();
});

app.on("window-all-closed", () => {
  app.quit();
});
