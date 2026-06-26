/* ==================================================================
   CCS Delivery Planner V2 — app logic
   Sections: summary, mvp2026, public2027, dependencies, artefacts, jira
   Two separate phase timelines (2026 Jun–Dec, 2027 Jan–Jun).
   Reuses V1 patterns: edit model, drag+fortnight scheduling, detail
   panel, Jira export, localStorage persistence.
   ================================================================== */

const STATUS_KEY   = "ccs-v2-status";
const SCHEDULE_KEY = "ccs-v2-schedule";
const EDITS_KEY    = "ccs-v2-edits";
const COLLAPSE_KEY = "ccs-v2-collapse";

const state = {
  view: "summary",
  filters: { search: "", role: "all" },
  statusShow: { "not-started": true, "in-progress": true, "complete": true },
  status: load(STATUS_KEY, {}),
  schedule: load(SCHEDULE_KEY, {}),
  edits: loadEdits(),
  collapsed: load(COLLAPSE_KEY, {}),
  editMode: false,
  execMode: false,
  _openTaskId: null
};

/* ---------------------------- storage ---------------------------- */
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function saveStatus()   { save(STATUS_KEY, state.status); }
function saveSchedule() { save(SCHEDULE_KEY, state.schedule); }
function saveEdits()    { save(EDITS_KEY, state.edits); }
function saveCollapsed(){ save(COLLAPSE_KEY, state.collapsed); }

function getStatus(id) { return state.status[id] || "not-started"; }
function setStatus(id, s) { state.status[id] = s; saveStatus(); }

/* ----------------------- editable model layer -------------------- */
function emptyEdits() {
  return { epicEdits: {}, taskEdits: {}, addedEpics: [], addedTasks: [], deletedEpics: [], deletedTasks: [] };
}
function loadEdits() {
  try { const e = JSON.parse(localStorage.getItem(EDITS_KEY)); return e ? Object.assign(emptyEdits(), e) : emptyEdits(); }
  catch { return emptyEdits(); }
}
function buildModel() {
  const ed = state.edits;
  const delE = new Set(ed.deletedEpics), delT = new Set(ed.deletedTasks);
  EPICS = BASE_EPICS.filter(e => !delE.has(e.id))
    .map(e => Object.assign(cloneDeep(e), ed.epicEdits[e.id] || {}))
    .concat(ed.addedEpics.filter(e => !delE.has(e.id)).map(e => Object.assign(cloneDeep(e), ed.epicEdits[e.id] || {})));
  TASKS = BASE_TASKS.filter(t => !delT.has(t.id) && !delE.has(t.epic))
    .map(t => Object.assign(cloneDeep(t), ed.taskEdits[t.id] || {}))
    .concat(ed.addedTasks.filter(t => !delT.has(t.id) && !delE.has(t.epic)).map(t => Object.assign(cloneDeep(t), ed.taskEdits[t.id] || {})));
  EPICS.sort((a, b) => epicOrder(a.id) - epicOrder(b.id));
}
function epicOrder(id) {
  const i = BASE_EPICS.findIndex(e => e.id === id);
  return i === -1 ? 1000 + (parseInt(id.replace(/\D/g, ""), 10) || 0) : i;
}
const isAddedEpic = id => state.edits.addedEpics.some(e => e.id === id);
const isAddedTask = id => state.edits.addedTasks.some(t => t.id === id);
function editEpic(id, patch) {
  if (isAddedEpic(id)) Object.assign(state.edits.addedEpics.find(e => e.id === id), patch);
  else state.edits.epicEdits[id] = Object.assign(state.edits.epicEdits[id] || {}, patch);
  saveEdits(); buildModel();
}
function editTask(id, patch) {
  if (isAddedTask(id)) Object.assign(state.edits.addedTasks.find(t => t.id === id), patch);
  else state.edits.taskEdits[id] = Object.assign(state.edits.taskEdits[id] || {}, patch);
  saveEdits(); buildModel();
}
function deleteEpic(id) {
  if (isAddedEpic(id)) state.edits.addedEpics = state.edits.addedEpics.filter(e => e.id !== id);
  if (!state.edits.deletedEpics.includes(id)) state.edits.deletedEpics.push(id);
  delete state.edits.epicEdits[id]; saveEdits(); buildModel();
}
function deleteTask(id) {
  if (isAddedTask(id)) state.edits.addedTasks = state.edits.addedTasks.filter(t => t.id !== id);
  if (!state.edits.deletedTasks.includes(id)) state.edits.deletedTasks.push(id);
  delete state.edits.taskEdits[id]; saveEdits(); buildModel();
}
const EPIC_PALETTE = ["#5B6B7B","#3B82C4","#2BA89A","#C9831F","#8B5CC7","#C2476A","#4A9E54","#0E7C86","#B23A6F","#6D8C2E"];
function nextEpicId() {
  let n = 0;
  while (BASE_EPICS.some(e => e.id === "E" + n) || state.edits.addedEpics.some(e => e.id === "E" + n)) n++;
  return "E" + n;
}
function nextTaskId(epicId) {
  const num = epicId.replace(/\D/g, "") || "X"; let sub = 1;
  const exists = id => TASKS.some(t => t.id === id) || state.edits.addedTasks.some(t => t.id === id);
  while (exists(num + "." + sub)) sub++;
  return num + "." + sub;
}
function addEpic(phase) {
  const id = nextEpicId();
  const months = monthsForPhase(phase);
  const e = { id, phase, title: "New Epic", colour: EPIC_PALETTE[(BASE_EPICS.length + state.edits.addedEpics.length) % EPIC_PALETTE.length],
    duration: months[0] + " – " + months[months.length - 1], owner: "UX/UI", roles: ["ux"],
    purpose: "Describe the purpose of this epic.", start: months[0], end: months[months.length - 1], depText: "None" };
  state.edits.addedEpics.push(e);
  state.edits.deletedEpics = state.edits.deletedEpics.filter(d => d !== id);
  saveEdits(); buildModel(); return id;
}
function addTask(epicId) {
  const ph = phaseOf(epicId), months = monthsForPhase(ph);
  const id = nextTaskId(epicId);
  const t = { id, epic: epicId, name: "New Task", owner: "UX/UI", roles: ["ux"],
    start: months[0], end: months[0], deps: [], depText: "None", critical: false, deliverables: [], acceptance: [] };
  state.edits.addedTasks.push(t); saveEdits(); buildModel(); return id;
}
function resetEdits() { state.edits = emptyEdits(); saveEdits(); buildModel(); }

