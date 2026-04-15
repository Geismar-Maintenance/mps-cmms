/* ======================================================
   WORK ORDERS (FRONTEND)
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

  let filtered = [...allWorkOrders];

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

  renderWOTable(filtered);
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
      duedate
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

  // ✅ Validation
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
        workedBy
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

