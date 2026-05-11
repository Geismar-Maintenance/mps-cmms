/* ======================================================
   ASSETS MODULE
   Handles runtime entry UI + logic
   ====================================================== */

export async function loadAssets() {
  const container = document.getElementById("main-content");

  container.innerHTML = "Loading runtime entry...";

  try {
    // ✅ Load HTML UI
    const res = await fetch("/assets.html");
    const html = await res.text();

    container.innerHTML = html;

    // ✅ Initialize page behavior
    initAssetsPage();

  } catch (err) {
    console.error("Failed to load assets module:", err);

    container.innerHTML = `
      <div class="alert alert-danger">
        Failed to load runtime entry page.
      </div>
    `;
  }
}

/* ======================================================
   INITIALIZATION
   ====================================================== */

function initAssetsPage() {
  console.log("Assets module initialized");

  loadAssetsList();
  loadWeekOptions();
}

/* ======================================================
   LOAD ASSETS
   ====================================================== */

async function loadAssetsList() {
  const select = document.getElementById("runtime-asset");

  if (!select) return;

  select.innerHTML = `<option value="">Loading assets...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/assets?action=list`);
    const data = await res.json();

    select.innerHTML = `<option value="">Select Asset</option>`;

    data.forEach(asset => {
      const opt = document.createElement("option");
      opt.value = asset.assetid;
      opt.textContent = asset.assetname;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load assets:", err);
    select.innerHTML = `<option>Error loading assets</option>`;
  }
}

/* ======================================================
   LOAD WEEKS
   ====================================================== */

async function loadWeekOptions() {
  const select = document.getElementById("runtime-week");

  if (!select) return;

  select.innerHTML = `<option>Loading weeks...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/assets?action=weeks`);
    const data = await res.json();

    select.innerHTML = "";

    data.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.week_id;
      opt.textContent = `Week ${w.week_number} (${w.year})`;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load weeks:", err);
    select.innerHTML = `<option>Error loading weeks</option>`;
  }
}

/* ======================================================
   SUBMIT RUNTIME
   ====================================================== */

window.submitRuntime = async function () {
  const assetId = document.getElementById("runtime-asset").value;
  const weekId = document.getElementById("runtime-week").value;
  const hours = document.getElementById("runtime-hours").value;

  if (!assetId || !weekId || !hours) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "add-runtime",
        asset_id: assetId,
        week_id: weekId,
        total_hours: hours
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to save runtime");
    }

    alert("Runtime saved successfully");

    // ✅ reload dashboard to refresh alert
    if (window.loadDashboard) {
      window.loadDashboard();
    }

  } catch (err) {
    console.error("Runtime submission failed:", err);

    alert("Failed to save runtime");
  }
};