/* export / import */
function exportPlanJSON() {
  buildModel();
  const payload = { meta: { app: "CCS Delivery Planner V2", exported: new Date().toISOString(), version: 2 },
    epics: EPICS, tasks: TASKS, status: state.status, schedule: state.schedule };
  downloadFile(JSON.stringify(payload, null, 2), "ccs-delivery-planner-v2.json", "application/json");
}
function importPlanJSON(text) {
  const data = JSON.parse(text);
  if (!data.epics || !data.tasks) throw new Error("File is missing epics or tasks.");
  const ed = emptyEdits();
  const baseE = new Set(BASE_EPICS.map(e => e.id)), baseT = new Set(BASE_TASKS.map(t => t.id));
  const impE = new Set(data.epics.map(e => e.id)), impT = new Set(data.tasks.map(t => t.id));
  BASE_EPICS.forEach(e => { if (!impE.has(e.id)) ed.deletedEpics.push(e.id); });
  BASE_TASKS.forEach(t => { if (!impT.has(t.id)) ed.deletedTasks.push(t.id); });
  data.epics.forEach(e => { if (baseE.has(e.id)) ed.epicEdits[e.id] = e; else ed.addedEpics.push(e); });
  data.tasks.forEach(t => { if (baseT.has(t.id)) ed.taskEdits[t.id] = t; else ed.addedTasks.push(t); });
  state.edits = ed;
  if (data.status) state.status = data.status;
  if (data.schedule) state.schedule = data.schedule;
  saveEdits(); saveStatus(); saveSchedule(); buildModel();
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type + ";charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
}

/* ---------------------- scheduling (fortnights) ------------------
   Per-phase axis. Half-slots: month*2 + half. TOTAL per phase varies. */
const HALVES_PER = 2;
const totalHalves = phase => monthsForPhase(phase).length * HALVES_PER;
function baseHalves(t) {
  const ph = phaseOf(t.epic);
  return { startHalf: MONTH_INDEX(t.start, ph) * HALVES_PER,
           endHalf: MONTH_INDEX(t.end, ph) * HALVES_PER + (HALVES_PER - 1) };
}
function storedHalves(o) {
  if (!o) return null;
  if (o.unit === "half") return { startHalf: o.start, endHalf: o.end };
  return { startHalf: o.start * HALVES_PER, endHalf: o.end * HALVES_PER + (HALVES_PER - 1) };
}
function getSchedule(t) {
  const ph = phaseOf(t.epic), months = monthsForPhase(ph);
  const ov = storedHalves(state.schedule[t.id]), base = baseHalves(t);
  const startHalf = ov ? ov.startHalf : base.startHalf;
  const endHalf = ov ? ov.endHalf : base.endHalf;
  const startIdx = Math.floor(startHalf / HALVES_PER), endIdx = Math.floor(endHalf / HALVES_PER);
  return { phase: ph, months, startHalf, endHalf, startIdx, endIdx,
    startName: months[startIdx], endName: months[endIdx],
    startLabel: halfLabel(startHalf, ph), endLabel: halfLabel(endHalf, ph),
    rangeLabel: halfRangeLabel(startHalf, endHalf, ph),
    halves: endHalf - startHalf + 1, moved: !!ov };
}
function halfLabel(h, phase) {
  const m = monthsForPhase(phase)[Math.floor(h / HALVES_PER)];
  return (h % HALVES_PER === 0) ? `${m} (1st half)` : `${m} (2nd half)`;
}
function halfRangeLabel(s, e, phase) {
  const months = monthsForPhase(phase);
  const sM = Math.floor(s / HALVES_PER), eM = Math.floor(e / HALVES_PER);
  const wholeS = s % HALVES_PER === 0, wholeE = e % HALVES_PER === HALVES_PER - 1;
  if (wholeS && wholeE) return sM === eM ? months[sM] : `${months[sM]}–${months[eM]}`;
  const half = h => (h % HALVES_PER === 0 ? "1st half" : "2nd half");
  const part = (m, h) => `${months[m]} (${half(h)})`;
  if (s === e) return part(sM, s);
  return `${wholeS ? months[sM] : part(sM, s)} – ${wholeE ? months[eM] : part(eM, e)}`;
}
function setHalves(t, startHalf, endHalf) {
  const base = baseHalves(t);
  if (startHalf === base.startHalf && endHalf === base.endHalf) delete state.schedule[t.id];
  else state.schedule[t.id] = { unit: "half", start: startHalf, end: endHalf };
  saveSchedule();
}

/* --------------------------- utilities --------------------------- */
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function roleBadge(rid) { const r = ROLES[rid]; return r ? `<span class="badge badge-${rid}" title="${esc(r.name)} — ${esc(r.owner)}">${r.short}</span>` : ""; }
function statusLabel(s) { return { "not-started": "Not started", "in-progress": "In progress", "complete": "Complete" }[s]; }
function resolveDeps(t) { const out = []; t.deps.forEach(d => { if (d.startsWith("E")) TASKS.filter(x => x.epic === d).forEach(x => out.push(x.id)); else out.push(d); }); return out; }

