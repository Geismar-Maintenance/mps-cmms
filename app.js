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
   INVENTORY OPERATIONS (ISSUE / RECEIVE / MOVE)
   ====================================================== */

/* ---------- ISSUE ---------- */
function openIssueModal(partid) {
  selectedPart = allParts.find(p => Number(p.partid) === Number(partid));
  if (!selectedPart) return;

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  const locSelect = document.getElementById("issue-location");
  locSelect.replaceChildren();

  if (!selectedPart.locations.length) {
    alert("No inventory available");
    return;
  }

  selectedPart.locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    locSelect.appendChild(opt);
  });

  loadAssetsForIssue();

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("issueModal"))
    .show();
}

async function submitIssue() {
  const assetid = document.getElementById("issue-asset").value;
  const locationid = document.getElementById("issue-location").value;
  const qty = Number(document.getElementById("issue-qty").value);
  const workorder = document.getElementById("issue-wo").value || null;

  if (!assetid || !locationid || qty <= 0) {
    alert("Asset, location, and quantity are required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/parts/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        from_locationid: locationid,
        qty,
        assetid,
        workorder,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    bootstrap.Modal
      .getInstance(document.getElementById("issueModal"))
      .hide();

    refreshPartsTable();

  } catch (err) {
    alert(err.message || "Issue failed");
    console.error(err);
  }
}

/* ---------- RECEIVE ---------- */
function openReceiveModal(partid) {
  selectedPart = allParts.find(p => Number(p.partid) === Number(partid));
  if (!selectedPart) return;

  document.getElementById("receive-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  document.getElementById("receive-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
}

async function submitReceive() {
  if (!selectedPart) {
    alert("No valid part selected.");
    return;
  }

  const qtyInput = document.getElementById("receive-qty");
  const qty = parseInt(qtyInput.value, 10);

  if (!Number.isInteger(qty) || qty <= 0) {
    alert("Quantity must be a positive whole number.");
    qtyInput.focus();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/parts/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: Number(selectedPart.partid),
        qty,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Receive failed");

    bootstrap.Modal
      .getInstance(document.getElementById("receiveModal"))
      .hide();

    refreshPartsTable();

    // ✅ Admin-guided post-receive hook
    if (typeof postReceiveAction === "function") {
      postReceiveAction();
      postReceiveAction = null;
    }

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

/* ---------- MOVE ---------- */
function openMoveModal(partid) {
  selectedPart = allParts.find(p => Number(p.partid) === Number(partid));
  if (!selectedPart) return;

  document.getElementById("move-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  const fromSelect = document.getElementById("move-from-location");
  fromSelect.replaceChildren();

  selectedPart.locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    fromSelect.appendChild(opt);
  });

  loadAllLocationsForMove();
  document.getElementById("move-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("moveModal"))
    .show();
}

async function submitMove() {
  const from_locationid =
    Number(document.getElementById("move-from-location").value);
  const to_locationid =
    Number(document.getElementById("move-to-location").value);
  const qty = parseInt(document.getElementById("move-qty").value, 10);

  if (!from_locationid || !to_locationid || from_locationid === to_locationid) {
    alert("Please select different source and destination locations.");
    return;
  }

  if (!Number.isInteger(qty) || qty <= 0) {
    alert("Quantity must be a positive number.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/parts/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        from_locationid,
        to_locationid,
        qty,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    bootstrap.Modal
      .getInstance(document.getElementById("moveModal"))
      .hide();

    refreshPartsTable();

  } catch (err) {
    alert(err.message || "Move failed");
    console.error(err);
  }
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

/* ======================================================
   APP INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
``
