const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let allWorkOrders = [];
let postReceiveAction = null;
let partsEntryMode = "sidebar"; // 'sidebar' | 'dashboard

window.currentUser = null;

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

window.currentUser = null;

async function submitLogin() {
  const username = document.getElementById("login-username").value.trim();
  const pin = document.getElementById("login-pin").value.trim();
  const err = document.getElementById("login-error");

  err.style.display = "none";

  if (!username || !pin) {
    err.textContent = "Username and PIN required";
    err.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/lookups?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    window.currentUser = data;

    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-shell").style.display = "block";

    // optional: show user name somewhere
    console.log("Logged in as", data.display_name);

  } catch (e) {
    err.textContent = e.message;
    err.style.display = "block";
  }
}

});
