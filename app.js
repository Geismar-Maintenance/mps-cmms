import { neon } from 'https://esm.sh/@neondatabase/serverless';

// 1. Your Anonymous Connection String
const connectionString = "postgresql://anonymous@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

// 2. UI Selectors
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

// 3. Mapping your specific Geismar tables to the sidebar
const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

/**
 * Connect and load initial data
 */
async function init() {
    try {
        console.log("Connecting to Geismar Node via Anonymous Pooler...");
        // Test connection
        const result = await sql`SELECT 1`;
        
        if (result) {
            statusDot.className = 'bi bi-circle-fill text-success me-2';
            statusText.innerText = "Online (Anonymous)";
            loadModuleData('parts'); // Default view
        }
    } catch (err) {
        console.error("Connection Failed:", err);
        statusDot.className = 'bi bi-circle-fill text-danger me-2';
        statusText.innerText = "Connection Failed";
        tableContainer.innerHTML = `
            <div class="p-5 text-center">
                <i class="bi bi-shield-exclamation text-danger fs-1"></i>
                <h5 class="mt-3">Anonymous Access Denied</h5>
                <code class="d-block mb-3">${err.message}</code>
                <div class="alert alert-info d-inline-block shadow-sm">
                    Ensure the <strong>anonymous</strong> role has been granted 
                    SELECT permissions in the Neon SQL Editor.
                </div>
            </div>`;
    }
}

/**
 * Fetches data for the selected management module
 */
async function loadModuleData(moduleKey) {
    const tableName = TABLE_MAP[moduleKey];
    tableContainer.innerHTML = `
        <div class="p-5 text-center text-muted">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>
            Accessing ${tableName}...
        </div>`;

    try {
        const data = await sql(`SELECT * FROM ${tableName} LIMIT 100`);
        renderTable(data);
    } catch (err) {
        console.error(`Query Error:`, err);
        tableContainer.innerHTML = `
            <div class="p-5 text-center text-warning">
                <i class="bi bi-lock-fill fs-2"></i><br>
                Permissions required for table: <strong>${tableName}</strong>
            </div>`;
    }
}

/**
 * Generates the Bootstrap table from database results
 */
function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-5 text-center text-muted">No records found.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
                    <thead class="table-light"><tr>`;
    
    // Create headers from keys
    Object.keys(data[0]).forEach(key => {
        html += `<th class="small fw-bold text-muted text-uppercase">${key.replace('_', ' ')}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Create rows from values
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

// Ensure the HTML buttons can trigger the load
window.loadModuleData = loadModuleData;

// Start the engine
init();
