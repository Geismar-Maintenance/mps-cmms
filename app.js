const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

let allParts = [];
let selectedPart = null;

/* ================= Navigation ================= */

window.switchModule = function (moduleName, el) {
  document.querySelectorAll(".module").forEach(m =>
    m.classList.remove("active")
  );

  const target = document.getElementById(`module-${moduleName}`);
  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );

  if (el) el.classList.add("active");

  if (moduleName === "parts-history") {
    loadPartsHistory();
  }

  if (moduleName === "wo-history") {
    loadWOHistory();
  }
 
  if (moduleName === "workorders") {
  loadWorkOrders();
}
};

/* ================= Parts Search ================= */

document.getElementById("part-search")
  .addEventListener("keydown", e => {
    if (e.key === "Enter") {
      runPartSearch();
    }
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

  try {
    const res = await fetch(
      `${API_BASE}/api/parts?search=${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      console.error("Search failed:", await res.text());
      renderPartsTable([]);
      return;
    }

    const data = await res.json();

    allParts = data.map(p => ({
      ...p,
      total_qty: Number(p.total_qty ?? 0),
      locations: Array.isArray(p.locations) ? p.locations : []
    }));

    document.getElementById("parts-placeholder").style.display = "none";
    renderPartsTable(allParts);

  } catch (err) {
    console.error("Search error:", err);
    alert("Error searching parts");
  }
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  parts.forEach(p => {
    const tr = document.createElement("tr");

    // ✅ Build location display
    let locationDisplay = "—";
    if (Array.isArray(p.locations) && p.locations.length > 0) {
      locationDisplay = p.locations
        .map(loc =>
          `${loc.cabinet}.${loc.section}.${loc.bin} (${loc.qty})`
        )
        .join("<br>");
    }

    tr.innerHTML = `
      <td>${p.partnumber}</td>
      <td>${p.description}</td>
      <td>${p.manufacturer}</td>
      <td>${p.model}</td>
      <td>${p.total_qty}</td>
      <td>${locationDisplay}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary"
                ${p.total_qty === 0 ? "disabled" : ""}
                onclick="openIssueModal(${p.partid})">
          Issue
        </button>
        <button class="btn btn-sm btn-outline-success"
                onclick="openReceiveModal(${p.partid})">
          Receive
        </button>
        <button class="btn btn-sm btn-outline-secondary"
                onclick="openMoveModal(${p.partid})">
          Move
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}
/* ================= Issue Modal ================= */

function openIssueModal(partid) {
  selectedPart = allParts.find(
    p => Number(p.partid) === Number(partid)
  );
  if (!selectedPart) return;

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

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

/* ================= Assets ================= */

async function loadAssetsForIssue() {
  const select = document.getElementById("issue-asset");
  select.replaceChildren(
    Object.assign(document.createElement("option"), {
      value: "",
      textContent: "Select Asset"
    })
  );

  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    if (!res.ok) throw new Error("Failed to load assets");

    const assets = await res.json();

    assets.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.assetid;
      opt.textContent = `${a.assetnumber} – ${a.assetname}`;
      select.appendChild(opt);
    });
  } catch (err) {
    alert("Unable to load assets for issue");
    console.error(err);
  }
}

/* ================= Submit Issue ================= */

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

  } catch (err) {
    alert("Issue failed");
    console.error(err);
  }
}

/* ================= Receive Modal ================= */
window.openReceiveModal = function (partid) {
  const part = allParts.find(
    p => Number(p.partid) === Number(partid)
  );

  if (!part) {
    alert("Please search for a part before receiving.");
    return;
  }

  selectedPart = part;

  document.getElementById("receive-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  document.getElementById("receive-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
};


/* ================= Submit Receive ================= */
async function submitReceive() {
  if (!selectedPart || !Number.isInteger(Number(selectedPart.partid))) {
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

    if (!res.ok) {
      throw new Error(result.error || "Receive failed");
    }

    bootstrap.Modal
      .getInstance(document.getElementById("receiveModal"))
      .hide();

    runPartSearch();

  } catch (err) {
    alert(err.message);
    console.error("Receive error:", err);
  }
}

/* ================= Move Modal ================= */
window.openMoveModal = function (partid) {
  const part = allParts.find(p => Number(p.partid) === Number(partid));
  if (!part) {
    alert("Please search for a part first.");
    return;
  }

  selectedPart = part;

  document.getElementById("move-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  // FROM locations = where inventory exists
  const fromSelect = document.getElementById("move-from-location");
  fromSelect.replaceChildren();

  selectedPart.locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    fromSelect.appendChild(opt);
  });

  // TO locations = all available locations
  loadAllLocationsForMove();

  document.getElementById("move-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("moveModal"))
    .show();
};

/* ================= Load Locations ================= */
async function loadAllLocationsForMove() {
  const toSelect = document.getElementById("move-to-location");
  toSelect.replaceChildren();

  try {
    const res = await fetch(`${API_BASE}/api/locations`);
    if (!res.ok) throw new Error("Failed to load locations");

    const locations = await res.json();

    locations.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc.locationid;
      opt.textContent = `${loc.cabinet}.${loc.section}.${loc.bin}`;
      toSelect.appendChild(opt);
    });

  } catch (err) {
    alert("Unable to load locations");
    console.error(err);
  }
}

