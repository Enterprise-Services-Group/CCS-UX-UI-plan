/* ==================================================================
   CCS UX/UI Delivery Plan — app logic
   Views: timeline, swimlanes, epics, dependencies, deliverables, jira
   ================================================================== */

const STORAGE_KEY = "ccs-delivery-plan-status-v1";
const COLLAPSE_KEY = "ccs-delivery-plan-collapsed-v1";
const SCHEDULE_KEY = "ccs-delivery-plan-schedule-v1";
const EDITS_KEY = "ccs-delivery-plan-edits-v1";

const state = {
  view: "timeline",
  filters: { search: "", role: "all", month: "all", epic: "all" },
  statusShow: { "not-started": true, "in-progress": true, "complete": true },
  status: loadStatus(),       // { "1.1": "in-progress", ... }
  schedule: loadSchedule(),   // { "1.1": { start: 0, end: 0 } } month indices
  edits: loadEdits(),         // structural edits to epics/tasks (see loadEdits)
  collapsed: loadCollapsed(), // { "E0": true }
  compact: false,
  editMode: false             // when true, titles/fields become editable
};

/* ---------------------------- storage ---------------------------- */
function loadStatus() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveStatus() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.status)); }
function loadSchedule() {
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY)) || {}; }
  catch { return {}; }
}
function saveSchedule() { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(state.schedule)); }

/* Structural edits layer.
   epicEdits / taskEdits : { id: { field: value, ... } } overrides on base items
   addedEpics / addedTasks : full new objects created in-app
   deletedEpics / deletedTasks : arrays of ids removed (base or added)         */
function emptyEdits() {
  return { epicEdits: {}, taskEdits: {}, addedEpics: [], addedTasks: [], deletedEpics: [], deletedTasks: [] };
}
function loadEdits() {
  try {
    const e = JSON.parse(localStorage.getItem(EDITS_KEY));
    return e ? Object.assign(emptyEdits(), e) : emptyEdits();
  } catch { return emptyEdits(); }
}
function saveEdits() { localStorage.setItem(EDITS_KEY, JSON.stringify(state.edits)); }

/* Compose the working EPICS / TASKS arrays from base data + edits. */
function buildModel() {
  const ed = state.edits;
  const delE = new Set(ed.deletedEpics);
  const delT = new Set(ed.deletedTasks);

  EPICS = BASE_EPICS
    .filter(e => !delE.has(e.id))
    .map(e => Object.assign(cloneDeep(e), ed.epicEdits[e.id] || {}))
    .concat(ed.addedEpics.filter(e => !delE.has(e.id))
      .map(e => Object.assign(cloneDeep(e), ed.epicEdits[e.id] || {})));

  TASKS = BASE_TASKS
    .filter(t => !delT.has(t.id) && !delE.has(t.epic))
    .map(t => Object.assign(cloneDeep(t), ed.taskEdits[t.id] || {}))
    .concat(ed.addedTasks.filter(t => !delT.has(t.id) && !delE.has(t.epic))
      .map(t => Object.assign(cloneDeep(t), ed.taskEdits[t.id] || {})));

  // keep epics in their canonical order, then any added epics by id
  EPICS.sort((a, b) => epicOrder(a.id) - epicOrder(b.id));
}
function epicOrder(id) {
  const i = BASE_EPICS.findIndex(e => e.id === id);
  return i === -1 ? 1000 + (parseInt(id.replace(/\D/g, ""), 10) || 0) : i;
}

/* Record a field edit on an epic or task (merges into the edits layer). */
function editEpic(id, patch) {
  if (isAddedEpic(id)) {
    const a = state.edits.addedEpics.find(e => e.id === id);
    Object.assign(a, patch);
  } else {
    state.edits.epicEdits[id] = Object.assign(state.edits.epicEdits[id] || {}, patch);
  }
  saveEdits(); buildModel();
}
function editTask(id, patch) {
  if (isAddedTask(id)) {
    const a = state.edits.addedTasks.find(t => t.id === id);
    Object.assign(a, patch);
  } else {
    state.edits.taskEdits[id] = Object.assign(state.edits.taskEdits[id] || {}, patch);
  }
  saveEdits(); buildModel();
}
const isAddedEpic = id => state.edits.addedEpics.some(e => e.id === id);
const isAddedTask = id => state.edits.addedTasks.some(t => t.id === id);

function deleteEpic(id) {
  if (isAddedEpic(id)) state.edits.addedEpics = state.edits.addedEpics.filter(e => e.id !== id);
  if (!state.edits.deletedEpics.includes(id)) state.edits.deletedEpics.push(id);
  delete state.edits.epicEdits[id];
  saveEdits(); buildModel();
}
function deleteTask(id) {
  if (isAddedTask(id)) state.edits.addedTasks = state.edits.addedTasks.filter(t => t.id !== id);
  if (!state.edits.deletedTasks.includes(id)) state.edits.deletedTasks.push(id);
  delete state.edits.taskEdits[id];
  saveEdits(); buildModel();
}

const EPIC_PALETTE = ["#5B6B7B","#3B82C4","#2BA89A","#C9831F","#8B5CC7","#C2476A","#4A9E54",
  "#0E7C86","#B23A6F","#6D8C2E","#9A6BC2","#C56A2D","#3E7CB1","#A03E52"];

function nextEpicId() {
  let n = 0;
  while (BASE_EPICS.some(e => e.id === "E" + n) || state.edits.addedEpics.some(e => e.id === "E" + n)) n++;
  return "E" + n;
}
function nextTaskId(epicId) {
  const num = epicId.replace(/\D/g, "") || "X";
  let sub = 1;
  const exists = id => TASKS.some(t => t.id === id) || state.edits.addedTasks.some(t => t.id === id);
  while (exists(num + "." + sub)) sub++;
  return num + "." + sub;
}

function addEpic() {
  const id = nextEpicId();
  const colour = EPIC_PALETTE[(BASE_EPICS.length + state.edits.addedEpics.length) % EPIC_PALETTE.length];
  const e = {
    id, title: "New Epic", colour,
    duration: "June to November 2026", owner: "UX/UI", roles: ["ux"],
    purpose: "Describe the purpose of this epic.", start: "June", end: "November"
  };
  state.edits.addedEpics.push(e);
  // un-delete if an id was previously removed
  state.edits.deletedEpics = state.edits.deletedEpics.filter(d => d !== id);
  saveEdits(); buildModel();
  return id;
}
function addTask(epicId) {
  const id = nextTaskId(epicId);
  const t = {
    id, epic: epicId, name: "New Task", owner: "UX/UI", roles: ["ux"],
    start: "June", end: "June", deps: [], depText: "None", critical: false,
    deliverables: [], acceptance: []
  };
  state.edits.addedTasks.push(t);
  saveEdits(); buildModel();
  return id;
}

function resetEdits() {
  state.edits = emptyEdits();
  saveEdits(); buildModel();
}

