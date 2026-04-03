// MPS CMMS - Custom Neon Bridge 2026
export class NeonBridge {
    constructor(config) {
        this.authUrl = config.authUrl;
        this.container = null;
    }

    async getSession() {
        const session = localStorage.getItem('mps_session');
        return session ? JSON.parse(session) : null;
    }

    renderLogin(containerId) {
    this.container = document.getElementById(containerId);
    this.container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2 class="mb-4">MPS Maintenance Portal</h2>
            <p>Please sign in to access Work Orders & Inventory.</p>
            <button id="btn-neon-direct" class="btn btn-primary btn-lg">
                Sign In with Neon
            </button>
        </div>`;

    document.getElementById('btn-neon-direct').onclick = () => {
        // This sends the user to the Neon-hosted login page
        // Once they log in, Neon sends them back to your GitHub page
        const redirectUrl = window.location.origin + window.location.pathname;
        window.location.href = `${this.authUrl}/login?redirect_uri=${encodeURIComponent(redirectUrl)}`;
    };
}

    async handleAuth() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const msg = document.getElementById('auth-msg');

        msg.innerText = "Authenticating with Neon...";

        try {
            const response = await fetch(`${this.authUrl}/v1/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('mps_session', JSON.stringify(data));
                window.location.reload();
            } else {
                msg.innerText = "Access Denied. Check credentials.";
            }
        } catch (e) {
            msg.innerText = "Network Error: Port 443 blocked or Neon offline.";
        }
    }
}
