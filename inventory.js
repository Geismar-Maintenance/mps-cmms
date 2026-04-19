/* ======================================================
   INVENTORY OPERATIONS (ISSUE / RECEIVE / MOVE)
   ====================================================== */
function applyInventoryDashboardFilters() {
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

  // ✅ Clear dashboard context after first use
  window.currentModuleFilters = null;
}

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
``
