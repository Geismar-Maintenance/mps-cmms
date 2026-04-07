const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* =====================================================
   GLOBAL STATE
===================================================== */

let currentModule = "dashboard";
let allParts = [];
let selectedPart = null;

/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  switchModule("dashboard", document.querySelector("#module-nav .nav-link"));
  initPartsModule();
});

/* =====================================================
   MODULE NAVIGATION (SAFE)
===================================================== */

function switchModule(moduleName, clickedLink) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(section => {
    section.classList.remove("active");
  });

  // Show selected module
  const active = document.getElementById("module-" + moduleName);
  if (active) {
    active.classList.add("active");
  }

  // Update nav state
  document.querySelectorAll("#module-nav .nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (clickedLink) {
    clickedLink.classList.add("active");
  }

  currentModule = moduleName;

  // Load parts ONLY after navigation succeeds
  if (moduleName === "parts") {
    try {
      loadParts();
    } catch (e) {
      console.warn("Parts load failed but navigation preserved", e);
    }
  }
}

/* =====================================================
   PARTS MODULE
===================================================== */

function initPartsModule() {
  const search = document.getElementById("part-search");
  if (search) {
    search.addEventListener("input", handlePartSearch);
  }
}

async function loadParts() {
  const res = await fetch(`${API_BASE}/api/parts`);
  if (!res.ok) {
    throw new Error("Failed to load parts");
  }

  const data = await res.json();
  allParts = data;
  renderPartsTable(allParts);
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

  if (!parts || parts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">
          No parts found
        </td>
      </tr>`;
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
            onclick="openIssueModal(${p.partid})">Issue</button>
          <button class="btn btn-sm btn-outline-success"
            onclick="openReceiveModal(${p.partid})">Receive</button>
          <button class="btn btn-sm btn-outline-secondary"
            onclick="openMoveModal(${p.partid})">Move</button>
        </td>
      </tr>`;
  });
}

/* =====================================================
   ISSUE PART
===================================================== */

function openIssueModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart || !selectedPart.locations) return;

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  const select = document.getElementById("issue-location");
  select.innerHTML = "";

  selectedPart.locations.forEach(loc => {
    select.innerHTML += `
      <option value="${loc.locationid}">
        ${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})
      </option>`;
  });

  document.getElementById("issue-qty").value = "";
  document.getElementById("issue-wo").value = "";

  new bootstrap.Modal(document.getElementById("issueModal")).show();
}

async function submitIssue() {
  alert("Issue logic re-enabled later");
}

/* =====================================================
   RECEIVE PART
===================================================== */

function openReceiveModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart) return;

  document.getElementById("receive-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  document.getElementById("rec-cabinet").value = "";
  document.getElementById("rec-section").value = "";
  document.getElementById("rec-bin").value = "";
  document.getElementById("rec-qty").value = "";

  new bootstrap.Modal(document.getElementById("receiveModal")).show();
}

async function submitReceive() {
  alert("Receive logic re-enabled later");
}

/* =====================================================
   MOVE PART
===================================================== */

function openMoveModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart || !selectedPart.locations) return;

  document.getElementById("move-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  const fromSelect = document.getElementById("move-from-location");
  fromSelect.innerHTML = "";

  selectedPart.locations.forEach(loc => {
    fromSelect.innerHTML += `
      <option value="${loc.locationid}">
        ${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})
      </option>`;
  });

  document.getElementById("move-qty").value = "";
  document.getElementById("move-to-cabinet").value = "";
  document.getElementById("move-to-section").value = "";
  document.getElementById("move-to-bin").value = "";

  new bootstrap.Modal(document.getElementById("moveModal")).show();
}

async function submitMove() {
  alert("Move logic re-enabled later");
}
