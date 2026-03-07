import { app, BrowserWindow, screen } from "electron";
import path from "node:path";

const WINDOW_WIDTH = 160;
const WINDOW_HEIGHT = 160;
const WINDOW_MARGIN = 16;

let mainWindow: BrowserWindow | null = null;

function getBottomRightPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  return {
    x: Math.round(workArea.x + workArea.width - WINDOW_WIDTH - WINDOW_MARGIN),
    y: Math.round(workArea.y + workArea.height - WINDOW_HEIGHT - WINDOW_MARGIN)
  };
}

function positionWindow(win: BrowserWindow) {
  const position = getBottomRightPosition();
  win.setPosition(position.x, position.y, false);
}

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
      contextIsolation: true,
      sandbox: true
    }
  });

  mainWindow = win;
  positionWindow(win);
  win.setAlwaysOnTop(true, "floating");
  win.setIgnoreMouseEvents(true);
  win.loadFile(path.join(app.getAppPath(), "index.html"));

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

app.whenReady().then(() => {
  createMainWindow();

  screen.on("display-added", repositionMainWindow);
  screen.on("display-removed", repositionMainWindow);
  screen.on("display-metrics-changed", repositionMainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