/* Export / import the full edited plan as JSON (browser-only persistence). */
function exportPlanJSON() {
  buildModel();
  const payload = {
    meta: { app: "CCS UX/UI Delivery Plan", exported: new Date().toISOString(), version: 1 },
    epics: EPICS, tasks: TASKS,
    status: state.status, schedule: state.schedule
  };
  downloadFile(JSON.stringify(payload, null, 2), "ccs-delivery-plan.json", "application/json");
}
function importPlanJSON(text) {
  const data = JSON.parse(text);
  if (!data.epics || !data.tasks) throw new Error("File is missing epics or tasks.");
  // Rebuild the edits layer so imported items become 'added', overriding base.
  const ed = emptyEdits();
  const baseEpicIds = new Set(BASE_EPICS.map(e => e.id));
  const baseTaskIds = new Set(BASE_TASKS.map(t => t.id));
  const impEpicIds = new Set(data.epics.map(e => e.id));
  const impTaskIds = new Set(data.tasks.map(t => t.id));
  BASE_EPICS.forEach(e => { if (!impEpicIds.has(e.id)) ed.deletedEpics.push(e.id); });
  BASE_TASKS.forEach(t => { if (!impTaskIds.has(t.id)) ed.deletedTasks.push(t.id); });
  data.epics.forEach(e => {
    if (baseEpicIds.has(e.id)) ed.epicEdits[e.id] = e; else ed.addedEpics.push(e);
  });
  data.tasks.forEach(t => {
    if (baseTaskIds.has(t.id)) ed.taskEdits[t.id] = t; else ed.addedTasks.push(t);
  });
  state.edits = ed;
  if (data.status) state.status = data.status;
  if (data.schedule) state.schedule = data.schedule;
  saveEdits(); saveStatus(); saveSchedule(); buildModel();
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type + ";charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; }
  catch { return {}; }
}
function saveCollapsed() { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state.collapsed)); }

function getStatus(id) { return state.status[id] || "not-started"; }
function setStatus(id, s) { state.status[id] = s; saveStatus(); }

/* ---------------------- scheduling (fortnights) ------------------
   The timeline is divided into half-month "fortnight" slots so blocks
   can be as short as 2 weeks. There are HALVES_PER (=2) per month and
   TOTAL_HALVES across the whole window.
   A half-position h:  month = floor(h/2), half = h%2 (0 = 1st half).
   A bar occupies inclusive half-slots [startHalf .. endHalf].          */
const HALVES_PER = 2;
const TOTAL_HALVES = () => MONTHS.length * HALVES_PER;

/* A task's ORIGINAL position in half-slots (full months => both halves). */
function baseHalves(t) {
  return { startHalf: MONTH_INDEX(t.start) * HALVES_PER,
           endHalf: MONTH_INDEX(t.end) * HALVES_PER + (HALVES_PER - 1) };
}
/* Read a stored override, migrating the old month-based format
   ({start,end} as month indices) to half-slots transparently. */
function storedHalves(o) {
  if (!o) return null;
  if (o.unit === "half") return { startHalf: o.start, endHalf: o.end };
  // legacy month-index override -> convert to full-month half range
  return { startHalf: o.start * HALVES_PER, endHalf: o.end * HALVES_PER + (HALVES_PER - 1) };
}

/* Effective schedule for a task. Returns half positions, derived month
   indices (for the month filter), and human-readable labels. */
function getSchedule(t) {
  const ov = storedHalves(state.schedule[t.id]);
  const base = baseHalves(t);
  const startHalf = ov ? ov.startHalf : base.startHalf;
  const endHalf   = ov ? ov.endHalf   : base.endHalf;
  const startIdx = Math.floor(startHalf / HALVES_PER);
  const endIdx   = Math.floor(endHalf / HALVES_PER);
  return {
    startHalf, endHalf, startIdx, endIdx,
    startName: MONTHS[startIdx], endName: MONTHS[endIdx],
    startLabel: halfLabel(startHalf), endLabel: halfLabel(endHalf),
    rangeLabel: halfRangeLabel(startHalf, endHalf),
    halves: endHalf - startHalf + 1,            // duration in fortnights
    moved: !!ov
  };
}
/* "June (1st half)" / "June (2nd half)" */
function halfLabel(h) {
  const m = MONTHS[Math.floor(h / HALVES_PER)];
  return (h % HALVES_PER === 0) ? `${m} (1st half)` : `${m} (2nd half)`;
}
/* Compact range label, collapsing whole months. e.g. "June–July",
   "June (2nd half)", "June (2nd half) – August (1st half)". */
function halfRangeLabel(s, e) {
  const sMonth = Math.floor(s / HALVES_PER), eMonth = Math.floor(e / HALVES_PER);
  const wholeStart = s % HALVES_PER === 0;
  const wholeEnd = e % HALVES_PER === HALVES_PER - 1;
  if (wholeStart && wholeEnd) {
    return sMonth === eMonth ? MONTHS[sMonth] : `${MONTHS[sMonth]}–${MONTHS[eMonth]}`;
  }
  const half = h => (h % HALVES_PER === 0 ? "1st half" : "2nd half");
  const part = (month, h) => `${MONTHS[month]} (${half(h)})`;
  if (s === e) return part(sMonth, s);
  const left = wholeStart ? MONTHS[sMonth] : part(sMonth, s);
  const right = wholeEnd ? MONTHS[eMonth] : part(eMonth, e);
  return `${left} – ${right}`;
}
/* Persist an override in half-slots, dropping it if it matches the base. */
function setHalves(t, startHalf, endHalf) {
  const base = baseHalves(t);
  if (startHalf === base.startHalf && endHalf === base.endHalf) {
    delete state.schedule[t.id];
  } else {
    state.schedule[t.id] = { unit: "half", start: startHalf, end: endHalf };
  }
  saveSchedule();
}

/* --------------------------- utilities --------------------------- */
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function roleBadge(roleId) {
  const r = ROLES[roleId];
  if (!r) return "";
  return `<span class="badge badge-${roleId}" title="${esc(r.name)} — ${esc(r.owner)}">${r.short}</span>`;
}
function statusLabel(s) {
  return { "not-started": "Not started", "in-progress": "In progress", "complete": "Complete" }[s];
}

/* Expand an epic-level dependency (e.g. "E2") into its tasks for matching. */
function resolveDeps(task) {
  const out = [];
  task.deps.forEach(d => {
    if (d.startsWith("E")) {
      TASKS.filter(t => t.epic === d).forEach(t => out.push(t.id));
    } else out.push(d);
  });
  return out;
}

