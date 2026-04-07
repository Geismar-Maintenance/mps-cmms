/* =====================================================
   CONFIG
===================================================== */

const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* =====================================================
   GLOBAL STATE
===================================================== */

let allParts = [];
let selectedPart = null;

/* =====================================================
   INIT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  hideAllModules();
  showModule("dashboard");
});

/* =====================================================
   NAVIGATION (SOLID & SAFE)
===================================================== */

function setupNavigation() {
  const links = document.querySelectorAll("#module-nav .nav-link");

  links.forEach(link => {
    link.addEventListener("click", () => {
      const moduleName = link.dataset.module;
      hideAllModules();
      setActiveNav(link);
      showModule(moduleName);

      if (moduleName === "parts") {
        loadParts();
      }
    });
  });
}

function hideAllModules() {
  document.querySelectorAll(".module").forEach(m => {
    m.classList.remove("active");
  });
}

function showModule(name) {
  const section = document.getElementById(`module-${name}`);
  if (!section) {
    console.error("Module not found:", name);
    return;
  }
  section.classList.add("active");
}

function setActiveNav(activeLink) {
  document.querySelectorAll("#module-nav .nav-link").forEach(l => {
    l.classList.remove("active");
  });
  activeLink.classList.add("active");
}

/* =====================================================
   PARTS (SAFE LOADER)
===================================================== */

async function loadParts() {
  try {
    const res = await fetch(`${API_BASE}/api/parts`);
    if (!res.ok) throw new Error("Failed to load parts");

    const data = await res.json();
    allParts = data;
    renderPartsTable(data);
  } catch (err) {
    console.error(err);
    alert("Error loading parts");
  }
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(parts) || parts.length === 0) {
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
  <button
    class="btn btn-sm btn-outline-primary"
    onclick="openIssueModal(${p.partid})">
    Issue
  </button>
  <button
    class="btn btn-sm btn-outline-success"
    onclick="openReceiveModal(${p.partid})">
    Receive
  </button>
  <button
    class="btn btn-sm btn-outline-secondary"
    onclick="openMoveModal(${p.partid})">
    Move
  </button>
</td>
      </tr>
    `;
  });
}

/* =====================================================
   SEARCH (SAFE)
===================================================== */

document.addEventListener("input", event => {
  if (event.target.id !== "part-search") return;

  const q = event.target.value.toLowerCase();
  const filtered = allParts.filter(p =>
    p.partnumber.toLowerCase().includes(q) ||
    p.manufacturer.toLowerCase().includes(q) ||
    p.model.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );

  renderPartsTable(filtered);
});
