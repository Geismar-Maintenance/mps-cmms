/**
 * GEISMAR MAINTENANCE PORTAL - DIRECT CONNECTION BRIDGE
 * Bypassing Auth for Development
 */

import { neon } from 'https://esm.sh/@neondatabase/serverless';

export class NeonBridge {
    constructor() {
        // PASTE YOUR CONNECTION STRING HERE FOR TESTING
        // In a real 'Production' version, we would move this to a GitHub Secret
        this.connectionString = "PASTE_YOUR_NEON_CONNECTION_STRING_HERE";
        this.sql = neon(this.connectionString);
    }

    // We simulate a "logged in" state so your other code doesn't break
    async getSession() {
        return { user: { email: "admin@geismar-mps.local" }, role: "developer" };
    }

    // This renders nothing (skipping the login card)
    renderLogin(containerId) {
        console.log("Sign-in bypassed. Connecting to database...");
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = `<p style="color:green; text-align:center;">Direct Connection Active</p>`;
    }

    /**
     * Use this function to get your actual data!
     * Example: const parts = await bridge.getData('SELECT * FROM spare_parts');
     */
    async getData(query) {
        try {
            const result = await this.sql(query);
            return result;
        } catch (error) {
            console.error("Database Error:", error);
            return null;
        }
    }
}
