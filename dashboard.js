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

  try {
    await loadRuntimeValidation();
  } catch (err) {
    console.error("Failed to validate runtime data", err);
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
  const alertBox = document.getElementById("runtime-alert");

  if (!alertBox) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/reports?type=missing-runtime`
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Runtime validation error:", data);
      throw new Error(data.error || "Request failed");
    }

    console.log("Runtime validation:", data);

    if (data.hasMissing) {
      renderRuntimeAlert(data);
    } else {
      alertBox.style.display = "none";
      alertBox.innerHTML = "";
    }

  } catch (err) {
    console.error("Failed to validate runtime data:", err);

    alertBox.className = "alert alert-danger";
    alertBox.style.display = "block";
    alertBox.innerHTML = `
      <strong>Error:</strong> Unable to validate runtime data.
    `;
  }
}

function renderRuntimeAlert(data) {
  const alertBox = document.getElementById("runtime-alert");

  if (!alertBox) return;

  alertBox.className = "alert alert-warning";
  alertBox.style.display = "block";

  const count = data.missingAssets.length;

  alertBox.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      
      <div>
        <strong>Runtime Data Required</strong><br>
        Week ${data.week} (${data.year}) is missing runtime entries.<br>

        <div class="mt-2">
          <strong>${count} Machine${count !== 1 ? "s" : ""} Affected:</strong>
          <ul class="mb-0">
            ${data.missingAssets.map(a => `
              <li>${a.assetname}</li>
            `).join("")}
          </ul>
        </div>
      </div>

      <button class="btn btn-sm btn-outline-dark ms-3"
              onclick="switchModule('assets')">
        Enter Runtime
      </button>

    </div>
  `;
}

function openRuntimeEntry() {
  loadModule("assets"); // match your module name
}