/* ================= Submit Move ================= */
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

    runPartSearch();

  } catch (err) {
    alert(err.message || "Move failed");
    console.error(err);
  }
}
/* ================= Parts history ================= */
async function loadPartsHistory() {
  const tbody = document.querySelector("#parts-history-table tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/history/parts`);
    if (!res.ok) throw new Error("Failed to load parts history");

    const rows = await res.json();

    rows.forEach(h => {
      const fromLoc = h.from_cabinet
        ? `${h.from_cabinet}.${h.from_section}.${h.from_bin}`
        : "—";

      const toLoc = h.to_cabinet
        ? `${h.to_cabinet}.${h.to_section}.${h.to_bin}`
        : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(h.transactiondate).toLocaleString()}</td>
        <td>${h.transactiontype}</td>
        <td>${h.partnumber}</td>
        <td>${h.description}</td>
        <td>${fromLoc}</td>
        <td>${toLoc}</td>
        <td>${h.qty}</td>
        <td>${h.performed_by}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    alert("Unable to load parts history");
    console.error(err);
  }
}    
/* ================= WO history ================= */
async function loadWOHistory() {
  // Placeholder for now
}

/* ================= Work Orders Module ================= */
async function loadWorkOrders() {
  const tbody = document.querySelector("#wo-table tbody");
  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/workorders`);
    if (!res.ok) throw new Error("Failed to load work orders");

    const rows = await res.json();

    rows.forEach(w => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${w.woid}</td>
        <td>${w.assetname ?? "—"}</td>
        <td>${w.description}</td>
        <td>${w.type}</td>
        <td>${w.priority}</td>
        <td>${w.status}</td>
        <td>${w.duedate ?? "—"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    alert("Unable to load work orders");
    console.error(err);
  }
}

/* ================= Work Orders Modal ================= */
window.openCreateWOModal = async function () {
  await loadWOAssets();
  await loadWOTypes();
  await loadWOPriorities();

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("createWOModal"))
    .show();
};

async function loadWOAssets() {
  const sel = document.getElementById("wo-asset");
  sel.innerHTML = "<option value=''>Select Asset</option>";

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
  sel.innerHTML = "<option value=''>Select Type</option>";

  const res = await fetch(`${API_BASE}//api/lookups?type=wotypes`);
  const types = await res.json();

  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    sel.appendChild(opt);
  });
}

async function loadWOPriorities() {
  const sel = document.getElementById("wo-priority");
  sel.innerHTML = "<option value=''>Select Priority</option>";

  const res = await fetch(`${API_BASE}/api/lookups?type=wopriorities`);
  const prios = await res.json();

  prios.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}


async function submitWorkOrder() {
  const assetid = document.getElementById("wo-asset").value;
  const description = document.getElementById("wo-description").value;
  const wotype = document.getElementById("wo-type").value;
  const priority = document.getElementById("wo-priority").value;
  const duedate = document.getElementById("wo-due").value || null;

  try {
    const res = await fetch(`${API_BASE}/api/workorders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetid,
        description,
        wotype,
        priority,
        duedate
      })
    });

    if (!res.ok) throw new Error("Create failed");

    bootstrap.Modal
      .getInstance(document.getElementById("createWOModal"))
      .hide();

    loadWorkOrders();

  } catch (err) {
    alert("Failed to create work order");
    console.error(err);
  }
}
