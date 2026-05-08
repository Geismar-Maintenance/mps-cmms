
/* ======================================================
   INVENTORY MODULE (FRONTEND)
   ------------------------------------------------------
   Responsibilities:
   - Issue inventory
   - Receive inventory
   - Move inventory
   - Open inventory-related modals
   - Call inventory backend endpoints

   Depends on:
   - allParts[] populated by parts.js
   ====================================================== */
window.selectedPart = null;

/* ======================================================
   INVENTORY OPERATIONS (ISSUE / RECEIVE / MOVE)
   ====================================================== */
window.applyInventoryDashboardFilters = function () {
  const filters = window.currentModuleFilters || {};
  if (!filters.stock) return;

  let filtered = [...allParts];

  if (filters.stock === 'out') {
    filtered = filtered.filter(p => Number(p.total_qty ?? 0) === 0);
  }

  if (filters.stock === 'low') {
    filtered = filtered.filter(p =>
      Number(p.total_qty ?? 0) > 0 &&
      Number(p.total_qty) <= Number(p.reorderlevel ?? 0)
    );
  }

  renderPartsTable(filtered);
};

/* ---------- ISSUE ---------- */
window.openIssueModal = async function (partid) {

  selectedPart = await getSelectedPart(partid);

  if (!selectedPart) {
    alert("Part data not available");
    return;
  }

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  const locSelect = document.getElementById("issue-location");
  locSelect.replaceChildren();

  if (!selectedPart.locations || !selectedPart.locations.length) {
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
};

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
    const res = await fetch(`${API_BASE}/api/transactions`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

body: JSON.stringify({
  type: "issue",
  partid: selectedPart.partid,
  from_locationid: locationid,
  qty,
  assetid,
  workorder,

        performed_by: window.currentUser.display_name
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
window.openReceiveModal = async function (partid) {

  selectedPart = await getSelectedPart(partid);

  if (!selectedPart) {
    alert("Part data not available");
    return;
  }

  document.getElementById("receive-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  document.getElementById("receive-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
};

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
    const res = await fetch(`${API_BASE}/api/transactions`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

body: JSON.stringify({
  type: "receive",
  partid: Number(selectedPart.partid),
  qty,

        performed_by: window.currentUser.display_name
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
window.openMoveModal = async function (partid) {

  selectedPart = await getSelectedPart(partid);

  if (!selectedPart) {
    alert("Part data not available");
    return;
  }

  document.getElementById("move-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  const fromSelect = document.getElementById("move-from-location");
  fromSelect.replaceChildren();

  const locations = selectedPart.locations || [];

  if (!locations.length) {
    alert("No inventory available");
    return;
  }

  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    fromSelect.appendChild(opt);
  });

  loadMoveDestinationLocations();
  document.getElementById("move-qty").value = "";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("moveModal"))
    .show();
};


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
    const res = await fetch(`${API_BASE}/api/transactions`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },

body: JSON.stringify({
  type: "move",
  partid: selectedPart.partid,
  from_locationid,
  to_locationid,
  qty,

        performed_by: window.currentUser.display_name
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
/* ---------- CYCLE COUNT ---------- */

window.openCycleCountModal = async function (partid) {

  selectedPart = await getSelectedPart(partid);

  if (!selectedPart) {
    alert("Part data not available");
    return;
  }

  document.getElementById("cycle-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model ?? ""})`;

  const locSelect = document.getElementById("cycle-location");
  locSelect.replaceChildren();

  if (!selectedPart.locations || !selectedPart.locations.length) {
    alert("No inventory available");
    return;
  }

  selectedPart.locations.forEach(loc => {
  const opt = document.createElement("option");
    
  const id =
   loc.locationid ??
   loc.location_id ??
   loc.id;
   opt.value = id;

   opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin}`;

   opt.dataset.qty = loc.qty;

    locSelect.appendChild(opt);
  });
   
if (locSelect.options.length > 0) {
  locSelect.selectedIndex = 0;
}

  locSelect.onchange = function () {
    const selected = locSelect.selectedOptions[0];
    document.getElementById("cycle-system-qty").value =
      selected.dataset.qty;
  };

  locSelect.dispatchEvent(new Event("change"));
 
const systemQty =
  document.getElementById("cycle-system-qty").value;

document.getElementById("cycle-actual-qty").value = systemQty;


  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("cycleCountModal"))
    .show();
};

async function submitCycleCount() {
  if (!selectedPart) {
    alert("No part selected");
    return;
  }

  const select = document.getElementById("cycle-location");
const selected = select.selectedOptions[0];

if (!selected) {
  alert("No location selected");
  return;
}

const locationid = Number(selected.value);

  const input = document.getElementById("cycle-actual-qty").value.trim();

    if (input === "") {
    alert("Enter a quantity");
    return;
  }

  const actualQty = Number(input);

  if (!locationid || isNaN(actualQty) || actualQty < 0) {
    alert("Enter a valid quantity");
    return;
  }

  try {

    const res = await fetch(`${API_BASE}/api/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "cycle_count",
        partid: selectedPart.partid,
        locationid,
        qty: actualQty,
        performed_by: window.currentUser.display_name
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    bootstrap.Modal
      .getInstance(document.getElementById("cycleCountModal"))
      .hide();

    refreshPartsTable();

  } catch (err) {
    alert(err.message || "Cycle count failed");
    console.error(err);
  }
}


/* ---------- SUPPORT ---------- */
async function loadAssetsForIssue() {
  const select = document.getElementById("issue-asset");
  select.replaceChildren(
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
    select.appendChild(opt);
  });
}

async function loadMoveDestinationLocations() {

  const res = await fetch(`${API_BASE}/api/locations?type=move_dest&partid=${selectedPart.partid}`);
  const locations = await res.json();

  const toSelect = document.getElementById("move-to-location");
  toSelect.replaceChildren();

  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent = `${loc.cabinet}.${loc.section}.${loc.bin}`;
    toSelect.appendChild(opt);
  });
}

async function loadAllLocationsForMove() {
  const toSelect = document.getElementById("move-to-location");
  toSelect.replaceChildren();

  const res = await fetch(`${API_BASE}/api/locations`);
  const locations = await res.json();

  locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent = `${loc.cabinet}.${loc.section}.${loc.bin}`;
    toSelect.appendChild(opt);
  });
}
window.refreshPartsTable = async function () {
  try {
    const res = await fetch(`${API_BASE}/api/parts`);
    const parts = await res.json();

    allParts = parts;          // update your global data
    renderPartsTable(parts);   // re-render UI

  } catch (err) {
    console.error("Failed to refresh parts table", err);
  }
};
async function getSelectedPart(partid) {

  // ✅ Case 1: coming from Part Detail (already have full data)
  if (
    window.currentPartData &&
    window.currentPartData.part &&
    window.currentPartData.part.partid == partid
  ) {
    return {
      ...window.currentPartData.part,
      locations: window.currentPartData.locations
    };
  }

  // ✅ Case 2: coming from Parts table → fetch full data
  try {
    const res = await fetch(`${API_BASE}/api/parts?partId=${partid}`);

    if (!res.ok) {
      console.error("Failed to fetch part");
      return null;
    }

    const data = await res.json();

    return {
      ...data.part,
      locations: data.locations
    };

  } catch (err) {
    console.error("getSelectedPart error:", err);
    return null;
  }
}

