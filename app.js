window.onload = async function() {
    // --- CONFIGURATION ---
    // Use your specific Neon project details
    const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

    // Verify SDK is loaded
    if (typeof Neon === 'undefined') {
        console.error("Neon SDK failed to load. Check your internet connection.");
        return;
    }

    // Initialize the unified client
    const client = Neon.createClient({
        auth: {
            url: NEON_AUTH_URL,
        }
    });

    async function initApp() {
        console.log("MPS Gateway Initializing...");
        try {
            // Get the current session
            const { data, error } = await client.auth.getSession();

            if (data && data.session) {
                console.log("Authenticated as:", data.session.user.email);
                document.getElementById('app-body').classList.add('active-app');
                refreshData();
            } else {
                console.log("No active session. Rendering login...");
                renderLoginUI();
            }
        } catch (err) {
            console.error("Startup Error:", err);
        }
    }

    function renderLoginUI() {
        const container = document.getElementById('neon-auth-ui');
        container.innerHTML = ""; // Clear loader
        
        // Render the pre-built Sign-In form
        client.auth.renderSignIn(container, {
            onSuccess: () => window.location.reload(),
        });
    }

    // Sign Out Logic
    document.getElementById('btnSignOut').onclick = async () => {
        await client.auth.signOut();
        window.location.reload();
    };

    async function refreshData() {
        try {
            // New v0.2 simplified query syntax
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
            console.error("Data Fetch Error:", err);
        }
    }

    initApp();
};
