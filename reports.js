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
``
