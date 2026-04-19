const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let allParts = [];
let allWorkOrders = [];
let selectedPart = null;
let lastPartSearch = "";
let postReceiveAction = null;

window.loadModule = function (moduleName, filters = {}) {
  // Switch visible module
  switchModule(moduleName);

  // Store filters globally so target module can read them
  window.currentModuleFilters = filters;
};

window.goToWorkOrders = function (filter) {
  switch (filter) {
    case 'open':
      loadModule('workorders', { status: 'open' });
      break;
    case 'overdue':
      loadModule('workorders', { status: 'open', due: 'overdue' });
      break;
    case 'week':
      loadModule('workorders', { status: 'open', due: 'this_week' });
      break;
    default:
      loadModule('workorders');
  }
};

window.goToInventory = function (filter) {
  switch (filter) {
    case 'low':
      loadModule('parts', { stock: 'low' });
      break;
    case 'out':
      loadModule('parts', { stock: 'out' });
      break;
    default:
      loadModule('parts');
  }
};

/* ======================================================
   NAVIGATION
   ====================================================== */
window.switchModule = function (moduleName, el) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(m => {
    m.classList.remove("active");
    m.style.display = "none";
  });

   
window.loadModule = function (moduleName, filters = {}) {
  switchModule(moduleName);
  window.currentModuleFilters = filters;
};


  // Show target module
  const target = document.getElementById(`module-${moduleName}`);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }
  
  // Update nav UI
  document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );
  if (el) el.classList.add("active");

  // Module-specific loading
  if (moduleName === "dashboard") loadDashboard();
  if (moduleName === "parts-history") loadPartsHistory();
  if (moduleName === "wo-history") loadWOHistory();
  if (moduleName === "workorders") loadWorkOrders();
   if (moduleName === "pm") loadPMView();  
  if (moduleName === 'pm-management') loadPMManagement();
   if (moduleName === "parts") loadParts();

};

/* ======================================================
   DASHBOARD
   ====================================================== */
function updateDashboardStat(id, value, onClickFn) {
  const el = document.getElementById(id);
  el.textContent = value;

  const row = el.closest('.clickable-stat');
  if (!row) return;

  if (value === 0) {
    row.style.pointerEvents = 'none';
    row.style.opacity = '0.45';
    row.title = 'No items to display';
    row.onclick = null;
  } else {
    row.style.pointerEvents = 'auto';
    row.style.opacity = '1';
    row.title = 'Click to view details';
    row.onclick = onClickFn;
  }
}
async function loadDashboard() {
  try { await loadWorkOrdersData(); } catch {}
  try { await loadDashboardInventory(); } catch {}
  renderDashboard();
}

function renderDashboard() {
  const today = new Date();
  const startOfWeek = new Date(today);
  const endOfWeek = new Date(today);

  startOfWeek.setDate(today.getDate() - today.getDay());
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const openWOs = allWorkOrders.filter(w => w.status !== "Completed");
  const overdueWOs = openWOs.filter(w =>
    w.duedate && new Date(w.duedate) < today
  );
  const dueThisWeek = openWOs.filter(w => {
    if (!w.duedate) return false;
    const d = new Date(w.duedate);
    return d >= startOfWeek && d <= endOfWeek;
  });

updateDashboardStat(
  "dash-wo-open",
  openWOs.length,
  () => window.goToWorkOrders('open')
);

updateDashboardStat(
  "dash-wo-overdue",
  overdueWOs.length,
  () => window.goToWorkOrders('overdue')
);

updateDashboardStat(
  "dash-wo-week",
  dueThisWeek.length,
  () => window.goToWorkOrders('week')
);
}

async function loadDashboardInventory() {
  const res = await fetch(`${API_BASE}/api/parts?summary=inventory`);
  if (!res.ok) return;
  const data = await res.json();

updateDashboardStat(
  "dash-low-stock",
  data.low_stock ?? 0,
  () => window.goToInventory('low')
);

updateDashboardStat(
  "dash-out-stock",
  data.out_stock ?? 0,
  () => window.goToInventory('out')
);
}

/* ======================================================
   PARTS SEARCH (OPS)
   ====================================================== */
