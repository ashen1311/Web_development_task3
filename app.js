'use strict';
/* ================================================================
   ASHEN PAUL — app.js  (Task 3: JavaScript Logic & State Management)
   ----------------------------------------------------------------
   Features:
   1.  State management — single source of truth object
   2.  Full CRUD — Create, Read, Update, Delete
   3.  localStorage persistence — survives browser reload
   4.  Filter views — All, Active, Completed
   5.  Search / highlight
   6.  Priority levels — Low, Medium, High
   7.  Mark all complete / Clear completed (bulk actions)
   8.  Progress bar + live stats
   9.  Edit modal with focus trap
   10. Dark / light mode toggle with localStorage
   11. Delegated event listeners on task list
   12. ARIA live announcements
   ================================================================ */


/* ── CONSTANTS ───────────────────────────────────────────────── */
const STORAGE_KEY  = 'ap-tasks-v1';
const THEME_KEY    = 'ap-theme';


/* ── STATE ───────────────────────────────────────────────────── */
let state = {
  tasks:      [],   // array of task objects
  filter:     'all',// 'all' | 'active' | 'completed'
  search:     '',
  editingId:  null, // id of task currently being edited
};


/* ── DOM REFS ────────────────────────────────────────────────── */
const taskList       = document.getElementById('task-list');
const emptyState     = document.getElementById('empty-state');
const emptySub       = document.getElementById('empty-sub');
const addForm        = document.getElementById('add-form');
const taskInput      = document.getElementById('task-input');
const inputErr       = document.getElementById('input-err');
const charCounter    = document.getElementById('char-counter');
const searchInput    = document.getElementById('search-input');
const liveAnnounce   = document.getElementById('live-announce');

const statTotal      = document.getElementById('stat-total');
const statActive     = document.getElementById('stat-active');
const statDone       = document.getElementById('stat-done');
const progressFill   = document.getElementById('progress-fill');
const progressPct    = document.getElementById('progress-pct');

const filterBtns     = document.querySelectorAll('.filter-btn');
const btnCompleteAll = document.getElementById('btn-complete-all');
const btnClearDone   = document.getElementById('btn-clear-done');

const editModal      = document.getElementById('edit-modal');
const editInput      = document.getElementById('edit-input');
const editErr        = document.getElementById('edit-err');
const modalSave      = document.getElementById('modal-save');
const modalCancel    = document.getElementById('modal-cancel');

const themeBtn       = document.getElementById('theme-btn');


/* ================================================================
   THEME TOGGLE
   ================================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeBtn) {
    themeBtn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }
}

(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
})();

themeBtn && themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
});


/* ================================================================
   PERSISTENCE — localStorage
   ================================================================ */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : [];
  } catch {
    state.tasks = [];
  }
}


/* ================================================================
   TASK FACTORY
   ================================================================ */
function createTask(text, priority = 'low') {
  return {
    id:        `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text:      text.trim(),
    completed: false,
    priority,
    createdAt: new Date().toISOString(),
  };
}


/* ================================================================
   HELPERS
   ================================================================ */
function announce(msg) {
  liveAnnounce.textContent = '';
  // Double-set forces screen reader re-read
  requestAnimationFrame(() => { liveAnnounce.textContent = msg; });
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightText(text, query) {
  if (!query) return escapeHTML(text);
  const safe  = escapeHTML(text);
  const safeQ = escapeHTML(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${safeQ})`, 'gi'), '<mark>$1</mark>');
}


/* ================================================================
   STATS & PROGRESS
   ================================================================ */
function updateStats() {
  const total     = state.tasks.length;
  const done      = state.tasks.filter(t => t.completed).length;
  const active    = total - done;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent  = total;
  statActive.textContent = active;
  statDone.textContent   = done;
  progressFill.style.width = `${pct}%`;
  progressPct.textContent  = `${pct}%`;
}


/* ================================================================
   FILTER — derived view of tasks
   ================================================================ */
function getFilteredTasks() {
  let tasks = state.tasks;

  // Filter by status
  if (state.filter === 'active')    tasks = tasks.filter(t => !t.completed);
  if (state.filter === 'completed') tasks = tasks.filter(t =>  t.completed);

  // Filter by search
  if (state.search) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t => t.text.toLowerCase().includes(q));
  }

  return tasks;
}


/* ================================================================
   RENDER
   ================================================================ */
