// MPS CMMS - Integrated Neon Bridge 2026
export class NeonBridge {
    constructor() {
        // These are now handled by your GitHub/Neon Integration
        this.projectId = "ep-plain-mouse-aeznlgmn"; 
        this.baseUrl = `https://console.neon.tech/api/v1/projects/${this.projectId}`;
    }

    async getSession() {
        const session = localStorage.getItem('mps_session');
        return session ? JSON.parse(session) : null;
    }

    renderLogin(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div id="login-card" style="max-width: 400px; margin: auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333; margin-bottom: 1.5rem;">MPS Maintenance</h2>
                <div id="auth-form">
                    <div class="mb-3">
                        <label class="form-label">Work Email</label>
                        <input type="email" id="email" class="form-control" placeholder="d.tinsley@mauser.com">
                    </div>
                    <button id="btn-login" class="btn btn-primary w-100 py-2">Enter Portal</button>
                    <div id="auth-msg" style="margin-top:15px; text-align:center; font-size:0.85rem; color: #666;"></div>
                </div>
            </div>`;

        document.getElementById('btn-login').onclick = () => this.handleMagicLink();
    }

    async handleMagicLink() {
        const email = document.getElementById('email').value;
        const msg = document.getElementById('auth-msg');
        msg.innerText = "Requesting secure link...";

        try {
            // This uses the Neon Auth API to send a Magic Link to your email
            const response = await fetch(`https://${this.projectId}.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth/v1/login/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                msg.style.color = "green";
                msg.innerText = "Check your email! Click the link to log in.";
            } else {
                msg.style.color = "red";
                msg.innerText = "Access Denied. Ensure email is registered in Neon.";
            }
        } catch (e) {
            msg.innerText = "Network Error: Port 443 blocked.";
        }
    }
}