/* ------------------------- filtering core ------------------------ */
function taskMatchesFilters(t) {
  const f = state.filters;
  if (f.role !== "all" && !t.roles.includes(f.role)) return false;
  if (!state.statusShow[getStatus(t.id)]) return false;
  if (f.search.trim()) {
    const q = f.search.toLowerCase();
    const hay = [t.id, t.name, t.owner, t.depText, ...t.deliverables, ...t.acceptance].join(" ").toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
const phaseEpics = ph => EPICS.filter(e => e.phase === ph);
const phaseTasks = ph => TASKS.filter(t => phaseOf(t.epic) === ph).filter(taskMatchesFilters);

/* ====================== progress helpers ======================== */
function pctComplete(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.filter(t => getStatus(t.id) === "complete").length / tasks.length * 100);
}

/* ======================= EXECUTIVE SUMMARY ===================== */
function renderSummary() {
  const root = el("div");

  const hero = el("div", "exec-hero");
  hero.innerHTML = `<h2>One programme, two delivery phases</h2>
    <p style="color:var(--muted);margin:0;font-size:13px">Treat these as distinct phases connected by a successful internal MVP — not one continuous project.</p>
    <div class="exec-flow">
      <div class="exec-phase p2026">
        <div class="ep-year">2026</div><div class="ep-label">${esc(PHASES["2026"].label)}</div>
        <div class="ep-window">${esc(PHASES["2026"].window)} · Internal users only</div>
        <div class="ep-goal">${esc(STRATEGIC_MESSAGE["2026"])}</div>
      </div>
      <div class="exec-arrow">→</div>
      <div class="exec-phase p2027">
        <div class="ep-year">2027</div><div class="ep-label">${esc(PHASES["2027"].label)}</div>
        <div class="ep-window">${esc(PHASES["2027"].window)} · Public users</div>
        <div class="ep-goal">${esc(STRATEGIC_MESSAGE["2027"])}</div>
      </div>
    </div>`;
  root.appendChild(hero);

  const cards = el("div", "summary-cards");
  EXEC_CARDS.forEach(c => {
    const card = el("div", "sum-card " + c.tone);
    card.innerHTML = `<h4>${esc(c.label)}</h4><div class="sum-val">${esc(c.value)}</div>`;
    cards.appendChild(card);
  });
  root.appendChild(cards);

  const prog = el("div", "summary-cards");
  ["2026", "2027"].forEach(ph => {
    const ts = TASKS.filter(t => phaseOf(t.epic) === ph);
    const p = pctComplete(ts);
    const card = el("div", "sum-card " + (ph === "2026" ? "phase2026" : "phase2027"));
    card.innerHTML = `<h4>${ph} progress</h4>
      <div class="sum-val">${p}% <span style="font-size:12px;font-weight:500;color:var(--muted)">of ${ts.length} tasks</span></div>
      <div class="epic-progress-mini" style="margin-top:8px"><div style="width:${p}%;background:${PHASES[ph].accent}"></div></div>`;
    prog.appendChild(card);
  });
  root.appendChild(prog);

  root.appendChild(el("div", "v2-section-title", "Strategic principles"));
  const pw = el("div", "principles-wrap");
  ["2026", "2027"].forEach(ph => {
    const col = el("div", "principles-col " + (ph === "2026" ? "p2026" : "p2027"));
    col.innerHTML = `<div class="pc-head">${ph} — ${esc(PHASES[ph].short)} principles</div>
      <ul>${PRINCIPLES[ph].map(p => `<li>${esc(p)}</li>`).join("")}</ul>`;
    pw.appendChild(col);
  });
  root.appendChild(pw);

  root.appendChild(el("div", "v2-section-title", "Risk & dependency heat map"));
  root.appendChild(renderHeatMaps());
  return root;
}

function renderHeatMaps() {
  const wrap = el("div", "heat-wrap");
  const risk = el("div", "heat-card");
  let rrows = "";
  ["2026", "2027"].forEach(ph => {
    const ts = TASKS.filter(t => phaseOf(t.epic) === ph);
    const crit = ts.filter(t => t.critical);
    const open = crit.filter(t => getStatus(t.id) !== "complete").length;
    const level = open >= 4 ? "high" : open >= 2 ? "med" : "low";
    rrows += `<div class="heat-row"><span class="heat-name">${ph} — critical items open</span>
      <span class="heat-pill heat-${level}">${open} / ${crit.length}</span></div>`;
  });
  rrows += `<div class="heat-row"><span class="heat-name">Backend integrations (primary risk)</span><span class="heat-pill heat-high">High</span></div>`;
  rrows += `<div class="heat-row"><span class="heat-name">Data availability (primary dependency)</span><span class="heat-pill heat-high">High</span></div>`;
  risk.innerHTML = `<h4>Risk heat map</h4><div class="heat-rows">${rrows}</div>`;
  wrap.appendChild(risk);

  const dep = el("div", "heat-card");
  let drows = "";
  EPICS.forEach(e => {
    const ts = TASKS.filter(t => t.epic === e.id);
    const gated = ts.filter(t => t.depText && t.depText !== "None").length;
    if (!gated) return;
    const level = gated >= 4 ? "high" : gated >= 2 ? "med" : "low";
    drows += `<div class="heat-row"><span class="heat-name">${e.id} · ${esc(e.title)}</span>
      <span class="heat-pill heat-${level}">${gated} gated</span></div>`;
  });
  dep.innerHTML = `<h4>Dependency heat map</h4><div class="heat-rows">${drows}</div>`;
  wrap.appendChild(dep);
  return wrap;
}

/* ===================== PHASE VIEW (2026 / 2027) ================== */
function renderPhase(phase) {
  const root = el("div");
  const P = PHASES[phase];

  const banner = el("div", "phase-banner " + (phase === "2026" ? "p2026" : "p2027"));
  banner.innerHTML = `<h2>${esc(P.label)}</h2>
    <div class="pb-window">${esc(P.window)}</div>
    <div class="pb-grid">
      <div class="pb-item"><b>Audience</b>${esc(P.audience)}</div>
      <div class="pb-item"><b>Public access</b>${esc(P.publicAccess || (phase === "2027" ? "Yes" : "No"))}</div>
      <div class="pb-item"><b>Goal</b>${esc(P.goal)}</div>
    </div>
    <div class="pb-msg">${esc(STRATEGIC_MESSAGE[phase])}</div>`;
  root.appendChild(banner);

  root.appendChild(el("div", "v2-section-title", "Timeline"));
  root.appendChild(renderTimeline(phase));

  root.appendChild(el("div", "v2-section-title", "Workstreams (where UX, SME & Dev overlap)"));
  root.appendChild(renderSwimlanes(phase));

  if (phase === "2026") {
    root.appendChild(el("div", "v2-section-title", "Blacklight Capability Matrix (Epic 2 artefact)"));
    root.appendChild(renderCapabilityMatrix());
  }

  root.appendChild(el("div", "v2-section-title", "Epics & tasks"));
  root.appendChild(renderEpics(phase));

  if (phase === "2026") {
    const block = el("div", "removed-block");
    block.innerHTML = `<h3>Not required for 2026</h3>
      <div class="rb-sub">Explicitly out of scope for the internal MVP — deferred to the 2027 public launch.</div>
      <div class="removed-list">${NOT_REQUIRED_2026.map(x => `<span class="removed-item">${esc(x)}</span>`).join("")}</div>`;
    root.appendChild(block);
  }
  return root;
}

function renderCapabilityMatrix() {
  const wrap = el("div", "cap-matrix");
  CAPABILITY_BUCKETS.forEach(bucket => {
    const col = el("div", "cap-col");
    col.dataset.bucket = bucket;
    const items = BLACKLIGHT_MATRIX.filter(m => m.bucket === bucket);
    col.innerHTML = `<div class="cap-head">${bucket}</div>
      <ul>${items.map(i => `<li>${esc(i.feature)}</li>`).join("") || '<li style="color:var(--muted)">—</li>'}</ul>`;
    wrap.appendChild(col);
  });
  return wrap;
}

/* ============================ TIMELINE =========================== */
function renderTimeline(phase) {
  const root = el("div");
  root.style.setProperty("--months", monthsForPhase(phase).length);
  if (!state.execMode) {
    root.appendChild(el("div", "tl-hint",
      `Drag a bar to move it, or drag an edge to change its duration. Bars snap to 2-week blocks. Click a bar for detail.`));
  }
  const months = monthsForPhase(phase);
  const tl = el("div", "timeline");
  tl.style.setProperty("--months", months.length);
  const head = el("div", "tl-head");
  head.innerHTML = `<div>Task</div>` + months.map(m => `<div>${m}</div>`).join("");
  tl.appendChild(head);

  const eps = phaseEpics(phase);
  let any = false;
  eps.forEach(e => {
    const ts = phaseTasks(phase).filter(t => t.epic === e.id);
    if (!ts.length) return;
    any = true;
    const group = el("div", "tl-epic-group");
    group.style.setProperty("--epic-colour", e.colour);
    const collapsed = !!state.collapsed["tl-" + e.id];
    const eh = el("div", "tl-epic-header" + (collapsed ? " collapsed" : ""));
    eh.innerHTML = `<span class="chev">▼</span> <span>${e.id} · ${esc(e.title)}</span>
      <span class="epic-count">${ts.length} task${ts.length !== 1 ? "s" : ""} · ${esc(e.duration)}</span>`;
    eh.onclick = () => { state.collapsed["tl-" + e.id] = !collapsed; saveCollapsed(); render(); };
    group.appendChild(eh);
    if (!collapsed) ts.forEach(t => group.appendChild(timelineRow(t, e, phase)));
    tl.appendChild(group);
  });
  if (!any) tl.appendChild(el("div", "view-empty", "No tasks match the current filters."));
  root.appendChild(tl);
  return root;
}

function timelineRow(t, e, phase) {
  const row = el("div", "tl-row");
  row.style.setProperty("--months", monthsForPhase(phase).length);
  const sch = getSchedule(t);
  const total = totalHalves(phase);
  const left = (sch.startHalf / total) * 100;
  const width = (sch.halves / total) * 100;

  const label = el("div", "tl-label");
  label.innerHTML = `<span class="tl-id">${t.id}</span>
    <span class="tl-name">${esc(t.name)}</span>
    <span class="tl-meta">${t.roles.map(roleBadge).join("")}
      <span class="status-dot ${getStatus(t.id)}" title="${statusLabel(getStatus(t.id))}"></span>
      ${sch.moved ? '<span class="moved-flag">edited</span>' : ''}
      ${t.critical ? '<span class="crit-flag">Critical</span>' : ''}</span>`;
  label.onclick = () => openDetail(t.id);
  row.appendChild(label);

  const track = el("div", "tl-track");
  const grid = el("div", "tl-grid");
  grid.innerHTML = monthsForPhase(phase).map(() => `<span class="tl-col"><i></i><i></i></span>`).join("");
  track.appendChild(grid);

  const bar = el("div", "tl-bar" + (sch.moved ? " moved" : "") + (sch.halves === 1 ? " fortnight" : ""));
  bar.style.left = left + "%"; bar.style.width = width + "%";
  bar.style.background = e.colour;
  bar.style.opacity = getStatus(t.id) === "not-started" ? "0.78" : "1";
  bar.innerHTML =
    `<span class="bar-handle bar-handle-l"></span>` +
    `<span class="bar-body">${t.id}${t.deps.length ? `<span class="bar-dep" title="Depends on ${esc(t.depText)}">⇠</span>` : ""}</span>` +
    `<span class="bar-handle bar-handle-r"></span>`;
  bar.title = `${t.name} (${sch.rangeLabel}) — drag to move, drag edges to resize. Snaps to 2-week blocks.`;
  enableBarDrag(bar, track, t, phase);
  track.appendChild(bar);
  row.appendChild(track);
  return row;
}

function enableBarDrag(bar, track, t, phase) {
  const total = totalHalves(phase), maxHalf = total - 1;
  let mode = null, startX = 0, origStart = 0, origEnd = 0, halfPx = 0, moved = false;
  const onDown = (ev) => {
    if (ev.button !== undefined && ev.button !== 0) return;
    const handle = ev.target.closest(".bar-handle");
    mode = handle ? (handle.classList.contains("bar-handle-l") ? "resize-l" : "resize-r") : "move";
    const s = getSchedule(t); origStart = s.startHalf; origEnd = s.endHalf;
    startX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
    halfPx = track.getBoundingClientRect().width / total;
    moved = false;
    document.body.classList.add("dragging-bar"); bar.classList.add("grabbing");
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false }); window.addEventListener("touchend", onUp);
    ev.preventDefault();
  };
  const onMove = (ev) => {
    const clientX = (ev.touches ? ev.touches[0].clientX : ev.clientX);
    const d = Math.round((clientX - startX) / halfPx);
    if (d !== 0) moved = true;
    let ns = origStart, ne = origEnd;
    if (mode === "move") { const dur = origEnd - origStart; ns = Math.max(0, Math.min(origStart + d, maxHalf - dur)); ne = ns + dur; }
    else if (mode === "resize-l") ns = Math.max(0, Math.min(origStart + d, origEnd));
    else if (mode === "resize-r") ne = Math.min(maxHalf, Math.max(origEnd + d, origStart));
    bar.style.left = (ns / total) * 100 + "%";
    bar.style.width = ((ne - ns + 1) / total) * 100 + "%";
    bar.classList.toggle("fortnight", ne - ns === 0);
    bar.dataset.pendStart = ns; bar.dataset.pendEnd = ne;
    if (ev.cancelable) ev.preventDefault();
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
    window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp);
    document.body.classList.remove("dragging-bar"); bar.classList.remove("grabbing");
    if (moved && bar.dataset.pendStart !== undefined) { setHalves(t, +bar.dataset.pendStart, +bar.dataset.pendEnd); render(); }
    else openDetail(t.id);
    mode = null;
  };
  bar.addEventListener("mousedown", onDown);
  bar.addEventListener("touchstart", onDown, { passive: false });
}