function render() {
  const filtered = getFilteredTasks();

  // Clear list
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    // Contextual empty message
    if (state.search) {
      emptySub.textContent = `No tasks match "${state.search}".`;
    } else if (state.filter === 'active') {
      emptySub.textContent = 'No active tasks. Add one above.';
    } else if (state.filter === 'completed') {
      emptySub.textContent = 'Nothing completed yet.';
    } else {
      emptySub.textContent = 'No tasks here. Add one above.';
    }
  } else {
    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item${task.completed ? ' completed' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="task-check">
          <input
            type="checkbox"
            class="task-checkbox"
            ${task.completed ? 'checked' : ''}
            aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${escapeHTML(task.text)}"
            data-action="toggle"
          />
        </div>
        <div class="task-body">
          <p class="task-text">${highlightText(task.text, state.search)}</p>
          <div class="task-meta">
            <span class="badge badge-${task.priority}">${task.priority}</span>
            <time class="task-date" datetime="${task.createdAt}">
              ${formatDate(task.createdAt)}
            </time>
          </div>
        </div>
        <div class="task-actions">
          <button
            class="task-btn edit"
            data-action="edit"
            aria-label="Edit task: ${escapeHTML(task.text)}"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            class="task-btn delete"
            data-action="delete"
            aria-label="Delete task: ${escapeHTML(task.text)}"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      `;

      fragment.appendChild(li);
    });

    taskList.appendChild(fragment);
  }

  updateStats();
}


/* ================================================================
   CRUD OPERATIONS
   ================================================================ */

/* CREATE */
function addTask(text, priority) {
  const task = createTask(text, priority);
  state.tasks.unshift(task); // newest first
  saveTasks();
  render();
  announce(`Task added: ${text}`);
  return task;
}

/* READ — handled by render() + getFilteredTasks() */

/* UPDATE — toggle completed */
function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
  announce(task.completed ? `Done: ${task.text}` : `Back to active: ${task.text}`);
}

/* UPDATE — edit text + priority */
function updateTask(id, newText, newPriority) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.text     = newText.trim();
  task.priority = newPriority;
  saveTasks();
  render();
  announce(`Task updated: ${task.text}`);
}

/* DELETE */
function deleteTask(id) {
  const task = state.tasks.find(t => t.id === id);
  const text = task ? task.text : '';
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  render();
  announce(`Deleted: ${text}`);
}

/* BULK — mark all complete */
function completeAll() {
  state.tasks.forEach(t => { t.completed = true; });
  saveTasks();
  render();
  announce('All tasks marked as done.');
}

/* BULK — clear completed */
function clearCompleted() {
  const count = state.tasks.filter(t => t.completed).length;
  state.tasks  = state.tasks.filter(t => !t.completed);
  saveTasks();
  render();
  announce(`${count} completed task${count !== 1 ? 's' : ''} removed.`);
}


/* ================================================================
   ADD FORM
   ================================================================ */
addForm.addEventListener('submit', e => {
  e.preventDefault();

  const text = taskInput.value.trim();

  // Validate
  if (!text) {
    inputErr.textContent = 'Please type a task first.';
    inputErr.hidden = false;
    taskInput.focus();
    return;
  }
  inputErr.hidden = true;

  // Get selected priority
  const priorityEl = addForm.querySelector('input[name="priority"]:checked');
  const priority   = priorityEl ? priorityEl.value : 'low';

  addTask(text, priority);

  // Reset
  taskInput.value = '';
  charCounter.textContent = '0 / 200';
  charCounter.className   = 'char-counter';
  addForm.querySelector('input[name="priority"][value="low"]').checked = true;
  taskInput.focus();
});

/* Live character count */
taskInput.addEventListener('input', () => {
  const len = taskInput.value.length;
  charCounter.textContent = `${len} / 200`;
  charCounter.className   = len >= 190 ? 'char-counter at-limit'
                          : len >= 160 ? 'char-counter near-limit'
                          : 'char-counter';
  if (inputErr && !inputErr.hidden) {
    inputErr.hidden = true;
  }
});


/* ================================================================
   DELEGATED EVENT LISTENER — task list
   All clicks on the task list bubble up here.
   ================================================================ */
taskList.addEventListener('click', e => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;

  const action = e.target.closest('[data-action]')?.dataset.action;

  if (action === 'toggle' || e.target.classList.contains('task-checkbox')) {
    toggleTask(id);
    return;
  }
  if (action === 'edit') {
    openEditModal(id);
    return;
  }
  if (action === 'delete') {
    deleteTask(id);
    return;
  }
});

/* Keyboard: Space/Enter on task item triggers checkbox */
taskList.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const checkbox = e.target.closest('.task-checkbox');
    if (checkbox) {
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      const item = checkbox.closest('.task-item');
      if (item) toggleTask(item.dataset.id);
    }
  }
});


/* ================================================================
   FILTER BUTTONS
   ================================================================ */
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;

    filterBtns.forEach(b => {
      b.setAttribute('aria-pressed', 'false');
      b.classList.remove('active');
    });
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('active');

    render();
    announce(`Showing ${state.filter} tasks.`);
  });
});


/* ================================================================
   BULK ACTIONS
   ================================================================ */
btnCompleteAll && btnCompleteAll.addEventListener('click', () => {
  if (state.tasks.length === 0) {
    announce('No tasks to mark as done.');
    return;
  }
  completeAll();
});

btnClearDone && btnClearDone.addEventListener('click', () => {
  const count = state.tasks.filter(t => t.completed).length;
  if (count === 0) {
    announce('No completed tasks to clear.');
    return;
  }
  clearCompleted();
});


/* ================================================================
   SEARCH
   ================================================================ */
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = searchInput.value.trim();
    render();
    if (state.search) {
      const filtered = getFilteredTasks();
      announce(`${filtered.length} task${filtered.length !== 1 ? 's' : ''} found for "${state.search}".`);
    }
  }, 250);
});


/* ================================================================
   EDIT MODAL
   ================================================================ */

/* Focus trap — keeps Tab key inside modal */
const FOCUSABLE = 'button, input, textarea, select, a[href]';
let focusableEls = [];
let firstFocus, lastFocus;

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  if (e.shiftKey) {
    if (document.activeElement === firstFocus) {
      e.preventDefault();
      lastFocus.focus();
    }
  } else {
    if (document.activeElement === lastFocus) {
      e.preventDefault();
      firstFocus.focus();
    }
  }
}

function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.editingId = id;

  editInput.value = task.text;
  editErr.hidden  = true;

  // Set priority radio
  const radios = editModal.querySelectorAll('input[name="edit-priority"]');
  radios.forEach(r => { r.checked = r.value === task.priority; });

  editModal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Set up focus trap
  focusableEls = Array.from(editModal.querySelectorAll(FOCUSABLE));
  firstFocus   = focusableEls[0];
  lastFocus    = focusableEls[focusableEls.length - 1];
  editModal.addEventListener('keydown', trapFocus);

  // Store element that had focus before modal opened
  editModal._triggerEl = document.activeElement;

  // Move focus into modal
  editInput.focus();
  editInput.select();
}

function closeEditModal() {
  editModal.hidden = true;
  document.body.style.overflow = '';
  editModal.removeEventListener('keydown', trapFocus);

  // Return focus to the element that opened modal
  if (editModal._triggerEl) editModal._triggerEl.focus();
  state.editingId = null;
}

modalSave && modalSave.addEventListener('click', () => {
  const newText = editInput.value.trim();
  if (!newText) {
    editErr.textContent = 'Task cannot be empty.';
    editErr.hidden = false;
    editInput.focus();
    return;
  }
  editErr.hidden = true;
  const priorityEl = editModal.querySelector('input[name="edit-priority"]:checked');
  const newPriority = priorityEl ? priorityEl.value : 'low';
  updateTask(state.editingId, newText, newPriority);
  closeEditModal();
});

modalCancel && modalCancel.addEventListener('click', closeEditModal);

// Close on backdrop click
editModal && editModal.addEventListener('click', e => {
  if (e.target === editModal) closeEditModal();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !editModal.hidden) closeEditModal();
});

// Save on Enter inside edit input
editInput && editInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); modalSave.click(); }
});


/* ================================================================
   BOOT
   ================================================================ */
(function init() {
  loadTasks();

  // If no saved tasks, seed with a couple of examples so it
  // doesn't look empty on first load
  if (state.tasks.length === 0) {
    state.tasks = [
      createTask('Review the accessibility audit report', 'high'),
      createTask('Update project README on GitHub', 'medium'),
      createTask('Add localStorage persistence to Task Board', 'low'),
    ];
    // Mark first one done so progress bar shows something
    state.tasks[0].completed = true;
    saveTasks();
  }

  render();
})();
