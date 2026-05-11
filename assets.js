/* ======================================================
   ASSETS MODULE (RUNTIME ENTRY)
   ====================================================== */

window.loadAssets = async function () {
  const container = document.getElementById("app-root");

    initAssetsPage();
};

/* ======================================================
   INIT
   ====================================================== */
function initAssetsPage() {
  loadAssetsList();

  const filters = window.currentModuleFilters || {};

  if (filters.week_id) {
    setWeek(filters.week_id);
  } else {
    loadWeekOptions();
  }
}


/* ======================================================
   LOAD ASSETS
   ====================================================== */

async function loadAssetsList() {
  const list = document.getElementById("asset-list");

  if (!list) {
    console.log("asset-list not found");
    return;
  }

  console.log("Loading assets...");

  list.innerHTML = `<li class="list-group-item">Loading...</li>`;

  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    const assets = await res.json();

    list.innerHTML = "";

    if (!assets.length) {
      list.innerHTML = `<li class="list-group-item">No assets found</li>`;
      return;
    }

    assets.forEach(a => {
      const li = document.createElement("li");
      li.className = "list-group-item list-group-item-action";
      li.style.cursor = "pointer";

      li.textContent = a.assetname;

      li.onclick = () => {
        selectAsset(a);
      };

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Failed to load assets:", err);
    list.innerHTML =
      `<li class="list-group-item text-danger">Error loading assets</li>`;
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

  const asset = window.selectedAsset;
  const weekId = document.getElementById("runtime-week").value;
  const hours = document.getElementById("runtime-hours").value;

  if (!asset || !weekId || !hours) {
    alert("Select an asset, week, and enter hours");
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
        asset_id: asset.assetid,   // ✅ FIXED (was assetId)
        week_id: weekId,
        runtime_hours: hours,
        recorded_by: window.currentUser.display_name
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
    console.error("Runtime error:", err);
    alert("Failed to save runtime");
  }
};
function selectAsset(asset) {
  console.log("Selected asset:", asset);

  // store selected asset globally
  window.selectedAsset = asset;

  // update UI field
  const input = document.getElementById("runtime-asset-name");
  if (input) {
    input.value = asset.assetname;
  }
}

function setWeek(weekId) {
  const select = document.getElementById("runtime-week");
  if (!select) return;

  select.innerHTML = `<option value="${weekId}">Week ${weekId}</option>`;
  select.value = weekId;
}

