/* ==================================================================
   CCS UX/UI Delivery Plan — app logic
   Views: timeline, swimlanes, epics, dependencies, deliverables, jira
   ================================================================== */

const STORAGE_KEY = "ccs-delivery-plan-status-v1";
const COLLAPSE_KEY = "ccs-delivery-plan-collapsed-v1";

const state = {
  view: "timeline",
  filters: { search: "", role: "all", month: "all", epic: "all" },
  statusShow: { "not-started": true, "in-progress": true, "complete": true },
  status: loadStatus(),       // { "1.1": "in-progress", ... }
  collapsed: loadCollapsed(), // { "E0": true }
  compact: false
};

/* ---------------------------- storage ---------------------------- */
function loadStatus() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveStatus() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.status)); }
function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; }
  catch { return {}; }
}
function saveCollapsed() { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state.collapsed)); }

function getStatus(id) { return state.status[id] || "not-started"; }
function setStatus(id, s) { state.status[id] = s; saveStatus(); }

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
    const a = MONTH_INDEX(t.start), b = MONTH_INDEX(t.end), m = MONTH_INDEX(f.month);
    if (m < a || m > b) return false;
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
  const pct = Math.round((counts.complete / all.length) * 100);

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
    const p = Math.round((done / ts.length) * 100);
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
  root.appendChild(tl);
  return root;
}

