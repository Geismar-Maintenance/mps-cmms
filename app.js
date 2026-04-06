const API_BASE = "http://localhost:3000/api";

const tableContainer = document.getElementById("data-table-container");
const statusDot = document.getElementById("db-status-dot");
const statusText = document.getElementById("db-status-text");

/**
 * Backend connection check
 */
document.getElementById("btn-connect").addEventListener("click", async () => {
  const errorDiv = document.getElementById("login-error");

  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error();

    document.getElementById("login-overlay").style.display = "none";
    statusDot.className = "status-dot bg-success";
    statusText.innerText = "Online";

    loadModuleData("parts");
  } catch {
    errorDiv.innerText = "Maintenance server unavailable.";
  }
});

/**
 * Load data from backend
 */
async function loadModuleData(moduleKey) {
  document.getElementById("module-title").innerText =
    moduleKey.replace("-", " ");

  tableContainer.innerHTML = `
    <div class="text-center p-5">
      <div class="spinner-border"></div><br>
      Querying Geismar Node...
    </div>`;

  try {
    const res = await fetch(`${API_BASE}/${moduleKey}`);
    const data = await res.json();
    renderTable(data);
  } catch {
    tableContainer.innerHTML =
      `<div class="alert alert-danger">
        Unable to load ${moduleKey}
      </div>`;
  }
}

/**
 * Render data table
 */
function renderTable(data) {
  if (!data || data.length === 0) {
    tableContainer.innerHTML = "Table is empty.";
    return;
  }

  let html = `
    <table class="table table-hover table-bordered bg-white shadow-sm">
      <thead><tr>`;

  Object.keys(data[0]).forEach(key => {
    html += `<th class="bg-light text-uppercase small">${key.replace("_", " ")}</th>`;
  });

  html += `</tr></thead><tbody>`;

  data.forEach(row => {
    html += "<tr>";
    Object.values(row).forEach(val => {
      html += `<td class="small">${val ?? "-"}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  tableContainer.innerHTML = html;
}

window.loadModuleData = loadModuleData;