/* ------------------------- filtering core ------------------------ */
function taskMatchesFilters(t) {
  const f = state.filters;
  if (f.role !== "all" && !t.roles.includes(f.role)) return false;
  if (f.epic !== "all" && t.epic !== f.epic) return false;
  if (f.month !== "all") {
    const s = getSchedule(t), m = MONTH_INDEX(f.month);
    if (m < s.startIdx || m > s.endIdx) return false;
  }
  if (!state.statusShow[getStatus(t.id)]) return false;
  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    const hay = [t.id, t.name, t.owner, t.depText, ...t.deliverables, ...t.acceptance].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
function visibleTasks() { return TASKS.filter(taskMatchesFilters); }

/* ============================ DASHBOARD ========================== */
function renderDashboard() {
  const root = document.getElementById("dashboard");
  root.innerHTML = "";
  const all = TASKS;
  const counts = { "not-started": 0, "in-progress": 0, "complete": 0 };
  all.forEach(t => counts[getStatus(t.id)]++);
  const pct = all.length ? Math.round((counts.complete / all.length) * 100) : 0;

  // overall
  const c1 = el("div", "dash-card");
  c1.innerHTML = `<h4>Overall progress</h4>
    <div class="dash-stat">${pct}% <small>${counts.complete}/${all.length} tasks complete</small></div>
    <div class="dash-bars" style="margin-top:8px">
      <div class="dash-bar-row"><span class="dash-bar-label">Done</span>
        <div class="dash-bar-track"><div class="dash-bar-fill" style="width:${pct}%"></div></div>
        <span class="dash-bar-pct">${pct}%</span></div>
    </div>`;
  root.appendChild(c1);

  // by epic
  const c2 = el("div", "dash-card");
  let bars = "";
  EPICS.forEach(e => {
    const ts = TASKS.filter(t => t.epic === e.id);
    const done = ts.filter(t => getStatus(t.id) === "complete").length;
    const p = ts.length ? Math.round((done / ts.length) * 100) : 0;
    bars += `<div class="dash-bar-row"><span class="dash-bar-label">${e.id}</span>
      <div class="dash-bar-track"><div class="dash-bar-fill" style="width:${p}%;background:${e.colour}"></div></div>
      <span class="dash-bar-pct">${p}%</span></div>`;
  });
  c2.innerHTML = `<h4>% complete by Epic</h4><div class="dash-bars">${bars}</div>`;
  root.appendChild(c2);

  // by role
  const c3 = el("div", "dash-card");
  let rbars = "";
  ["ux", "sme", "dev", "gov"].forEach(rid => {
    const ts = TASKS.filter(t => t.roles.includes(rid));
    const done = ts.filter(t => getStatus(t.id) === "complete").length;
    const p = ts.length ? Math.round((done / ts.length) * 100) : 0;
    rbars += `<div class="dash-bar-row"><span class="dash-bar-label">${ROLES[rid].short}</span>
      <div class="dash-bar-track"><div class="dash-bar-fill" style="width:${p}%"></div></div>
      <span class="dash-bar-pct">${p}%</span></div>`;
  });
  c3.innerHTML = `<h4>% complete by role</h4><div class="dash-bars">${rbars}</div>`;
  root.appendChild(c3);

  // risk
  const critOpen = TASKS.filter(t => t.critical && getStatus(t.id) !== "complete").length;
  const c4 = el("div", "dash-card");
  c4.innerHTML = `<h4>Critical dependencies</h4>
    <div class="dash-stat" style="color:${critOpen ? 'var(--warn)' : 'var(--st-done)'}">${critOpen}
    <small>tasks with strong deps still open</small></div>`;
  root.appendChild(c4);
}

/* ============================ TIMELINE =========================== */
function renderTimeline() {
  const root = el("div");
  const tl = el("div", "timeline");
  const head = el("div", "tl-head");
  head.innerHTML = `<div>Task</div>` + MONTHS.map(m => `<div>${m}</div>`).join("");
  tl.appendChild(head);

  const vis = visibleTasks();
  EPICS.forEach(e => {
    if (state.filters.epic !== "all" && state.filters.epic !== e.id) return;
    const ts = vis.filter(t => t.epic === e.id);
    if (!ts.length) return;
    const group = el("div", "tl-epic-group");
    group.style.setProperty("--epic-colour", e.colour);

    const collapsed = !!state.collapsed[e.id];
    const eh = el("div", "tl-epic-header" + (collapsed ? " collapsed" : ""));
    eh.innerHTML = `<span class="chev">▼</span> <span>${e.id} · ${esc(e.title)}</span>
      <span class="epic-count">${ts.length} task${ts.length !== 1 ? "s" : ""} · ${esc(e.duration)}</span>`;
    eh.onclick = () => { state.collapsed[e.id] = !collapsed; saveCollapsed(); render(); };
    group.appendChild(eh);

    if (!collapsed) {
      ts.forEach(t => group.appendChild(timelineRow(t, e)));
    }
    tl.appendChild(group);
  });
  if (!vis.length) tl.appendChild(el("div", "view-empty", "No tasks match the current filters."));
  const hint = el("div", "tl-hint",
    `Tip: drag a bar to move it, or drag its left / right edge to change its duration. Bars snap to 2-week blocks (each month has an early and late half), so you can shorten a task to a single fortnight. Changes save automatically. Click a bar to open its detail.`);
  root.appendChild(hint);
  root.appendChild(tl);
  return root;
}

function timelineRow(t, e) {
  const row = el("div", "tl-row");
  const sch = getSchedule(t);
  const total = TOTAL_HALVES();
  const left = (sch.startHalf / total) * 100;
  const width = (sch.halves / total) * 100;

  const label = el("div", "tl-label");
  label.innerHTML = `<span class="tl-id">${t.id}</span>
    <span class="tl-name">${esc(t.name)}</span>
    <span class="tl-meta">${t.roles.map(roleBadge).join("")}
      <span class="status-dot ${getStatus(t.id)}" title="${statusLabel(getStatus(t.id))}"></span>
      ${sch.moved ? '<span class="moved-flag" title="Rescheduled from ' + t.start + (t.start !== t.end ? "–" + t.end : "") + '">edited</span>' : ''}
      ${t.critical ? '<span class="crit-flag">Critical dep</span>' : ''}</span>`;
  label.onclick = () => openDetail(t.id);
  row.appendChild(label);

  const track = el("div", "tl-track");
  const grid = el("div", "tl-grid");
  // 6 month columns, each split into two fortnight sub-cells
  grid.innerHTML = MONTHS.map(() => `<span class="tl-col"><i></i><i></i></span>`).join("");
  track.appendChild(grid);

  const bar = el("div", "tl-bar" + (sch.moved ? " moved" : "") + (sch.halves === 1 ? " fortnight" : ""));
  bar.style.left = left + "%";
  bar.style.width = width + "%";
  bar.style.background = e.colour;
  bar.style.opacity = getStatus(t.id) === "not-started" ? "0.78" : "1";
  bar.innerHTML =
    `<span class="bar-handle bar-handle-l" title="Drag to change start"></span>` +
    `<span class="bar-body">${t.id}${t.deps.length ? `<span class="bar-dep" title="Depends on ${esc(t.depText)}">⇠</span>` : ""}</span>` +
    `<span class="bar-handle bar-handle-r" title="Drag to change end"></span>`;
  bar.title = `${t.name} (${sch.rangeLabel}) — drag to move, drag edges to resize. Snaps to 2-week blocks.`;
  enableBarDrag(bar, track, t);
  track.appendChild(bar);

  row.appendChild(track);
  return row;
}

/* Drag a timeline bar to move it (preserve duration) or drag an edge to
   resize it. Snaps to 2-week (half-month) fortnight slots. Minimum bar
   length is one fortnight. Saves to localStorage and re-renders. */
function enableBarDrag(bar, track, t) {
  const total = TOTAL_HALVES();
  const maxHalf = total - 1;
  let mode = null;          // "move" | "resize-l" | "resize-r"
  let startX = 0;
  let origStart = 0, origEnd = 0;
  let halfPx = 0;
  let moved = false;

  const onDown = (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const handle = ev.target.closest(".bar-handle");
    mode = handle
      ? (handle.classList.contains("bar-handle-l") ? "resize-l" : "resize-r")
      : "move";
    const s = getSchedule(t);
    origStart = s.startHalf; origEnd = s.endHalf;
    startX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
    halfPx = track.getBoundingClientRect().width / total;   // px per fortnight
    moved = false;
    document.body.classList.add("dragging-bar");
    bar.classList.add("grabbing");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    ev.preventDefault();
  };

  const onMove = (ev) => {
    const clientX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
    const deltaHalves = Math.round((clientX - startX) / halfPx);
    if (deltaHalves !== 0) moved = true;
    let ns = origStart, ne = origEnd;
    if (mode === "move") {
      const dur = origEnd - origStart;
      ns = Math.max(0, Math.min(origStart + deltaHalves, maxHalf - dur));
      ne = ns + dur;
    } else if (mode === "resize-l") {
      ns = Math.max(0, Math.min(origStart + deltaHalves, origEnd)); // min 1 fortnight, can't pass end
    } else if (mode === "resize-r") {
      ne = Math.min(maxHalf, Math.max(origEnd + deltaHalves, origStart)); // min 1 fortnight, can't pass start
    }
    bar.style.left = (ns / total) * 100 + "%";
    bar.style.width = ((ne - ns + 1) / total) * 100 + "%";
    bar.classList.toggle("fortnight", ne - ns === 0);
    bar.dataset.pendStart = ns;
    bar.dataset.pendEnd = ne;
    if (ev.cancelable) ev.preventDefault();
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onUp);
    document.body.classList.remove("dragging-bar");
    bar.classList.remove("grabbing");
    if (moved && bar.dataset.pendStart !== undefined) {
      setHalves(t, +bar.dataset.pendStart, +bar.dataset.pendEnd);
      render();
    } else {
      openDetail(t.id);   // treated as a click
    }
    mode = null;
  };

  bar.addEventListener("mousedown", onDown);
  bar.addEventListener("touchstart", onDown, { passive: false });
}

