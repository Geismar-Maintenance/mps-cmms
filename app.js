import { neon } from 'https://esm.sh/@neondatabase/serverless@latest';
import { createAuthClient } from 'https://esm.sh/@neondatabase/auth-client@latest';

/**
 * MPS-CMMS: Core Application Logic
 */

// --- CONFIGURATION ---
const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';
const DATABASE_URL = 'postgresql://anon@ep-plain-mouse-aeznlgmn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const authClient = createAuthClient({
  baseUrl: NEON_AUTH_URL,
});

let sql; // Our database query function
let currentModule = 'wo-mgmt';

/**
 * AUTHENTICATION INITIALIZATION
 */
async function initApp() {
    console.log("Checking session status...");
    try {
        const session = await authClient.getSession();

        if (session && session.accessToken) {
            console.log("Session Active:", session.data.user.email);
            
            // 1. Show the App UI
            document.getElementById('app-body').classList.add('active-app');
            
            // 2. Setup the SQL connection using the JWT token
            sql = neon(DATABASE_URL, { authToken: session.accessToken });
            
            // 3. Load initial data
            refreshData();
        } else {
            console.log("No Session. Displaying Sign-In UI.");
            renderLoginUI();
        }
    } catch (err) {
        console.error("Critical Auth Error:", err);
        document.getElementById('neon-auth-ui').innerHTML = 
            `<div class="alert alert-danger m-3">Connection failed. Check your browser's Console (F12).</div>`;
    }
}

function renderLoginUI() {
    const container = document.getElementById('neon-auth-ui');
    container.innerHTML = ""; // Clear loader
    
    authClient.renderSignIn(container, {
        onSuccess: () => {
            console.log("Login Successful.");
            window.location.reload();
        },
    });
}

/**
 * DATA OPERATIONS
 */
async function refreshData() {
    if (!sql) return;
    
    try {
        if (currentModule === 'wo-mgmt') {
            const data = await sql('SELECT * FROM WorkOrders ORDER BY woid DESC LIMIT 25');
            document.getElementById('wo-table-body').innerHTML = data.map(wo => `
                <tr>
                    <td>${wo.woid}</td>
                    <td>${wo.assetid}</td>
                    <td>${wo.description}</td>
                    <td><span class="badge bg-secondary">${wo.priority}</span></td>
                    <td><span class="badge bg-info">${wo.status || 'Open'}</span></td>
                </tr>`).join('');
        } else {
            const data = await sql('SELECT * FROM MasterParts LIMIT 25');
            document.getElementById('parts-table-body').innerHTML = data.map(p => `
                <tr>
                    <td>${p.partnumber}</td>
                    <td>${p.manufacturer}</td>
                    <td>${p.model}</td>
                    <td>${p.reorderlevel}</td>
                </tr>`).join('');
        }
    } catch (err) {
        console.error("Database Error:", err);
    }
}

/**
 * UI NAVIGATION HANDLERS
 */
const switchModule = (moduleId) => {
    document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(moduleId).classList.add('active');
    document.getElementById(moduleId === 'wo-mgmt' ? 'link-wo' : 'link-parts').classList.add('active');
    
    currentModule = moduleId;
    document.getElementById('module-title').innerText = moduleId === 'wo-mgmt' ? 'Work Order Management' : 'Master Parts Registry';
    refreshData();
};

// Event Listeners for Nav
document.getElementById('link-wo').onclick = () => switchModule('wo-mgmt');
document.getElementById('link-parts').onclick = () => switchModule('part-mgmt');

// Sign Out
document.getElementById('btnSignOut').onclick = async () => {
    await authClient.signOut();
    window.location.reload();
};

// Start the Application
initApp();
