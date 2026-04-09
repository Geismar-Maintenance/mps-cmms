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

document.getElementById("part-search")
  .addEventListener("keydown", e => {
    if (e.key === "Enter") {
      runPartSearch();
    }
  });

async function runPartSearch() {
  const input = document.getElementById("part-search");
  const query = input.value.trim();

  if (query.length < 2) {
    allParts = [];
    renderPartsTable([]);
    document.getElementById("parts-placeholder").style.display = "block";
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/parts?search=${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      console.error("Search failed:", await res.text());
      renderPartsTable([]);
      return;
    }

    const data = await res.json();

    allParts = data.map(p => ({
      ...p,
      total_qty: Number(p.total_qty ?? 0),
      locations: Array.isArray(p.locations) ? p.locations : []
    }));

    document.getElementById("parts-placeholder").style.display = "none";
    renderPartsTable(allParts);

  } catch (err) {
    console.error("Search error:", err);
    alert("Error searching parts");
  }
}

function renderPartsTable(parts) {
  const tbody = document.querySelector("#parts-table tbody");
  tbody.innerHTML = "";

  parts.forEach(p => {
    const tr = document.createElement("tr");

    // ✅ Build location display
    let locationDisplay = "—";
    if (Array.isArray(p.locations) && p.locations.length > 0) {
      locationDisplay = p.locations
        .map(loc =>
          `${loc.cabinet}.${loc.section}.${loc.bin} (${loc.qty})`
        )
        .join("<br>");
    }

    tr.innerHTML = `
      <td>${p.partnumber}</td>
      <td>${p.description}</td>
      <td>${p.manufacturer}</td>
      <td>${p.model}</td>
      <td>${p.total_qty}</td>
      <td>${locationDisplay}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary"
                ${p.total_qty === 0 ? "disabled" : ""}
                onclick="openIssueModal(${p.partid})">
          Issue
        </button>
        <button class="btn btn-sm btn-outline-success"
                onclick="openReceiveModal(${p.partid})">
          Receive
        </button>
        <button class="btn btn-sm btn-outline-secondary"
                onclick="openMoveModal(${p.partid})">
          Move
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

// ✅ SINGLE SOURCE OF TRUTH
const RECEIVING_LOCATION_ID = 2;

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const partid = Number(req.body.partid);
  const qty = Number(req.body.qty);
  const performed_by = req.body.performed_by ?? "system";

  if (
    !Number.isInteger(partid) ||
    !Number.isInteger(qty) ||
    qty <= 0
  ) {
    return res.status(400).json({ error: "Invalid receive data" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Increment inventory in RECEIVING
    const updateRes = await client.query(
      `
      UPDATE partlocations
      SET qty = qty + $1
      WHERE partid = $2
        AND locationid = $3
      RETURNING qty
      `,
      [qty, partid, RECEIVING_LOCATION_ID]
    );

    let finalQty;

    if (updateRes.rowCount === 0) {
      const insertRes = await client.query(
        `
        INSERT INTO partlocations (partid, locationid, qty)
        VALUES ($1, $2, $3)
        RETURNING qty
        `,
        [partid, RECEIVING_LOCATION_ID, qty]
      );
      finalQty = insertRes.rows[0].qty;
    } else {
      finalQty = updateRes.rows[0].qty;
    }

    // 2️⃣ Transaction record
    await client.query(
      `
      INSERT INTO transactions (
        transactiontypeid,
        partid,
        to_locationid,
        qty,
        performed_by,
        transactiondate
      )
      VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
      `,
      [
        TRANSACTION_TYPES.RECEIVE,
        partid,
        RECEIVING_LOCATION_ID,
        qty,
        performed_by
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      receiving_locationid: RECEIVING_LOCATION_ID,
      new_qty: finalQty
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("RECEIVE FAILED:", err);
    return res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

    // ✅ Close modal
    bootstrap.Modal
      .getInstance(document.getElementById("receiveModal"))
      .hide();

    // ✅ Refresh search results (inventory changed)
    runPartSearch();

  } catch (err) {
    console.error("Receive error:", err);
    alert("Receive failed");
  }
}
    
