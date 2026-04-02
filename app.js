/**
 * MPS-CMMS: Core Application Logic
 * Utilizing Neon Auth & Database Service
 */

// --- CONFIGURATION ---
const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

// Initialize the Client using the global Neon object from index.bundle.js
const client = Neon.createClient({
  auth: {
    url: NEON_AUTH_URL,
  }
});

let currentModule = 'wo-mgmt';

/**
 * AUTHENTICATION INITIALIZATION
 */
async function initApp() {
    console.log("Checking session status...");
    try {
        const session = await client.auth.getSession();

        if (session && session.data) {
            console.log("Session Active:", session.data.user.email);
            document.getElementById('app-body').classList.add('active-app');
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
    
    client.auth.renderSignIn(container, {
        onSuccess: () => {
            console.log("Login Successful.");
            window.location.reload();
        },
    });
}

window.handleSignOut = async () => {
    await client.auth.signOut();
    window.location.reload();
};

/**
 * DATA OPERATIONS
 */
async function refreshData() {
    console.log(`Refreshing ${currentModule} data...`);
    try {
        if (currentModule === 'wo-mgmt') {
            const { data, error } = await client.from('WorkOrders').select('*').order('WOID', { ascending: false });
            if (error) throw error;
            
            document.getElementById('wo-table-body').innerHTML = data.map(wo => `
                <tr>
                    <td>${wo.WOID || wo.woid}</td>
                    <td>${wo.AssetID || wo.assetid}</td>
                    <td>${wo.Description || wo.description}</td>
                    <td><span class="badge bg-secondary">${wo.Priority || wo.priority}</span></td>
                    <td><span class="badge bg-info">${wo.Status || 'Open'}</span></td>
                </tr>`).join('');
        } else if (currentModule === 'part-mgmt') {
            const { data, error } = await client.from('MasterParts').select('*');
            if (error) throw error;

            document.getElementById('parts-table-body').innerHTML = data.map(p => `
                <tr>
                    <td>${p.PartNumber || p.partnumber}</td>
                    <td>${p.Manufacturer || p.manufacturer}</td>
                    <td>${p.Model || p.model}</td>
                    <td>${p.ReorderLevel || p.reorderlevel}</td>
                </tr>`).join('');
        }
    } catch (err) {
        console.error("Database Error:", err);
    }
}

/**
 * UI NAVIGATION
 */
window.switchModule = (moduleId) => {
    // UI Update
    document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(moduleId).classList.add('active');
    document.getElementById(moduleId === 'wo-mgmt' ? 'link-wo' : 'link-parts').classList.add('active');
    
    // Logic Update
    currentModule = moduleId;
    document.getElementById('module-title').innerText = moduleId === 'wo-mgmt' ? 'Work Order Management' : 'Master Parts Registry';
    refreshData();
};

window.openAddModal = () => {
    alert("Add function is currently being linked to the authenticated schema. Use the SQL console to add test data for now.");
};

// Start the Application
initApp();