/* ============================ SWIMLANES ========================== */
function renderSwimlanes(phase) {
  const root = el("div", "swimlanes");
  const months = monthsForPhase(phase);
  ["ux", "sme", "dev", "gov"].forEach(rid => {
    if (state.filters.role !== "all" && state.filters.role !== rid) return;
    const r = ROLES[rid];
    const ts = phaseTasks(phase).filter(t => t.roles.includes(rid));
    const lane = el("div", "lane");
    lane.style.setProperty("--lane-colour", rid === "ux" ? "#3B82C4" : rid === "sme" ? "#2BA89A" : rid === "dev" ? "#8B5CC7" : "#5B6B7B");
    lane.style.setProperty("--months", months.length);
    const head = el("div", "lane-head");
    head.innerHTML = `${roleBadge(rid)}<h3>${esc(r.name)}</h3><span class="lane-owner">${esc(r.owner)}</span>
      <span class="lane-count">${ts.length} task${ts.length !== 1 ? "s" : ""}</span>`;
    lane.appendChild(head);
    const grid = el("div", "lane-grid");
    grid.style.setProperty("--months", months.length);
    months.forEach(m => {
      const cell = el("div", "lane-month");
      cell.appendChild(el("div", "lane-month-label", m));
      const mi = MONTH_INDEX(m, phase);
      ts.filter(t => { const s = getSchedule(t); return s.startIdx <= mi && mi <= s.endIdx; }).forEach(t => {
        const e = epicById(t.epic);
        const shared = t.roles.filter(x => x !== "gov").length > 1;
        const card = el("div", "mini-task" + (shared ? " shared" : ""));
        card.style.setProperty("--epic-colour", e.colour);
        card.innerHTML = `<div class="mt-top"><span class="mt-id">${t.id}</span>
          <span class="status-dot ${getStatus(t.id)}"></span>${t.critical ? '<span class="crit-flag">!</span>' : ''}</div>
          <div class="mt-name">${esc(t.name)}</div>`;
        card.onclick = () => openDetail(t.id);
        cell.appendChild(card);
      });
      grid.appendChild(cell);
    });
    lane.appendChild(grid);
    const shared = ts.filter(t => t.roles.filter(x => x !== "gov").length > 1);
    if (shared.length) lane.appendChild(el("div", "overlap-note",
      `Shared / overlapping work: ` + shared.map(t => `<span class="overlap-pill">${t.id}</span>`).join(" ")));
    root.appendChild(lane);
  });
  if (!root.children.length) root.appendChild(el("div", "view-empty", "No tasks match the current filters."));
  return root;
}

