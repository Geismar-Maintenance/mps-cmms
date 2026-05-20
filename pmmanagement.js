/* ======================================================
   PM MANAGEMENT (ADMIN ONLY)
   ====================================================== */

let pmTemplates = [];
let selectedPMTemplateId = null;
let currentTaskId = null;


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
    const res = await fetch(`${API_BASE}/api/pm?action=adminLoad`);
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

 item.textContent = `${t.description || t.assetname} (${t.pm_engine_type})`;

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
      Select a PM template to begin managing triggers, tasks, and requirements.
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
        <a class="nav-link" onclick="renderTemplateTriggers()">Triggers</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderTaskTiers()">Task Tiers</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderTasks()">Tasks</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" onclick="renderPreview()">Preview</a>
      </li>

    </ul>

    <div id="pm-template-editor">
      <!-- dynamic content -->
    </div>
  `;

  renderTemplateInfo();
}
function renderTemplateInfo() {
  const editor = document.getElementById("pm-template-editor");

  if (!selectedPMTemplateId) {
    editor.innerHTML = `<div class="text-muted">No template selected.</div>`;
    return;
  }

  const template = pmTemplates.find(
    t => t.pm_template_id === selectedPMTemplateId
  );

  if (!template) {
    editor.innerHTML = `<div class="text-danger">Template not found.</div>`;
    return;
  }

  editor.innerHTML = `
    <div class="mb-3">
      <h5>PM Template – ${template.assetname}</h5>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label fw-bold">Asset</label>
        <div>${template.assetname}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">Engine Type</label>
        <div class="text-capitalize">${template.pm_engine_type}</div>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6">
        <label class="form-label fw-bold">Status</label>
        <div>
          <span class="badge ${
            template.active ? "bg-success" : "bg-secondary"
          }">
            ${template.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label fw-bold">Description</label>
      <textarea
        class="form-control"
        id="pm-template-description"
        rows="3"
      >${template.description || ""}</textarea>
    </div>

    <div class="d-flex gap-2 mb-4">
      <button
        class="btn btn-primary"
        onclick="saveTemplateInfo()"
      >
        Save Changes
      </button>

      <button
        class="btn btn-outline-secondary"
        onclick="toggleTemplateActive(${template.pm_template_id})"
      >
        ${template.active ? "Deactivate" : "Activate"}
      </button>
    </div>

    <hr />

    <h6 class="fw-bold">Definition Health</h6>
    <ul id="pm-template-warnings" class="text-muted">
      <li>Checking definitions…</li>
    </ul>
  `;

  renderTemplateWarnings(template.pm_template_id);
}
async function saveTemplateInfo() {
  const description = document
    .getElementById("pm-template-description")
    .value;

  await fetch(`${API_BASE}/api/pm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveTemplate",
      pm_template_id: selectedPMTemplateId,
      description
    })
  });

  const template = pmTemplates.find(
    t => t.pm_template_id === selectedPMTemplateId
  );
  if (template) template.description = description;
}

