// pm.js

export async function loadPMView() {
  const container = document.getElementById("main");
  container.innerHTML = "<h2>Preventive Maintenance</h2>";

  const res = await fetch(`${API_BASE}/api/pm?action=status`);
  const pms = await res.json();

  renderPMList(pms, container);
}

function renderPMList(pms, container) {
  const table = document.createElement("table");
  table.className = "pm-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th>Asset</th>
        <th>PM Block</th>
        <th>Phase</th>
        <th>Due</th>
        <th>Execution</th>
        <th>Completion</th>
        <th>Exceptions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  pms.forEach(pm => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${pm.asset_name}</td>
      <td>${pm.pm_block_hours}</td>
      <td>${pm.phase}</td>
      <td>${pm.due_friday}</td>
      <td>${pm.execution_allowed ? "✅" : "🔒"}</td>
      <td>${pm.completion_percentage ?? "-"}</td>
      <td>${pm.has_exceptions ? "⚠️" : ""}</td>
    `;

    tbody.appendChild(row);
  });

  container.appendChild(table);
}
