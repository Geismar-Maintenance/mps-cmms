alert("app.js loaded");

function switchModule(moduleName, el) {
  alert("Switching to: " + moduleName);

  document.querySelectorAll(".module").forEach(section => {
    section.classList.remove("active");
  });

  const target = document.getElementById("module-" + moduleName);
  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll("#module-nav .nav-link").forEach(link => {
    link.classList.remove("active");
  });

  if (el) {
    el.classList.add("active");
  }
}
