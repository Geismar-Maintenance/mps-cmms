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
        
<td>
  <a href="#" onclick="openWorkOrder(${w.woid})">
    WO-${w.woid}
  </a>
</td>

        <td>${w.assetname ?? "—"}</td>
        <td>${w.description ?? "—"}</td>
        <td>${w.type ?? "—"}</td>
        <td>${w.priority ?? "—"}</td>
        <td>${w.opendate ? new Date(w.opendate).toLocaleDateString() : "—"}</td>
        <td>${w.closeddate ? new Date(w.closeddate).toLocaleDateString() : "—"}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("WO History error:", err);
  }
};
window.openWorkOrder = async function (woid) {
  try {
    const res = await fetch(`${API_BASE}/api/workorders?id=${woid}`);

    console.log("STATUS:", res.status);

    const data = await res.json();
    console.log("DATA:", data);

    if (!res.ok) throw new Error(data.error);

    showWorkOrderModal(data);

  } 
catch (err) {
  console.error("FULL ERROR:", err);
  alert(err.message);
}

};

function showWorkOrderModal(wo) {
  document.getElementById("wo-detail-id").innerText = wo.woid;
  document.getElementById("wo-detail-description").value = wo.description || "";
  document.getElementById("wo-detail-workperformed").value = wo.workperformed || "";
  document.getElementById("wo-detail-workperformed-by").value =
    wo.workperformed_by || window.currentUser.display_name;

  document.getElementById("wo-detail-created-by").innerText =
    wo.created_by || "—";

  bootstrap.Modal
    .getOrCreateInstance(document.getElementById("workOrderDetailModal"))
    .show();
}

