# Web_development_task3
# Ashen Paul — Task 3: JavaScript Logic & State Management

A fully client-side To-Do List application built with vanilla JavaScript.
No libraries, no frameworks. Just HTML, CSS, and JS — written by hand.

---

## What it does

| Feature | Detail |
|---|---|
| **Create** | Type a task, pick a priority, press Enter or click Add |
| **Read** | Tasks render from state, filtered view updates instantly |
| **Update** | Click the edit button — modal opens with focus trap |
| **Delete** | Click the bin icon — task removed, screen reader announces |
| **localStorage** | All tasks saved automatically, survive a full page reload |
| **Filter** | All / Active / Completed — updates task list and empty state |
| **Search** | Debounced search — matching text highlighted in yellow |
| **Priority** | Low / Medium / High — shown as coloured badges |
| **Bulk actions** | Mark all done / Clear completed |
| **Progress bar** | Live percentage of tasks completed |
| **Stats** | Total, Active, Done — update on every change |
| **Dark / light mode** | Toggle saved to localStorage |
| **Accessibility** | ARIA live regions, focus trap in modal, keyboard nav |

---

## Files

```
task3-todo/
├── index.html   Markup — semantic HTML5, ARIA attributes
├── style.css    Styles — dark/light tokens, Grid, Flexbox, animations
├── app.js       All logic — state, CRUD, localStorage, events
└── README.md    This file
```

---

## How to upload to GitHub

### If this is your first time on this machine

```bash
git config --global user.name "Ashen Paul"
git config --global user.email "hello@ashenpaul.dev"
```

---

### Option A — New repo (Task 3 only)

```bash
cd path/to/task3-todo

git init
git add .
git commit -m "task 3: JavaScript logic and state management — To-Do app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/todo-app.git
git push -u origin main
```

---

### Option B — Add to your existing portfolio repo

Copy the `task3-todo` folder into your portfolio repo, then:

```bash
cd path/to/portfolio

git add task3-todo/
git commit -m "task 3: To-Do app — CRUD, localStorage, filter, search"
git push
```

---

### Enable GitHub Pages (free hosting)

1. Go to your repo on GitHub
2. **Settings → Pages**
3. Source: **main** / folder: **/ (root)**
4. Save — live at `https://YOUR_USERNAME.github.io/todo-app/`

---

### Every future update

```bash
git add .
git commit -m "describe what changed"
git push
```

---

## Useful Git commands

```bash
git status          # see what files changed
git log --oneline   # commit history
git diff            # changes before staging
```

---

## Licence

MIT
