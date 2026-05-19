window.loadReports = function () {

  const selector = document.getElementById("report-selector");

  if (!selector) return;

  // ✅ Auto-select first report
  selector.value = "section";

  // ✅ Render its UI immediately
  handleReportSelection();
};
``

window.handleReportSelection = function () {
  const value = document.getElementById("report-selector").value;
  const paramsDiv = document.getElementById("report-params");
  const output = document.getElementById("report-output");

  paramsDiv.style.display = "block";
  paramsDiv.innerHTML = "";

  if (value === "section") {
    renderSectionReportParams();
  }

  else if (value === "pm-visual") {

    paramsDiv.style.display = "none";

    output.innerHTML = `
      <h5 class="mb-3">Visual Maintenance Summary</h5>

      <div id="pm-summary-dashboard" class="mb-4"></div>

      <div id="pm-visual-board"></div>
    `;

    loadVisualMaintenanceReport();
  }
  else if (value === "parts-usage") {

  paramsDiv.innerHTML = `
    <h6 class="mb-2">Parts Usage</h6>

    <div class="row g-2">

      <div class="col-md-3">
        <select id="usage-range"
                class="form-select"
                onchange="loadPartsUsageReport()">
          <option value="7">Last 7 Days</option>
          <option value="30" selected>Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div class="col-md-3">
        <button class="btn btn-primary w-100"
                onclick="loadPartsUsageReport()">
          Run Report
        </button>
      </div>

    </div>
  `;

  // ✅ Auto-load immediately
  loadPartsUsageReport();
}
};

// ---------------Inventory Report By Cabinet Section----------------//

function renderSectionReportParams() {
  const paramsDiv = document.getElementById("report-params");

  paramsDiv.innerHTML = `
    <h6 class="mb-2">Inventory by Cabinet / Section</h6>

    <div class="row g-2">

      <div class="col-md-3">
        <input id="report-cabinet"
               class="form-control"
               placeholder="Cabinet">
      </div>

      <div class="col-md-3">
        <input id="report-section"
               class="form-control"
               placeholder="Section">
      </div>

      <div class="col-md-3">
        <button class="btn btn-primary w-100"
                onclick="runSectionReport()">
          Run Report
        </button>
      </div>

    </div>
  `;
}

