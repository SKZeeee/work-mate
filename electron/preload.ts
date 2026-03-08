import { contextBridge, ipcRenderer } from "electron";

type BedrockState = {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
  detail: string;
  updatedAt: string | null;
};

contextBridge.exposeInMainWorld("desktopFriend", {
  getState(): Promise<BedrockState> {
    return ipcRenderer.invoke("bedrock:get-state");
  },
  onStateChange(callback: (state: BedrockState) => void) {
    const listener = (_event: Electron.IpcRendererEvent, state: BedrockState) => {
      callback(state);
    };

    ipcRenderer.on("bedrock:state-changed", listener);

    return () => {
      ipcRenderer.removeListener("bedrock:state-changed", listener);
    };
  },
  requestRefresh() {
    ipcRenderer.send("bedrock:refresh");
  },
});