async function toggleTemplateActive(templateId) {
  await fetch(`${API_BASE}/api/pm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggleTemplate",
      pm_template_id: templateId
    })
  });

  const t = pmTemplates.find(p => p.pm_template_id === templateId);
  if (t) t.active = !t.active;

  renderTemplateInfo();
}

async function renderTemplateWarnings(templateId) {
  const list = document.getElementById("pm-template-warnings");

  try {
    const res = await fetch(
      `${API_BASE}/api/pm?action=templateHealth&templateId=${templateId}`
    );
    const data = await res.json();

    list.innerHTML = "";

    if (!data.warnings || data.warnings.length === 0) {
      list.innerHTML = `<li class="text-success">No issues detected.</li>`;
      return;
    }

    data.warnings.forEach(w => {
      const li = document.createElement("li");
      li.textContent = w;
      li.classList.add("text-warning");
      list.appendChild(li);
    });

  } catch {
    list.innerHTML = `<li class="text-danger">Failed to load warnings.</li>`;
  }
}

async function renderTemplateTriggers() {
  if (!selectedPMTemplateId) return;

  const container = document.getElementById("pm-template-editor");

  container.innerHTML = `
    <h5 class="mb-3">Triggers</h5>
    <div id="linked-triggers"></div>

    <hr/>

    <h6>Available Triggers</h6>
    <div id="all-triggers"></div>
  `;

  loadLinkedTriggers();
  loadAllTriggers();
}

async function loadLinkedTriggers() {
  const res = await fetch(
    `${API_BASE}/api/pm?action=getTemplateTriggers&templateId=${selectedPMTemplateId}`
  );

  const data = await res.json();

  const container = document.getElementById("linked-triggers");

  container.innerHTML = data.triggers.map(t => `
    <div class="list-group-item d-flex justify-content-between align-items-center">
      <div>
       ${t.name} – ${t.interval_value} ${t.trigger_type === "runtime" ? "hrs" : ""}
      </div>

      <button class="btn btn-sm btn-danger"
        onclick="unlinkTrigger(${t.trigger_block_id})">
        Remove
      </button>
    </div>
  `).join("");
}

async function loadAllTriggers() {
  const res = await fetch(`${API_BASE}/api/pm?action=getTriggers`);
  const data = await res.json();

  const container = document.getElementById("all-triggers");

  container.innerHTML = data.triggers.map(t => `
    <div class="list-group-item d-flex justify-content-between align-items-center">
      <div>
       ${t.name} – ${t.interval_value} ${t.trigger_type === "runtime" ? "hrs" : ""}
      </div>

      <button class="btn btn-sm btn-primary"
        onclick="linkTrigger(${t.trigger_block_id})">
        Add
      </button>
    </div>
  `).join("");
}
async function linkTrigger(triggerId) {
  await fetch(`${API_BASE}/api/pm?action=linkTriggerTemplate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trigger_block_id: triggerId,
      pm_template_id: selectedPMTemplateId
    })
  });

  renderTemplateTriggers();
}
async function unlinkTrigger(triggerId) {
  await fetch(`${API_BASE}/api/pm?action=unlinkTriggerTemplate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trigger_block_id: triggerId,
      pm_template_id: selectedPMTemplateId
    })
  });

  renderTemplateTriggers();
}

async function renderTaskTiers() {
  const editor = document.getElementById("pm-template-editor");

  if (!selectedPMTemplateId) return;

  editor.innerHTML = `
    <h5 class="mb-3">Task Tiers</h5>

    <div id="pm-tier-list">Loading tiers…</div>

    <hr />

    <h6>Add New Tier</h6>
    <div class="row g-2 mb-3">
      <div class="col-md-5">
        <input
          type="text"
          id="new-tier-name"
          class="form-control"
          placeholder="Tier name (e.g. 2000-Hour)"
        />
      </div>
      <div class="col-md-3">
        <input
          type="number"
          id="new-tier-order"
          class="form-control"
          placeholder="Order"
        />
      </div>
      <div class="col-md-4">
        <button class="btn btn-primary w-100" onclick="addTaskTier()">
          Add Tier
        </button>
      </div>
    </div>
  `;

  loadTaskTiers();
}

async function loadTaskTiers() {
  const container = document.getElementById("pm-tier-list");

  try {
    const res = await fetch(`${API_BASE}/api/pm?action=getTaskTiers&templateId=${selectedPMTemplateId}`);
    const data = await res.json();

    if (data.tiers.length === 0) {
      container.innerHTML =
        `<div class="text-muted">No task tiers defined.</div>`;
      return;
    }

    container.innerHTML = `
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Order</th>
            <th>Tier Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data.tiers.map(t => `
            <tr>
              <td>${t.tier_order}</td>
              <td>${t.tier_name}</td>
              <td>
                <button
                  class="btn btn-sm btn-outline-danger"
                  onclick="removeTaskTier(${t.pm_task_tier_id})"
                >
                  Remove
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

  } catch {
    container.innerHTML =
      `<div class="text-danger">Failed to load task tiers.</div>`;
  }
}
async function loadTaskTierOptions() {
  const select = document.getElementById("task-tier");
  if (!select) return;

  select.innerHTML = `<option value="">Select Tier</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/pm?action=getTaskTiers`);
    const data = await res.json();

    data.tiers.forEach(tier => {
      const opt = document.createElement("option");
      opt.value = tier.pm_task_tier_id;
      opt.textContent = tier.tier_name;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load task tiers:", err);
    select.innerHTML =
      `<option value="">Error loading tiers</option>`;
  }
}

async function addTaskTier() {
  const name = document.getElementById("new-tier-name").value.trim();
  const order = Number(document.getElementById("new-tier-order").value);

  if (!name || !order) {
    alert("Tier name and order are required.");
    return;
  }

 await fetch(`${API_BASE}/api/pm?action=addTaskTier`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tier_name: name,
    tier_order: order
  })
});

  renderTaskTiers();
}

async function removeTaskTier(tierId) {
  const confirmDelete = confirm(
    "Remove this task tier? Tasks assigned to it will block removal."
  );
  if (!confirmDelete) return;

const res = await fetch(`${API_BASE}/api/pm?action=removeTaskTier`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pm_task_tier_id: tierId
  })
});

  if (!res.ok) {
    alert("Tier cannot be removed because tasks exist.");
    return;
  }

  renderTaskTiers();
}

async function renderTasks() {
  const editor = document.getElementById("pm-template-editor");

  editor.innerHTML = `
    <!-- TASKS HEADER -->
    <h5 class="mb-3">Tasks</h5>

    <!-- TASK LIST -->
    <div id="pm-task-list">Loading tasks…</div>

    <hr />

    <!-- ADD NEW TASK -->
    <h6>Add New Task</h6>
    <div class="row g-2 mb-3">
      <div class="col-md-4">
        <input id="task-desc" class="form-control"
               placeholder="Task description" />
      </div>

      <div class="col-md-3">
        <select id="task-tier" class="form-select"></select>
      </div>

      <div class="col-md-3">
        <select id="task-discipline" class="form-select">
          <option value="mechanical">Mechanical</option>
          <option value="electrical">Electrical</option>
        </select>
      </div>

      <div class="col-md-1">
        <input id="task-order" class="form-control" type="number"
               placeholder="Ord" />
      </div>

      <div class="col-md-1">
        <button class="btn btn-primary w-100"
                onclick="addTask()">
          Add
        </button>
      </div>
    </div>

    <!-- ============================= -->
    <!-- TASK REQUIREMENTS SECTION     -->
    <!-- ============================= -->

    <hr />

    <h6>Task Requirements</h6>

    <!-- REQUIREMENTS LIST (renders here) -->
    <div id="task-requirements"
         class="list-group mb-3">
      <div class="text-muted">
        Select a task to manage its requirements.
      </div>
    </div>

    <!-- ADD REQUIREMENT FORM -->
    <div class="row g-2 align-items-center">
      <div class="col-md-6">
        <input id="req-name"
               class="form-control"
               placeholder="Requirement description" />
      </div>

      <div class="col-md-2">
        <input id="req-order"
               type="number"
               class="form-control"
               placeholder="Seq" />
      </div>

      <div class="col-md-2 form-check mt-2">
        <input id="req-reading"
               type="checkbox"
               class="form-check-input" />
        <label class="form-check-label">
          Requires Reading
        </label>
      </div>

<button type="button"
        class="btn btn-primary w-100"
        onclick="addRequirement(currentTaskId)">
  Add Requirement
</button>

      </div>
    </div>
  `;

  await loadTaskTierOptions();
  await loadTasks();
}

async function loadTasks() {
  const res = await fetch(
    `${API_BASE}/api/pm?action=getTasks&templateId=${selectedPMTemplateId}`
  );
  const { tasks } = await res.json();

  const container = document.getElementById("pm-task-list");
  if (tasks.length === 0) {
    container.innerHTML = `<div class="text-muted">No tasks defined.</div>`;
    return;
  }

  const grouped = {};
  tasks.forEach(t => {
    grouped[t.tier_name] ??= [];
    grouped[t.tier_name].push(t);
  });

  container.innerHTML = Object.keys(grouped).map(tier => `
    <h6 class="mt-3">${tier}</h6>
    <ul class="list-group mb-2">
      ${grouped[tier].map(t => `
<li class="list-group-item d-flex justify-content-between align-items-center"
    onclick="selectTask(${t.pm_task_template_id})">

  <span>
    ${t.task_description}
    <span class="text-muted">(${t.discipline})</span>
  </span>

  <button class="btn btn-sm btn-outline-danger"
          onclick="event.stopPropagation(); removeTask(${t.pm_task_template_id})">
    Remove
  </button>
</li>
      `).join("")}
    </ul>
  `).join("");
}
async function addTask() {
  const desc = document.getElementById("task-desc").value.trim();
  const tierId = document.getElementById("task-tier").value;
  const disc = document.getElementById("task-discipline").value;
  const order = Number(document.getElementById("task-order").value);

  if (!desc || !tierId || !order) {
    alert("All fields required.");
    return;
  }

  await fetch(`${API_BASE}/api/pm?action=addTask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pm_template_id: selectedPMTemplateId,
      pm_task_tier_id: tierId,
      task_description: desc,
      discipline: disc,
      sequence_order: order
    })
  });

  renderTasks();
}