function timelineRow(t, e) {
  const row = el("div", "tl-row");
  const a = MONTH_INDEX(t.start), b = MONTH_INDEX(t.end);
  const left = (a / 6) * 100;
  const width = ((b - a + 1) / 6) * 100;

  const label = el("div", "tl-label");
  label.innerHTML = `<span class="tl-id">${t.id}</span>
    <span class="tl-name">${esc(t.name)}</span>
    <span class="tl-meta">${t.roles.map(roleBadge).join("")}
      <span class="status-dot ${getStatus(t.id)}" title="${statusLabel(getStatus(t.id))}"></span>
      ${t.critical ? '<span class="crit-flag">Critical dep</span>' : ''}</span>`;
  label.onclick = () => openDetail(t.id);
  row.appendChild(label);

  const track = el("div", "tl-track");
  const grid = el("div", "tl-grid");
  grid.innerHTML = "<span></span>".repeat(6);
  track.appendChild(grid);

  const bar = el("div", "tl-bar");
  bar.style.left = left + "%";
  bar.style.width = width + "%";
  bar.style.background = e.colour;
  bar.style.opacity = getStatus(t.id) === "not-started" ? "0.78" : "1";
  bar.innerHTML = `${t.id}${t.deps.length ? `<span class="bar-dep" title="Depends on ${esc(t.depText)}">⇠</span>` : ""}`;
  bar.title = `${t.name} (${t.start}${t.start !== t.end ? "–" + t.end : ""})`;
  bar.onclick = () => openDetail(t.id);
  track.appendChild(bar);

  row.appendChild(track);
  return row;
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
      ts.filter(t => MONTH_INDEX(t.start) <= mi && mi <= MONTH_INDEX(t.end)).forEach(t => {
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
  EPICS.forEach(e => {
    if (state.filters.epic !== "all" && state.filters.epic !== e.id) return;
    const ts = vis.filter(t => t.epic === e.id);
    if (!ts.length && (state.filters.search || state.filters.role !== "all" || state.filters.month !== "all")) return;

    const allTs = TASKS.filter(t => t.epic === e.id);
    const done = allTs.filter(t => getStatus(t.id) === "complete").length;
    const pct = Math.round((done / allTs.length) * 100);
    const allDeliv = allTs.flatMap(t => t.deliverables);
    const depList = [...new Set(allTs.flatMap(t => t.deps).filter(d => !d.startsWith("E")))];

    const card = el("div", "epic-card");
    card.style.setProperty("--epic-colour", e.colour);
    const collapsed = !!state.collapsed["epic-view-" + e.id];

    const head = el("div", "epic-card-head" + (collapsed ? " collapsed" : ""));
    head.innerHTML = `<div class="epic-swatch">${e.id}</div>
      <div class="ec-body">
        <h3>${esc(e.title)}</h3>
        <p class="ec-purpose">${esc(e.purpose)}</p>
        <div class="ec-meta">
          <span><b>Duration:</b> ${esc(e.duration)}</span>
          <span><b>Owner:</b> ${esc(e.owner)}</span>
          <span><b>Roles:</b> ${e.roles.map(roleBadge).join(" ")}</span>
          <span><b>Tasks:</b> ${allTs.length}</span>
          <span><b>Deliverables:</b> ${allDeliv.length}</span>
          <span><b>${pct}% complete</b></span>
        </div>
        <div class="epic-progress-mini"><div style="width:${pct}%;background:${e.colour}"></div></div>
      </div>
      <span class="chev">▼</span>`;
    head.onclick = () => { state.collapsed["epic-view-" + e.id] = !collapsed; saveCollapsed(); render(); };
    card.appendChild(head);

    if (!collapsed) {
      const body = el("div", "epic-tasks");
      ts.forEach(t => {
        const row = el("div", "epic-task-row");
        row.innerHTML = `<span class="status-dot ${getStatus(t.id)}"></span>
          <span class="etr-id">${t.id}</span>
          <span class="etr-name">${esc(t.name)} ${t.roles.map(roleBadge).join("")}
          ${t.critical ? '<span class="crit-flag">Critical dep</span>' : ''}</span>
          <span class="etr-months">${t.start === t.end ? t.start : t.start + "–" + t.end}</span>`;
        row.onclick = () => openDetail(t.id);
        body.appendChild(row);
      });
      if (depList.length) {
        body.appendChild(el("div", "overlap-note",
          `Key dependencies: ${depList.map(d => `Task ${d}`).join(", ")}`));
      }
      card.appendChild(body);
    }
    root.appendChild(card);
  });
  if (!root.children.length) root.appendChild(el("div", "view-empty", "No epics match the current filters."));
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
    const ts = vis.filter(t => MONTH_INDEX(t.start) <= mi && mi <= MONTH_INDEX(t.end));
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
  return [
    `${t.id} — ${t.name}`,
    `Epic: ${t.epic} (${epicById(t.epic).title})`,
    `Owner: ${t.owner}`,
    `Start: ${t.start}    End: ${t.end}`,
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

/* ============================ DETAIL PANEL ====================== */
function openDetail(id) {
  const t = taskById(id);
  if (!t) return;
  const e = epicById(t.epic);
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
  const c = document.getElementById("detail-content");
  c.innerHTML = `
    <div class="detail-eyebrow">${e.id} · ${esc(e.title)}</div>
    <h2>${esc(t.name)}</h2>
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
      <div class="detail-row"><span class="dr-label">Owner</span><span class="dr-val">${esc(t.owner)}</span></div>
      <div class="detail-row"><span class="dr-label">Role(s)</span><span class="dr-val">${t.roles.map(roleBadge).join(" ")}</span></div>
      <div class="detail-row"><span class="dr-label">Start</span><span class="dr-val">${t.start} 2026</span></div>
      <div class="detail-row"><span class="dr-label">End</span><span class="dr-val">${t.end} 2026</span></div>
    </div>

    <div class="detail-section">
      <h4>Dependencies</h4>
      <div>${depsHtml}</div>
    </div>

    <div class="detail-section">
      <h4>Deliverables</h4>
      <div class="deliv-list">${t.deliverables.map(d => `<span class="deliv-tag">${esc(d)}</span>`).join("")}</div>
    </div>

    <div class="detail-section">
      <h4>Acceptance criteria</h4>
      <ul class="detail-list">${t.acceptance.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
    </div>

    <div class="detail-section">
      <button class="copy-btn" id="detail-copy">Copy Jira task</button>
    </div>`;

  c.querySelectorAll(".status-pick-btn").forEach(b => {
    b.onclick = () => { setStatus(t.id, b.dataset.s); openDetail(t.id); renderDashboard(); renderCurrentView(); };
  });
  c.querySelectorAll("[data-go]").forEach(n => { n.onclick = () => openDetail(n.dataset.go); });
  c.querySelector("#detail-copy").onclick = (ev) => copyText(taskJiraText(t), ev.target, "Copy Jira task");

  panel.classList.remove("hidden");
  overlay.classList.remove("hidden");
}
function closeDetail() {
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("overlay").classList.add("hidden");
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
  renderDashboard();
  renderCurrentView();
}

/* ============================== CSV ============================= */
function exportCSV() {
  const headers = ["Task ID", "Task Name", "Epic", "Epic Title", "Owner", "Roles", "Start", "End", "Status", "Critical", "Dependencies", "Deliverables", "Acceptance Criteria"];
  const rows = TASKS.map(t => [
    t.id, t.name, t.epic, epicById(t.epic).title, t.owner,
    t.roles.map(r => ROLES[r].name).join("; "),
    t.start, t.end, statusLabel(getStatus(t.id)), t.critical ? "Yes" : "No",
    t.depText, t.deliverables.join(" | "), t.acceptance.join(" | ")
  ].map(csvCell).join(","));
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

/* ============================== INIT =========================== */
function init() {
  // epic filter options
  const ef = document.getElementById("filter-epic");
  EPICS.forEach(e => {
    const o = document.createElement("option");
    o.value = e.id; o.textContent = `${e.id} · ${e.title}`;
    ef.appendChild(o);
  });

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
  document.getElementById("btn-reset").onclick = () => {
    if (confirm("Reset all saved task status changes back to 'Not started'?")) {
      state.status = {}; saveStatus(); render();
    }
  };

  // detail panel close
  document.getElementById("detail-close").onclick = closeDetail;
  document.getElementById("overlay").onclick = closeDetail;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

  render();
}

document.addEventListener("DOMContentLoaded", init);
