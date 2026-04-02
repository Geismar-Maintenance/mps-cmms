/**
 * MPS-CMMS | Core Application Logic
 * Integrates Neon PostgreSQL via PostgREST API
 */

// --- CONFIGURATION ---
const NEON_CONFIG = {
    projectId: 'your-project-id', // e.g., 'ep-cool-water-123456'
    region: 'us-east-2',          // e.g., 'us-east-2'
    dbSchema: 'public'
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("MPS-CMMS Initialized.");

    // Check for existing session
    if (sessionStorage.getItem('neon_token')) {
        hideAuthOverlay();
        refreshTableData('workorders');
    }

    // Form Submission Listeners
    document.getElementById('formAddPart').addEventListener('submit', (e) => handleFormSubmit(e, 'masterparts'));
    document.getElementById('formAddWO').addEventListener('submit', (e) => handleFormSubmit(e, 'workorders'));

    // Accessibility Fix: Clear aria-hidden when Bootstrap modals are hidden
    document.querySelectorAll('.modal').forEach(modalEl => {
        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl.setAttribute('aria-hidden', 'true');
            document.getElementById('sidebar').removeAttribute('inert');
            document.getElementById('main-content').removeAttribute('inert');
        });
    });
});

// --- AUTHENTICATION ---
function authenticate() {
    const token = document.getElementById('db-token-input').value.trim();
    if (token.length > 20) {
        sessionStorage.setItem('neon_token', token);
        hideAuthOverlay();
        refreshTableData('workorders');
        refreshTableData('masterparts');
    } else {
        alert("Invalid Token. Please provide your Neon Service Role JWT.");
    }
}

function hideAuthOverlay() {
    document.getElementById('auth-overlay').style.setProperty('display', 'none', 'important');
}

// --- DATABASE ACTIONS (API) ---
async function dbAction(method, table, data = null) {
    const token = sessionStorage.getItem('neon_token');
    const url = `https://${NEON_CONFIG.projectId}.${NEON_CONFIG.region}.aws.neon.tech/rest/v1/${table}`;

    const options = {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': token,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }
    return method === 'DELETE' ? null : await response.json();
}

// --- MODULE NAVIGATION ---
function showModule(moduleId) {
    document.querySelectorAll('.module-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    document.getElementById(moduleId).classList.add('active');
    const activeLink = document.querySelector(`[onclick="showModule('${moduleId}')"]`);
    activeLink.classList.add('active');
    document.getElementById('module-title').innerText = activeLink.innerText.trim();

    // Load data for the specific module
    const tableMap = { 'wo-mgmt': 'workorders', 'part-mgmt': 'masterparts' };
    if (tableMap[moduleId]) refreshTableData(tableMap[moduleId]);
}

// --- UI LOGIC ---
function openCreateModal() {
    const activeModule = document.querySelector('.module-section.active').id;
    let modalId = activeModule === 'wo-mgmt' ? 'modalAddWO' : (activeModule === 'part-mgmt' ? 'modalAddPart' : null);

    if (modalId) {
        const modalEl = document.getElementById(modalId);
        modalEl.removeAttribute('aria-hidden'); // Fix for the focus error
        
        // Prevent background focus
        document.getElementById('sidebar').setAttribute('inert', '');
        document.getElementById('main-content').setAttribute('inert', '');

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
    }
}

async function handleFormSubmit(event, table) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    // Clean data types for Postgres
    if (data.Cost) data.Cost = parseFloat(data.Cost);
    if (data.ReorderLevel) data.ReorderLevel = parseInt(data.ReorderLevel);
    if (data.AssetID) data.AssetID = parseInt(data.AssetID);

    try {
        await dbAction('POST', table, data);
        alert("Record saved successfully.");
        event.target.reset();
        bootstrap.Modal.getInstance(event.target.closest('.modal')).hide();
        refreshTableData(table);
    } catch (err) {
        console.error("Submission Error:", err);
        alert("Error saving to Neon. See console for details.");
    }
}

// --- DATA RENDERING ---
async function refreshTableData(table) {
    try {
        const data = await dbAction('GET', table + '?select=*');
        const tbodyId = table === 'workorders' ? 'wo-table-body' : 'parts-table-body';
        const tbody = document.getElementById(tbodyId);
        
        if (!tbody) return;
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            if (table === 'workorders') {
                row.innerHTML = `
                    <td>${item.WOID}</td>
                    <td>${item.AssetID}</td>
                    <td>${item.Description}</td>
                    <td><span class="badge bg-info">${item.Priority || 'Med'}</span></td>
                    <td><span class="badge bg-warning">${item.Status || 'Open'}</span></td>
                    <td>${item.DueDate || '--'}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('workorders', ${item.WOID})">Cancel</button></td>
                `;
            } else if (table === 'masterparts') {
                row.innerHTML = `
                    <td>${item.PartNumber}</td>
                    <td>${item.Manufacturer}</td>
                    <td>${item.Model}</td>
                    <td>$${item.Cost}</td>
                    <td>${item.ReorderLevel}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('masterparts', ${item.PartID})">Remove</button></td>
                `;
            }
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

async function deleteRecord(table, id) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const idColumn = table === 'workorders' ? 'WOID' : 'PartID';
    try {
        await dbAction('DELETE', `${table}?${idColumn}=eq.${id}`);
        refreshTableData(table);
    } catch (err) {
        alert("Delete failed.");
    }
}
