
/* ======================================================
   PARTS MODULE (FRONTEND)
   ------------------------------------------------------
   Responsibilities:
   - Search parts
   - Render parts table
   - Dispatch inventory actions (Issue / Receive / Move)

   Does NOT:
   - Perform inventory mutations
   - Manage modals directly

   Inventory actions are handled by inventory.js
   ====================================================== */


let allParts = [];
let selectedPart = null;
let lastPartSearch = "";

let currentSort = {
  column: null,
  direction: "asc"
};


/* ---------- Entry ---------- */

window.loadParts = function () {
  const filter = window.currentModuleFilters?.inventoryFilter;

  console.log("loadParts called, inventoryFilter =", filter);

  const validFilters = ["all", "in", "low", "out", "receiving"];

  const resolvedFilter = validFilters.includes(filter) ? filter : "all";

  window.loadInventoryFilteredParts(resolvedFilter);
};


/* ---------- Filtered Inventory ---------- */
function setInventoryFilter(type) {
  window.currentModuleFilters = {
    inventoryFilter: type
  };

  document.getElementById("part-search").value = ""; // 🔥 important

  window.loadInventoryFilteredParts(type);
}

window.loadInventoryFilteredParts = async function (type) {
  console.log("✅ loadInventoryFilteredParts called with:", type);

  let url = `${API_BASE}/api/parts`;

  const params = new URLSearchParams();

  if (type && type !== "all") {
    params.append("inventory", type);
  }

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    console.error("Failed to load inventory filter:", type);
    return;
  }

  const data = await res.json();

  window.currentParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  document.getElementById("parts-placeholder")
    ?.style.setProperty("display", "none");

  renderPartsTable(window.currentParts);
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

   window.currentModuleFilters = {
  inventoryFilter: null,
  mode: "search"
};

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

 window.currentParts = data.map(p => ({
    ...p,
    total_qty: Number(p.total_qty ?? 0),
    locations: Array.isArray(p.locations) ? p.locations : []
  }));

  document.getElementById("parts-placeholder")?.style.setProperty("display", "none");
  renderPartsTable(window.currentParts);
}

/* ---------- Rendering ---------- */
function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  if (!tbody) return;

  // ✅ APPLY SORTING
  if (currentSort.column) {
    parts = [...parts].sort((a, b) => {
      let valA = a[currentSort.column];
      let valB = b[currentSort.column];

      valA = valA ?? "";
      valB = valB ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

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
          onclick="openPartDetail(${p.partid})">
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
window.openPartDetail = async function (partId) {

  window.currentPartId = partId;

  const res = await fetch(`${API_BASE}/api/parts?partId=${partId}`);
  if (!res.ok) {
    alert("Failed to load part details");
    return;
  }

  const data = await res.json();
  
window.currentPartData = data;
renderPartDetails(data);

};


function renderPartDetails(data) {

  // ✅ basic info
  document.getElementById("part-detail-number").innerText =
    data.part.partnumber;

  document.getElementById("part-detail-desc").innerText =
    data.part.description;

  document.getElementById("part-detail-mfg").innerText =
    data.part.manufacturer ?? "—";

  document.getElementById("part-detail-model").innerText =
    data.part.model ?? "—";

  // ✅ locations
  const locTable = document.getElementById("part-detail-locations");
  locTable.innerHTML = "";

  if (data.locations.length === 0) {
    locTable.innerHTML =
      `<tr><td colspan="2" class="text-muted">No inventory on hand.</td></tr>`;
  } else {
    data.locations.forEach(l => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${l.cabinet}.${l.section}.${l.bin}</td>
        <td>${l.qty}</td>
      `;

      locTable.appendChild(tr);
    });
  }

  // ✅ total qty
  const total = data.locations.reduce((sum, l) => sum + Number(l.qty), 0);
  document.getElementById("part-detail-qty").innerText = total;

  // ✅ history
  const historyDiv = document.getElementById("part-detail-history");

  if (!historyDiv) return;

  if (data.history.length === 0) {
    historyDiv.innerHTML =
      `<div class="text-muted">No transactions.</div>`;
  } else {
    historyDiv.innerHTML = data.history.map(h => `
      <div>
        ${new Date(h.transactiondate).toLocaleString()}
        — ${h.transactiontype} ${h.qty}
      </div>
    `).join("");
  }

  // ✅ SHOW MODAL
  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("partDetailModal"))
    .show();
}

function closePartDetails() {
  const panel = document.getElementById("part-detail-panel");
  if (panel) panel.style.display = "none";
}

window.sortParts = function (column) {
  console.log("Sorting by:", column);

  if (currentSort.column === column) {
    // toggle direction
    currentSort.direction =
      currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    // new column sort
    currentSort.column = column;
    currentSort.direction = "asc";
  }

  renderPartsTable(window.currentParts);
};