/* ============================ SWIMLANES ========================== */
function renderSwimlanes() {
  const root = el("div", "swimlanes");
  const laneOrder = ["ux", "sme", "dev", "gov"];
  const vis = visibleTasks();

  laneOrder.forEach(rid => {
    if (state.filters.role !== "all" && state.filters.role !== rid) return;
    const r = ROLES[rid];
    const ts = vis.filter(t => t.roles.includes(rid));
    const lane = el("div", "lane");
    lane.style.setProperty("--lane-colour", rid === "ux" ? "#3B82C4" : rid === "sme" ? "#2BA89A" : rid === "dev" ? "#8B5CC7" : "#5B6B7B");

    const head = el("div", "lane-head");
    head.innerHTML = `${roleBadge(rid)}<h3>${esc(r.name)}</h3>
      <span class="lane-owner">${esc(r.owner)}</span>
      <span class="lane-count">${ts.length} task${ts.length !== 1 ? "s" : ""}</span>`;
    lane.appendChild(head);

    const grid = el("div", "lane-grid");
    MONTHS.forEach(m => {
      const cell = el("div", "lane-month");
      cell.appendChild(el("div", "lane-month-label", m));
      const mi = MONTH_INDEX(m);
      ts.filter(t => { const s = getSchedule(t); return s.startIdx <= mi && mi <= s.endIdx; }).forEach(t => {
        const e = epicById(t.epic);
        const shared = t.roles.filter(x => x !== "gov").length > 1;
        const card = el("div", "mini-task" + (shared ? " shared" : ""));
        card.style.setProperty("--epic-colour", e.colour);
        card.innerHTML = `<div class="mt-top"><span class="mt-id">${t.id}</span>
          <span class="status-dot ${getStatus(t.id)}"></span>
          ${t.critical ? '<span class="crit-flag">!</span>' : ''}</div>
          <div class="mt-name">${esc(t.name)}</div>`;
        card.onclick = () => openDetail(t.id);
        cell.appendChild(card);
      });
      grid.appendChild(cell);
    });
    lane.appendChild(grid);

    // overlap note: tasks in this lane shared with other roles
    const sharedTasks = ts.filter(t => t.roles.filter(x => x !== "gov").length > 1);
    if (sharedTasks.length) {
      lane.appendChild(el("div", "overlap-note",
        `Shared / overlapping work: ` + sharedTasks.map(t =>
          `<span class="overlap-pill">${t.id}</span>`).join(" ")));
    }
    root.appendChild(lane);
  });
  if (!root.children.length) root.appendChild(el("div", "view-empty", "No tasks match the current filters."));
  return root;
}

