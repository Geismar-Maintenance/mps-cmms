/* ======================================================
   ADMIN MODULE (FRONTEND)
   Responsibility:
   - Admin-only configuration actions
   ====================================================== */

// Open Add Part modal
window.openAddPartModal = function () {
  document.getElementById("addPartForm")?.reset();

  const modal = document.getElementById("addPartModal");
  if (!modal) return;

  bootstrap.Modal.getOrCreateInstance(modal).show();
};

// Submit Add Part form
window.submitAddPart = async function (event) {
  event.preventDefault();

  const btn = document.getElementById("btnSubmitNewPart");
  if (btn) btn.disabled = true;

  const payload = {
    partnumber: document.getElementById("adminPartNumber").value.trim(),
    description: document.getElementById("adminDescription").value.trim(),
    manufacturer: document.getElementById("adminManufacturer").value.trim(),
    model: document.getElementById("adminModel").value.trim(),
    cost: document.getElementById("adminCost").value,
    reorderlevel: document.getElementById("adminReorder").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/parts?admin=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to create part");

    bootstrap.Modal.getInstance(
      document.getElementById("addPartModal")
    ).hide();

    alert("Part created successfully");

  } catch (err) {
    alert(err.message);

  } finally {
    if (btn) btn.disabled = false;
  }
};

window.importInventoryCSV = async function () {
  const fileInput = document.getElementById("inventory-csv");
  const log = document.getElementById("import-log");

  if (!fileInput.files.length) {
    alert("Please select a CSV file.");
    return;
  }

  const file = fileInput.files[0];

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,

    complete: async function (results) {
      const rows = results.data;

      // ✅ Header validation
      const requiredHeaders = [
        "partnumber",
        "description",
        "manufacturer",
        "model",
        "reorderlevel",
        "cost",
        "cabinet",
        "section",
        "bin",
        "qty"
      ];

      for (const h of requiredHeaders) {
        if (!results.meta.fields.includes(h)) {
          alert(`Missing required column: ${h}`);
          return;
        }
      }

      // ✅ Structural guard (prevents silent corruption)
      for (const row of rows) {
        if (Object.values(row).some(v => v === undefined)) {
          alert("CSV structure error: column mismatch (likely commas or quoting issues).");
          return;
        }
      }

      log.textContent = `Parsed ${rows.length} rows. Sending to server…`;

      const res = await fetch(
        `${API_BASE}/api/parts?action=importInventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        log.textContent = "❌ Import failed:\n" + JSON.stringify(result, null, 2);
        return;
      }

      log.textContent = "✅ Import succeeded:\n" + JSON.stringify(result, null, 2);
      alert("Import succeeded!");
    },

    error: function (err) {
      log.textContent = "❌ CSV parse error: " + err.message;
    }
  });
};

async function loadLocations() {
  try {
    const res = await fetch(`${API_BASE}/api/locations`);
    const data = await res.json();

    // ✅ SORT: Cabinet → Section → Bin
    data.sort((a, b) => {
      // Cabinet (string)
      if (a.cabinet !== b.cabinet) {
        return a.cabinet.localeCompare(b.cabinet);
      }

      // Section (string)
      if (a.section !== b.section) {
        return a.section.localeCompare(b.section);
      }

      // Bin (numeric-safe)
      return Number(a.bin) - Number(b.bin);
    });

    const tbody = document.querySelector("#locations-table tbody");
    tbody.innerHTML = "";

    data.forEach(loc => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${loc.cabinet}</td>
        <td>${loc.section}</td>
        <td>${loc.bin}</td>
        <td>${loc.description || ""}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Failed to load locations", err);
  }
}
window.addLocationRange = async function () {
  const cabinet = document.getElementById("loc-cabinet").value.trim().toUpperCase();
  const section = document.getElementById("loc-section").value.trim().toUpperCase();

  const startInput = document.getElementById("loc-bin-start").value;
  const start = parseInt(startInput, 10);
  const end = parseInt(document.getElementById("loc-bin-end").value, 10);
  const increment = parseInt(document.getElementById("loc-bin-increment").value, 10) || 1;

  if (!cabinet || !section || isNaN(start)) {
    alert("Cabinet, section, and start bin are required");
    return;
  }

  const finalEnd = isNaN(end) ? start : end;

  if (finalEnd < start) {
    alert("End must be >= start");
    return;
  }

  if (increment <= 0) {
    alert("Increment must be greater than 0");
    return;
  }

  const totalCount = Math.floor((finalEnd - start) / increment) + 1;
  if (totalCount > 500) {
    alert("Too many locations at once (limit 500)");
    return;
  }

  const width = startInput.length;

  try {
    const requests = [];

    for (let i = start; i <= finalEnd; i += increment) {
      const bin = String(i).padStart(width, "0");

      requests.push(
        fetch(`${API_BASE}/api/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cabinet, section, bin })
        })
      );
    }

    const responses = await Promise.all(requests);

    for (const res of responses) {
      if (!res.ok) {
        const data = await res.json();

        if (data.error !== "Location already exists") {
          throw new Error(data.error);
        }
      }
    }

    alert("Locations created");

    // clear inputs
    document.getElementById("loc-cabinet").value = "";
    document.getElementById("loc-section").value = "";
    document.getElementById("loc-bin-start").value = "";
    document.getElementById("loc-bin-end").value = "";
    document.getElementById("loc-bin-increment").value = "";

    document.getElementById("loc-cabinet").focus();

    loadLocations();

  } catch (err) {
    console.error(err);
    alert("Error creating locations");
  }
};

