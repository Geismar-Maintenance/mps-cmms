/* ======================================================
   HISTORY MODULE (FRONTEND)
   Responsibility:
   - Read-only audit views
   ====================================================== */

// Load Parts History
window.loadPartsHistory = async function () {
  const tbody = document.querySelector("#parts-history-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/parts?history=true`);
    if (!res.ok) throw new Error("Failed to load parts history");

    const rows = await res.json();

    rows.forEach(h => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(h.transactiondate).toLocaleString()}</td>
        <td>${h.transactiontype}</td>
        <td>${h.partnumber}</td>
        <td>${h.description}</td>
        <td>${h.from_cabinet ? `${h.from_cabinet}.${h.from_section}.${h.from_bin}` : "—"}</td>
        <td>${h.to_cabinet ? `${h.to_cabinet}.${h.to_section}.${h.to_bin}` : "—"}</td>
        <td>${h.qty}</td>
        <td>${h.performed_by}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
};

// Load Work Order History (if you have it)
window.loadWOHistory = async function () {
  const tbody = document.querySelector("#wo-history-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/workorders?history=true`);
    if (!res.ok) throw new Error("Failed to load WO history");

    const rows = await res.json();

    rows.forEach(w => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(w.closedate).toLocaleDateString()}</td>
        <td>WO-${w.woid}</td>
        <td>${w.assetname}</td>
        <td>${w.description}</td>
        <td>${w.completed_by ?? "—"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
};
