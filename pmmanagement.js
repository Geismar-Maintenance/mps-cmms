/* ======================================================
   PM MANAGEMENT (ADMIN ONLY)
   ====================================================== */

let pmTemplates = [];
let selectedPMTemplateId = null;


/* ======================================================
   ENTRY POINT
   ====================================================== */

function loadPMManagement() {
  loadPMTemplates();
  clearPMWorkspace();
}

/* ======================================================
   TEMPLATE LIST
   ====================================================== */

async function loadPMTemplates() {
  const list = document.getElementById('pm-template-list');

  list.innerHTML = `
    <div class="list-group-item text-muted">
      Loading PM templates…
    </div>
  `;

  try {
    const res = await fetch('${API_BASE}/api/pm?action=adminLoad`);
    const data = await res.json();

    pmTemplates = data.templates || [];

    if (pmTemplates.length === 0) {
      list.innerHTML = `
        <div class="list-group-item text-muted">
          No PM templates found.
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    pmTemplates.forEach(t => {
      const item = document.createElement('button');
      item.className = 'list-group-item list-group-item-action';
      item.textContent = `${t.assetname} (${t.pm_engine_type})`;
      item.onclick = () => selectPMTemplate(t.pm_template_id);
      list.appendChild(item);
    });

  } catch (err) {
    console.error('Failed to load PM templates:', err);
    list.innerHTML = `
      <div class="list-group-item text-danger">
        Error loading PM templates.
      </div>
    `;
  }
}

/* ======================================================
   TEMPLATE SELECTION
   ====================================================== */

function selectPMTemplate(templateId) {
  selectedPMTemplateId = templateId;

  const template = pmTemplates.find(
    t => t.pm_template_id === templateId
  );

  if (!template) return;

  renderPMTemplateWorkspace(template);
}

/* ======================================================
   WORKSPACE
   ====================================================== */

function clearPMWorkspace() {
  const workspace = document.getElementById('pm-management-workspace');
  workspace.innerHTML = `
    <div class="text-muted text-center py-5">
      Select a PM template to begin managing blocks, tasks, and requirements.
    </div>
  `;
}

function renderPMTemplateWorkspace(template) {
  const workspace = document.getElementById('pm-management-workspace');

  workspace.innerHTML = `
    <h4 class="mb-3">
      ${template.assetname}
    </h4>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link active" onclick="renderTemplateInfo()">Template Info</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderTriggerBlocks()">Trigger Blocks</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderTaskTiers()">Task Tiers</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderTasks()">Tasks</a>
      </li>
    </ul>

    <div id="pm-template-editor">
      <!-- dynamic content -->
    </div>
  `;

  renderTemplateInfo();
}
