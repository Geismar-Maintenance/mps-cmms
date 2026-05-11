/* ======================================================
   ASSETS MODULE (RUNTIME ENTRY)
   ====================================================== */

window.loadAssets = function () {
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
    console.warn("No week_id provided to assets module");
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

        // highlight selected
        document.querySelectorAll("#asset-list li")
          .forEach(el => el.classList.remove("active"));

        li.classList.add("active");
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
   SET WEEK (READ ONLY)
   ====================================================== */

function setWeek(weekId) {
  const display = document.getElementById("runtime-week-display");
  if (!display) return;

  display.value = `Week ${weekId}`;
}

/* ======================================================
   SELECT ASSET
   ====================================================== */

function selectAsset(asset) {
  window.selectedAsset = asset;

  const input = document.getElementById("runtime-asset-name");
  if (input) {
    input.value = asset.assetname;
  }
}

/* ======================================================
   SUBMIT RUNTIME
   ====================================================== */

window.submitRuntime = async function () {

  const asset = window.selectedAsset;
  const filters = window.currentModuleFilters || {};
  const weekId = filters.week_id;
  const hours = document.getElementById("runtime-hours").value;

  if (!asset || !weekId || !hours) {
    alert("Select an asset and enter hours");
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
        asset_id: asset.assetid,
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
