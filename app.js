import { neon } from 'https://esm.sh/@neondatabase/serverless';

/**
 * GEISMAR MAINTENANCE PORTAL - ANONYMOUS ACCESS MODE
 * Uses the Neon Authenticated Pooler without a password.
 */

// We use the 'authenticated' user which Neon allows for public-facing apps
const connectionString = "postgresql://authenticated@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

// UI Elements
const statusDot = document.getElementById('db-status-dot');
const statusText = document.getElementById('db-status-text');
const tableContainer = document.getElementById('data-table-container');

const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

async function init() {
    try {
        console.log("Attempting Anonymous Connection...");
        // Heartbeat check
        const result = await sql`SELECT 1`;
        
        if (result) {
            statusDot.className = 'bi bi-circle-fill text-success me-2';
            statusText.innerText = "Online (Anonymous)";
            loadModuleData('parts'); 
        }
    } catch (err) {
        console.error("Anonymous Connection Failed:", err);
        statusDot.className = 'bi bi-circle-fill text-danger me-2';
        statusText.innerText = "Access Denied";
        
        // Detailed feedback for Geismar team
        tableContainer.innerHTML = `
            <div class="p-5 text-center">
                <i class="bi bi-shield-lock fs-1 text-danger"></i>
                <h5 class="mt-3">Database Locked</h5>
                <p class="text-muted small">${err.message}</p>
                <div class="alert alert-secondary d-inline-block mt-3">
                    Verify that the <strong>'authenticated'</strong> role has 
                    SELECT permissions in the Neon Console.
                </div>
            </div>`;
    }
}

async function loadModuleData(moduleKey) {
    const tableName = TABLE_MAP[moduleKey];
    tableContainer.innerHTML = `<div class="p-5 text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Loading ${tableName}...</div>`;

    try {
        const data = await sql(`SELECT * FROM ${tableName} LIMIT 100`);
        renderTable(data);
    } catch (err) {
        console.error(`Query Error:`, err);
        tableContainer.innerHTML = `<div class="p-5 text-center text-warning">
            <i class="bi bi-exclamation-triangle fs-2"></i><br>
            Permission Denied for table: <strong>${tableName}</strong>
        </div>`;
    }
}

function renderTable(data) {
    if (!data || data.length === 0) {
        tableContainer.innerHTML = `<div class="p-5 text-center text-muted">Table is empty.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
                    <thead class="table-light"><tr>`;
    Object.keys(data[0]).forEach(key => html += `<th class="small fw-bold text-muted text-uppercase">${key.replace('_', ' ')}</th>`);
    html += `</tr></thead><tbody>`;

    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => html += `<td>${val || '-'}</td>`);
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
}

window.loadModuleData = loadModuleData;
init();
