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
function loadParts() {
  // Baseline behavior: show nothing until search
  renderPartsTable([]);
}

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

function closePartDetails() {
  const panel = document.getElementById("part-detail-panel");
  if (panel) panel.style.display = "none";
}


