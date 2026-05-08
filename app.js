/* ======================================================
   GLOBAL STATE
   ====================================================== */
const API_BASE = "https://mps-geismar-backend-hkxb.vercel.app";

let allWorkOrders = [];
let postReceiveAction = null;
let partsEntryMode = "sidebar";

window.currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("hidden.bs.modal", () => {
    document.activeElement.blur();
  });
});

/* ======================================================
   NAV HELPERS
   ====================================================== */
window.loadModule = function (moduleName, filters = {}) {
  window.currentModuleFilters = filters;
  switchModule(moduleName);
};

window.goToWorkOrders = function (filter) {
  switch (filter) {
    case "open":
      loadModule("workorders", { status: "open" });
      break;
    case "overdue":
      loadModule("workorders", { status: "open", due: "overdue" });
      break;
    case "week":
      loadModule("workorders", { status: "open", due: "this_week" });
      break;
    default:
      loadModule("workorders");
  }
};

/* ======================================================
   LOGIN
   ====================================================== */

window.submitLogin = async function (e) {
  e.preventDefault();

  const usernameEl = document.getElementById("login-username");
  const pinEl = document.getElementById("login-pin");
  const err = document.getElementById("login-error");

  const username = usernameEl ? usernameEl.value.trim() : "";
  const pin = pinEl ? pinEl.value.trim() : "";

  if (err) err.style.display = "none";

  if (!username || !pin) {
    if (err) {
      err.textContent = "Username and PIN required";
      err.style.display = "block";
    }
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

    const label = document.getElementById("current-user-label");
    if (label) {
      label.textContent = `Logged in as ${data.display_name}`;
    }

    const loginScreen = document.getElementById("login-screen");
    if (loginScreen) loginScreen.style.display = "none";

    const appShell = document.getElementById("app-shell");
    if (appShell) appShell.style.display = "block";


switchModule("dashboard", document.querySelector(
  "#module-nav button[onclick*='dashboard']"))

    console.log("Logged in as", data.display_name);

  } catch (e) {
    console.error("Login error:", e);

    if (err) {
      err.textContent = e.message;
      err.style.display = "block";
    }
  }
};

/* ======================================================
   LOGOUT
   ====================================================== */
window.logout = function () {
  window.currentUser = null;

  // Hide app, show login
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";

  // Clear login fields
  document.getElementById("login-username").value = "";
  document.getElementById("login-pin").value = "";

  // Clear user label
  document.getElementById("current-user-label").textContent = "";
};

async function submitPinChange() {
  const currentPin = document.getElementById('pin-current').value;
  const newPin = document.getElementById('pin-new').value;
  const confirmPin = document.getElementById('pin-confirm').value;
  const errorEl = document.getElementById('pin-change-error');

  // Basic Frontend Validation
  if (newPin !== confirmPin) {
    errorEl.textContent = "New PINs do not match.";
    errorEl.style.display = 'block';
    return;
  }

  if (newPin.length < 4) {
    errorEl.textContent = "PIN must be at least 4 digits.";
    errorEl.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'changePin',
         username: currentUser.username,
        currentPin: currentPin,
        newPin: newPin
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert("PIN updated successfully.");
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('changePinModal'));
      modal.hide();
      // Clear inputs
      document.getElementById('pin-current').value = '';
      document.getElementById('pin-new').value = '';
      document.getElementById('pin-confirm').value = '';
    } else {
      errorEl.textContent = data.error || "Failed to update PIN.";
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = "Server error. Please try again.";
    errorEl.style.display = 'block';
  }
};

/* ======================================================
   NAVIGATION
   ====================================================== */
window.switchModule = async function (moduleName, el) {

  if (moduleName === "dashboard") {
    const res = await fetch("dashboard.html");
    document.getElementById("app-root").innerHTML = await res.text();
    if (typeof loadDashboard === "function") loadDashboard();

  } else if (moduleName === "parts-history") {
    const res = await fetch("parthistory.html");
    document.getElementById("app-root").innerHTML = await res.text();
    if (typeof loadPartsHistory === "function") loadPartsHistory();

  } else {
      if (moduleName === "wo-history") loadWOHistory();
  if (moduleName === "workorders") loadWorkOrders();
  if (moduleName === "pm") loadPMView();
  if (moduleName === "pm-management") loadPMManagement();
  if (moduleName === "parts") loadParts();
  if (moduleName === "locations") {loadLocations();
  if (moduleName === "reports") loadReports();

    document.querySelectorAll(".module").forEach(m => {
      m.classList.remove("active");
      m.style.display = "none";
    });

    const target = document.getElementById(`module-${moduleName}`);
    if (target) {
      target.classList.add("active");
      target.style.display = "block";
    }
  }

  // nav highlighting
  document.querySelectorAll("#module-nav .nav-link").forEach(l =>
    l.classList.remove("active")
  );
  if (el) el.classList.add("active");
};
  );
  if (el) el.classList.add("active");
};

