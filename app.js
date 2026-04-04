import { neon } from 'https://esm.sh/@neondatabase/serverless';

// 1. Connection using your Authenticated Pooler
const connectionString = "postgresql://authenticated@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

// 2. UI Elements
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

// 3. Table Mapping (Linking your Sidebar to your SQL Tables)
const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

/**
 * Initializes the connection and loads the default view
 */
async function init() {
    try {
        console.log("Checking DB Heartbeat...");
        const result = await sql`SELECT NOW()`;
        
        if (result) {
            statusDot.className = 'bi bi-circle-fill text-success me-2';
            statusText.innerText = "Online (Direct)";
            loadModuleData('parts'); // Initial load
        }
    } catch (err) {
        console.error("Critical Connection Error:", err);
        statusDot.className = 'bi bi-circle-fill text-danger me-2';
        statusText.innerText = "Connection Failed";
        tableContainer.innerHTML = `<div class="p-5 text-center text-danger">
            <h6>Database Access Denied</h6>
            <small>${err.message}</small>
        </div>`;
    }
}

/**
 * Fetches and renders data for a specific module
 */
async function loadModuleData(moduleKey) {
    const tableName = TABLE_MAP[moduleKey];
    tableContainer.innerHTML = `<div class="p-5 text-center text-muted">Loading ${tableName}...</div>`;

    try {
        // Query the specific table provided in your list
        const data = await sql(`SELECT * FROM ${tableName} LIMIT 100`);
        renderTable(data);
    } catch (err) {
        console.error(`Error loading ${tableName}:`, err);
        tableContainer.innerHTML = `<div class="p-5 text-center text-warning">
            <i class="bi bi-exclamation-triangle d-block mb-2 fs-3"></i>
            Table <strong>${tableName}</strong> could not be loaded.<br>
            <small>Verify schema permissions in Neon Console.</small>
        </div>`;
    }
}

/**
 * Builds the HTML table dynamically
 */
function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-5 text-center text-muted">No records found in this table.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
                    <thead class="table-light"><tr>`;
    
    // Header row
    Object.keys(data[0]).forEach(key => {
        html += `<th class="text-uppercase small fw-bold text-muted">${key.replace('_', ' ')}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Data rows
    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td>${val === null ? '<span class="text-muted">-</span>' : val}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
}

// Global exposure for the HTML onclick events
window.loadModuleData = loadModuleData;

// Run it
init();
