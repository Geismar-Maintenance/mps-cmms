export class NeonBridge {
    constructor() {
        this.projectId = "ep-plain-mouse-aeznlgmn";
        // The direct API endpoint for your project's auth
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
                <div id="otp-step-1">
                    <div class="mb-3">
                        <label class="form-label">Work Email</label>
                        <input type="email" id="email" class="form-control" placeholder="d.tinsley@mauser.com">
                    </div>
                    <button id="btn-send-code" class="btn btn-primary w-100">Send Access Code</button>
                </div>
                <div id="otp-step-2" style="display:none;">
                    <div class="mb-3">
                        <label class="form-label">6-Digit Code</label>
                        <input type="text" id="otp-code" class="form-control" placeholder="123456">
                    </div>
                    <button id="btn-verify" class="btn btn-success w-100">Verify & Sign In</button>
                </div>
                <div id="auth-msg" style="margin-top:15px; text-align:center; font-size:0.85rem; color: #666;"></div>
            </div>`;

        document.getElementById('btn-send-code').onclick = () => this.sendOTP();
    }

    async sendOTP() {
        const email = document.getElementById('email').value;
        const msg = document.getElementById('auth-msg');
        msg.innerText = "Sending code...";

        try {
            const resp = await fetch(`${this.authApi}/login/email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (resp.ok) {
                document.getElementById('otp-step-1').style.display = 'none';
                document.getElementById('otp-step-2').style.display = 'block';
                msg.innerText = "Check your inbox for the code.";
                document.getElementById('btn-verify').onclick = () => this.verifyOTP(email);
            } else {
                msg.innerText = "Error: Email not authorized.";
            }
        } catch (e) { msg.innerText = "Network Error."; }
    }

    async verifyOTP(email) {
        const code = document.getElementById('otp-code').value;
        const msg = document.getElementById('auth-msg');
        
        try {
            const resp = await fetch(`${this.authApi}/verify/email-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            if (resp.ok) {
                const data = await resp.json();
                localStorage.setItem('mps_session', JSON.stringify(data));
                window.location.reload();
            } else {
                msg.innerText = "Invalid code. Please try again.";
            }
        } catch (e) { msg.innerText = "Verification failed."; }
    }
}