/* ============================== EPICS =========================== */
function renderEpics(phase) {
  const root = el("div", "epic-grid");
  if (state.editMode) {
    const bar = el("div", "edit-toolbar");
    bar.innerHTML = `<span class="edit-toolbar-msg"><b>Editing ${phase}.</b> Add an epic below, or <b>+ Add task</b> inside any epic. Click a title, owner or purpose to edit. Open a task to edit its detail.</span>`;
    const addE = el("button", "primary-btn", "+ Add new epic to " + phase);
    addE.onclick = () => { const id = addEpic(phase); state.collapsed["epic-view-" + id] = false; render(); };
    bar.appendChild(addE);
    root.appendChild(bar);
  }
  phaseEpics(phase).forEach(e => {
    const ts = phaseTasks(phase).filter(t => t.epic === e.id);
    if (!ts.length && (state.filters.search || state.filters.role !== "all")) return;
    const allTs = TASKS.filter(t => t.epic === e.id);
    const pct = pctComplete(allTs);
    const allDeliv = [...new Set(allTs.flatMap(t => t.deliverables))];
    const editing = state.editMode;
    const card = el("div", "epic-card");
    card.style.setProperty("--epic-colour", e.colour);
    const collapsed = !!state.collapsed["epic-view-" + e.id];

    const titleHtml = editing ? `<input class="edit-title-input epic" data-edit="title" value="${esc(e.title)}" />` : `<h3>${esc(e.title)}</h3>`;
    const purposeHtml = editing ? `<textarea class="edit-input ec-purpose-edit" data-edit="purpose">${esc(e.purpose)}</textarea>` : `<p class="ec-purpose">${esc(e.purpose)}</p>`;

    const head = el("div", "epic-card-head" + (collapsed ? " collapsed" : ""));
    head.innerHTML = `<div class="epic-swatch">${e.id}</div>
      <div class="ec-body">
        ${titleHtml}${purposeHtml}
        <div class="ec-meta">
          <span><b>Duration:</b> ${editing ? `<input class="edit-input inline" data-edit="duration" value="${esc(e.duration)}" />` : esc(e.duration)}</span>
          <span><b>Owner:</b> ${editing ? `<input class="edit-input inline" data-edit="owner" value="${esc(e.owner)}" />` : esc(e.owner)}</span>
          <span><b>Roles:</b> ${e.roles.map(roleBadge).join(" ")}</span>
          <span><b>Tasks:</b> ${allTs.length}</span>
          <span><b>Deliverables:</b> ${allDeliv.length}</span>
          <span><b>Dependencies:</b> ${esc(e.depText || "None")}</span>
          <span><b>${pct}% complete</b></span>
        </div>
        <div class="epic-progress-mini"><div style="width:${pct}%;background:${e.colour}"></div></div>
      </div>
      ${editing ? `<button class="danger-btn epic-del">Delete epic</button>` : `<span class="chev">▼</span>`}`;
    head.onclick = (ev) => { if (ev.target.closest("input, textarea, button")) return; state.collapsed["epic-view-" + e.id] = !collapsed; saveCollapsed(); render(); };
    card.appendChild(head);

    if (editing) {
      head.querySelectorAll("[data-edit]").forEach(inp => {
        inp.onclick = ev => ev.stopPropagation();
        inp.oninput = () => editEpic(e.id, { [inp.dataset.edit]: inp.value });
        if (inp.tagName === "TEXTAREA") { autoGrow(inp); inp.addEventListener("input", () => autoGrow(inp)); }
      });
      const del = head.querySelector(".epic-del");
      if (del) del.onclick = (ev) => { ev.stopPropagation(); if (confirm(`Delete epic ${e.id} “${e.title}” and its ${allTs.length} task(s)?`)) { deleteEpic(e.id); render(); } };
    }

    if (!collapsed && !state.execMode) {
      const body = el("div", "epic-tasks");
      if (editing) {
        const wrap = el("div", "epic-why");
        wrap.innerHTML = `<h5>Why this epic</h5><textarea class="edit-input" data-edit-desc="1" placeholder="Why is this epic needed?">${esc(e.description || "")}</textarea>`;
        const ta = wrap.querySelector("textarea");
        ta.onclick = ev => ev.stopPropagation();
        ta.oninput = () => { autoGrow(ta); editEpic(e.id, { description: ta.value }); };
        body.appendChild(wrap);
        autoGrow(ta);
      } else if (e.description) {
        body.appendChild(el("div", "epic-why", `<h5>Why this epic</h5><p>${esc(e.description)}</p>`));
      }
      ts.forEach(t => {
        const sch = getSchedule(t);
        const row = el("div", "epic-task-row");
        row.innerHTML = `<span class="status-dot ${getStatus(t.id)}"></span>
          <span class="etr-id">${t.id}</span>
          <span class="etr-name">${esc(t.name)} ${t.roles.map(roleBadge).join("")}${t.critical ? '<span class="crit-flag">Critical</span>' : ''}</span>
          <span class="etr-months">${sch.rangeLabel}${sch.moved ? ' <span class="moved-flag">edited</span>' : ''}</span>`;
        row.onclick = () => openDetail(t.id);
        body.appendChild(row);
      });
      if (!ts.length) body.appendChild(el("div", "overlap-note", "No tasks yet."));
      if (editing) { const a = el("button", "primary-btn epic-add-task", "+ Add task to this epic"); a.onclick = () => { const id = addTask(e.id); render(); openDetail(id); }; body.appendChild(a); }
      card.appendChild(body);
    }
    root.appendChild(card);
  });
  if (!root.querySelector(".epic-card")) root.appendChild(el("div", "view-empty", "No epics match the current filters."));
  return root;
}

/* =========================== DEPENDENCIES ======================= */
function renderDependencies() {
  const root = el("div", "dep-wrap");
  root.appendChild(el("div", "dep-legend",
    "The MVP feeds the public launch. 2026 must complete a successful internal pilot before 2027 work begins. ▲ marks critical items."));

  const flow = el("div", "dep-chain");
  flow.appendChild(el("h4", null, "Strategic dependency flow"));
  flow.appendChild(el("div", "phase-chip p2026", "2026 — Internal MVP"));
  flow.appendChild(flowList(["Prototype", "Blacklight Capability Mapping", "UI Skinning", "Content Foundations", "Sprint Validation", "Internal Pilot"], "#2563B5"));
  flow.appendChild(el("div", "dep-bridge", "↓  successful internal MVP  ↓"));
  flow.appendChild(el("div", "phase-chip p2027", "2027 — Public Launch"));
  flow.appendChild(flowList(["Public Product Strategy", "Design System", "Enhanced UX", "Accessibility", "Public Content", "Public Launch"], "#9A4DBC"));
  root.appendChild(flow);

  ["2026", "2027"].forEach(ph => {
    const withDeps = phaseTasks(ph).filter(t => t.depText && t.depText !== "None");
    if (!withDeps.length) return;
    const chain = el("div", "dep-chain");
    chain.appendChild(el("h4", null, `${ph} — task dependencies`));
    withDeps.forEach(t => {
      const e = epicById(t.epic);
      const item = el("div", "dep-item" + (t.critical ? " dep-critrow" : ""));
      const fromNodes = resolveDeps(t).map(d => {
        const dt = taskById(d), de = dt ? epicById(dt.epic) : null;
        return `<span class="dep-node" data-dep="${d}" style="--epic-colour:${de ? de.colour : '#bbb'}">${d}</span>`;
      });
      item.innerHTML = `<div class="dep-from">${fromNodes.length ? fromNodes.join("") : `<span class="dep-node" style="--epic-colour:#bbb">${esc(t.depText)}</span>`}</div>
        <span class="dep-arrow">→</span>
        <div class="dep-target"><span class="dep-node" data-dep="${t.id}" style="--epic-colour:${e.colour}">${t.id}</span>
        <span>${esc(t.name)}</span>${t.critical ? '<span class="crit-flag">Critical</span>' : ''}</div>`;
      chain.appendChild(item);
    });
    root.appendChild(chain);
  });

  root.querySelectorAll("[data-dep]").forEach(n => { n.onclick = () => { if (taskById(n.dataset.dep)) openDetail(n.dataset.dep); }; });
  return root;
}
function flowList(items, colour) {
  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:0;align-items:flex-start;margin:6px 0";
  items.forEach((x, i) => {
    const node = el("div", "dep-node");
    node.style.setProperty("--epic-colour", colour);
    node.textContent = x;
    wrap.appendChild(node);
    if (i < items.length - 1) { const a = el("div", null, "↓"); a.style.cssText = "color:var(--muted);font-weight:700;margin:2px 0 2px 14px"; wrap.appendChild(a); }
  });
  return wrap;
}

