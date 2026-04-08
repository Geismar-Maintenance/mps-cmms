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
  try {
    const res = await fetch(`${API_BASE}/api/parts`);

    // Only treat real HTTP errors as failures
    if (!res.ok) {
      throw new Error(`Failed to load parts (${res.status})`);
    }

    const data = await res.json();

    // Normalize data defensively
    allParts = data.map(p => ({
      ...p,
      total_qty: Number(p.total_qty ?? 0),
      locations: Array.isArray(p.locations) ? p.locations : []
    }));

    console.log("Parts loaded:", allParts);

    renderPartsTable(allParts);
  } catch (err) {
    console.error("loadParts failed:", err);
    alert(`Unable to load parts: ${err.message}`);
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
      </tr>`;
  });
}

/* =====================================================
   ISSUE PART
===================================================== */

function openIssueModal(partid) {
  selectedPart = allParts.find(p => p.partid === partid);
  if (!selectedPart) return;

  const modalEl = document.getElementById("issueModal");
  if (!modalEl) {
    alert("Issue modal not available");
    return;
  }

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  // Populate locations
  const locSelect = document.getElementById("issue-location");
  locSelect.innerHTML = "";

  if (!Array.isArray(selectedPart.locations) ||
      selectedPart.locations.length === 0) {
    alert("No inventory available for this part");
    return;
  }

  selectedPart.locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    locSelect.appendChild(opt);
  });

  // Load assets (required)
  loadAssetsForIssue();

  // Reset fields
  document.getElementById("issue-qty").value = "";
  document.getElementById("issue-wo").value = "";

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
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
    const res = await fetch(`${API_BASE}/api/parts/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        from_locationid: locationid,
        qty,
        assetid: workOrder || null,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    loadParts(); // refresh inventory
    bootstrap.Modal.getInstance(
      document.getElementById("issueModal")
    ).hide();

  } catch (err) {
    alert("Issue failed: " + err.message);
  }
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
