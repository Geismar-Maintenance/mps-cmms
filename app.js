const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let allParts = [];
let allWorkOrders = [];
let selectedPart = null;
let lastPartSearch = "";
let postReceiveAction = null;

/* ======================================================
   NAVIGATION
   ====================================================== */
window.switchModule = function (moduleName, el) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(m => {
    m.classList.remove("active");
    m.style.display = "none";
  });

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
  if (moduleName === "workorders") loadWorkOrders();
};

/* ======================================================
   DASHBOARD
   ====================================================== */
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

  document.getElementById("dash-wo-open").textContent = openWOs.length;
  document.getElementById("dash-wo-overdue").textContent = overdueWOs.length;
  document.getElementById("dash-wo-week").textContent = dueThisWeek.length;
}

async function loadDashboardInventory() {
  const res = await fetch(`${API_BASE}/api/parts?summary=inventory`);
  if (!res.ok) return;
  const data = await res.json();

  document.getElementById("dash-low-stock").textContent =
    data.low_stock ?? 0;
  document.getElementById("dash-out-stock").textContent =
    data.out_stock ?? 0;
}

/* ======================================================
   WORK ORDERS (OPS)
   ====================================================== */
async function loadWorkOrdersData() {
  const res = await fetch(`${API_BASE}/api/workorders`);
  if (!res.ok) throw new Error("Failed to load work orders");
  allWorkOrders = await res.json();
}

async function loadWorkOrders() {
  await loadWorkOrdersData();
  applyWOFilters();
}

function applyWOFilters() {
  const statusFilter =
    document.getElementById("wo-status-filter")?.value || "open";

  let filtered = [...allWorkOrders];

  if (statusFilter === "open")
    filtered = filtered.filter(w => w.status !== "Completed");

  if (statusFilter === "completed")
    filtered = filtered.filter(w => w.status === "Completed");

  if (statusFilter === "all") {
    filtered.sort((a, b) =>
      a.status === "Completed" && b.status !== "Completed" ? 1 :
      a.status !== "Completed" && b.status === "Completed" ? -1 : 0
    );
  }

  renderWOTable(filtered);
}

function renderWOTable(rows) {
  const tbody = document.querySelector("#wo-table tbody");
  tbody.innerHTML = "";

  rows.forEach(w => {
    const tr = document.createElement("tr");
    if (w.status === "Completed") tr.classList.add("table-secondary");

    tr.innerHTML = `
      <td>${w.woid}</td>
      <td>${w.assetname ?? "—"}</td>
      <td>${w.description}</td>
      <td>${w.type}</td>
      <td>${w.priority}</td>
      <td>${w.status}</td>
      <td>${w.duedate ? new Date(w.duedate).toLocaleDateString() : "—"}</td>
      <td>
        ${
          w.status !== "Completed"
            ? `<button class="btn btn-sm btn-success"
                       onclick="openCloseWOModal(${w.woid})">
                 Complete
               </button>`
            : "—"
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}
/* ======================================================
   WORK ORDER CREATE
   ====================================================== */
async function openCreateWOModal() {
  try {
    await loadWOAssets();
    await loadWOTypes();
    await loadWOPriorities();

    bootstrap.Modal
      .getOrCreateInstance(document.getElementById("createWOModal"))
      .show();

  } catch (err) {
    alert("Unable to load data for work order creation");
    console.error(err);
  }
}

/* ---------- Load Assets ---------- */
async function loadWOAssets() {
  const sel = document.getElementById("wo-asset");
  sel.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Asset";
  sel.appendChild(placeholder);

  const res = await fetch(`${API_BASE}/api/assets`);
  if (!res.ok) throw new Error("Failed to load assets");

  const assets = await res.json();

  assets.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.assetid;
    opt.textContent = `${a.assetnumber} – ${a.assetname}`;
    sel.appendChild(opt);
  });
}

/* ---------- Load WO Types ---------- */
async function loadWOTypes() {
  const sel = document.getElementById("wo-type");
  sel.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Type";
  sel.appendChild(placeholder);

  const res = await fetch(`${API_BASE}/api/lookups?type=wotypes`);
  if (!res.ok) throw new Error("Failed to load WO types");

  const types = await res.json();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.type;
    sel.appendChild(opt);
  });
}

/* ---------- Load Priorities ---------- */
async function loadWOPriorities() {
  const sel = document.getElementById("wo-priority");
  sel.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select Priority";
  sel.appendChild(placeholder);

  const res = await fetch(`${API_BASE}/api/lookups?type=wopriorities`);
  if (!res.ok) throw new Error("Failed to load priorities");

  const prios = await res.json();

  prios.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.priority;
    sel.appendChild(opt);
  });
}
/* ======================================================
   WORK ORDER CREATE / SUBMIT
   ====================================================== */
async function submitWorkOrder() {
  const assetid = document.getElementById("wo-asset").value;
  const description = document.getElementById("wo-description").value.trim();
  const wotype = document.getElementById("wo-type").value;
  const priority = document.getElementById("wo-priority").value;
  const duedate = document.getElementById("wo-due").value || null;

  // ✅ Frontend validation
  if (!assetid || !description || !wotype || !priority) {
    alert("Asset, description, type, and priority are required.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/workorders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetid: parseInt(assetid, 10),
        description,
        wotype: parseInt(wotype, 10),
        priority: parseInt(priority, 10),
        duedate
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Create failed");

    // Close modal
    bootstrap.Modal
      .getInstance(document.getElementById("createWOModal"))
      .hide();

    // Refresh active work orders
    loadWorkOrders();

  } catch (err) {
    alert(err.message);
    console.error("Create WO failed:", err);
  }
}
``
/* ======================================================
   WORK ORDER CLOSE (TECHNICIAN COMPLETE)
   ====================================================== */
function openCloseWOModal(woid) {
  document.getElementById("close-wo-id").value = woid;
  document.getElementById("workperformed").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("closeWOModal"))
    .show();
}

async function submitCloseWO() {
  const woid = document.getElementById("close-wo-id").value;
  const workperformed =
    document.getElementById("workperformed").value.trim();

  if (!workperformed) {
    alert("Work performed is required.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/workorders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "close",
        woid,
        workperformed
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Close failed");

    bootstrap.Modal
      .getInstance(document.getElementById("closeWOModal"))
      .hide();

    // ✅ Refresh active work orders
    loadWorkOrders();

  } catch (err) {
    alert(err.message);
    console.error("Close WO failed:", err);
  }
}


/* ======================================================
   PARTS SEARCH (OPS)
   ====================================================== */
document.getElementById("part-search")?.addEventListener("keydown", e => {
  if (e.key === "Enter") runPartSearch();
});

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

  const res = await fetch(`${API_BASE}/api/history/parts`);
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

async function loadWOHistory() {
  const tbody = document.querySelector("#wo-history-table tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/workorders?history=true`);
    if (!res.ok) throw new Error("Failed to load work order history");

    const rows = await res.json();

    rows.forEach(w => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${w.woid}</td>
        <td>${w.assetname ?? "—"}</td>
        <td>${w.description}</td>
        <td>${w.type}</td>
        <td>${w.priority}</td>
        <td>${new Date(w.opendate).toLocaleDateString()}</td>
        <td>${w.closedate ? new Date(w.closedate).toLocaleDateString() : "—"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    alert("Unable to load work order history");
    console.error(err);
  }
}

/* ======================================================
   APP INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
``