/* ============================ ARTEFACTS ========================= */
function renderArtefacts() {
  const root = el("div");
  ["2026", "2027"].forEach(ph => {
    root.appendChild(el("div", "v2-section-title",
      `<span class="phase-chip ${ph === "2026" ? "p2026" : "p2027"}">${ph}</span> ${esc(PHASES[ph].label)} artefacts`));
    const grid = el("div", "deliv-grid");
    ["ux", "sme", "dev"].forEach(rid => {
      const items = (ARTEFACTS[ph] && ARTEFACTS[ph][rid]) || [];
      const card = el("div", "deliv-month-card");
      card.innerHTML = `<div class="deliv-month-head">${roleBadge(rid)} ${esc(ROLES[rid].name)}</div>
        <div class="deliv-owner-block"><div class="deliv-list">${items.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("")}</div></div>`;
      grid.appendChild(card);
    });
    root.appendChild(grid);
  });

  root.appendChild(el("div", "v2-section-title", "Task-level deliverables (from the plan)"));
  ["2026", "2027"].forEach(ph => {
    const grid = el("div", "deliv-grid");
    let any = false;
    ["ux", "sme", "dev", "gov"].forEach(rid => {
      const ts = phaseTasks(ph).filter(t => t.roles.includes(rid));
      const delivs = [...new Set(ts.flatMap(t => t.deliverables))];
      if (!delivs.length) return;
      any = true;
      const card = el("div", "deliv-month-card");
      card.innerHTML = `<div class="deliv-month-head">${ph} · ${roleBadge(rid)} ${esc(ROLES[rid].name)}</div>
        <div class="deliv-owner-block"><div class="deliv-list">${delivs.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("")}</div></div>`;
      grid.appendChild(card);
    });
    if (any) root.appendChild(grid);
  });
  return root;
}

/* ============================ JIRA EXPORT ======================= */
function epicJiraText(e) {
  const ts = TASKS.filter(t => t.epic === e.id);
  return [
    `EPIC: ${e.id} — ${e.title}`,
    `Phase: ${e.phase} (${PHASES[e.phase].label})`,
    `Duration: ${e.duration}`,
    `Owner: ${e.owner}`,
    `Roles involved: ${e.roles.map(r => ROLES[r].name).join(", ")}`,
    `Dependencies: ${e.depText || "None"}`,
    ``, `Summary:`, e.purpose,
    ``, `Why this epic:`, e.description || e.purpose,
    ``, `Tasks (${ts.length}): ${ts.map(t => t.id).join(", ")}`
  ].join("\n");
}
function taskJiraText(t) {
  const sch = getSchedule(t), e = epicById(t.epic);
  return [
    `${t.id} — ${t.name}`,
    `Epic: ${t.epic} (${e.title})   Phase: ${e.phase}`,
    `Owner: ${t.owner}`,
    `Start: ${sch.startLabel}    End: ${sch.endLabel}    (${sch.rangeLabel})` + (sch.moved ? `    [rescheduled]` : ``),
    `Dependencies: ${t.depText}`,
    ``, `Description (why this task):`, t.description || e.purpose,
    ``, `Deliverables:`, ...t.deliverables.map(d => `- ${d}`),
    ``, `Acceptance criteria:`, ...t.acceptance.map(a => `- ${a}`)
  ].join("\n");
}
function renderJira() {
  const root = el("div", "jira-wrap");
  const tb = el("div", "jira-toolbar");
  const copyAll = el("button", "copy-btn", "Copy entire backlog");
  copyAll.onclick = () => {
    const txt = EPICS.map(e => epicJiraText(e) + "\n\n" + TASKS.filter(t => t.epic === e.id).map(taskJiraText).join("\n\n---\n\n"))
      .join("\n\n========================================\n\n");
    copyText(txt, copyAll, "Copy entire backlog");
  };
  tb.appendChild(copyAll);
  tb.appendChild(el("span", null, `<span style="color:var(--muted);font-size:12px">${EPICS.length} Epics, ${TASKS.length} Tasks across both phases</span>`));
  root.appendChild(tb);

  ["2026", "2027"].forEach(ph => {
    root.appendChild(el("div", "v2-section-title",
      `<span class="phase-chip ${ph === "2026" ? "p2026" : "p2027"}">${ph}</span> ${esc(PHASES[ph].label)}`));
    phaseEpics(ph).forEach(e => {
      const ts = TASKS.filter(t => t.epic === e.id).filter(taskMatchesFilters);
      if (!ts.length) return;
      const block = el("div", "jira-epic");
      block.style.setProperty("--epic-colour", e.colour);
      const head = el("div", "jira-epic-head");
      head.innerHTML = `<div class="epic-swatch" style="width:26px;height:26px;font-size:11px">${e.id}</div><h3>${esc(e.title)}</h3>`;
      const ec = el("button", "copy-btn", "Copy Epic"); ec.onclick = () => copyText(epicJiraText(e), ec, "Copy Epic");
      head.appendChild(ec); block.appendChild(head);
      ts.forEach(t => {
        const tw = el("div", "jira-task");
        const th = el("div", "jira-task-head");
        th.innerHTML = `<span class="status-dot ${getStatus(t.id)}"></span><span class="jt-title">${t.id} — ${esc(t.name)}</span>`;
        const tc = el("button", "copy-btn", "Copy Task"); tc.onclick = () => copyText(taskJiraText(t), tc, "Copy Task");
        th.appendChild(tc); tw.appendChild(th);
        tw.appendChild(el("div", "jira-block", esc(taskJiraText(t))));
        block.appendChild(tw);
      });
      root.appendChild(block);
    });
  });
  return root;
}
function copyText(txt, btn, original) {
  const done = () => { btn.textContent = "Copied ✓"; btn.classList.add("copied"); setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  else fallbackCopy(txt, done);
}
function fallbackCopy(txt, cb) {
  const ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta); cb();
}

