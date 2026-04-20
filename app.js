const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let allParts = [];
let allWorkOrders = [];
let selectedPart = null;
let lastPartSearch = "";
let postReceiveAction = null;
let partsEntryMode = "sidebar"; // 'sidebar' | 'dashboard

window.loadModule = function (moduleName, filters = {}) {
    // Store filters globally so target module can read them
  window.currentModuleFilters = filters;
   // Switch visible module
  switchModule(moduleName);
};

window.goToWorkOrders = function (filter) {
  switch (filter) {
    case 'open':
      loadModule('workorders', { status: 'open' });
      break;
    case 'overdue':
      loadModule('workorders', { status: 'open', due: 'overdue' });
      break;
    case 'week':
      loadModule('workorders', { status: 'open', due: 'this_week' });
      break;
    default:
      loadModule('workorders');
  }
};

/* ======================================================
   NAVIGATION
   ====================================================== */
window.switchModule = function (moduleName, el) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(m => {
    m.classList.remove("active");
    m.style.display = "none";
  });

   
  // Show target module
  const target = document.getElementById(`module-${moduleName}`);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }
  
  // Update nav UI
   document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );
  if (el) el.classList.add("active");

  // Module-specific loading
  if (moduleName === "dashboard") loadDashboard();
  if (moduleName === "parts-history") loadPartsHistory();
  if (moduleName === "wo-history") loadWOHistory();
  if (moduleName === "workorders") loadWorkOrders();
   if (moduleName === "pm") loadPMView();  
  if (moduleName === 'pm-management') loadPMManagement();
   if (moduleName === "parts") loadParts();
};


/* ======================================================
   ADMIN – ADD MASTER PART ONLY
   ====================================================== */
window.openAddPartModal = function () {
  document.getElementById("addPartForm").reset();
  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("addPartModal")
  ).show();
};

async function submitAddPart(event) {
  event.preventDefault();

  const btn = document.getElementById("btnSubmitNewPart");
  btn.disabled = true;

  const payload = {
    partnumber: document.getElementById("adminPartNumber").value.trim(),
    description: document.getElementById("adminDescription").value.trim(),
    manufacturer: document.getElementById("adminManufacturer").value.trim(),
    model: document.getElementById("adminModel").value.trim(),
    cost: document.getElementById("adminCost").value,
    reorderlevel: document.getElementById("adminReorder").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/parts?admin=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    // Close Add Part modal
    bootstrap.Modal.getInstance(
      document.getElementById("addPartModal")
    ).hide();

    const newPartId = result.partid;

    // Prompt to receive inventory
    setTimeout(() => {
      if (confirm("Part created. Would you like to receive inventory now?")) {
        openReceiveFromAdmin(newPartId);
      }
    }, 300);

  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

/* ======================================================
   ADMIN‑GUIDED INVENTORY HELPERS
   ====================================================== */

function openReceiveFromAdmin(partid) {
  // Set selectedPart context
  selectedPart = {
    partid,
    partnumber: document.getElementById("adminPartNumber").value,
    model: ""
  };

  document.getElementById("receive-partname").innerText =
    selectedPart.partnumber;

  document.getElementById("receive-qty").value = "";

  // ✅ Define one‑time post‑receive behavior
  postReceiveAction = () => {
    setTimeout(() => {
      if (confirm("Inventory received. Would you like to move it to a storage location now?")) {
        openMoveModal(partid);
      }
    }, 300);
  };

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
}


/* ======================================================
   HISTORY (READ‑ONLY)
   ====================================================== */
async function loadPartsHistory() {
   const tbody = document.querySelector("#parts-history-table tbody");
  tbody.innerHTML = "";

  const res = await fetch(`${API_BASE}/api/parts?history=true`);
  if (!res.ok) return;

  const rows = await res.json();
  rows.forEach(h => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(h.transactiondate).toLocaleString()}</td>
      <td>${h.transactiontype}</td>
      <td>${h.partnumber}</td>
      <td>${h.description}</td>
      <td>${h.from_cabinet ? `${h.from_cabinet}.${h.from_section}.${h.from_bin}` : "—"}</td>
      <td>${h.to_cabinet ? `${h.to_cabinet}.${h.to_section}.${h.to_bin}` : "—"}</td>
      <td>${h.qty}</td>
      <td>${h.performed_by}</td>
    `;
    tbody.appendChild(tr);
  });
}


/* ======================================================
   APP INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
