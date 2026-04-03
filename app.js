import { NeonBridge } from './neon-bridge.js';

const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

const bridge = new NeonBridge({
    authUrl: NEON_AUTH_URL
});

// Use DOMContentLoaded to ensure the HTML is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log("MPS App Initializing...");
    init();
});

async function init() {
    try {
        const session = await bridge.getSession();

        if (session) {
            document.body.classList.add('active-app');
            setupApp();
            loadData();
        } else {
            console.log("No session - Rendering Login Card");
            bridge.renderLogin('neon-auth-ui');
        }
    } catch (err) {
        console.error("Initialization Error:", err);
    }
}

function setupApp() {
    const signOutBtn = document.getElementById('signOut');
    if (signOutBtn) {
        signOutBtn.onclick = () => {
            localStorage.removeItem('mps_session');
            window.location.reload();
        };
    }
}

async function loadData() {
    const tbody = document.getElementById('wo-table-body');
    if (!tbody) return;

    // Placeholder data to confirm UI is working
    tbody.innerHTML = `
        <tr>
            <td>1001</td>
            <td>LINE-04-WRAP</td>
            <td>Verify SDK Connection</td>
            <td><span class="badge bg-warning">Medium</span></td>
            <td>System Check</td>
        </tr>`;
}