/* ----------------------- editable-field helpers ------------------ */
function buildEditableList(host, items, onChange, placeholder) {
  host.innerHTML = "";
  const list = el("div", "edit-list");
  items.forEach((val, i) => {
    const row = el("div", "edit-list-row");
    const input = el("textarea", "edit-input"); input.rows = 2; input.value = val; input.placeholder = placeholder;
    input.oninput = () => { autoGrow(input); const next = items.slice(); next[i] = input.value; onChange(next); };
    const del = el("button", "mini-del", "&times;"); del.onclick = () => { const next = items.slice(); next.splice(i, 1); onChange(next); };
    row.appendChild(input); row.appendChild(del); list.appendChild(row);
  });
  const add = el("button", "add-line-btn", "+ Add"); add.onclick = () => onChange(items.concat([""]));
  host.appendChild(list); host.appendChild(add);
  list.querySelectorAll("textarea").forEach(autoGrow);
}
function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = Math.max(60, ta.scrollHeight) + "px"; }
function rebindList(scope, selector, getItems, setItems, placeholder) {
  const host = scope.querySelector(selector); if (!host) return;
  const refresh = () => buildEditableList(host, getItems(), onChange, placeholder);
  function onChange(next) { setItems(next); refresh(); renderCurrentView(); }
  refresh();
}

/* ============================ DETAIL PANEL ====================== */
function openDetail(id) {
  const t = taskById(id); if (!t) return;
  state._openTaskId = id;
  const e = epicById(t.epic), editing = state.editMode;
  const panel = document.getElementById("detail-panel"), overlay = document.getElementById("overlay");
  panel.style.setProperty("--epic-colour", e.colour);
  const sch = getSchedule(t), cur = getStatus(t.id);
  const c = document.getElementById("detail-content");

  const depsHtml = t.deps.length
    ? resolveDeps(t).map(d => taskById(d) ? `<span class="dep-link" data-go="${d}">${d} ${esc(taskById(d).name)}</span>` : `<span>${esc(d)}</span>`).join("<br>") + `<div style="color:var(--muted);font-size:12px;margin-top:6px">${esc(t.depText)}</div>`
    : `<span style="color:var(--muted)">${esc(t.depText && t.depText !== "None" ? "Gated by: " + t.depText : "None")}</span>`;

  const halfOptions = (selHalf) => Array.from({ length: totalHalves(e.phase) }, (_, h) =>
    `<option value="${h}" ${h === selHalf ? "selected" : ""}>${halfLabel(h, e.phase)}</option>`).join("");

  const titleHtml = editing ? `<input class="edit-title-input" id="edit-task-name" value="${esc(t.name)}" />` : `<h2>${esc(t.name)}</h2>`;

  c.innerHTML = `
    <div class="detail-eyebrow"><span class="phase-chip ${e.phase === "2026" ? "p2026" : "p2027"}" style="margin:0 6px 0 0">${e.phase}</span>${e.id} · ${esc(e.title)}</div>
    ${titleHtml}
    <div class="detail-id">Task ${t.id}${t.critical ? ' · <span style="color:var(--warn);font-weight:700">▲ Critical</span>' : ''}</div>

    <div class="detail-section"><h4>Status</h4>
      <div class="detail-status-picker">
        <button class="status-pick-btn not-started ${cur === 'not-started' ? 'active' : ''}" data-s="not-started">Not started</button>
        <button class="status-pick-btn in-progress ${cur === 'in-progress' ? 'active' : ''}" data-s="in-progress">In progress</button>
        <button class="status-pick-btn complete ${cur === 'complete' ? 'active' : ''}" data-s="complete">Complete</button>
      </div>
    </div>

    <div class="detail-section">
      <h4>Why this matters</h4>
      ${editing
        ? `<textarea class="edit-input" id="edit-task-desc" placeholder="Why is this task needed?">${esc(t.description || "")}</textarea>`
        : `<p class="why-text">${esc(t.description || e.purpose)}</p>`}
    </div>

    <div class="detail-section">
      ${editing ? `
        <div class="detail-row"><span class="dr-label">Owner</span><input class="edit-input inline" id="edit-task-owner" value="${esc(t.owner)}" /></div>
        <div class="detail-row"><span class="dr-label">Roles</span><span class="dr-val" id="edit-task-roles">${["ux","sme","dev","gov"].map(r => `<label class="role-pick"><input type="checkbox" value="${r}" ${t.roles.includes(r) ? "checked" : ""}/> ${ROLES[r].short}</label>`).join(" ")}</span></div>
        <div class="detail-row"><span class="dr-label">Start</span><select class="edit-input inline" id="edit-task-start">${halfOptions(sch.startHalf)}</select></div>
        <div class="detail-row"><span class="dr-label">End</span><select class="edit-input inline" id="edit-task-end">${halfOptions(sch.endHalf)}</select></div>
        <div class="detail-row"><span class="dr-label">Dependencies</span><input class="edit-input inline" id="edit-task-deptext" value="${esc(t.depText)}" /></div>
        <div class="detail-row"><span class="dr-label">Critical</span><label class="role-pick"><input type="checkbox" id="edit-task-critical" ${t.critical ? "checked" : ""}/> critical</label></div>
      ` : `
        <div class="detail-row"><span class="dr-label">Owner</span><span class="dr-val">${esc(t.owner)}</span></div>
        <div class="detail-row"><span class="dr-label">Role(s)</span><span class="dr-val">${t.roles.map(roleBadge).join(" ")}</span></div>
        <div class="detail-row"><span class="dr-label">Start</span><span class="dr-val">${sch.startLabel}</span></div>
        <div class="detail-row"><span class="dr-label">End</span><span class="dr-val">${sch.endLabel}</span></div>
        <div class="detail-row"><span class="dr-label">Span</span><span class="dr-val">${sch.rangeLabel} · ${sch.halves} fortnight${sch.halves !== 1 ? "s" : ""}</span></div>
        <div class="detail-section" style="margin-top:14px"><h4>Dependencies</h4><div>${depsHtml}</div></div>
      `}
    </div>

    <div class="detail-section"><h4>Deliverables</h4>
      ${editing ? `<div id="edit-deliverables"></div>` : `<div class="deliv-list">${t.deliverables.length ? t.deliverables.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("") : '<span style="color:var(--muted)">None</span>'}</div>`}
    </div>

    <div class="detail-section"><h4>Acceptance criteria</h4>
      ${editing ? `<div id="edit-acceptance"></div>` : `<ul class="detail-list">${t.acceptance.length ? t.acceptance.map(a => `<li>${esc(a)}</li>`).join("") : '<li style="color:var(--muted);list-style:none;margin-left:-18px">None</li>'}</ul>`}
    </div>

    <div class="detail-section detail-actions">
      <button class="copy-btn" id="detail-copy">Copy Jira task</button>
      ${editing ? `<button class="danger-btn" id="detail-delete">Delete task</button>` : ``}
    </div>`;

  c.querySelectorAll(".status-pick-btn").forEach(b => { b.onclick = () => { setStatus(t.id, b.dataset.s); openDetail(t.id); renderCurrentView(); }; });
  c.querySelectorAll("[data-go]").forEach(n => { n.onclick = () => openDetail(n.dataset.go); });
  c.querySelector("#detail-copy").onclick = (ev) => copyText(taskJiraText(t), ev.target, "Copy Jira task");

  if (editing) {
    const nameI = c.querySelector("#edit-task-name"); nameI.oninput = () => { editTask(t.id, { name: nameI.value }); renderCurrentView(); };
    const descI = c.querySelector("#edit-task-desc"); if (descI) { autoGrow(descI); descI.oninput = () => { autoGrow(descI); editTask(t.id, { description: descI.value }); }; }
    c.querySelector("#edit-task-owner").oninput = (ev) => editTask(t.id, { owner: ev.target.value });
    c.querySelector("#edit-task-deptext").oninput = (ev) => editTask(t.id, { depText: ev.target.value });
    c.querySelector("#edit-task-critical").onchange = (ev) => { editTask(t.id, { critical: ev.target.checked }); renderCurrentView(); };
    c.querySelectorAll("#edit-task-roles input").forEach(chk => { chk.onchange = () => { const roles = [...c.querySelectorAll("#edit-task-roles input:checked")].map(x => x.value); editTask(t.id, { roles: roles.length ? roles : ["ux"] }); renderCurrentView(); }; });
    const ss = c.querySelector("#edit-task-start"), es = c.querySelector("#edit-task-end");
    const apply = (changed) => { let s = +ss.value, en = +es.value; if (en < s) { if (changed === "start") en = s; else s = en; } ss.value = s; es.value = en; setHalves(t, s, en); render(); openDetail(t.id); };
    ss.onchange = () => apply("start"); es.onchange = () => apply("end");
    rebindList(c, "#edit-deliverables", () => taskById(t.id).deliverables, next => editTask(t.id, { deliverables: next }), "Deliverable");
    rebindList(c, "#edit-acceptance", () => taskById(t.id).acceptance, next => editTask(t.id, { acceptance: next }), "Acceptance criterion");
    const del = c.querySelector("#detail-delete");
    if (del) del.onclick = () => { if (confirm(`Delete task ${t.id} “${t.name}”?`)) { deleteTask(t.id); closeDetail(); render(); } };
  }

  panel.classList.remove("hidden"); overlay.classList.remove("hidden");
}
function closeDetail() {
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
  state._openTaskId = null;
}

