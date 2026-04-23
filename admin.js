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