window.selectTask = function (taskId) {
  currentTaskId = taskId;
  renderRequirements(taskId);
};


async function renderRequirements(taskId) {
  const res = await fetch(
    `${API_BASE}/api/pm?action=getTaskRequirements&taskId=${taskId}`
  );
  const { requirements } = await res.json();

  const container = document.getElementById("task-requirements");

  let html = "";

  if (requirements.length === 0) {
    html = `<div class="text-muted">No requirements defined.</div>`;
  } else {
    html = requirements.map(r => `
      <div class="list-group-item d-flex justify-content-between">
        <div>
          ${r.sequence_order}. ${r.requirement_name}
          <span class="text-muted">
            (${r.requires_reading ? "Reading" : "Check"})
          </span>
        </div>
        <button class="btn btn-sm btn-outline-danger"
          onclick="removeRequirement(${r.pm_task_requirement_id}, ${taskId})">
          Remove
        </button>
      </div>
    `).join("");
  }

  container.innerHTML = html;
}
async function addRequirement(taskId) {
  if (!taskId) {
    alert("Please select a task first.");
    return;
  }

  const nameInput = document.getElementById("req-name");
  const orderInput = document.getElementById("req-order");
  const readingInput = document.getElementById("req-reading");

  const name = nameInput.value.trim();
  const order = Number(orderInput.value);
  const requiresReading = readingInput.checked;

  if (!name || !order) {
    alert("Name and sequence are required.");
    return;
  }

  await fetch(`${API_BASE}/api/pm?action=addTaskRequirement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pm_task_template_id: taskId,
      requirement_name: name,
      sequence_order: order,
      requires_reading: requiresReading
    })
  });

  // optional but recommended
  nameInput.value = "";
  orderInput.value = "";
  readingInput.checked = false;

  renderRequirements(taskId);
}

async function removeRequirement(reqId, taskId) {
  if (!confirm("Remove this requirement?")) return;

  await fetch(`${API_BASE}/api/pm?action=removeTaskRequirement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pm_task_requirement_id: reqId
    })
  });

  renderRequirements(taskId);
}

