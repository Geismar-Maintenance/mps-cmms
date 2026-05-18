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

    // No parameters needed
    paramsDiv.style.display = "none";

    output.innerHTML = `
      <h5 class="mb-3">Visual Maintenance Summary</h5>

      <div id="pm-summary-dashboard" class="mb-4"></div>

      <div id="pm-visual-board"></div>
    `;

    loadVisualMaintenanceReport();
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

