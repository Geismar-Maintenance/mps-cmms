// pm.js (FRONTEND)

/* ======================================================
   PM VIEW LOADER
   ====================================================== */

async function loadPMView() {
  const root = document.getElementById("app-root");

  // ✅ Create container dynamically
  root.innerHTML = `
    <h4 class="mb-3">Preventive Maintenance</h4>
    <div id="pm-content">
      <h5>Loading Preventive Maintenance…</h5>
    </div>
  `;

  const container = document.getElementById("pm-content");

  try {
    const res = await fetch(`${API_BASE}/api/pm?action=status`);
    if (!res.ok) throw new Error("Failed to load PM status");

    const pms = await res.json();
    renderPMList(pms);

  } catch (err) {
    console.error(err);
    container.innerHTML =
      `<div class="text-danger">Error loading PMs</div>`;
  }
}

/* ======================================================
   RENDER PM LIST (READ-ONLY)
   ====================================================== */

function renderPMList(pms) {
  const container = document.getElementById("pm-content");
  container.innerHTML = "";

  if (!Array.isArray(pms) || pms.length === 0) {
    container.innerHTML = "<p>No PMs found.</p>";
    return;
  }

  const table = document.createElement("table");
  table.className = "table table-sm";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Asset</th>
        <th>PM Block</th>
        <th>Phase</th>
        <th>Execution</th>
        <th>Completion</th>
        <th>Exceptions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  pms.forEach(pm => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${pm.asset_name}</td>
      <td>${pm.pm_block_hours}</td>
      <td>${pm.phase}</td>
      <td>${pm.execution_allowed ? "✅" : "🔒"}</td>
      <td>${pm.completion_percentage ?? "—"}</td>
      <td>${pm.has_exceptions ? "⚠️" : ""}</td>
    `;

    tbody.appendChild(tr);
  });

  container.appendChild(table);
}
