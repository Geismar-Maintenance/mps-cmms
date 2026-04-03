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
            <div id="login-card" style="max-width: 400px; margin: auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333; margin-bottom: 1.5rem;">MPS Maintenance Portal</h2>
                <div class="mb-3">
                    <label class="form-label">Corporate Email</label>
                    <input type="email" id="email" class="form-control" placeholder="d.tinsley@mauser.com">
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" placeholder="••••••••">
                </div>
                <button id="auth-submit" class="btn btn-primary w-100 py-2">Sign In</button>
                <div id="auth-msg" style="color: red; margin-top: 10px; font-size: 0.9rem; text-align: center;"></div>
            </div>`;

        document.getElementById('auth-submit').onclick = () => this.handleAuth();
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