/* ============================== EPICS =========================== */
function renderEpics() {
  const root = el("div", "epic-grid");
  const vis = visibleTasks();

  if (state.editMode) {
    const bar = el("div", "edit-toolbar");
    bar.innerHTML = `<span class="edit-toolbar-msg"><b>Editing.</b> Add a new epic below, or use <b>+ Add task</b> inside any epic. Click an epic title, owner or purpose to edit it. Open a task to edit its details, deliverables and acceptance criteria.</span>`;
    const addE = el("button", "primary-btn", "+ Add new epic");
    addE.onclick = () => { const id = addEpic(); state.collapsed["epic-view-" + id] = false; render(); };
    bar.appendChild(addE);
    root.appendChild(bar);
  }

  EPICS.forEach(e => {
    if (state.filters.epic !== "all" && state.filters.epic !== e.id) return;
    const ts = vis.filter(t => t.epic === e.id);
    if (!ts.length && (state.filters.search || state.filters.role !== "all" || state.filters.month !== "all")) return;

    const allTs = TASKS.filter(t => t.epic === e.id);
    const done = allTs.filter(t => getStatus(t.id) === "complete").length;
    const pct = allTs.length ? Math.round((done / allTs.length) * 100) : 0;
    const allDeliv = allTs.flatMap(t => t.deliverables);
    const depList = [...new Set(allTs.flatMap(t => t.deps).filter(d => !d.startsWith("E")))];
    const editing = state.editMode;

    const card = el("div", "epic-card");
    card.style.setProperty("--epic-colour", e.colour);
    const collapsed = !!state.collapsed["epic-view-" + e.id];

    const head = el("div", "epic-card-head" + (collapsed ? " collapsed" : ""));
    const titleHtml = editing
      ? `<input class="edit-title-input epic" data-edit="title" value="${esc(e.title)}" placeholder="Epic title" />`
      : `<h3>${esc(e.title)}</h3>`;
    const purposeHtml = editing
      ? `<textarea class="edit-input ec-purpose-edit" data-edit="purpose" placeholder="Purpose">${esc(e.purpose)}</textarea>`
      : `<p class="ec-purpose">${esc(e.purpose)}</p>`;
    const ownerHtml = editing
      ? `<input class="edit-input inline" data-edit="owner" value="${esc(e.owner)}" />`
      : esc(e.owner);

    head.innerHTML = `<div class="epic-swatch">${e.id}</div>
      <div class="ec-body">
        ${titleHtml}
        ${purposeHtml}
        <div class="ec-meta">
          <span><b>Duration:</b> ${editing ? `<input class="edit-input inline" data-edit="duration" value="${esc(e.duration)}" />` : esc(e.duration)}</span>
          <span><b>Owner:</b> ${ownerHtml}</span>
          <span><b>Roles:</b> ${e.roles.map(roleBadge).join(" ")}</span>
          <span><b>Tasks:</b> ${allTs.length}</span>
          <span><b>Deliverables:</b> ${allDeliv.length}</span>
          <span><b>${pct}% complete</b></span>
        </div>
        <div class="epic-progress-mini"><div style="width:${pct}%;background:${e.colour}"></div></div>
      </div>
      ${editing ? `<button class="danger-btn epic-del" title="Delete epic">Delete epic</button>` : `<span class="chev">▼</span>`}`;

    // collapse only when clicking the header chrome, not inputs/buttons
    head.onclick = (ev) => {
      if (ev.target.closest("input, textarea, button, .role-pick")) return;
      state.collapsed["epic-view-" + e.id] = !collapsed; saveCollapsed(); render();
    };
    card.appendChild(head);

    if (editing) {
      head.querySelectorAll("[data-edit]").forEach(inp => {
        inp.onclick = ev => ev.stopPropagation();
        inp.oninput = () => editEpic(e.id, { [inp.dataset.edit]: inp.value });
        if (inp.tagName === "TEXTAREA") { autoGrow(inp); inp.addEventListener("input", () => autoGrow(inp)); }
      });
      const delBtn = head.querySelector(".epic-del");
      if (delBtn) delBtn.onclick = (ev) => {
        ev.stopPropagation();
        if (confirm(`Delete epic ${e.id} “${e.title}” and its ${allTs.length} task(s)? This cannot be undone except by Reset.`)) {
          deleteEpic(e.id); render();
        }
      };
    }

    if (!collapsed) {
      const body = el("div", "epic-tasks");
      ts.forEach(t => {
        const row = el("div", "epic-task-row");
        row.innerHTML = `<span class="status-dot ${getStatus(t.id)}"></span>
          <span class="etr-id">${t.id}</span>
          <span class="etr-name">${esc(t.name)} ${t.roles.map(roleBadge).join("")}
          ${t.critical ? '<span class="crit-flag">Critical dep</span>' : ''}</span>
          <span class="etr-months">${getSchedule(t).rangeLabel}${getSchedule(t).moved ? ' <span class="moved-flag">edited</span>' : ''}</span>`;
        row.onclick = () => openDetail(t.id);
        body.appendChild(row);
      });
      if (!ts.length) body.appendChild(el("div", "overlap-note", "No tasks yet."));
      if (depList.length) {
        body.appendChild(el("div", "overlap-note",
          `Key dependencies: ${depList.map(d => `Task ${d}`).join(", ")}`));
      }
      if (editing) {
        const addT = el("button", "primary-btn epic-add-task", "+ Add task to this epic");
        addT.onclick = () => { const id = addTask(e.id); render(); openDetail(id); };
        body.appendChild(addT);
      }
      card.appendChild(body);
    }
    root.appendChild(card);
  });
  if (!root.children.length) root.appendChild(el("div", "view-empty", "No epics match the current filters."));

  if (state.editMode) {
    const addE = el("button", "add-epic-btn", "+ Add new epic");
    addE.onclick = () => { const id = addEpic(); state.collapsed["epic-view-" + id] = false; render(); };
    root.appendChild(addE);
  }
  return root;
}

/* =========================== DEPENDENCIES ======================= */
function renderDependencies() {
  const root = el("div", "dep-wrap");
  root.appendChild(el("div", "dep-legend",
    "▲ Critical dependencies are highlighted. Tasks with no predecessors can start immediately. Click any task to open its detail."));

  const vis = visibleTasks();
  const withDeps = vis.filter(t => t.deps.length);

  const chain = el("div", "dep-chain");
  chain.appendChild(el("h4", null, "Task dependency chain"));
  withDeps.forEach(t => {
    const e = epicById(t.epic);
    const item = el("div", "dep-item" + (t.critical ? " dep-critrow" : ""));
    const fromNodes = resolveDeps(t).map(d => {
      const dt = taskById(d);
      const de = dt ? epicById(dt.epic) : null;
      const colour = de ? de.colour : "#ccc";
      return `<span class="dep-node" data-dep="${d}" style="--epic-colour:${colour}">${d}${dt ? "" : ""}</span>`;
    });
    // Non-task deps (e.g. "Working build available")
    const textDep = t.deps.length === 0 || resolveDeps(t).every(d => taskById(d));
    item.innerHTML = `<div class="dep-from">${fromNodes.length ? fromNodes.join("") :
        `<span class="dep-node" style="--epic-colour:#bbb">${esc(t.depText)}</span>`}</div>
      <span class="dep-arrow">→</span>
      <div class="dep-target">
        <span class="dep-node" data-dep="${t.id}" style="--epic-colour:${e.colour}">${t.id}</span>
        <span>${esc(t.name)}</span>
        ${t.critical ? '<span class="crit-flag">Critical</span>' : ''}
      </div>`;
    chain.appendChild(item);
  });

  // External (non-task) dependencies block
  const extTasks = vis.filter(t => t.deps.length === 0 && t.depText && t.depText !== "None");
  root.appendChild(chain);

  if (extTasks.length) {
    const ext = el("div", "dep-chain");
    ext.appendChild(el("h4", null, "Tasks gated by external / build readiness"));
    extTasks.forEach(t => {
      const e = epicById(t.epic);
      const item = el("div", "dep-item" + (t.critical ? " dep-critrow" : ""));
      item.innerHTML = `<div class="dep-from"><span class="dep-node" style="--epic-colour:#bbb">${esc(t.depText)}</span></div>
        <span class="dep-arrow">→</span>
        <div class="dep-target"><span class="dep-node" data-dep="${t.id}" style="--epic-colour:${e.colour}">${t.id}</span>
        <span>${esc(t.name)}</span>${t.critical ? '<span class="crit-flag">Critical</span>' : ''}</div>`;
      ext.appendChild(item);
    });
    root.appendChild(ext);
  }

  root.querySelectorAll("[data-dep]").forEach(n => {
    n.onclick = () => { if (taskById(n.dataset.dep)) openDetail(n.dataset.dep); };
  });
  return root;
}

