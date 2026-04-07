const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentModule = "dashboard";
let allParts = [];
let selectedPart = null;

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  switchModule("dashboard", document.querySelector("#module-nav .nav-link"));
  initPartsModule();
});

/* =========================================================
   MODULE NAVIGATION
   ========================================================= */

function switchModule(moduleName, el) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(section => {
    section.classList.remove("active");
  });

  // Show selected module
  const active = document.getElementById("module-" + moduleName);
  if (active) {
    active.classList.add("active");
  }

  // Update nav
  document.querySelectorAll("#module-nav .nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (el) {
    el.classList.add("active");
  }

  currentModule = moduleName;

  // Module hooks
  if (moduleName === "parts") {
    loadParts();
  }
}

/* =========================================================
   PARTS MODULE
   ========================================================= */

function initPartsModule() {
  const search = document.getElementById("part-search");
  if (search) {
    search.addEventListener("input", handlePartSearch);
  }
}

async function loadParts() {
  try {
    const res = await fetch(`${API_BASE}/api/parts`);
    if (!res.ok) {
      throw new Error("Failed to load parts");
    }

    const data = await res.json();
    allParts = data;
    renderPartsTable(allParts);
  } catch (err) {
    console.error(err);
    alert("Error loading parts");
  }
}

function handlePartSearch(e) {
  const q = e.target.value.toLowerCase().trim();

  const filtered = allParts.filter(p =>
    p.partnumber.toLowerCase().includes(q) ||
    p.manufacturer.toLowerCase().includes(q) ||
    p.model.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );

  renderPartsTable(filtered);
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  if (parts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No parts found
        </td>
      </tr>
    `;
    return;
  }

  parts.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.partnumber}</td>
        <td>${p.description}</td>
        <td>${p.manufacturer}</td>
        <td>${p.model}</td>
        <td>${p.total_qty}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary"
            onclick="openIssueModal(${p.partid})">
            Issue
          </button>
          <button class="btn btn-sm btn-outline-success"
            onclick="openReceiveModal(${p.partid})">
            Receive
          </button>
        </td>
      </tr>
    `;
  });
}

/* =========================================================
   ISSUE PART
   ========================================================= */

function openIssueModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart) return;

  document.getElementById("issue-partname").innerText =
    selectedPart.partnumber + " (" + selectedPart.model + ")";

  const select = document.getElementById("issue-location");
  select.innerHTML = "";

  selectedPart.locations.forEach(loc => {
    select.innerHTML += `
      <option value="${loc.locationid}">
        ${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})
      </option>
    `;
  });

  document.getElementById("issue-qty").value = "";
  document.getElementById("issue-wo").value = "";

  new bootstrap.Modal(document.getElementById("issueModal")).show();
}

async function submitIssue() {
  const locationid = document.getElementById("issue-location").value;
  const qty = Number(document.getElementById("issue-qty").value);
  const workOrder = document.getElementById("issue-wo").value;

  if (!locationid || qty <= 0) {
    alert("Invalid issue quantity or location");
    return;
  }

  try {
    const res = await fetch("/api/parts/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        from_locationid: locationid,
        qty: qty,
        assetid: workOrder,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    loadParts();
    bootstrap.Modal.getInstance(document.getElementById("issueModal")).hide();
  } catch (err) {
    alert(err.message);
  }
}

/* =========================================================
   RECEIVE PART
   ========================================================= */

function openReceiveModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart) return;

  document.getElementById("receive-partname").innerText =
    selectedPart.partnumber + " (" + selectedPart.model + ")";

  document.getElementById("rec-cabinet").value = "";
  document.getElementById("rec-section").value = "";
  document.getElementById("rec-bin").value = "";
  document.getElementById("rec-qty").value = "";

  new bootstrap.Modal(document.getElementById("receiveModal")).show();
}

async function submitReceive() {
  const qty = Number(document.getElementById("rec-qty").value);

  if (qty <= 0) {
    alert("Invalid receive quantity");
    return;
  }

  try {
    const res = await fetch("/api/parts/receive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        cabinet: document.getElementById("rec-cabinet").value,
        section: document.getElementById("rec-section").value,
        bin: document.getElementById("rec-bin").value,
        qty: qty,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    loadParts();
    bootstrap.Modal.getInstance(document.getElementById("receiveModal")).hide();
  } catch (err) {
    alert(err.message);
  }
}
/* =========================================================
   Move PART
   ========================================================= */
function openMoveModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart) return;

  document.getElementById("move-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  const fromSelect = document.getElementById("move-from-location");
  fromSelect.innerHTML = "";

  selectedPart.locations.forEach(loc => {
    fromSelect.innerHTML += `
      <option value="${loc.locationid}">
        ${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})
      </option>
    `;
  });

  document.getElementById("move-qty").value = "";
  document.getElementById("move-to-cabinet").value = "";
  document.getElementById("move-to-section").value = "";
  document.getElementById("move-to-bin").value = "";

  new bootstrap.Modal(document.getElementById("moveModal")).show();
}
}
