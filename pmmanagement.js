function loadPMManagement() {
  // later this will call /api/pm?action=adminLoad
  document.getElementById('pm-template-list').innerHTML = `
    <div class="list-group-item text-muted">
      PM templates will load here.
    </div>
  `;
}
