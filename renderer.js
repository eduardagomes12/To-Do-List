
/* ==========================================
   1. CONFIGURAÇÕES E ELEMENTOS
========================================== */

// Onde vamos guardar as tarefas
const STORAGE_KEY = "my-little-todo-tasks";

// Estado atual
let tasks = [];
let activeTab = "todo";
let isExpanded = false;
let isPinned = true;
let isSwitching = false;

// Elementos da interface
const app = document.getElementById("app");

const compactView = document.getElementById("compact-view");
const expandedView = document.getElementById("expanded-view");

const compactButton = document.getElementById("compact-button");
const compactCount = document.getElementById("compact-count");

const minimizeButton = document.getElementById("minimize-button");
const pinButton = document.getElementById("pin-button");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const addTaskForm = document.getElementById("add-task-form");
const newTaskInput = document.getElementById("new-task-input");

const todayLabel = document.getElementById("today-label");

const tabs = document.querySelectorAll(".tab");

// Estados possíveis de uma tarefa
const VALID_STATUSES = [
  "todo",
  "pending",
  "completed",
  "cancelled"
];


/* ==========================================
   2. GUARDAR E CARREGAR TAREFAS
========================================== */

function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.error("Erro ao guardar tarefas:", error);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      tasks = [];
      return;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      tasks = [];
      return;
    }

    tasks = parsed.filter((task) => {
      return (
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        VALID_STATUSES.includes(task.status)
      );
    });

  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    tasks = [];
  }
}


/* ==========================================
   3. DATA ATUAL
========================================== */

function updateDate() {
  const today = new Date();

  todayLabel.textContent = new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric"
    }
  ).format(today);
}


/* ==========================================
   4. CONTADOR DA BOLINHA
========================================== */

function updateTaskCount() {

  // Contamos tarefas a fazer e pendentes
  const remaining = tasks.filter((task) => {
    return (
      task.status === "todo" ||
      task.status === "pending"
    );
  }).length;

  compactCount.textContent = remaining;

  compactButton.setAttribute(
    "aria-label",
    `Abrir lista: ${remaining} tarefas por concluir`
  );
}


/* ==========================================
   5. CRIAR NOVA TAREFA
========================================== */

function addTask(text) {

  const cleanText = text.trim();

  if (!cleanText) return;

  const task = {
    id: crypto.randomUUID(),
    text: cleanText,
    status: "todo",
    createdAt: Date.now()
  };

  // Adiciona a nova tarefa no início
  tasks.unshift(task);

  saveTasks();

  // Mostra o separador To-do
  switchTab("todo");

  newTaskInput.value = "";
  newTaskInput.focus();
}


/* ==========================================
   6. ALTERAR O ESTADO DE UMA TAREFA
========================================== */

function updateTaskStatus(id, newStatus) {

  if (!VALID_STATUSES.includes(newStatus)) {
    return;
  }

  const task = tasks.find((item) => {
    return item.id === id;
  });

  if (!task) return;

  task.status = newStatus;

  saveTasks();
  renderTasks();
}


/* ==========================================
   7. APAGAR TAREFA
========================================== */

function deleteTask(id) {

  tasks = tasks.filter((task) => {
    return task.id !== id;
  });

  saveTasks();
  renderTasks();
}


/* ==========================================
   8. CRIAR BOTÕES DAS TAREFAS
========================================== */

function createActionButton(symbol, title, action, id) {

  const button = document.createElement("button");

  button.type = "button";
  button.className = "task-action";

  button.textContent = symbol;
  button.title = title;

  button.setAttribute("aria-label", title);

  button.dataset.action = action;
  button.dataset.id = id;

  return button;
}


/* ==========================================
   9. MOSTRAR AS TAREFAS
========================================== */

function renderTasks() {

  taskList.replaceChildren();

  updateTaskCount();

  // Só mostra tarefas do separador selecionado
  const visibleTasks = tasks.filter((task) => {
    return task.status === activeTab;
  });

  // Lista vazia
  emptyState.hidden = visibleTasks.length > 0;

  if (visibleTasks.length === 0) {
    return;
  }

  visibleTasks.forEach((task) => {

    // Linha da tarefa
    const item = document.createElement("div");

    item.className = "task-item";

    if (task.status === "completed") {
      item.classList.add("is-completed");
    }

    // Checkbox
    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";

    checkbox.checked = task.status === "completed";
    checkbox.disabled = task.status === "cancelled";

    checkbox.dataset.action = "complete";
    checkbox.dataset.id = task.id;

    checkbox.setAttribute(
      "aria-label",
      `Concluir tarefa: ${task.text}`
    );

    // Texto da tarefa
    const text = document.createElement("span");

    text.className = "task-text";
    text.textContent = task.text;

    // Zona dos botões
    const actions = document.createElement("div");

    actions.className = "task-actions";

    // Tarefas por fazer
    if (task.status === "todo") {

      actions.appendChild(
        createActionButton(
          "◷",
          "Mover para pendentes",
          "pending",
          task.id
        )
      );

      actions.appendChild(
        createActionButton(
          "×",
          "Cancelar tarefa",
          "cancelled",
          task.id
        )
      );
    }

    // Tarefas pendentes
    if (task.status === "pending") {

      actions.appendChild(
        createActionButton(
          "↩",
          "Voltar a To-do",
          "todo",
          task.id
        )
      );

      actions.appendChild(
        createActionButton(
          "×",
          "Cancelar tarefa",
          "cancelled",
          task.id
        )
      );
    }

    // Tarefas concluídas ou canceladas
    if (
      task.status === "completed" ||
      task.status === "cancelled"
    ) {

      actions.appendChild(
        createActionButton(
          "↩",
          "Restaurar tarefa",
          "todo",
          task.id
        )
      );
    }

    // Botão de apagar
    actions.appendChild(
      createActionButton(
        "✕",
        "Apagar definitivamente",
        "delete",
        task.id
      )
    );

    // Construir a linha
    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(actions);

    taskList.appendChild(item);
  });
}