async function renderPreview() {
  const editor = document.getElementById("pm-template-editor");

  editor.innerHTML = `<p>Loading preview...</p>`;

  try {
    const res = await fetch(
      `${API_BASE}/api/pm?action=previewTemplate&templateId=${selectedPMTemplateId}`
    );

    const data = await res.json();

    let html = `
      <div class="alert alert-info">
        Preview Mode – No data saved
      </div>
    `;

    let lastGroup = "";

    // ✅ group requirements by task
    const reqMap = {};
    data.requirements.forEach(r => {
      reqMap[r.pm_task_template_id] ??= [];
      reqMap[r.pm_task_template_id].push(r);
    });

    data.tasks.forEach(task => {

      const group = `${task.discipline} - ${task.tier_name}`;

      if (group !== lastGroup) {
        html += `<h5 class="mt-3">${group}</h5>`;
        lastGroup = group;
      }
     const reqs = reqMap[task.pm_task_template_id] || [];
     const hasRequirements = reqs.length > 0;

html += `
  <div class="card mb-2">
    <div class="card-body">

      <!-- TASK HEADER -->
      <div class="d-flex align-items-center">

      
       <!-- LEFT SIDE (task text) -->
        <div style="flex:1">
          <strong>${task.task_description}</strong>

          ${
            !hasRequirements
              ? `<span class="text-success ms-2 small">(No requirements)</span>`
              : `<span class="text-muted ms-2 small">(Requires checks)</span>`
          }
        </div>

        <!-- TASK CHECKBOX -->
        <input type="checkbox"
               class="me-2"
               ${hasRequirements ? "disabled" : ""}>
      </div>
`;
      reqs.forEach(r => {
        html += `
          <div class="d-flex align-items-center mt-2">
            <div style="flex:1">
              ${r.requirement_name}
            </div>

            ${
              r.requires_reading
                ? `<input type="number" class="form-control form-control-sm"
                         style="width:120px;" placeholder="value">`
                : `<input type="checkbox">`
            }
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    editor.innerHTML = html;

  } catch (err) {
    console.error("Preview failed:", err);
    editor.innerHTML = `<div class="text-danger">Preview failed</div>`;
  }
}

/* ======================================================
   ADD TEMPLATE MODAL
   ====================================================== */

function openAddTemplateModal() {
  loadTemplateAssets();

  const modal = new bootstrap.Modal(
    document.getElementById('addTemplateModal')
  );

  modal.show();
}

async function loadTemplateAssets() {
  try {
    const res = await fetch(`${API_BASE}/api/assets`);
    const data = await res.json();

    const select = document.getElementById('templateAsset');
    select.innerHTML = '';

    data.forEach(asset => {
      const opt = document.createElement('option');
      opt.value = asset.assetid;
      opt.textContent = asset.assetname;
      select.appendChild(opt);
    });

  } catch (err) {
    console.error("Failed to load assets:", err);
  }
}

async function saveTemplate() {
  const asset_id = document.getElementById('templateAsset').value;
  const pm_engine_type = document.getElementById('templateType').value;
  const description = document.getElementById('templateDescription').value;

  if (!asset_id) {
    alert("Asset is required");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/pm?action=addTemplate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset_id,
        pm_engine_type,
        description
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Failed to create template");
      return;
    }

    // ✅ Close modal
    const modalEl = document.getElementById('addTemplateModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    // ✅ Reload templates
    await loadPMTemplates();

    // ✅ OPTIONAL: auto-select new template
    selectPMTemplate(data.pm_template_id);

  } catch (err) {
    console.error("Create template error:", err);
    alert("Error creating template");
  }
}

