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
