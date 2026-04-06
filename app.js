/*************************************************
 * CMMS Frontend Controller
 * app.js
 *************************************************/

/**
 * Current active module
 * parts | workorders | admin
 */
let currentModule = "parts";

/*************************************************
 * Page Initialize
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  initModuleNavigation();
  switchModule("parts");
});

/*************************************************
 * Module Navigation
 *************************************************/
function initModuleNavigation() {
  const links = document.querySelectorAll("#module-nav .nav-link");

  links.forEach(link => {
    link.addEventListener("click", function () {
      const moduleName = getModuleFromLink(this);
      switchModule(moduleName);
    });
  });
}

/**
 * Determine module name from sidebar link text
 */
function getModuleFromLink(link) {
  const text = link.textContent.toLowerCase();

  if (text.includes("work")) return "workorders";
  if (text.includes("admin")) return "admin";
  return "parts";
}

/**
 * Switch active module
 */
function switchModule(moduleName) {
  currentModule = moduleName;

  // Hide all modules
  document.querySelectorAll(".module").forEach(section => {
    section.classList.remove("active");
  });

  // Show selected module
  const activeSection = document.getElementById("module-" + moduleName);
  if (activeSection) {
    activeSection.classList.add("active");
  }

  // Update sidebar active state
  updateSidebarState(moduleName);

  // Hook for future module-specific logic
  handleModuleLoad(moduleName);
}

/**
 * Highlight active sidebar item
 */
function updateSidebarState(moduleName) {
  const links = document.querySelectorAll("#module-nav .nav-link");

  links.forEach(link => {
    link.classList.remove("active");

    const text = link.textContent.toLowerCase();
    if (
      (moduleName === "parts" && text.includes("parts")) ||
      (moduleName === "workorders" && text.includes("work")) ||
      (moduleName === "admin" && text.includes("admin"))
    ) {
      link.classList.add("active");
    }
  });
}

/*************************************************
 * Module Load Hooks (Future Expansion)
 *************************************************/
function handleModuleLoad(moduleName) {
  switch (moduleName) {
    case "parts":
      onPartsModuleLoad();
      break;

    case "workorders":
      onWorkOrdersModuleLoad();
      break;

    case "admin":
      onAdminModuleLoad();
      break;
  }
}

/*************************************************
 * Parts Management Hooks
 *************************************************/
function onPartsModuleLoad() {
  console.log("Parts Management loaded");

  // Future:
  // loadPartsFromAPI();
  // setupIssuePartModal();
  // setupReceivePartModal();
}

/*************************************************
 * Work Orders Hooks
 *************************************************/
function onWorkOrdersModuleLoad() {
  console.log("Work Orders loaded");

  // Future:
  // loadWorkOrders();
  // setupNewWorkOrderForm();
}

/*************************************************
 * Administration Hooks
 *************************************************/
function onAdminModuleLoad() {
  console.log("Administration loaded");

  // Future:
  // checkAdminPermission();
  // loadAdminTables();
}
``
