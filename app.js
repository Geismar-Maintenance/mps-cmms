/**
 * MPS-CMMS: Operations Gateway
 */

window.onload = function() {
    // --- 1. NETWORK & SDK CHECK ---
    if (typeof Neon === 'undefined') {
        console.error("FIREWALL ALERT: Neon SDK could not be reached.");
        const authUI = document.getElementById('neon-auth-ui');
        authUI.innerHTML = `
            <div class="p-3">
                <i class="bi bi-shield-slash text-danger fs-1"></i>
                <h5 class="mt-3 text-dark">Connection Blocked</h5>
                <p class="small text-muted">Your network firewall is blocking the security SDK. Please contact IT to whitelist <b>cdn.jsdelivr.net</b>.</p>
                <button class="btn btn-sm btn-outline-primary" onclick="location.reload()">Retry Connection</button>
            </div>`;
        return;
    }

    // --- 2. CONFIGURATION ---
    const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

    const client = Neon.createClient({
        auth: { url: NEON_AUTH_URL }
    });

    // --- 3. AUTH LOGIC ---
    async function initApp() {
        try {
            const session = await client.auth.getSession();
            if (session && session.data) {
                // Success - Show App
                document.getElementById('app-body').classList.add('active-app');
                refreshData();
            } else {
                // No Session - Show Login
                renderLoginUI();
            }
        } catch (err) {
            console.error("Auth System Error:", err);
        }
    }

    function renderLoginUI() {
        const container = document.getElementById('neon-auth-ui');
        container.innerHTML = ""; // Clear the "Connecting..." spinner
        
        client.auth.renderSignIn(container, {
            onSuccess: () => window.location.reload(),
        });
    }

    // --- 4. DATA LOGIC ---
    async function refreshData() {
        try {
            // Using the new v0.2.0 'from' syntax for easier reading
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
            console.error("Database Fetch Error:", err);
        }
    }

    // --- 5. GLOBAL EXPORTS ---
    window.handleSignOut = async () => {
        await client.auth.signOut();
        window.location.reload();
    };

    window.switchModule = (moduleId) => {
        document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(moduleId).classList.add('active');
        refreshData();
    };

    // Launch
    initApp();
};
