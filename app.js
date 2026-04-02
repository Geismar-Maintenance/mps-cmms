import { neon } from 'https://esm.sh/@neondatabase/serverless';

// --- CONFIGURATION ---
const DATABASE_URL = 'postgresql://anon@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// --- STATE MANAGEMENT ---
let currentModule = 'wo-mgmt';

// --- CORE FUNCTIONS ---

async function runQuery(query, params = []) {
    const authToken = sessionStorage.getItem('neon_token');
    if (!authToken) throw new Error("Not authenticated");
    
    const sql = neon(DATABASE_URL, { authToken });
    return await sql(query, params);
}

const ui = {
    hideAuth: () => document.getElementById('auth-overlay').style.setProperty('display', 'none', 'important'),
    showModule: (id) => {
        document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        currentModule = id;
    }
};

// --- DATABASE OPERATIONS ---

async function refreshData() {
    try {
        if (currentModule === 'wo-mgmt') {
            const data = await runQuery('SELECT * FROM WorkOrders ORDER BY WOID DESC');
            const tbody = document.getElementById('wo-table-body');
            tbody.innerHTML = data.map(wo => `
                <tr>
                    <td>${wo.woid}</td>
                    <td>${wo.assetid}</td>
                    <td>${wo.description}</td>
                    <td><span class="badge bg-secondary">${wo.priority}</span></td>
                    <td><span class="badge bg-info">${wo.status || 'New'}</span></td>
                    <td>${wo.duedate || '--'}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('WorkOrders', 'WOID', ${wo.woid})">Delete</button></td>
                </tr>
            `).join('');
        } else if (currentModule === 'part-mgmt') {
            const data = await runQuery('SELECT * FROM MasterParts ORDER BY PartID DESC');
            const tbody = document.getElementById('parts-table-body');
            tbody.innerHTML = data.map(p => `
                <tr>
                    <td>${p.partnumber}</td>
                    <td>${p.manufacturer}</td>
                    <td>${p.model}</td>
                    <td>$${p.cost}</td>
                    <td>${p.reorderlevel}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('MasterParts', 'PartID', ${p.partid})">Remove</button></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

// Global delete handler
window.deleteItem = async (table, col, id) => {
    if (!confirm("Delete this record?")) return;
    try {
        await runQuery(`DELETE FROM ${table} WHERE ${col} = $1`, [id]);
        refreshData();
    } catch (err) { alert("Delete failed: " + err.message); }
};

// --- EVENT LISTENERS ---

document.getElementById('btnConnect').addEventListener('click', () => {
    const token = document.getElementById('db-token-input').value;
    if (token.length > 50) {
        sessionStorage.setItem('neon_token', token);
        ui.hideAuth();
        refreshData();
    } else {
        alert("Please enter a valid JWT token.");
    }
});

// Navigation
document.getElementById('nav-wo').onclick = () => { ui.showModule('wo-mgmt'); refreshData(); };
document.getElementById('nav-part').onclick = () => { ui.showModule('part-mgmt'); refreshData(); };

// Form Submissions
document.getElementById('formAddPart').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    
    try {
        await runQuery(
            `INSERT INTO MasterParts (PartNumber, Manufacturer, Model, Description, Cost, ReorderLevel) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [d.PartNumber, d.Manufacturer, d.Model, d.Description, parseFloat(d.Cost), parseInt(d.ReorderLevel)]
        );
        bootstrap.Modal.getInstance(document.getElementById('modalAddPart')).hide();
        e.target.reset();
        refreshData();
    } catch (err) { alert(err.message); }
};

document.getElementById('formAddWO').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd.entries());
    
    try {
        await runQuery(
            `INSERT INTO WorkOrders (AssetID, Description, Priority, WOType, DueDate) 
             VALUES ($1, $2, $3, $4, $5)`,
            [parseInt(d.AssetID), d.Description, d.Priority, d.WOType, d.DueDate]
        );
        bootstrap.Modal.getInstance(document.getElementById('modalAddWO')).hide();
        e.target.reset();
        refreshData();
    } catch (err) { alert(err.message); }
};

// Open Modals via Central Button
document.getElementById('btnAddRecord').onclick = () => {
    const modalId = currentModule === 'wo-mgmt' ? 'modalAddWO' : 'modalAddPart';
    const modalEl = document.getElementById(modalId);
    modalEl.removeAttribute('aria-hidden'); // Fix focus error
    new bootstrap.Modal(modalEl).show();
};

// Auto-login check
if (sessionStorage.getItem('neon_token')) {
    ui.hideAuth();
    refreshData();
}
