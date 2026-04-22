/* ======================================================
   PARTS MODULE (FRONTEND)
   Baseline behavior:
   - Do nothing on entry
   - Wait for search + Enter
   ====================================================== */

let allParts = [];
let selectedPart = null;
let lastPartSearch = "";

/* ---------- Entry ---------- */

window.loadParts = function () {
  const filter = window.currentModuleFilters?.inventoryFilter;
  console.log("loadParts called, inventoryFilter =", filter);

  if (!filter) {
    renderPartsTable([]);
    return;
  }

  loadInventoryFilteredParts(filter);
}


/* ---------- Filtered Inventory ---------- */

window.loadInventoryFilteredParts = async function (type) {
  console.log("✅ loadInventoryFilteredParts called with:", type);

  const res = await fetch(`${API_BASE}/api/parts?inventory=${type}`);
  if (!res.ok) {
    console.error("Failed to load inventory filter:", type);
    return;
  }

  const data = await res.json();
  console.log("📦 inventory filter response:", data);

  allParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  // ✅ THIS WAS MISSING
  document.getElementById("parts-placeholder")
    ?.style.setProperty("display", "none");

  renderPartsTable(allParts);
};


/* ---------- Search ---------- */
document.getElementById("part-search")?.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    runPartSearch();
  }
});

async function runPartSearch() {
  const input = document.getElementById("part-search");
  const query = input.value.trim();

  if (query.length < 2) {
    renderPartsTable([]);
    return;
  }

  lastPartSearch = query;

  const res = await fetch(
    `${API_BASE}/api/parts?search=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    console.error("Failed to search parts");
    return;
  }

  const data = await res.json();

  allParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  document.getElementById("parts-placeholder")?.style.setProperty("display", "none");
  renderPartsTable(allParts);
}

/* ---------- Rendering ---------- */
function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  parts.forEach(p => {
    const tr = document.createElement("tr");

    const locationDisplay =
      p.locations.length > 0
        ? p.locations
            .map(loc =>
              `${loc.cabinet}.${loc.section}.${loc.bin} (${loc.qty})`
            )
            .join("<br>")
        : "—";

    tr.innerHTML = `

<td class="text-primary"
    style="cursor:pointer"
    onclick="loadPartDetails(${p.partid})">
  ${p.partnumber}
</td>
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

window.loadPartDetails = async function (partId) {
  const res = await fetch(`${API_BASE}/api/parts?partId=${partId}`);
  if (!res.ok) {
    alert("Failed to load part details");
    return;
  }

  const data = await res.json();
  console.log("PART DETAILS RESPONSE:", data);
   renderPartDetails(data);
};

function renderPartDetails(data) {
  const panel = document.getElementById("part-detail-panel");
  console.log("DETAIL PANEL:", panel);

  if (!panel) return;

  panel.style.display = "block";

  panel.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5>${data.part.partnumber}</h5>
      <button class="btn btn-sm btn-outline-secondary"
              onclick="closePartDetails()">Back to Parts</button>
    </div>

    <div class="mb-2">${data.part.description}</div>

    <div class="text-muted mb-3">
      ${data.part.manufacturer ?? "—"} | ${data.part.model ?? "—"}
    </div>

    <hr>

    <h6>Locations</h6>
    ${
      data.locations.length === 0
        ? `<div class="text-muted">No inventory on hand.</div>`
        : data.locations.map(l => `
            <div>
              ${l.cabinet}.${l.section}.${l.bin} — ${l.qty}
            </div>
          `).join("")
    }

    <hr>

    <h6>History</h6>
    ${
      data.history.length === 0
        ? `<div class="text-muted">No transactions.</div>`
        : data.history.map(h => `
            <div>
              ${new Date(h.transactiondate).toLocaleString()}
              — ${h.transactiontype} ${h.qty}
            </div>
          `).join("")
    }
  `;
}
//=========CYCLE COUNT===========//
let ccContext = {};

function openCycleCount(part) {
  ccContext = part;

  document.getElementById("cc-partnumber").textContent = part.partnumber;
  document.getElementById("cc-confirm-partnumber").textContent = part.partnumber;
  document.getElementById("cc-location").textContent = part.location_label;
  document.getElementById("cc-system-qty").textContent = part.qty;

  document.getElementById("cc-confirm-part").checked = false;
  document.getElementById("cc-actual-qty").value = "";
  document.getElementById("cc-delta").textContent = "0";
  document.getElementById("cc-actual-qty").disabled = true;
  document.getElementById("cc-submit").disabled = true;

  new bootstrap.Modal(document.getElementById("cycleCountModal")).show();
}

function toggleCycleCountInputs() {
  const confirmed = document.getElementById("cc-confirm-part").checked;
  document.getElementById("cc-actual-qty").disabled = !confirmed;
}

function updateCycleDelta() {
  const actual = Number(document.getElementById("cc-actual-qty").value);
  const system = Number(ccContext.qty);
  const delta = actual - system;

  document.getElementById("cc-delta").textContent =
    delta > 0 ? `+${delta}` : delta;

  document.getElementById("cc-submit").disabled = actual < 0;
}

async function submitCycleCount() {
  const actual_qty = Number(document.getElementById("cc-actual-qty").value);

  await fetch(`${API_BASE}/api/parts?action=cycleCount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partid: ccContext.partid,
      locationid: ccContext.locationid,
      actual_qty,
      performed_by_userid: currentUser.userid
    })
  });

  bootstrap.Modal.getInstance(
    document.getElementById("cycleCountModal")
  ).hide();

  loadParts(); // refresh inventory
}
function closePartDetails() {
  const panel = document.getElementById("part-detail-panel");
  if (panel) panel.style.display = "none";
}


