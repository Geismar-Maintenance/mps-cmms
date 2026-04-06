/*************************************************
 * CONFIG
 *************************************************/
const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app/api";

/*************************************************
 * ENTRY POINT
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  loadParts();
});

/*************************************************
 * MODULE LOADERS
 *************************************************/
async function loadParts() {
  setTitle("Parts Inventory");
  setLoading();

  try {
    const res = await fetch(`${API_BASE}/parts`);
    if (!res.ok) throw new Error("Failed to load parts");

    const data = await res.json();
    renderPartsTable(data);
  } catch (err) {
    showError(err.message);
  }
}

/*************************************************
 * RENDERING
 *************************************************/
function renderPartsTable(parts) {
  if (!parts.length) {
    document.getElementById("table-container").innerHTML =
      "<div class='text-muted'>No parts found.</div>";
    return;
  }

  let html = `
    <table class="table table-bordered table-hover table-sm align-middle">
      <thead>
        <tr>
          <th>ID</th>
          <th>Part #</th>
          <th>Description</th>
          <th>Manufacturer</th>
          <th>Model</th>
          <th>Cost</th>
          <th>Reorder Level</th>
        </tr>
      </thead>
      <tbody>
  `;

  parts.forEach(p => {
    const lowStockClass =
      p.reorderlevel !== null && p.reorderlevel > 0
        ? "table-warning"
        : "";

    html += `
      <tr class="${lowStockClass}">
        <td>${p.partid}</td>
        <td>${escapeHtml(p.partnumber)}</td>
        <td>${escapeHtml(p.description)}</td>
        <td>${escapeHtml(p.manufacturer)}</td>
        <td>${escapeHtml(p.model)}</td>
        <td>$${Number(p.cost).toFixed(2)}</td>
        <td>${p.reorderlevel ?? "-"}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  document.getElementById("table-container").innerHTML = html;
}

/*************************************************
 * UI HELPERS
 *************************************************/
function setLoading() {
  document.getElementById("table-container").innerHTML =
    "<div class='text-muted'>Loading data…</div>";
}

function showError(message) {
  document.getElementById("table-container").innerHTML = `
    <div class="alert alert-danger">
      ${message}
    </div>
  `;
}

function setTitle(title) {
  document.getElementById("module-title").innerText = title;
}

/*************************************************
 * SECURITY
 *************************************************/
function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
