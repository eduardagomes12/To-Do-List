
const { contextBridge, ipcRenderer } = require("electron");

// ======================================
// COMUNICAÇÃO ENTRE INTERFACE E ELECTRON
// ======================================

contextBridge.exposeInMainWorld("widgetAPI", {

  // 1. Abrir ou fechar a To-Do List
  toggle: () => {
    return ipcRenderer.invoke("widget:toggle");
  },

  // 2. Fixar ou desafixar a janela
  setPinned: (pinned) => {
    return ipcRenderer.invoke(
      "widget:pin",
      Boolean(pinned)
    );
  },

  // 3. Obter o estado atual da janela
  getState: () => {
    return ipcRenderer.invoke("widget:get-state");
  },

  // 4. Detetar quando a janela ganha
  // ou perde o foco
  onFocusChange: (callback) => {

    if (typeof callback !== "function") {
      return () => {};
    }

    const listener = (_event, isFocused) => {
      callback(Boolean(isFocused));
    };

    ipcRenderer.on("widget:focus", listener);

    // Permite remover o listener
    return () => {
      ipcRenderer.removeListener(
        "widget:focus",
        listener
      );
    };
  },

});
