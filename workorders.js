/* ======================================================
   WORK ORDERS MODULE (FRONTEND)
   ------------------------------------------------------
   Responsibilities:
   - Load and render work orders
   - Apply dashboard and UI filters
   - Open Work Order Detail modal
   - Create, edit, and close work orders

   Backend expectations:
   - GET /api/workorders           → list
   - GET /api/workorders?id=ID     → single WO
   - POST /api/workorders          → create / close
   - PUT /api/workorders?id=ID     → update
   ====================================================== */

/* ---------- LOAD & RENDER ---------- */
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

  const dashboardFilters = window.currentModuleFilters || {};

  let filtered = [...allWorkOrders];

  // ✅ Status filtering (existing behavior)
  if (statusFilter === "open") {
    filtered = filtered.filter(w => w.status !== "Completed");
  }

  if (statusFilter === "completed") {
    filtered = filtered.filter(w => w.status === "Completed");
  }

  if (statusFilter === "all") {
    filtered.sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (a.status !== "Completed" && b.status === "Completed") return -1;
      return 0;
    });
  }

  // ✅ Dashboard due-date filters
  if (dashboardFilters.due === "overdue") {
    const today = new Date();
    filtered = filtered.filter(
      w => w.duedate && new Date(w.duedate) < today
    );
  }

  if (dashboardFilters.due === "this_week") {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    start.setDate(today.getDate() - today.getDay());
    end.setDate(start.getDate() + 6);

    filtered = filtered.filter(w => {
      if (!w.duedate) return false;
      const d = new Date(w.duedate);
      return d >= start && d <= end;
    });
  }

  renderWOTable(filtered);

  // ✅ Clear dashboard filters after first use
  window.currentModuleFilters = null;
}

function renderWOTable(rows) {
  const tbody = document.querySelector("#wo-table tbody");
  tbody.innerHTML = "";

  rows.forEach(w => {
    const tr = document.createElement("tr");

    if (w.status === "Completed") {
      tr.classList.add("table-secondary");
    }

    tr.innerHTML = `
      
<td class="text-primary"
    style="cursor:pointer"
    onclick="openWorkOrderDetailModal(${w.woid})">
  WO-${w.woid}
</td>

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

/* ---------- CREATE ---------- */
async function openCreateWOModal() {
  await loadWOAssets();
  await loadWOTypes();
  await loadWOPriorities();

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("createWOModal"))
    .show();
}

async function submitWorkOrder() {
  const assetid = document.getElementById("wo-asset").value;
  const description = document.getElementById("wo-description").value.trim();
  const wotype = document.getElementById("wo-type").value;
  const priority = document.getElementById("wo-priority").value;
  const duedate = document.getElementById("wo-due").value || null;

  if (!assetid || !description || !wotype || !priority) {
    alert("Asset, description, type, and priority are required.");
    return;
  }

  
const res = await fetch(`${API_BASE}/api/workorders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    assetid: parseInt(assetid, 10),
    description,
    wotype: parseInt(wotype, 10),
    priority: parseInt(priority, 10),
    duedate,
    created_by_userid: currentUser ? currentUser.userid: null
  })
});


  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Create failed");

  bootstrap.Modal
    .getInstance(document.getElementById("createWOModal"))
    .hide();

  loadWorkOrders();
}

/* ---------- COMPLETE ---------- */

function openCloseWOModal(woid) {
  document.getElementById("close-wo-id").value = woid;
  document.getElementById("workperformed").value = "";
  loadTechniciansForWO();

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("closeWOModal"))
    .show();
}


