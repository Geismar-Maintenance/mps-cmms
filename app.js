import { neon } from 'https://esm.sh/@neondatabase/serverless';

let sql = null;

// Combined Mapping for all your Geismar tables
const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

// UI Selectors
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

// 1. Handle the Connection Login
document.getElementById('btn-connect').addEventListener('click', async () => {
    const password = document.getElementById('db-password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (!password) {
        errorDiv.innerText = "Password required.";
        return;
    }

    // Use your pooled connection string
    const connectionString = `postgresql://neondb_owner:${password}@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    
    try {
        errorDiv.innerText = "Connecting to Geismar Node...";
        const tempSql = neon(connectionString);
        
        // Test connection
        await tempSql`SELECT 1`;
        
        // Success: Clear overlay and set global sql object
        sql = tempSql;
        document.getElementById('login-overlay').style.display = 'none';
        statusDot.className = 'bi bi-circle-fill text-success me-2';
        statusText.innerText = "Online (Authenticated)";
        
        // Load default view
        loadModuleData('parts');
    } catch (err) {
        console.error("Auth Error:", err);
        errorDiv.innerText = "Invalid Password or Access Denied.";
    }
});

// 2. Fetch Data using the established SQL connection
async function loadModuleData(moduleKey) {
    if (!sql) return;
    
    const tableName = TABLE_MAP[moduleKey];
    tableContainer.innerHTML = `<div class="p-5 text-center text-muted">
        <div class="spinner-border spinner-border-sm me-2"></div> Querying ${tableName}...
    </div>`;

    try {
        // Fetch rows using the serverless driver
        const data = await sql(`SELECT * FROM ${tableName} LIMIT 100`);
        renderTable(data);
    } catch (err) {
        console.error(`Query Error:`, err);
        tableContainer.innerHTML = `
            <div class="p-5 text-center text-warning">
                <i class="bi bi-exclamation-triangle fs-2"></i><br>
                Error accessing <strong>${tableName}</strong>. Check table permissions.
            </div>`;
    }
}

// 3. Render the Bootstrap Table
function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-5 text-center text-muted">No records found.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
                <thead class="table-light"><tr>`;
    
    // Headers - replace underscores with spaces for cleaner look
    Object.keys(data[0]).forEach(key => {
        html += `<th class="small fw-bold text-muted text-uppercase">${key.replace('_', ' ')}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Rows
    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td>${val === null ? '-' : val}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
}

// Make functions available to the HTML onclick events
window.loadModuleData = loadModuleData;
window.showModule = function(moduleId) {
    // UI update for sidebar
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    // Trigger data load
    document.getElementById('module-title').innerText = moduleId.replace('-', ' ').toUpperCase();
    loadModuleData(moduleId);
};
