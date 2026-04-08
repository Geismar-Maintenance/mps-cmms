const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

let allParts = [];
let selectedPart = null;

/* ================= Navigation ================= */

function switchModule(moduleName, el) {
  document.querySelectorAll(".module").forEach(m =>
    m.classList.remove("active")
  );

  document.getElementById(`module-${moduleName}`).classList.add("active");

  document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );
  el.classList.add("active");
}

/* ================= Parts Search ================= */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("part-search")
    .addEventListener("input", handlePartSearch);
});

async function handlePartSearch(e) {
  const query = e.target.value.trim();

  if (query.length < 2) {
    renderPartsTable([]);
    document.getElementById("parts-placeholder").style.display = "block";
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/parts?search=${encodeURIComponent(query)}`
    );
    if (!res.ok) throw new Error("Failed to search parts");

    const data = await res.json();

    allParts = data.map(p => ({
      ...p,
      total_qty: Number(p.total_qty ?? 0),
      locations: Array.isArray(p.locations) ? p.locations : []
    }));

    document.getElementById("parts-placeholder").style.display = "none";
    renderPartsTable(allParts);

  } catch (err) {
    alert("Error loading parts");
    console.error(err);
  }
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  parts.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.partnumber}</td>
      <td>${p.description}</td>
      <td>${p.manufacturer}</td>
      <td>${p.model}</td>
      <td>${p.total_qty}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary"
                ${p.total_qty === 0 ? "disabled" : ""}
                onclick="openIssueModal(${p.partid})">
          Issue
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ================= Issue Modal ================= */

function openIssueModal(partid) {
  selectedPart = allParts.find(
    p => Number(p.partid) === Number(partid)
  );
  if (!selectedPart) return;

  document.getElementById("issue-partname").innerText =
    `${selectedPart.partnumber} (${selectedPart.model})`;

  const locSelect = document.getElementById("issue-location");
  locSelect.replaceChildren();

  if (!selectedPart.locations.length) {
    alert("No inventory available");
    return;
  }

  selectedPart.locations.forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc.locationid;
    opt.textContent =
      `${loc.cabinet}.${loc.section}.${loc.bin} (Qty ${loc.qty})`;
    locSelect.appendChild(opt);
  });

  loadAssetsForIssue();

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("issueModal"))
    .show();
}

/* ================= Assets ================= */

async function loadAssetsForIssue() {
  const select = document.getElementById("issue-asset");
  select.replaceChildren(
    Object.assign(document.createElement("option"), {
      value: "",
      textContent: "Select Asset"
    })
  );

  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    if (!res.ok) throw new Error("Failed to load assets");

    const assets = await res.json();

    assets.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.assetid;
      opt.textContent = `${a.assetnumber} – ${a.assetname}`;
      select.appendChild(opt);
    });
  } catch (err) {
    alert("Unable to load assets for issue");
    console.error(err);
  }
}

/* ================= Submit Issue ================= */

async function submitIssue() {
  const assetid = document.getElementById("issue-asset").value;
  const locationid = document.getElementById("issue-location").value;
  const qty = Number(document.getElementById("issue-qty").value);
  const workorder = document.getElementById("issue-wo").value || null;

  if (!assetid || !locationid || qty <= 0) {
    alert("Asset, location, and quantity are required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/parts/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partid: selectedPart.partid,
        from_locationid: locationid,
        qty,
        assetid,
        workorder,
        performed_by: "tech"
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error);

    bootstrap.Modal
      .getInstance(document.getElementById("issueModal"))
      .hide();

  } catch (err) {
    alert("Issue failed");
    console.error(err);
  }
}
