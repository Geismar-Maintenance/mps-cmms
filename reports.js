window.loadReports = function () {

  const output = document.getElementById("report-output");
  const selector = document.getElementById("report-selector");
  const params = document.getElementById("report-params");

  if (output) {
    output.innerHTML = "Select a report to begin";
  }

  if (selector) {
    selector.value = "";
  }

  if (params) {
    params.style.display = "none";
  }
};

window.handleReportSelection = function () {
  const value = document.getElementById("report-selector").value;
  const paramsDiv = document.getElementById("report-params");

  paramsDiv.style.display = "block";
  paramsDiv.innerHTML = "";

  if (value === "section") {
    renderSectionReportParams();
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
