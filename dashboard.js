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


  try {
    await loadRuntimeValidation();
  } catch (err) {
    console.error("Failed to validate runtime data", err);
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
    () => goToInventory('low')
  );

  updateDashboardStat(
    "dash-out-stock",
    data.out_stock ?? 0,
    () => goToInventory('out')
  );
}

window.goToInventory = function (type) {
  loadModule("parts", { inventoryFilter: type });
};

async function loadRuntimeValidation() {
  const res = await fetch(`${API_BASE}/api/reports?type=missing-runtime`);

  if (!res.ok) {
    throw new Error("Runtime validation request failed");
  }

  const data = await res.json();

  renderRuntimeAlert(data);
}

function renderRuntimeAlert(data) {
  const container = document.getElementById("runtime-alert");

  if (!container) return;

  // ✅ No missing data → hide card
  if (!data.hasMissing) {
    container.innerHTML = "";
    return;
  }

  const list = data.missingAssets
    .map(a => `<li>${a.assetname}</li>`)
    .join("");

  container.innerHTML = `
    <div class="card border-danger shadow-sm">
      <div class="card-body">

        <div class="d-flex justify-content-between align-items-center">
          <h6 class="card-title text-danger mb-0">
            ⚠️ Runtime Data Required
          </h6>
        </div>

        <p class="mt-2 mb-2">
          Week <strong>${data.week}</strong> (${data.year})
          is missing runtime entry.
        </p>

        <p class="mb-1"><strong>Affected Machines:</strong></p>

        <ul class="mb-3">
          ${list}
        </ul>

        <div class="d-flex justify-content-between align-items-center">
          <span class="text-muted small">
            ${data.missingAssets.length} machine(s) missing data
          </span>

          <button class="btn btn-sm btn-outline-danger"
                  onclick="openRuntimeEntry()">
            Enter Runtime
          </button>
        </div>

      </div>
    </div>
  `;
}


function openRuntimeEntry() {
  loadModule("runtime"); // match your module name
}