window.runSectionReport = async function () {
  const cabinet = document.getElementById("report-cabinet").value.trim();
  const section = document.getElementById("report-section").value.trim();

  if (!cabinet || !section) {
    alert("Cabinet and section required");
    return;
  }

  const output = document.getElementById("report-output");
  output.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/reports?type=inventory-section&cabinet=${cabinet}&section=${section}`)

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    renderSectionReport(data);

  } catch (err) {
    console.error(err);
    output.innerHTML = `<div class="text-danger">Failed to load report</div>`;
  }
};

function renderSectionReport(data) {
  const output = document.getElementById("report-output");

  if (!data.length) {
    output.innerHTML =
      `<div class="text-muted">No items found for this section.</div>`;
    return;
  }

  output.innerHTML = `
    <table class="table table-sm table-hover">
      <thead>
        <tr>
          <th>Part #</th>
          <th>Description</th>
          <th>Location</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            <td class="text-primary"
                style="cursor:pointer"
                onclick="openPartDetail(${row.partid})">
              ${row.partnumber}
            </td>
            <td>${row.description}</td>
            <td>${row.cabinet}.${row.section}.${row.bin}</td>
            <td>${row.qty}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function exportToExcel(data) {

  const headers = Object.keys(data[0]);

  const csv = [
    headers.join(","), // header row
    ...data.map(row =>
      headers.map(field => `"${row[field] ?? ""}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory_report.csv";
  a.click();

  URL.revokeObjectURL(url);
}


function printReport() {
  window.print();
}

async function loadVisualMaintenanceReport() {

  const summary = document.getElementById("pm-summary-dashboard");
  const board = document.getElementById("pm-visual-board");

  summary.innerHTML = "Loading summary…";
  board.innerHTML = "Loading board…";

  try {
    const res = await fetch(`${API_BASE}/api/pm?action=visualBoard`);
    const data = await res.json();

    renderPMSummary(data.summary);
    renderPMBoard(data.board);

  } catch (err) {
    console.error(err);
    summary.innerHTML =
      `<div class="text-danger">Failed to load report</div>`;
  }
}
function renderPMSummary(data) {

  const container = document.getElementById("pm-summary-dashboard");

  let html = `
    <h6>PM Completion Summary</h6>

    <table class="table table-sm table-bordered text-center">
      <thead>
        <tr>
          <th>Location</th>
          ${data.months.map(m => `<th>${m}</th>`).join("")}
          <th>YTD</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.locations.forEach(loc => {
    html += `
      <tr>
        <td>${loc.name}</td>
        ${loc.months.map(p => `
          <td class="${p < 85 ? 'text-danger' : 'text-success'}">
            ${p ?? '-'}%
          </td>
        `).join("")}
        <td><strong>${loc.ytd}%</strong></td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  container.innerHTML = html;
}
function renderPMBoard(data) {

  const container = document.getElementById("pm-visual-board");

  let html = `
    <h6 class="mt-4">PM Weekly Execution Board</h6>

    <div style="overflow:auto;">
      <table class="table table-sm table-bordered text-center align-middle">
        <thead>
          <tr>
            <th>Machine</th>
            ${Array.from({length: 52}, (_, i) => `<th>${i+1}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  data.machines.forEach(machine => {

    html += `<tr><td><strong>${machine.name}</strong></td>`;

    machine.weeks.forEach(w => {

      if (!w) {
        html += `<td></td>`;
        return;
      }

      let bg = "";

      if (w.pm_completed) bg = "#28a745";
      else if (w.pm_due) bg = "#dc3545";
      else if (w.warning) bg = "#ffc107";

      html += `
        <td style="
          min-width:85px;
          font-size:11px;
          padding:4px;
          background:${bg};
          color:${bg ? 'white' : 'black'};
        ">
          <div><strong>${w.hours ?? ""}h</strong></div>
          <div>${w.cumulative ?? ""}</div>

          ${w.pm_due ? `<div>🔧 ${w.pm_type}</div>` : ""}
          ${w.pm_completed ? `<div>✅</div>` : ""}
          ${w.has_exception ? `<div>⚠️</div>` : ""}
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}
window.loadPartsUsageReport = async function () {

  const output = document.getElementById("report-output");
  output.innerHTML = "Loading...";

  try {
    const days = Number(document.getElementById("usage-range").value);

    const { start, end } = getDateRange(days);

    const res = await fetch(
      `${API_BASE}/api/reports?type=parts-usage&startDate=${start}&endDate=${end}`
    );

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    renderPartsUsageReport(data);

  } catch (err) {
    console.error(err);
    output.innerHTML =
      `<div class="text-danger">Failed to load report</div>`;
  }
};
function renderPartsUsageReport(data) {

  const output = document.getElementById("report-output");

  if (!data.length) {
    output.innerHTML =
      `<div class="text-muted">No parts used in this period.</div>`;
    return;
  }

  output.innerHTML = `
    <h6 class="mb-2">Parts Usage</h6>

    <table class="table table-sm table-hover">
      <thead>
        <tr>
          <th>Part #</th>
          <th>Description</th>
          <th class="text-end">Total Used</th>
          <th class="text-end">Transactions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            <td>${row.partnumber}</td>
            <td>${row.part_description || row.description}</td>
            <td class="text-end">${row.total_used}</td>
            <td class="text-end">${row.transaction_count || ""}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
function getDateRange(days) {
  const end = new Date();
  const start = new Date();

  start.setDate(end.getDate() - days);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}
