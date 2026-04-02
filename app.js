/**
 * MPS-CMMS: Core Application Logic
 */

window.onload = function() {
    // --- CONFIGURATION ---
    const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

    // Verify Neon exists before continuing
    if (typeof Neon === 'undefined') {
        console.error("Neon SDK failed to load from CDN.");
        document.getElementById('neon-auth-ui').innerHTML = 
            `<div class="alert alert-danger">SDK Error: Check your internet connection or firewall.</div>`;
        return;
    }

    const client = Neon.createClient({
        auth: { url: NEON_AUTH_URL }
    });

    let currentModule = 'wo-mgmt';

    async function initApp() {
        console.log("Checking session status...");
        try {
            const session = await client.auth.getSession();
            if (session && session.data) {
                document.getElementById('app-body').classList.add('active-app');
                refreshData();
            } else {
                renderLoginUI();
            }
        } catch (err) {
            console.error("Auth Error:", err);
        }
    }

    function renderLoginUI() {
        const container = document.getElementById('neon-auth-ui');
        container.innerHTML = ""; 
        client.auth.renderSignIn(container, {
            onSuccess: () => window.location.reload(),
        });
    }

    // Assign globally so HTML buttons can see them
    window.handleSignOut = async () => {
        await client.auth.signOut();
        window.location.reload();
    };

    window.switchModule = (moduleId) => {
        document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(moduleId).classList.add('active');
        currentModule = moduleId;
        refreshData();
    };

    async function refreshData() {
        try {
            const { data, error } = await client.from('WorkOrders').select('*');
            if (error) throw error;
            const tbody = document.getElementById('wo-table-body');
            tbody.innerHTML = data.map(wo => `
                <tr>
                    <td>${wo.woid}</td>
                    <td>${wo.assetid}</td>
                    <td>${wo.description}</td>
                    <td><span class="badge bg-secondary">${wo.priority}</span></td>
                    <td><span class="badge bg-info">${wo.status || 'Open'}</span></td>
                </tr>`).join('');
        } catch (err) {
            console.error("Data Error:", err);
        }
    }

    initApp();
};
