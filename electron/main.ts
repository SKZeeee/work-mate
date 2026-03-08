import { app, BrowserWindow, ipcMain, screen } from "electron";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

import { createBedrockService, type BedrockState } from "./bedrock";

const WINDOW_WIDTH = 360;
const WINDOW_HEIGHT = 320;
const WINDOW_MARGIN = 16;

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

function getBottomRightPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  return {
    x: Math.round(workArea.x + workArea.width - WINDOW_WIDTH - WINDOW_MARGIN),
    y: Math.round(workArea.y + workArea.height - WINDOW_HEIGHT - WINDOW_MARGIN),
  };
}

function positionWindow(win: BrowserWindow) {
  const position = getBottomRightPosition();
  win.setPosition(position.x, position.y, false);
}

function sendBedrockState(state: BedrockState) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send("bedrock:state-changed", state);
}

const bedrockService = createBedrockService({
  onStateChange: sendBedrockState,
});

function createMainWindow() {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    useContentSize: true,
    show: false,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(app.getAppPath(), "build/electron/preload.js"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow = win;
  positionWindow(win);
  win.setAlwaysOnTop(true, "floating");
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(app.getAppPath(), "index.html"));

  win.webContents.on("did-finish-load", () => {
    sendBedrockState(bedrockService.getState());
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
  ipcMain.handle("bedrock:get-state", () => {
    return bedrockService.getState();
  });

  ipcMain.on("bedrock:refresh", () => {
    void bedrockService.refresh();
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();
  bedrockService.start();

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
  bedrockService.stop();
  ipcMain.removeHandler("bedrock:get-state");
});

app.on("window-all-closed", () => {
  app.quit();
});
