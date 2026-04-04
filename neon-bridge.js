export class NeonBridge {
    constructor() {
        this.projectId = "ep-plain-mouse-aeznlgmn";
        // This is your confirmed base URL
        this.authBase = "https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth";
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
                <div class="mb-3">
                    <label class="form-label">Work Email</label>
                    <input type="email" id="email-input" class="form-control" placeholder="d.tinsley@mauser.com">
                </div>
                <button id="btn-auth" class="btn btn-primary w-100">Send Access Link</button>
                <div id="msg" style="margin-top:15px; text-align:center; font-size:0.9rem; color: #666;"></div>
            </div>`;

        document.getElementById('btn-auth').onclick = () => this.handleMagicLink();
    }

    async handleMagicLink() {
        const email = document.getElementById('email-input').value;
        const msg = document.getElementById('msg');
        msg.innerText = "Connecting to Geismar Node...";

        try {
            // Updated Path: We use /v1/passwordless/start which is the standard 2026 API
            const response = await fetch(`${this.authBase}/v1/passwordless/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    connection: 'email',
                    email: email,
                    send: 'link',
                    authParams: {
                        redirect_uri: window.location.href 
                    }
                })
            });

            if (response.ok) {
                msg.style.color = "green";
                msg.innerText = "Link sent! Please check your email.";
            } else {
                const errData = await response.json();
                console.error("Neon API Response:", errData);
                msg.style.color = "red";
                msg.innerText = "Access Denied. Check your Neon 'Users' list.";
            }
        } catch (e) {
            msg.innerText = "Network Error. Confirm the .tech URL is reachable.";
        }
    }
}
