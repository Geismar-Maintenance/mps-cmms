const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let allWorkOrders = [];
let postReceiveAction = null;
let partsEntryMode = "sidebar"; // 'sidebar' | 'dashboard

window.loadModule = function (moduleName, filters = {}) {
    // Store filters globally so target module can read them
  window.currentModuleFilters = filters;
   // Switch visible module
  switchModule(moduleName);
};

window.goToWorkOrders = function (filter) {
  switch (filter) {
    case 'open':
      loadModule('workorders', { status: 'open' });
      break;
    case 'overdue':
      loadModule('workorders', { status: 'open', due: 'overdue' });
      break;
    case 'week':
      loadModule('workorders', { status: 'open', due: 'this_week' });
      break;
    default:
      loadModule('workorders');
  }
};

/* ======================================================
   NAVIGATION
   ====================================================== */
window.switchModule = function (moduleName, el) {
  // Hide all modules
  document.querySelectorAll(".module").forEach(m => {
    m.classList.remove("active");
    m.style.display = "none";
  });

   
  // Show target module
  const target = document.getElementById(`module-${moduleName}`);
  if (target) {
    target.classList.add("active");
    target.style.display = "block";
  }
  
  // Update nav UI
   document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );
  if (el) el.classList.add("active");

  // Module-specific loading
  if (moduleName === "dashboard") loadDashboard();
  if (moduleName === "parts-history") loadPartsHistory();
  if (moduleName === "wo-history") loadWOHistory();
  if (moduleName === "workorders") loadWorkOrders();
   if (moduleName === "pm") loadPMView();  
  if (moduleName === 'pm-management') loadPMManagement();
   if (moduleName === "parts") loadParts();
};

/* ======================================================
   APP INIT
   ====================================================== */
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});
