/**
 * GEISMAR MAINTENANCE PORTAL - REST API MODE
 * Using the Neon REST Endpoint for standard HTTPS data fetching.
 */

const API_BASE = "https://ep-plain-mouse-aeznlgmn.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";

// UI Selectors
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

// Mapping your Geismar tables
const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

/**
 * Initialize and check API health
 */
async function init() {
    try {
        console.log("Pinging Geismar REST Endpoint...");
        
        // A simple GET request to check connectivity
        const response = await fetch(`${API_BASE}/tables`);
        
        if (response.ok) {
            statusDot.className = 'bi bi-circle-fill text-success me-2';
            statusText.innerText = "Online (REST API)";
            loadModuleData('parts'); // Default view
        } else {
            throw new Error(`Server responded with ${response.status}`);
        }
    } catch (err) {
        console.error("REST Connection Failed:", err);
        statusDot.className = 'bi bi-circle-fill text-danger me-2';
        statusText.innerText = "API Offline";
        tableContainer.innerHTML = `
            <div class="p-5 text-center">
                <i class="bi bi-cloud-slash text-danger fs-1"></i>
                <h5 class="mt-3">REST API Connection Failed</h5>
                <code>${err.message}</code>
            </div>`;
    }
}

/**
 * Fetches data for the selected table via REST
 */
async function loadModuleData(moduleKey) {
    const tableName = TABLE_MAP[moduleKey];
    tableContainer.innerHTML = `<div class="p-5 text-center text-muted">Requesting ${tableName} via REST...</div>`;

    try {
        // Neon REST API convention for fetching rows
        const response = await fetch(`${API_BASE}/tables/${tableName}/rows`);
        
        if (!response.ok) throw new Error(`Could not fetch ${tableName}`);
        
        const result = await response.json();
        renderTable(result.data || result); // Neon REST usually wraps data in a 'data' key
    } catch (err) {
        console.error(`REST Query Error:`, err);
        tableContainer.innerHTML = `
            <div class="p-5 text-center text-warning">
                <i class="bi bi-lock-fill fs-2"></i><br>
                REST Access Denied for: <strong>${tableName}</strong>
            </div>`;
    }
}

/**
 * Builds the Bootstrap table
 */
function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-5 text-center text-muted">No records found.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
                    <thead class="table-light"><tr>`;
    
    // Headers
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

window.loadModuleData = loadModuleData;
init();