/* =========================== DELIVERABLES ======================= */
function renderDeliverables() {
  const root = el("div", "deliv-grid");
  const vis = visibleTasks();
  MONTHS.forEach(m => {
    if (state.filters.month !== "all" && state.filters.month !== m) return;
    const mi = MONTH_INDEX(m);
    const ts = vis.filter(t => { const s = getSchedule(t); return s.startIdx <= mi && mi <= s.endIdx; });
    if (!ts.length) return;
    const card = el("div", "deliv-month-card");
    card.appendChild(el("div", "deliv-month-head", m + " 2026"));

    ["ux", "sme", "dev", "gov"].forEach(rid => {
      const rt = ts.filter(t => t.roles.includes(rid));
      const delivs = [...new Set(rt.flatMap(t => t.deliverables))];
      if (!delivs.length) return;
      const block = el("div", "deliv-owner-block");
      block.innerHTML = `<div class="deliv-owner-head">${roleBadge(rid)} ${esc(ROLES[rid].name)}</div>
        <div class="deliv-list">${delivs.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("")}</div>`;
      card.appendChild(block);
    });
    root.appendChild(card);
  });
  if (!root.children.length) root.appendChild(el("div", "view-empty", "No deliverables match the current filters."));
  return root;
}

/* ============================ JIRA EXPORT ======================= */
function epicJiraText(e) {
  const ts = TASKS.filter(t => t.epic === e.id);
  return [
    `EPIC: ${e.id} — ${e.title}`,
    `Duration: ${e.duration}`,
    `Owner: ${e.owner}`,
    `Roles involved: ${e.roles.map(r => ROLES[r].name).join(", ")}`,
    ``,
    `Description:`,
    e.purpose,
    ``,
    `Tasks (${ts.length}): ${ts.map(t => t.id).join(", ")}`
  ].join("\n");
}
function taskJiraText(t) {
  const sch = getSchedule(t);
  return [
    `${t.id} — ${t.name}`,
    `Epic: ${t.epic} (${epicById(t.epic).title})`,
    `Owner: ${t.owner}`,
    `Start: ${sch.startLabel}    End: ${sch.endLabel}    (${sch.rangeLabel})` + (sch.moved ? `    [rescheduled from ${t.start}–${t.end}]` : ``),
    `Dependencies: ${t.depText}`,
    ``,
    `Description:`,
    `${epicById(t.epic).purpose}`,
    ``,
    `Deliverables:`,
    ...t.deliverables.map(d => `- ${d}`),
    ``,
    `Acceptance criteria:`,
    ...t.acceptance.map(a => `- ${a}`)
  ].join("\n");
}

function renderJira() {
  const root = el("div", "jira-wrap");
  const tb = el("div", "jira-toolbar");
  const copyAll = el("button", "copy-btn", "Copy entire backlog");
  copyAll.onclick = () => {
    const txt = EPICS.map(e =>
      epicJiraText(e) + "\n\n" + TASKS.filter(t => t.epic === e.id).map(taskJiraText).join("\n\n---\n\n")
    ).join("\n\n========================================\n\n");
    copyText(txt, copyAll, "Copy entire backlog");
  };
  tb.appendChild(copyAll);
  tb.appendChild(el("span", null, `<span style="color:var(--muted);font-size:12px">Copy-ready for Jira: ${EPICS.length} Epics, ${TASKS.length} Tasks</span>`));
  root.appendChild(tb);

  EPICS.forEach(e => {
    if (state.filters.epic !== "all" && state.filters.epic !== e.id) return;
    const ts = TASKS.filter(t => t.epic === e.id).filter(taskMatchesFilters);
    if (!ts.length) return;

    const block = el("div", "jira-epic");
    block.style.setProperty("--epic-colour", e.colour);
    const head = el("div", "jira-epic-head");
    head.innerHTML = `<div class="epic-swatch" style="width:26px;height:26px;font-size:11px">${e.id}</div>
      <h3>${esc(e.title)}</h3>`;
    const ecopy = el("button", "copy-btn", "Copy Epic");
    ecopy.onclick = () => copyText(epicJiraText(e), ecopy, "Copy Epic");
    head.appendChild(ecopy);
    block.appendChild(head);

    ts.forEach(t => {
      const tw = el("div", "jira-task");
      const th = el("div", "jira-task-head");
      th.innerHTML = `<span class="status-dot ${getStatus(t.id)}"></span>
        <span class="jt-title">${t.id} — ${esc(t.name)}</span>`;
      const tcopy = el("button", "copy-btn", "Copy Task");
      tcopy.onclick = () => copyText(taskJiraText(t), tcopy, "Copy Task");
      th.appendChild(tcopy);
      tw.appendChild(th);
      tw.appendChild(el("div", "jira-block", esc(taskJiraText(t))));
      block.appendChild(tw);
    });
    root.appendChild(block);
  });
  return root;
}

function copyText(txt, btn, original) {
  const done = () => { btn.textContent = "Copied ✓"; btn.classList.add("copied");
    setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  } else fallbackCopy(txt, done);
}
function fallbackCopy(txt, cb) {
  const ta = document.createElement("textarea");
  ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); } catch {}
  document.body.removeChild(ta); cb();
}

/* ----------------------- editable-field helpers ------------------ */
/* Builds an editable list (deliverables / acceptance criteria) inside `host`.
   items: current array; onChange(newArray) is called on every change. */
function buildEditableList(host, items, onChange, placeholder) {
  host.innerHTML = "";
  const list = el("div", "edit-list");
  items.forEach((val, i) => {
    const row = el("div", "edit-list-row");
    const input = el("textarea", "edit-input");
    input.rows = 2; input.value = val;
    input.placeholder = placeholder;
    input.oninput = () => { autoGrow(input); const next = items.slice(); next[i] = input.value; onChange(next); };
    const del = el("button", "mini-del", "&times;");
    del.title = "Remove";
    del.onclick = () => { const next = items.slice(); next.splice(i, 1); onChange(next); };
    row.appendChild(input); row.appendChild(del);
    list.appendChild(row);
  });
  const add = el("button", "add-line-btn", "+ Add");
  add.onclick = () => onChange(items.concat([""]));
  host.appendChild(list);
  host.appendChild(add);
  // size each textarea to its content now that it's in the DOM
  list.querySelectorAll("textarea").forEach(autoGrow);
}
function autoGrow(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.max(60, ta.scrollHeight) + "px";
}