document.getElementById("part-search")?.addEventListener("keydown", e => {
  if (e.key === "Enter") runPartSearch();
});
async function loadParts() {
  // Always load parts when navigating here
  const res = await fetch(`${API_BASE}/api/parts`);
  if (!res.ok) {
    console.error("Failed to load parts");
    return;
  }

  const data = await res.json();

  // Normalize shape exactly like search does
  allParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  // If dashboard passed an inventory filter, apply it
  if (window.currentModuleFilters?.stock) {
    applyInventoryDashboardFilters();
    return;
  }

  // Default inventory view (show all parts)
  renderPartsTable(allParts);
  document.getElementById("parts-placeholder").style.display = "none";
}
async function runPartSearch() {
  const input = document.getElementById("part-search");
  const query = input.value.trim();

  if (query.length < 2) {
    allParts = [];
    renderPartsTable([]);
    document.getElementById("parts-placeholder").style.display = "block";
    return;
  }

  lastPartSearch = query;

  const res = await fetch(
    `${API_BASE}/api/parts?search=${encodeURIComponent(query)}`
  );
  if (!res.ok) return;

  const data = await res.json();
  allParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  document.getElementById("parts-placeholder").style.display = "none";
  renderPartsTable(allParts);
}

function refreshPartsTable() {
  if (lastPartSearch.length >= 2) {
    document.getElementById("part-search").value = lastPartSearch;
    runPartSearch();
  }
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  parts.forEach(p => {
    const tr = document.createElement("tr");
    const locationDisplay =
      p.locations.length > 0
        ? p.locations.map(loc =>
            `${loc.cabinet}.${loc.section}.${loc.bin} (${loc.qty})`
          ).join("<br>")
        : "—";

    tr.innerHTML = `
      <td>${p.partnumber}</td>
      <td>${p.description}</td>
      <td>${p.manufacturer ?? "—"}</td>
      <td>${p.model ?? "—"}</td>
      <td>${p.total_qty}</td>
      <td>${locationDisplay}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary"
                ${p.total_qty === 0 ? "disabled" : ""}
                onclick="openIssueModal(${p.partid})">Issue</button>
        <button class="btn btn-sm btn-outline-success"
                onclick="openReceiveModal(${p.partid})">Receive</button>
        <button class="btn btn-sm btn-outline-secondary"
                onclick="openMoveModal(${p.partid})">Move</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* ======================================================
   ADMIN – ADD MASTER PART ONLY
   ====================================================== */
window.openAddPartModal = function () {
  document.getElementById("addPartForm").reset();
  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("addPartModal")
  ).show();
};

async function submitAddPart(event) {
  event.preventDefault();

  const btn = document.getElementById("btnSubmitNewPart");
  btn.disabled = true;

  const payload = {
    partnumber: document.getElementById("adminPartNumber").value.trim(),
    description: document.getElementById("adminDescription").value.trim(),
    manufacturer: document.getElementById("adminManufacturer").value.trim(),
    model: document.getElementById("adminModel").value.trim(),
    cost: document.getElementById("adminCost").value,
    reorderlevel: document.getElementById("adminReorder").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/parts?admin=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    // Close Add Part modal
    bootstrap.Modal.getInstance(
      document.getElementById("addPartModal")
    ).hide();

    const newPartId = result.partid;

    // Prompt to receive inventory
    setTimeout(() => {
      if (confirm("Part created. Would you like to receive inventory now?")) {
        openReceiveFromAdmin(newPartId);
      }
    }, 300);

  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

/* ======================================================
   ADMIN‑GUIDED INVENTORY HELPERS
   ====================================================== */

function openReceiveFromAdmin(partid) {
  // Set selectedPart context
  selectedPart = {
    partid,
    partnumber: document.getElementById("adminPartNumber").value,
    model: ""
  };

  document.getElementById("receive-partname").innerText =
    selectedPart.partnumber;

  document.getElementById("receive-qty").value = "";

  // ✅ Define one‑time post‑receive behavior
  postReceiveAction = () => {
    setTimeout(() => {
      if (confirm("Inventory received. Would you like to move it to a storage location now?")) {
        openMoveModal(partid);
      }
    }, 300);
  };

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
}


/* ======================================================
   HISTORY (READ‑ONLY)
   ====================================================== */
async function loadPartsHistory() {
   const tbody = document.querySelector("#parts-history-table tbody");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}/api/parts?history=true`);
  if (!res.ok) return;

  const rows = await res.json();
  rows.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(h.transactiondate).toLocaleString()}</td>
      <td>${h.transactiontype}</td>
      <td>${h.partnumber}</td>
      <td>${h.description}</td>
      <td>${h.from_cabinet ? `${h.from_cabinet}.${h.from_section}.${h.from_bin}` : "—"}</td>
      <td>${h.to_cabinet ? `${h.to_cabinet}.${h.to_section}.${h.to_bin}` : "—"}</td>
      <td>${h.qty}</td>
      <td>${h.performed_by}</td>
    `;
    tbody.appendChild(tr);
  });
}


/* ======================================================
   APP INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