window.openUserManagement = async function () {
  const modal = document.getElementById("userMgmtModal");
  bootstrap.Modal.getOrCreateInstance(modal).show();
  loadUsers();
};

async function loadUsers() {
  const res = await fetch(`${API_BASE}/api/users`);
  const users = await res.json();

  const tbody = document.getElementById("user-table");
  tbody.innerHTML = "";

  users.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
<td>
  <strong>${u.display_name}</strong><br>
  <small class="text-muted">${u.username}</small>
</td>

      <td>${u.role}</td>
      <td>
        <span class="${u.active ? 'text-success' : 'text-danger'}">
          ${u.active ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary"
          onclick="editUser('${u.username}')">Edit</button>

        <button class="btn btn-sm btn-outline-danger"
          onclick="toggleUser('${u.username}', ${u.active})">
          ${u.active ? 'Disable' : 'Enable'}
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

window.toggleUser = async function (username, currentStatus) {
  if (!confirm("Are you sure?")) return;

  const res = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggleUser",
      username,
      active: !currentStatus
    })
  });

  if (!res.ok) {
    alert("Failed to update user");
    return;
  }

  loadUsers();
};

window.openCreateUser = function () {
  const username = prompt("Username:");
  if (!username) return;

  const display_name = prompt("Display name:");
  if (!display_name) return;

  const pin = prompt("PIN:");
  if (!pin) return;

  const role = prompt("Role (tech, manager, supervisor, admin):", "tech");

  createUser(username, display_name, pin, role);
};

async function createUser(username, display_name, pin, role) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createUser",
      username,
      display_name,
      pin,
      role
    })
  });

  if (!res.ok) {
    alert("Failed to create user");
    return;
  }

  loadUsers();
}


/* ======================================================
   ADMIN‑GUIDED INVENTORY HELPERS
   ====================================================== */

function openReceiveFromAdmin(partid) {
  // Set selectedPart context
  selectedPart = {
    partid,
    partnumber: document.getElementById("adminPartNumber").value,
    model: ""
  };

  document.getElementById("receive-partname").innerText =
    selectedPart.partnumber;

  document.getElementById("receive-qty").value = "";

  // ✅ Define one‑time post‑receive behavior
  postReceiveAction = () => {
    setTimeout(() => {
      if (confirm("Inventory received. Would you like to move it to a storage location now?")) {
        openMoveModal(partid);
      }
    }, 300);
  };

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("receiveModal"))
    .show();
}

