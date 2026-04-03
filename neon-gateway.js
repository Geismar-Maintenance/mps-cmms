// MPS-CMMS: Unified Neon Gateway (Lightweight Version)
export class NeonClient {
    constructor(config) {
        this.authUrl = config.auth.url;
        this.dbUrl = config.db?.url;
    }

    async getSession() {
        const token = localStorage.getItem('neon_access_token');
        if (!token) return { data: null };
        
        try {
            const resp = await fetch(`${this.authUrl}/session`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await resp.json();
            return { data: resp.ok ? data : null };
        } catch (e) { return { data: null }; }
    }

    renderSignIn(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="margin-bottom: 20px; color: #333;">MPS Secure Login</h3>
                <input type="email" id="neon-email" placeholder="Email" class="form-control mb-2">
                <input type="password" id="neon-pass" placeholder="Password" class="form-control mb-3">
                <button id="btn-neon-login" class="btn btn-primary w-100">Sign In</button>
                <div id="auth-error" class="text-danger mt-2 small"></div>
            </div>`;

        document.getElementById('btn-neon-login').onclick = async () => {
            const email = document.getElementById('neon-email').value;
            const password = document.getElementById('neon-pass').value;
            
            const resp = await fetch(`${this.authUrl}/login`, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await resp.json();
            if (resp.ok) {
                localStorage.setItem('neon_access_token', result.accessToken);
                window.location.reload();
            } else {
                document.getElementById('auth-error').innerText = "Invalid credentials or access denied.";
            }
        };
    }
}
