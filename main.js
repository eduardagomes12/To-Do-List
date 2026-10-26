
const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

// ======================================
// 1. CONFIGURAÇÕES DA JANELA
// ======================================

// Tamanho da bolinha quando está fechada
const COMPACT_SIZE = {
  width: 72,
  height: 72,
};

// Tamanho da lista quando está aberta
const EXPANDED_SIZE = {
  width: 350,
  height: 490,
};

// Estado da aplicação
let mainWindow = null;
let isExpanded = false;
let isPinned = true;

// ======================================
// 2. CRIAR A JANELA
// ======================================

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  // Posição inicial: canto superior direito
  const x = workArea.x + workArea.width - COMPACT_SIZE.width - 25;
  const y = workArea.y + 75;

  mainWindow = new BrowserWindow({
    width: COMPACT_SIZE.width,
    height: COMPACT_SIZE.height,
    x,
    y,

    // Remove a barra normal da janela
    frame: false,

    // Permite fundo transparente
    transparent: true,
    backgroundColor: "#00000000",

    // Fica por cima das outras aplicações
    alwaysOnTop: true,

    // A janela não pode ser redimensionada manualmente
    resizable: false,

    // Remove a sombra nativa
    hasShadow: false,

    // Configurações de segurança
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Carregar a interface
  mainWindow.loadFile("index.html");

  mainWindow.setAlwaysOnTop(true, "floating");

  // Mostrar noutros espaços de trabalho do Mac
  if (process.platform === "darwin") {
    mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
  }

  // Quando clicamos na janela
  mainWindow.on("focus", () => {
    mainWindow.webContents.send("widget:focus", true);
  });

  // Quando clicamos noutra aplicação
  mainWindow.on("blur", () => {
    mainWindow.webContents.send("widget:focus", false);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ======================================
// 3. ABRIR E FECHAR A LISTA
// ======================================

ipcMain.handle("widget:toggle", () => {
  if (!mainWindow) return false;

  const bounds = mainWindow.getBounds();

  isExpanded = !isExpanded;

  const newSize = isExpanded
    ? EXPANDED_SIZE
    : COMPACT_SIZE;

  // Mantém a janela alinhada à direita
  let newX = bounds.x + bounds.width - newSize.width;
  let newY = bounds.y;

  // Impede que a janela saia do ecrã
  const display = screen.getDisplayNearestPoint({
    x: bounds.x + Math.floor(bounds.width / 2),
    y: bounds.y + Math.floor(bounds.height / 2),
  });

  const area = display.workArea;

  newX = Math.max(
    area.x,
    Math.min(newX, area.x + area.width - newSize.width)
  );

  newY = Math.max(
    area.y,
    Math.min(newY, area.y + area.height - newSize.height)
  );

  mainWindow.setBounds({
    x: Math.round(newX),
    y: Math.round(newY),
    width: newSize.width,
    height: newSize.height,
  });

  return isExpanded;
});

// ======================================
// 4. FIXAR A JANELA
// ======================================

ipcMain.handle("widget:pin", (event, pinned) => {
  if (!mainWindow) return false;

  isPinned = Boolean(pinned);

  mainWindow.setAlwaysOnTop(isPinned, "floating");

  if (process.platform === "darwin") {
    mainWindow.setVisibleOnAllWorkspaces(isPinned, {
      visibleOnFullScreen: isPinned,
    });
  }

  return isPinned;
});

// ======================================
// 5. CONSULTAR O ESTADO
// ======================================

ipcMain.handle("widget:get-state", () => {
  return {
    expanded: isExpanded,
    pinned: isPinned,
    focused: mainWindow ? mainWindow.isFocused() : false,
  };
});

// ======================================
// 6. INICIAR A APLICAÇÃO
// ======================================

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fechar a aplicação em Windows/Linux
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
