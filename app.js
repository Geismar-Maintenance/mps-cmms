import { neon } from 'https://esm.sh/@neondatabase/serverless';
import { createAuthClient } from 'https://esm.sh/@neondatabase/auth-client';

// --- CONFIGURATION ---
// CLEAN BASE URL (Extracted from your working JWKS link)
const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

// Your standard database connection
const DATABASE_URL = 'postgresql://anon@ep-plain-mouse-aeznlgmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const authClient = createAuthClient({
  baseUrl: NEON_AUTH_URL,
});

/** * Rest of your app.js logic remains the same.
 * The initApp() function will now be able to find the 
 * /openid-configuration automatically because the base is valid.
 */

let sql; // Global SQL instance initialized after login
let currentModule = 'wo-mgmt';

/**
 * --- AUTHENTICATION & INITIALIZATION ---
 */
async function initApp() {
    const session = await authClient.getSession();

    if (session && session.accessToken) {
        // 1. User is authenticated
        document.getElementById('app-body').classList.add('active-app');
        
        // 2. Initialize the Serverless Driver with the JWT (Access Token)
        sql = neon(DATABASE_URL, { authToken: session.accessToken });
        
        // 3. Load initial data
        console.log("Authenticated successfully with Neon Auth.");
        refreshData();
    } else {
        // 4. User is not logged in, render the Neon Sign-In UI
        document.getElementById('app-body').classList.remove('active-app');
        renderLoginUI();
    }
}

function renderLoginUI() {
    const container = document.getElementById('neon-auth-ui');
    if (container) {
        authClient.renderSignIn(container, {
            onSuccess: () => {
                console.log("Sign-in successful.");
                initApp();
            },
        });
    }
}

// Global Sign Out Handler
document.getElementById('btnSignOut').onclick = async () => {
    await authClient.signOut();
    sessionStorage.clear();
    location.reload();
};

/**
 * --- DATA OPERATIONS ---
 */
async function refreshData() {
    if (!sql) return;

    try {
        if (currentModule === 'wo-mgmt') {
            const data = await sql('SELECT * FROM WorkOrders ORDER BY WOID DESC');
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
                </tr>`).join('');
        } else if (currentModule === 'part-mgmt') {
            const data = await sql('SELECT * FROM MasterParts ORDER BY PartID DESC');
            const tbody = document.getElementById('parts-table-body');
            tbody.innerHTML = data.map(p => `
                <tr>
                    <td>${p.partnumber}</td>
                    <td>${p.manufacturer}</td>
                    <td>${p.model}</td>
                    <td>$${p.cost}</td>
                    <td>${p.reorderlevel}</td>
                    <td><button class="btn btn-sm btn-outline-danger" onclick="window.deleteItem('MasterParts', 'PartID', ${p.partid})">Remove</button></td>
                </tr>`).join('');
        }
    } catch (err) {
        console.error("Database Fetch Error:", err);
    }
}

/**
 * --- FORM SUBMISSIONS ---
 */
document.getElementById('formAddPart').onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
        await sql('INSERT INTO MasterParts (PartNumber, Manufacturer, Description, Cost, ReorderLevel) VALUES ($1, $2, $3, $4, $5)', 
        [d.PartNumber, d.Manufacturer, d.Description, parseFloat(d.Cost), parseInt(d.ReorderLevel)]);
        
        bootstrap.Modal.getInstance(document.getElementById('modalAddPart')).hide();
        e.target.reset();
        refreshData();
    } catch (err) { alert("Error saving part: " + err.message); }
};

document.getElementById('formAddWO').onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
        await sql('INSERT INTO WorkOrders (AssetID, Description, Priority, DueDate) VALUES ($1, $2, $3, $4)', 
        [parseInt(d.AssetID), d.Description, d.Priority, d.DueDate]);
        
        bootstrap.Modal.getInstance(document.getElementById('modalAddWO')).hide();
        e.target.reset();
        refreshData();
    } catch (err) { alert("Error generating WO: " + err.message); }
};

/**
 * --- UI NAVIGATION ---
 */
window.switchModule = (id) => {
    document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    currentModule = id;
    refreshData();
};

document.getElementById('btnAddRecord').onclick = () => {
    const modalId = currentModule === 'wo-mgmt' ? 'modalAddWO' : 'modalAddPart';
    const modalEl = document.getElementById(modalId);
    modalEl.removeAttribute('aria-hidden'); 
    new bootstrap.Modal(modalEl).show();
};

// Global delete helper
window.deleteItem = async (table, col, id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
        await sql(`DELETE FROM ${table} WHERE ${col} = $1`, [id]);
        refreshData();
    } catch (err) { alert("Delete failed: " + err.message); }
};

// Start the Auth Check
initApp();