/* ==========================================
   10. INTERAÇÕES COM AS TAREFAS
========================================== */

// Clicar nos botões de ação
taskList.addEventListener("click", (event) => {

  const button = event.target.closest(
    "button[data-action]"
  );

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "delete") {
    deleteTask(id);
    return;
  }

  updateTaskStatus(id, action);
});

// Marcar ou desmarcar uma tarefa
taskList.addEventListener("change", (event) => {

  const checkbox = event.target;

  if (!checkbox.matches(".task-checkbox")) {
    return;
  }

  const id = checkbox.dataset.id;

  if (checkbox.checked) {
    updateTaskStatus(id, "completed");
  } else {
    updateTaskStatus(id, "todo");
  }
});


/* ==========================================
   11. MUDAR DE SEPARADOR
========================================== */

function switchTab(status) {

  if (!VALID_STATUSES.includes(status)) {
    return;
  }

  activeTab = status;

  tabs.forEach((tab) => {

    const selected = tab.dataset.status === status;

    tab.classList.toggle("is-active", selected);

    tab.setAttribute(
      "aria-selected",
      String(selected)
    );
  });

  renderTasks();
}


/* ==========================================
   12. ABRIR E MINIMIZAR A JANELA
========================================== */

function showView(expanded) {

  isExpanded = expanded;

  compactView.hidden = expanded;
  expandedView.hidden = !expanded;
}

async function toggleWindow() {

  if (isSwitching) return;

  isSwitching = true;

  try {

    // Pedir ao Electron para mudar o tamanho
    const expanded = await window.widgetAPI.toggle();

    showView(expanded);

  } catch (error) {

    console.error(
      "Não foi possível alterar a janela:",
      error
    );

  } finally {

    isSwitching = false;
  }
}


/* ==========================================
   13. FIXAR / DESAFIXAR JANELA
========================================== */

function updatePinButton() {

  pinButton.classList.toggle(
    "is-active",
    isPinned
  );

  pinButton.textContent = isPinned ? "📌" : "◇";

  pinButton.title = isPinned
    ? "Desafixar janela"
    : "Fixar janela";

  pinButton.setAttribute(
    "aria-pressed",
    String(isPinned)
  );
}

async function togglePin() {

  try {

    isPinned = await window.widgetAPI.setPinned(
      !isPinned
    );

    updatePinButton();

  } catch (error) {

    console.error(
      "Não foi possível fixar a janela:",
      error
    );
  }
}


/* ==========================================
   14. TRANSPARÊNCIA DINÂMICA
========================================== */

function updateFocus(isFocused) {

  // Quando perde o foco, fica mais transparente
  app.classList.toggle(
    "is-unfocused",
    !isFocused
  );
}


/* ==========================================
   15. EVENTOS DOS BOTÕES
========================================== */

// Abrir a partir da bolinha
compactButton.addEventListener(
  "click",
  toggleWindow
);

// Minimizar para a bolinha
minimizeButton.addEventListener(
  "click",
  toggleWindow
);

// Fixar ou desafixar
pinButton.addEventListener(
  "click",
  togglePin
);

// Separadores
tabs.forEach((tab) => {

  tab.addEventListener("click", () => {
    switchTab(tab.dataset.status);
  });

});

// Formulário de adicionar tarefas
addTaskForm.addEventListener("submit", (event) => {

  event.preventDefault();

  addTask(newTaskInput.value);
});


/* ==========================================
   16. INICIAR A APLICAÇÃO
========================================== */

async function initializeApp() {

  // Carregar tarefas guardadas
  loadTasks();

  // Mostrar a data
  updateDate();

  // Desenhar a lista
  renderTasks();

  // Obter estado inicial do Electron
  try {

    const state = await window.widgetAPI.getState();

    showView(state.expanded);

    isPinned = state.pinned;

    updatePinButton();
    updateFocus(state.focused);

  } catch (error) {

    console.error(
      "Erro ao obter o estado da janela:",
      error
    );
  }

  // Detetar quando clicamos noutra aplicação
  window.widgetAPI.onFocusChange((isFocused) => {
    updateFocus(isFocused);
  });
}

// Começar!
initializeApp();
