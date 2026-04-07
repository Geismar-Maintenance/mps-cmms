document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("#module-nav .nav-link");

  links.forEach(link => {
    link.addEventListener("click", () => {
      const moduleName = link.dataset.module;

      // Hide all modules
      document.querySelectorAll(".module").forEach(section => {
        section.classList.remove("active");
      });

      // Show selected module
      const target = document.getElementById("module-" + moduleName);
      if (target) {
        target.classList.add("active");
      } else {
        console.error("Missing module:", moduleName);
      }

      // Update nav highlight
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  console.log("Navigation initialized"); // <--- PROOF
});
``
