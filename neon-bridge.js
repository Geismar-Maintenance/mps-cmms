/**
 * GEISMAR MAINTENANCE PORTAL - NEON AUTH BRIDGE (2026 EDITION)
 * This bridge handles the "Better Auth" transition for Neon Projects.
 */

export class NeonBridge {
    constructor() {
        // Your confirmed Auth URL from the Neon Console
        this.authBase = "https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth";
    }

    /**
     * Checks localStorage for a saved session.
     * Better Auth sessions are typically handled via cookies, 
     * but we store the user data here for frontend display.
     */
    async getSession() {
        const session = localStorage.getItem('mps_session');
        return session ? JSON.parse(session) : null;
    }

    /**
     * Renders the login interface into the provided HTML container.
     */
    renderLogin(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div id="login-card" style="max-width: 400px; margin: 2rem auto; padding: 2.5rem; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-family: sans-serif;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2 style="color: #1a202c; margin-bottom: 0.5rem;">MPS Geismar</h2>
                    <p style="color: #718096; font-size: 0.9rem;">Maintenance Management System</p>
                </div>
                
                <div id="auth-form">
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #4a5568;">Work Email</label>
                        <input type="email" id="email-input" 
                            style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; transition: border-color 0.2s;"
                            placeholder="d.tinsley@mauser.com"
                            onfocus="this.style.borderColor='#4299e1'"
                            onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    
                    <button id="btn-auth-send" 
                        style="width: 100%; padding: 0.75rem; background: #3182ce; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                        Send Magic Link
                    </button>
                    
                    <div id="auth-msg" style="margin-top: 1.25rem; text-align: center; font-size: 0.85rem; min-height: 1.2rem;"></div>
                </div>
                
                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #edf2f7; font-size: 0.75rem; color: #a0aec0; text-align: center;">
                    Secure Industrial Authentication via Neon
                </div>
            </div>
        `;

        document.getElementById('btn-auth-send').onclick = () => this.handleMagicLink();
    }

    /**
     * Triggers the Magic Link email via the Better Auth API.
     */
    async handleMagicLink() {
        const emailInput = document.getElementById('email-input');
        const msg = document.getElementById('auth-msg');
        const btn = document.getElementById('btn-auth-send');
        
        const email = emailInput.value.trim();
        if (!email) {
            this.showMessage("Please enter your work email.", "red");
            return;
        }

        // UI Feedback
        btn.disabled = true;
        btn.innerText = "Verifying...";
        this.showMessage("Contacting Geismar Auth Node...", "#4a5568");

        try {
            /**
             * The Better Auth Path: 
             * This bypasses the old /v1/passwordless folders which were causing the 404.
             */
            const response = await fetch(`${this.authBase}/api/auth/magic-link`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email,
                    callbackURL: window.location.origin + window.location.pathname
                })
            });

            if (response.ok) {
                this.showMessage("Success! Check your email for the login link.", "green");
                btn.innerText = "Link Sent";
                emailInput.value = "";
            } else {
                const status = response.status;
                if (status === 404) {
                    this.showMessage("Error: Auth endpoint not found. Verify URL in Neon Console.", "red");
                } else {
                    this.showMessage("Access Denied. Is this email in the Neon Users list?", "red");
                }
                btn.disabled = false;
                btn.innerText = "Send Magic Link";
                console.error(`Neon Auth Error (${status})`);
            }
        } catch (error) {
            this.showMessage("Network Error: Could not reach Neon server.", "red");
            btn.disabled = false;
            btn.innerText = "Try Again";
            console.error("Bridge Connection Failure:", error);
        }
    }

    /**
     * Helper to display status messages to the user.
     */
    showMessage(text, color) {
        const msg = document.getElementById('auth-msg');
        if (msg) {
            msg.innerText = text;
            msg.style.color = color;
        }
    }
}