/* ============================== CSV ============================= */
function exportCSV() {
  const headers = ["Task ID","Task Name","Phase","Epic","Epic Title","Owner","Roles","Start","End","Span","Fortnights","Status","Critical","Dependencies","Deliverables","Acceptance Criteria"];
  const rows = TASKS.map(t => {
    const s = getSchedule(t), e = epicById(t.epic);
    return [t.id, t.name, e.phase, t.epic, e.title, t.owner, t.roles.map(r => ROLES[r].name).join("; "),
      s.startLabel, s.endLabel, s.rangeLabel, s.halves, statusLabel(getStatus(t.id)), t.critical ? "Yes" : "No",
      t.depText, t.deliverables.join(" | "), t.acceptance.join(" | ")].map(csvCell).join(",");
  });
  downloadFile(headers.map(csvCell).join(",") + "\n" + rows.join("\n"), "ccs-delivery-planner-v2.csv", "text/csv");
}
function csvCell(v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

/* ============================== RENDER ========================== */
const VIEW_RENDERERS = {
  summary: renderSummary,
  mvp2026: () => renderPhase("2026"),
  public2027: () => renderPhase("2027"),
  dependencies: renderDependencies,
  artefacts: renderArtefacts,
  jira: renderJira
};
function renderCurrentView() {
  const root = document.getElementById("view-root");
  root.innerHTML = "";
  root.appendChild(VIEW_RENDERERS[state.view]());
  document.getElementById("filter-bar").style.display =
    ["mvp2026", "public2027", "jira"].includes(state.view) ? "flex" : "none";
}
function render() {
  buildModel();
  renderCurrentView();
  syncHeaderHeight();
}
function syncHeaderHeight() {
  const h = document.querySelector(".app-header");
  if (h) document.documentElement.style.setProperty("--header-h", h.offsetHeight + "px");
}

/* ============================== INIT =========================== */
function init() {
  buildModel();

  document.querySelectorAll(".view-tab").forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll(".view-tab").forEach(x => x.classList.remove("active"));
      tab.classList.add("active"); state.view = tab.dataset.view; renderCurrentView();
    };
  });

  const sb = document.getElementById("filter-search");
  sb.oninput = () => { state.filters.search = sb.value; renderCurrentView(); };
  document.getElementById("filter-role").onchange = e => { state.filters.role = e.target.value; renderCurrentView(); };
  document.querySelectorAll(".status-check input").forEach(chk => { chk.onchange = () => { state.statusShow[chk.dataset.status] = chk.checked; renderCurrentView(); }; });

  document.getElementById("btn-mode").onclick = (e) => {
    state.execMode = !state.execMode;
    document.body.classList.toggle("exec-mode", state.execMode);
    e.target.classList.toggle("on", state.execMode);
    e.target.textContent = state.execMode ? "Executive mode" : "Detailed mode";
    render();
  };

  document.getElementById("btn-edit").onclick = (e) => {
    state.editMode = !state.editMode;
    document.body.classList.toggle("edit-mode", state.editMode);
    e.target.classList.toggle("on", state.editMode);
    e.target.textContent = state.editMode ? "✓ Done editing" : "✎ Edit / Add";
    if (state.editMode && !["mvp2026", "public2027"].includes(state.view)) {
      state.view = "mvp2026";
      document.querySelectorAll(".view-tab").forEach(x => x.classList.toggle("active", x.dataset.view === "mvp2026"));
    }
    render();
    if (!document.getElementById("detail-panel").classList.contains("hidden") && state._openTaskId) openDetail(state._openTaskId);
  };

  document.getElementById("btn-print").onclick = () => { document.body.classList.add("print-all"); window.print(); setTimeout(() => document.body.classList.remove("print-all"), 500); };
  document.getElementById("btn-csv").onclick = exportCSV;
  document.getElementById("btn-save-plan").onclick = exportPlanJSON;
  document.getElementById("btn-load-plan").onclick = () => document.getElementById("file-load-plan").click();
  document.getElementById("file-load-plan").onchange = (ev) => {
    const file = ev.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { importPlanJSON(reader.result); render(); } catch (err) { alert("Could not load plan: " + err.message); } ev.target.value = ""; };
    reader.readAsText(file);
  };
  document.getElementById("btn-reset").onclick = () => {
    if (confirm("Reset all saved changes? This clears statuses, timeline edits and all content edits, restoring the original V2 plan.")) {
      state.status = {}; state.schedule = {}; saveStatus(); saveSchedule(); resetEdits(); render();
    }
  };

  document.getElementById("detail-close").onclick = closeDetail;
  document.getElementById("overlay").onclick = closeDetail;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });
  window.addEventListener("resize", syncHeaderHeight);

  render();
}
document.addEventListener("DOMContentLoaded", init);
