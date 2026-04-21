/* ======================================================
   DASHBOARD LOGIC
   Responsibility:
   - Load dashboard data
   - Render dashboard stats
   ====================================================== */

/* ---------- Utility ---------- */
function updateDashboardStat(id, value, onClickFn) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value;

  const row = el.closest(".clickable-stat");
  if (!row) return;

  if (value === 0) {
    row.style.pointerEvents = "none";
    row.style.opacity = "0.45";
    row.title = "No items to display";
    row.onclick = null;
  } else {
    row.style.pointerEvents = "auto";
    row.style.opacity = "1";
    row.title = "Click to view details";
    row.onclick = onClickFn;
  }
}

/* ---------- Public Entry ---------- */
async function loadDashboard() {
  try {
    await loadWorkOrdersData();
  } catch (err) {
    console.error("Failed to load work orders for dashboard", err);
  }

  try {
    await loadDashboardInventory();
  } catch (err) {
    console.error("Failed to load inventory summary", err);
  }

  renderDashboard();
}

/* ---------- Rendering ---------- */
function renderDashboard() {
  const today = new Date();
  const startOfWeek = new Date(today);
  const endOfWeek = new Date(today);

  startOfWeek.setDate(today.getDate() - today.getDay());
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const openWOs = allWorkOrders.filter(
    w => w.status !== "Completed"
  );

  const overdueWOs = openWOs.filter(
    w => w.duedate && new Date(w.duedate) < today
  );

  const dueThisWeek = openWOs.filter(w => {
    if (!w.duedate) return false;
    const d = new Date(w.duedate);
    return d >= startOfWeek && d <= endOfWeek;
  });

  updateDashboardStat(
    "dash-wo-open",
    openWOs.length,
    () => goToWorkOrders("open")
  );

  updateDashboardStat(
    "dash-wo-overdue",
    overdueWOs.length,
    () => goToWorkOrders("overdue")
  );

  updateDashboardStat(
    "dash-wo-week",
    dueThisWeek.length,
    () => goToWorkOrders("week")
  );
}

/* ---------- Inventory Summary ---------- */
async function loadDashboardInventory() {
  const res = await fetch(`${API_BASE}/api/parts?summary=inventory`);
  if (!res.ok) {
    throw new Error("Inventory summary request failed");
  }

  const data = await res.json();

  updateDashboardStat(
    "dash-low-stock",
    data.low_stock ?? 0,
    () => goToInventory('low');
  );

  updateDashboardStat(
    "dash-out-stock",
    data.out_stock ?? 0,
    () => goToInventory('out');
  );
}
