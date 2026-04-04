import { neon } from 'https://esm.sh/@neondatabase/serverless';

// 1. Database Configuration
const connectionString = "postgresql://authenticated@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);

// 2. Initialize UI Elements
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

async function init() {
    try {
        console.log("Starting Geismar Direct Pipe...");
        const result = await sql`SELECT NOW()`;
        
        if (result) {
            statusDot.className = 'bi bi-circle-fill text-success me-1';
            statusText.innerText = "Online (Direct)";
            loadModuleData('parts'); // Default module
        }
    } catch (err) {
        console.error("Connection Failed:", err);
        statusDot.className = 'bi bi-circle-fill text-danger me-1';
        statusText.innerText = "Connection Failed";
        tableContainer.innerHTML = `<div class="p-4 text-danger">Error: ${err.message}</div>`;
    }
}

/**
 * Loads data based on the selected module
 */
async function loadModuleData(moduleName) {
    tableContainer.innerHTML = `<div class="p-4 text-muted">Fetching ${moduleName}...</div>`;
    
    // Map UI names to your actual SQL tables
    const tableMap = {
        'parts': 'parts', // Change these if your SQL tables have different names
        'work-orders': 'work_orders',
        'assets': 'assets',
        'locations': 'locations',
        'technicians': 'technicians'
    };

    const tableName = tableMap[moduleName];

    try {
        const data = await sql(`SELECT * FROM ${tableName} LIMIT 50`);
        renderTable(data);
    } catch (err) {
        tableContainer.innerHTML = `<div class="p-4 text-warning text-center">
            Table '${tableName}' not found or empty.<br>
            <small>Verify table name in Neon SQL Editor.</small>
        </div>`;
    }
}

function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-4 text-center">No records found.</div>`;
        return;
    }

    let html = `<table class="table table-hover mb-0"><thead><tr>`;
    Object.keys(data[0]).forEach(key => html += `<th>${key.toUpperCase()}</th>`);
    html += `</tr></thead><tbody>`;

    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => html += `<td>${val || '-'}</td>`);
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
    document.getElementById('data-count').innerText = `${data.length} Records Found`;
}

// Attach to window so the HTML onclick can find it
window.loadModuleData = loadModuleData;

// Boot
init();
