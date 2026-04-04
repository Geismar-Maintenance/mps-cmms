/**
 * GEISMAR MAINTENANCE PORTAL - NEON AUTH BRIDGE
 * Integrated Project Version
 */

export class NeonBridge {
    constructor() {
        this.projectId = "ep-plain-mouse-aeznlgmn";
        // This is the direct 2026 API path for Integrated Projects
        this.authBase = "https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth/v1";
    }

    async getSession() {
        const session = localStorage.getItem('mps_session');
        return session ? JSON.parse(session) : null;
    }

    renderLogin(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div id="login-card" style="max-width: 400px; margin: 2rem auto; padding: 2.5rem; background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <h2 style="text-align:center; color:#1a202c;">MPS Maintenance</h2>
                <div style="margin-top:20px;">
                    <label style="display:block; margin-bottom:5px; font-weight:600;">Work Email</label>
                    <input type="email" id="email-input" class="form-control" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;" placeholder="d.tinsley@mauser.com">
                </div>
                <button id="btn-send" style="width:100%; margin-top:20px; padding:12px; background:#3182ce; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">
                    Send Access Link
                </button>
                <div id="auth-msg" style="margin-top:15px; text-align:center; font-size:0.9rem;"></div>
            </div>`;

        document.getElementById('btn-send').onclick = () => this.handleMagicLink();
    }

    async handleMagicLink() {
        const email = document.getElementById('email-input').value.trim();
        const msg = document.getElementById('auth-msg');
        
        if (!email) {
            msg.innerText = "Email required.";
            return;
        }

        msg.innerText = "Requesting link...";

        try {
            /**
             * ATTEMPT: The Direct Sign-In Path
             * Some integrated projects use '/signin/magic-link' instead of '/api/auth'
             */
            const response = await fetch(`${this.authBase}/login/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    redirect_uri: window.location.href 
                })
            });

            if (response.ok) {
                msg.style.color = "green";
                msg.innerText = "Success! Link sent to your email.";
            } else {
                // If it's a 404, we catch it here
                console.error(`Status: ${response.status}`);
                msg.style.color = "red";
                msg.innerText = `Error (${response.status}): Auth node busy.`;
                
                // FALLBACK: If /login/magic-link 404s, try the root passwordless path
                if (response.status === 404) {
                    this.tryFallback(email);
                }
            }
        } catch (e) {
            msg.innerText = "Network Error.";
        }
    }

    async tryFallback(email) {
        const msg = document.getElementById('auth-msg');
        const response = await fetch(`${this.authBase}/passwordless/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                connection: 'email',
                email: email,
                send: 'link',
                authParams: { redirect_uri: window.location.href }
            })
        });

        if (response.ok) {
            msg.style.color = "green";
            msg.innerText = "Fallback Success! Link sent.";
        } else {
            msg.innerText = "Fatal: All Auth endpoints returned 404.";
        }
    }
}
