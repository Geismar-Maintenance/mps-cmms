// MPS CMMS - Direct Auth Bridge 2026
export class NeonBridge {
    constructor() {
        this.projectId = "ep-plain-mouse-aeznlgmn";
        // Using the direct API endpoint, not the /login webpage
        this.authApi = `https://${this.projectId}.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth/v1`;
    }

    async getSession() {
        const session = localStorage.getItem('mps_session');
        return session ? JSON.parse(session) : null;
    }

    renderLogin(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div id="login-card" style="max-width: 400px; margin: auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333; margin-bottom: 1.5rem;">MPS Maintenance Portal</h2>
                <div id="otp-step">
                    <div class="mb-3">
                        <label class="form-label">Work Email</label>
                        <input type="email" id="email-input" class="form-control" placeholder="d.tinsley@mauser.com">
                    </div>
                    <button id="btn-auth-start" class="btn btn-primary w-100">Send Access Link</button>
                </div>
                <div id="auth-msg" style="margin-top:15px; text-align:center; font-size:0.85rem; color: #666;"></div>
            </div>`;

        document.getElementById('btn-auth-start').onclick = () => this.handleMagicLink();
    }

    async handleMagicLink() {
        const email = document.getElementById('email-input').value;
        const msg = document.getElementById('auth-msg');
        msg.innerText = "Requesting secure access...";

        try {
            // This calls the API directly, avoiding the 404 /login page
            const response = await fetch(`${this.authApi}/login/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    redirect_uri: window.location.href 
                })
            });

            if (response.ok) {
                msg.style.color = "green";
                msg.innerText = "Check your email! Click the link to enter the portal.";
            } else {
                const errData = await response.json();
                msg.style.color = "red";
                msg.innerText = "Access Denied. Is your email registered in Neon?";
                console.error("Neon Auth Error:", errData);
            }
        } catch (e) {
            msg.innerText = "Network Error. Check firewall settings.";
        }
    }
}