async function submitCloseWO() {
  const woid = document.getElementById("close-wo-id").value;

  const workperformedEl = document.getElementById("workperformed");
  const workedByEl = document.getElementById("wo-worked-by");

  const workperformed = workperformedEl ? workperformedEl.value.trim() : "";
  const workedBy = workedByEl ? workedByEl.value : null;

  if (!workperformed) {
    alert("Work performed is required.");
    return;
  }

  if (!workedBy) {
    alert("Please select who worked on this job.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/workorders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     
body: JSON.stringify({
  action: "close",
  woid,
  workperformed,
  workedBy,
  completed_by_userid: currentUser ? currentUser.userid:null
})

    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Close failed");

    bootstrap.Modal
      .getInstance(document.getElementById("closeWOModal"))
      .hide();

    loadWorkOrders();

  } catch (err) {
    console.error("Close WO failed:", err);
    alert(err.message);
  }
}


/* ---------- HISTORY ---------- */
async function loadWOHistory() {
  const tbody = document.querySelector("#wo-history-table tbody");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}/api/workorders?history=true`);
  if (!res.ok) throw new Error("Failed to load work order history");

  const rows = await res.json();

  rows.forEach(w => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${w.woid}</td>
      <td>${w.assetname ?? "—"}</td>
      <td>${w.description}</td>
      <td>${w.type ?? "—"}</td>
      <td>${w.priority ?? "—"}</td>
      <td>${w.opendate ? new Date(w.opendate).toLocaleDateString() : "—"}</td>
      <td>${w.closeddate ? new Date(w.closeddate).toLocaleDateString() : "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.openWorkOrderDetailModal = async function (woid) {
  const res = await fetch(`${API_BASE}/api/workorders?id=${woid}`);
  if (!res.ok) {
    alert("Failed to load work order");
    return;
  }

  const wo = await res.json();

  document.getElementById("wo-detail-id").textContent = wo.woid;
  document.getElementById("wo-detail-hidden-id").value = wo.woid;
  document.getElementById("wo-detail-description").value = wo.description;
  document.getElementById("wo-detail-due").value =
    wo.duedate?.split("T")[0] ?? "";
  document.getElementById("wo-detail-status").value = wo.status;
  document.getElementById("wo-detail-created-by").textContent =
  wo.created_by ?? "—";


  const modalEl = document.getElementById("workOrderDetailModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();

  await loadWODetailAssets(wo.assetid);
  await loadWODetailPriorities(wo.priority);
  await loadWODetailTypes(wo.type);
};

window.saveWorkOrderDetails = async function () {
  const woid = document.getElementById("wo-detail-hidden-id").value;

  const payload = {
    description: document.getElementById("wo-detail-description").value,
    assetid: document.getElementById("wo-detail-asset").value,
    priority: document.getElementById("wo-detail-priority").value,
    type: document.getElementById("wo-detail-type").value,
    status: document.getElementById("wo-detail-status").value,
    duedate: document.getElementById("wo-detail-due").value
  };

  const res = await fetch(`${API_BASE}/api/workorders/${woid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    alert("Failed to save work order");
    return;
  }

  bootstrap.Modal.getInstance(
    document.getElementById("workOrderDetailModal")
  ).hide();

  loadWorkOrders(); // refresh table
};


/* ---------- SUPPORT LOADERS ---------- */
async function loadWOAssets() {
  const sel = document.getElementById("wo-asset");
  sel.replaceChildren(
    Object.assign(document.createElement("option"), {
      value: "",
      textContent: "Select Asset"
    })
  );

  const res = await fetch(`${API_BASE}/api/assets`);
  const assets = await res.json();

  assets.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.assetid;
    opt.textContent = `${a.assetnumber} – ${a.assetname}`;
    sel.appendChild(opt);
  });
}

async function loadWOTypes() {
  const sel = document.getElementById("wo-type");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/lookups?type=wotypes`);
  const types = await res.json();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.type;
    sel.appendChild(opt);
  });
}

async function loadWOPriorities() {
  const sel = document.getElementById("wo-priority");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/lookups?type=wopriorities`);
  const prios = await res.json();

  prios.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.priority;
    sel.appendChild(opt);
  });
}
async function loadTechniciansForWO(defaultTechId = null) {
  const sel = document.getElementById("wo-worked-by");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/technicians`);
  if (!res.ok) throw new Error("Failed to load technicians");

  const techs = await res.json();

  techs.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name; // adjust field name if needed

    if (defaultTechId && Number(defaultTechId) === Number(t.id)) {
      opt.selected = true;
    }

    sel.appendChild(opt);
  });
}
async function loadWODetailAssets(selectedId = null) {
  const sel = document.getElementById("wo-detail-asset");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/assets`);
  const assets = await res.json();

  assets.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a.assetid;
    opt.textContent = `${a.assetnumber} – ${a.assetname}`;
    if (Number(a.assetid) === Number(selectedId)) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

async function loadWODetailTypes(selectedId = null) {
  const sel = document.getElementById("wo-detail-type");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/lookups?type=wotypes`);
  const types = await res.json();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.type;
    if (Number(t.id) === Number(selectedId)) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

async function loadWODetailPriorities(selectedId = null) {
  const sel = document.getElementById("wo-detail-priority");
  sel.replaceChildren();

  const res = await fetch(`${API_BASE}/api/lookups?type=wopriorities`);
  const prios = await res.json();

  prios.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.priority;
    if (Number(p.id) === Number(selectedId)) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}
