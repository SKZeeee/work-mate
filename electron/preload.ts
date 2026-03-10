import { contextBridge, ipcRenderer } from "electron";

type OverlayConfig = {
  mode: "cockpit-hud";
  alienBedrockEnabled: boolean;
};

type BedrockState = {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
  detail: string;
  updatedAt: string | null;
};

contextBridge.exposeInMainWorld("workFriendsOverlay", {
  mode: "cockpit-hud" as const,
  getConfig(): Promise<OverlayConfig> {
    return ipcRenderer.invoke("overlay:get-config");
  },
  getAlienBedrockState(): Promise<BedrockState | null> {
    return ipcRenderer.invoke("alien-bedrock:get-state");
  },
  onAlienBedrockStateChange(callback: (state: BedrockState) => void) {
    const listener = (_event: Electron.IpcRendererEvent, state: BedrockState) => {
      callback(state);
    };

    ipcRenderer.on("alien-bedrock:state-changed", listener);

    return () => {
      ipcRenderer.removeListener("alien-bedrock:state-changed", listener);
    };
  },
  requestAlienBedrockRefresh() {
    ipcRenderer.send("alien-bedrock:refresh");
  },
});
