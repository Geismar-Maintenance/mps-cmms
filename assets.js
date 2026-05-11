/* ======================================================
   ASSETS MODULE (RUNTIME ENTRY)
   ====================================================== */

window.loadAssets = async function () {
  const container = document.getElementById("app-root");

  container.innerHTML = "Loading runtime entry...";

  try {
    const res = await fetch("assets.html");
    const html = await res.text();

    container.innerHTML = html;

    initAssetsPage();

  } catch (err) {
    console.error("Failed to load assets module:", err);

    container.innerHTML = `
      <div class="alert alert-danger">
        Failed to load runtime entry page.
      </div>
    `;
  }
};

/* ======================================================
   INIT
   ====================================================== */

function initAssetsPage() {
  loadAssetsList();
  loadWeekOptions();
}

/* ======================================================
   LOAD ASSETS
   ====================================================== */

async function loadAssetsList() {
  const select = document.getElementById("runtime-asset");

  if (!select) return;

  select.innerHTML = `<option>Loading...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    const assets = await res.json();

    select.innerHTML = `<option value="">Select Asset</option>`;

    assets.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.assetid;
      opt.textContent = a.assetname;
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
    const weeks = await res.json();

    select.innerHTML = "";

    weeks.forEach(w => {
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
    alert("All fields required");
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
        total_hours: hours,
        recorded_by: window.currentUser.display_name
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to save runtime");
    }

    alert("Runtime saved successfully");

    // ✅ Refresh dashboard alert
    if (window.loadDashboard) {
      window.loadDashboard();
    }

  } catch (err) {
    console.error("Runtime error:", err);
    alert("Failed to save runtime");
  }
};
/* ======================================================
   ASSETS MODULE
   ====================================================== */

window.loadAssets = async function () {
  const container = document.getElementById("app-root");

  container.innerHTML = "Loading runtime entry...";

  try {
    const res = await fetch("assets.html");
    const html = await res.text();

    container.innerHTML = html;

    initAssetsPage();

  } catch (err) {
    console.error("Failed to load assets module:", err);

    container.innerHTML = `
      <div class="alert alert-danger">
        Failed to load runtime entry page.
      </div>
    `;
  }
};

/* ======================================================
   INIT
   ====================================================== */

function initAssetsPage() {
  loadAssetsList();
  loadWeekOptions();
}

/* ======================================================
   LOAD ASSETS
   ====================================================== */

async function loadAssetsList() {
  const select = document.getElementById("runtime-asset");
  if (!select) return;

  select.innerHTML = `<option>Loading assets...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    const assets = await res.json();

    select.innerHTML = `<option value="">Select Asset</option>`;

    assets.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.assetid;
      opt.textContent = a.assetname;
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
    const weeks = await res.json();

    select.innerHTML = "";

    weeks.forEach(w => {
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

    if (window.loadDashboard) {
      window.loadDashboard();
    }

  } catch (err) {
    console.error("Runtime submission failed:", err);
    alert("Failed to save runtime");
  }
};