/* ============================ DETAIL PANEL ====================== */
function openDetail(id) {
  const t = taskById(id);
  if (!t) return;
  state._openTaskId = id;
  const e = epicById(t.epic);
  const editing = state.editMode;
  const panel = document.getElementById("detail-panel");
  const overlay = document.getElementById("overlay");
  panel.style.setProperty("--epic-colour", e.colour);

  const depsHtml = t.deps.length
    ? resolveDeps(t).map(d => taskById(d)
        ? `<span class="dep-link" data-go="${d}">${d} ${esc(taskById(d).name)}</span>`
        : `<span>${esc(d)}</span>`).join("<br>") + `<div style="color:var(--muted);font-size:12px;margin-top:6px">${esc(t.depText)}</div>`
    : `<span style="color:var(--muted)">None — can start immediately</span>` +
      (t.depText && t.depText !== "None" ? `<div style="color:var(--muted);font-size:12px;margin-top:4px">Gated by: ${esc(t.depText)}</div>` : "");

  const cur = getStatus(t.id);
  const sch = getSchedule(t);
  const c = document.getElementById("detail-content");

  const titleHtml = editing
    ? `<input class="edit-title-input" id="edit-task-name" value="${esc(t.name)}" placeholder="Task name" />`
    : `<h2>${esc(t.name)}</h2>`;

  const monthOptions = (sel) => MONTHS.map(m => `<option ${m === sel ? "selected" : ""}>${m}</option>`).join("");
  // fortnight options: value = half-slot index 0..11, label e.g. "June (1st half)"
  const halfOptions = (selHalf) => Array.from({ length: TOTAL_HALVES() }, (_, h) =>
    `<option value="${h}" ${h === selHalf ? "selected" : ""}>${halfLabel(h)}</option>`).join("");

  c.innerHTML = `
    <div class="detail-eyebrow">${e.id} · ${esc(e.title)}</div>
    ${titleHtml}
    <div class="detail-id">Task ${t.id}${t.critical ? ' · <span style="color:var(--warn);font-weight:700">▲ Critical dependency</span>' : ''}</div>

    <div class="detail-section">
      <h4>Status</h4>
      <div class="detail-status-picker">
        <button class="status-pick-btn not-started ${cur === 'not-started' ? 'active' : ''}" data-s="not-started">Not started</button>
        <button class="status-pick-btn in-progress ${cur === 'in-progress' ? 'active' : ''}" data-s="in-progress">In progress</button>
        <button class="status-pick-btn complete ${cur === 'complete' ? 'active' : ''}" data-s="complete">Complete</button>
      </div>
    </div>

    <div class="detail-section">
      ${editing ? `
        <div class="detail-row"><span class="dr-label">Owner</span><input class="edit-input inline" id="edit-task-owner" value="${esc(t.owner)}" /></div>
        <div class="detail-row"><span class="dr-label">Roles</span><span class="dr-val" id="edit-task-roles">${["ux","sme","dev","gov"].map(r => `<label class="role-pick"><input type="checkbox" value="${r}" ${t.roles.includes(r) ? "checked" : ""}/> ${ROLES[r].short}</label>`).join(" ")}</span></div>
        <div class="detail-row"><span class="dr-label">Start</span><select class="edit-input inline" id="edit-task-start">${halfOptions(sch.startHalf)}</select></div>
        <div class="detail-row"><span class="dr-label">End</span><select class="edit-input inline" id="edit-task-end">${halfOptions(sch.endHalf)}</select></div>
        <div class="detail-row"><span class="dr-label">Dependencies</span><input class="edit-input inline" id="edit-task-deptext" value="${esc(t.depText)}" placeholder="e.g. Task 1.1 complete" /></div>
        <div class="detail-row"><span class="dr-label">Critical</span><label class="role-pick"><input type="checkbox" id="edit-task-critical" ${t.critical ? "checked" : ""}/> flag as critical dependency</label></div>
      ` : `
        <div class="detail-row"><span class="dr-label">Owner</span><span class="dr-val">${esc(t.owner)}</span></div>
        <div class="detail-row"><span class="dr-label">Role(s)</span><span class="dr-val">${t.roles.map(roleBadge).join(" ")}</span></div>
        <div class="detail-row"><span class="dr-label">Start</span><span class="dr-val">${sch.startLabel} 2026</span></div>
        <div class="detail-row"><span class="dr-label">End</span><span class="dr-val">${sch.endLabel} 2026</span></div>
        <div class="detail-row"><span class="dr-label">Span</span><span class="dr-val">${sch.rangeLabel} · ${sch.halves} fortnight${sch.halves !== 1 ? "s" : ""}</span></div>
        ${sch.moved ? `<div class="detail-row"><span class="dr-label">Original</span><span class="dr-val" style="font-weight:500;color:var(--muted)">${t.start}–${t.end} · <span class="dep-link" id="detail-reset-sched">reset to original</span></span></div>` : ``}
        <div class="detail-section" style="margin-top:14px"><h4>Dependencies</h4><div>${depsHtml}</div></div>
      `}
    </div>

    <div class="detail-section">
      <h4>Deliverables</h4>
      ${editing ? `<div id="edit-deliverables"></div>`
        : `<div class="deliv-list">${t.deliverables.length ? t.deliverables.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("") : '<span style="color:var(--muted)">None</span>'}</div>`}
    </div>

    <div class="detail-section">
      <h4>Acceptance criteria</h4>
      ${editing ? `<div id="edit-acceptance"></div>`
        : `<ul class="detail-list">${t.acceptance.length ? t.acceptance.map(a => `<li>${esc(a)}</li>`).join("") : '<li style="color:var(--muted);list-style:none;margin-left:-18px">None</li>'}</ul>`}
    </div>

    <div class="detail-section detail-actions">
      <button class="copy-btn" id="detail-copy">Copy Jira task</button>
      ${editing ? `<button class="danger-btn" id="detail-delete">Delete task</button>` : ``}
    </div>`;

  c.querySelectorAll(".status-pick-btn").forEach(b => {
    b.onclick = () => { setStatus(t.id, b.dataset.s); openDetail(t.id); renderDashboard(); renderCurrentView(); };
  });
  c.querySelectorAll("[data-go]").forEach(n => { n.onclick = () => openDetail(n.dataset.go); });
  c.querySelector("#detail-copy").onclick = (ev) => copyText(taskJiraText(t), ev.target, "Copy Jira task");
  const resetSched = c.querySelector("#detail-reset-sched");
  if (resetSched) resetSched.onclick = () => { delete state.schedule[t.id]; saveSchedule(); openDetail(t.id); render(); };

  if (editing) {
    const nameI = c.querySelector("#edit-task-name");
    nameI.oninput = () => { editTask(t.id, { name: nameI.value }); renderCurrentView(); };
    const ownerI = c.querySelector("#edit-task-owner");
    ownerI.oninput = () => { editTask(t.id, { owner: ownerI.value }); };
    c.querySelector("#edit-task-deptext").oninput = (ev) => editTask(t.id, { depText: ev.target.value });
    c.querySelector("#edit-task-critical").onchange = (ev) => { editTask(t.id, { critical: ev.target.checked }); renderCurrentView(); };
    c.querySelectorAll("#edit-task-roles input").forEach(chk => {
      chk.onchange = () => {
        const roles = [...c.querySelectorAll("#edit-task-roles input:checked")].map(x => x.value);
        editTask(t.id, { roles: roles.length ? roles : ["ux"] });
        renderCurrentView();
      };
    });
    const startSel = c.querySelector("#edit-task-start"), endSel = c.querySelector("#edit-task-end");
    const applyHalves = (changed) => {
      let s = +startSel.value, en = +endSel.value;
      // keep start <= end; nudge the other field if they cross
      if (en < s) { if (changed === "start") en = s; else s = en; }
      startSel.value = s; endSel.value = en;
      setHalves(t, s, en);   // persists as a fortnight-precise schedule override
      render(); openDetail(t.id);
    };
    startSel.onchange = () => applyHalves("start");
    endSel.onchange = () => applyHalves("end");

    rebindList(c, "#edit-deliverables", () => taskById(t.id).deliverables, next => editTask(t.id, { deliverables: next }), "Deliverable");
    rebindList(c, "#edit-acceptance", () => taskById(t.id).acceptance, next => editTask(t.id, { acceptance: next }), "Acceptance criterion");

    const del = c.querySelector("#detail-delete");
    if (del) del.onclick = () => {
      if (confirm(`Delete task ${t.id} “${t.name}”? This cannot be undone except by Reset.`)) {
        deleteTask(t.id); closeDetail(); render();
      }
    };
  }

  panel.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

/* Rebind an editable list so each change re-renders the list in place. */
function rebindList(scope, selector, getItems, setItems, placeholder) {
  const host = scope.querySelector(selector);
  if (!host) return;
  const refresh = () => buildEditableList(host, getItems(), onChange, placeholder);
  function onChange(next) { setItems(next); refresh(); renderCurrentView(); }
  refresh();
}
function closeDetail() {
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
  state._openTaskId = null;
}

/* ============================== RENDER ========================== */
const VIEW_RENDERERS = {
  timeline: renderTimeline,
  swimlanes: renderSwimlanes,
  epics: renderEpics,
  dependencies: renderDependencies,
  deliverables: renderDeliverables,
  jira: renderJira
};
function renderCurrentView() {
  const root = document.getElementById("view-root");
  root.innerHTML = "";
  root.appendChild(VIEW_RENDERERS[state.view]());
}
function render() {
  refreshEpicFilter();
  renderDashboard();
  renderCurrentView();
  syncHeaderHeight();
}

/* ============================== CSV ============================= */
function exportCSV() {
  const headers = ["Task ID", "Task Name", "Epic", "Epic Title", "Owner", "Roles", "Start", "End", "Span", "Fortnights", "Original Start", "Original End", "Rescheduled", "Status", "Critical", "Dependencies", "Deliverables", "Acceptance Criteria"];
  const rows = TASKS.map(t => {
    const s = getSchedule(t);
    return [
      t.id, t.name, t.epic, epicById(t.epic).title, t.owner,
      t.roles.map(r => ROLES[r].name).join("; "),
      s.startLabel, s.endLabel, s.rangeLabel, s.halves, t.start, t.end, s.moved ? "Yes" : "No",
      statusLabel(getStatus(t.id)), t.critical ? "Yes" : "No",
      t.depText, t.deliverables.join(" | "), t.acceptance.join(" | ")
    ].map(csvCell).join(",");
  });
  const csv = headers.map(csvCell).join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ccs-delivery-plan.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
function csvCell(v) {
  v = String(v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

/* Keep the sticky timeline month-header offset in sync with the
   (variable-height) app header so the months stay pinned below it. */
function syncHeaderHeight() {
  const h = document.querySelector(".app-header");
  if (h) document.documentElement.style.setProperty("--header-h", h.offsetHeight + "px");
}

/* ============================== INIT =========================== */
function refreshEpicFilter() {
  const ef = document.getElementById("filter-epic");
  if (!ef) return;
  const cur = ef.value;
  ef.innerHTML = '<option value="all">All epics</option>';
  EPICS.forEach(e => {
    const o = document.createElement("option");
    o.value = e.id; o.textContent = `${e.id} · ${e.title}`;
    ef.appendChild(o);
  });
  // keep selection if it still exists, else fall back to all
  ef.value = [...ef.options].some(o => o.value === cur) ? cur : "all";
  if (ef.value !== cur) state.filters.epic = ef.value;
}

function init() {
  buildModel();
  refreshEpicFilter();

  // view tabs
  document.querySelectorAll(".view-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".view-tab").forEach(x => x.classList.remove("active"));
      tab.classList.add("active");
      state.view = tab.dataset.view;
      renderCurrentView();
    };
  });

  // filters
  const sb = document.getElementById("filter-search");
  sb.oninput = () => { state.filters.search = sb.value; renderCurrentView(); };
  document.getElementById("filter-role").onchange = e => { state.filters.role = e.target.value; renderCurrentView(); };
  document.getElementById("filter-month").onchange = e => { state.filters.month = e.target.value; renderCurrentView(); };
  document.getElementById("filter-epic").onchange = e => { state.filters.epic = e.target.value; renderCurrentView(); };
  document.querySelectorAll(".status-check input").forEach(chk => {
    chk.onchange = () => { state.statusShow[chk.dataset.status] = chk.checked; render(); };
  });

  // header actions
  document.getElementById("btn-compact").onclick = (e) => {
    state.compact = !state.compact;
    document.body.classList.toggle("compact", state.compact);
    e.target.classList.toggle("on", state.compact);
    e.target.textContent = state.compact ? "Detailed view" : "Compact view";
  };
  document.getElementById("btn-print").onclick = () => {
    document.body.classList.add("print-all"); window.print();
    setTimeout(() => document.body.classList.remove("print-all"), 500);
  };
  document.getElementById("btn-csv").onclick = exportCSV;

  // edit mode toggle
  document.getElementById("btn-edit").onclick = (e) => {
    state.editMode = !state.editMode;
    document.body.classList.toggle("edit-mode", state.editMode);
    e.target.classList.toggle("on", state.editMode);
    e.target.textContent = state.editMode ? "✓ Done editing" : "✎ Edit / Add";
    // jump to the Epics view when turning editing on — that's where you
    // add/delete epics and tasks, so the controls are immediately visible.
    if (state.editMode && state.view !== "epics") {
      state.view = "epics";
      document.querySelectorAll(".view-tab").forEach(x => x.classList.toggle("active", x.dataset.view === "epics"));
    }
    render();
    // refresh an open detail panel so its fields switch mode
    if (!document.getElementById("detail-panel").classList.contains("hidden") && state._openTaskId) {
      openDetail(state._openTaskId);
    }
  };

  // save / load plan as JSON
  document.getElementById("btn-save-plan").onclick = exportPlanJSON;
  document.getElementById("btn-load-plan").onclick = () => document.getElementById("file-load-plan").click();
  document.getElementById("file-load-plan").onchange = (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importPlanJSON(reader.result); refreshEpicFilter(); render(); }
      catch (err) { alert("Could not load plan: " + err.message); }
      ev.target.value = "";
    };
    reader.readAsText(file);
  };

  document.getElementById("btn-reset").onclick = () => {
    if (confirm("Reset all saved changes? This clears task statuses, timeline edits, and all content edits (added/deleted/renamed epics and tasks), restoring the original delivery plan.")) {
      state.status = {}; state.schedule = {};
      saveStatus(); saveSchedule(); resetEdits(); refreshEpicFilter(); render();
    }
  };

  // detail panel close
  document.getElementById("detail-close").onclick = closeDetail;
  document.getElementById("overlay").onclick = closeDetail;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

  // keep the pinned month-header offset accurate
  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);

  render();
}

document.addEventListener("DOMContentLoaded", init);
