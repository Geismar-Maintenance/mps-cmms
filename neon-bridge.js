import { neon } from 'https://esm.sh/@neondatabase/serverless';

/**
 * GEISMAR MAINTENANCE PORTAL - DIRECT DB BRIDGE
 * Bypasses Auth to provide immediate data access.
 */
export class NeonBridge {
    constructor() {
        // IMPORTANT: Use your actual string from the Neon Console here.
        // It should look like: postgresql://neondb_owner:npg_xxxx@ep-plain-mouse...
        const connectionString = "YOUR_ACTUAL_NEON_CONNECTION_STRING_HERE";
        
        if (connectionString.includes("YOUR_ACTUAL")) {
            console.error("CRITICAL: You must paste your Neon Connection String into neon-bridge.js");
        }
        
        this.sql = neon(connectionString);
    }

    /**
     * Executes a SQL query directly against the Neon database.
     * @param {string} text - The SQL query (e.g., 'SELECT * FROM inventory')
     * @returns {Promise<Array>} - The rows from the database
     */
    async query(text) {
        try {
            const result = await this.sql(text);
            return result;
        } catch (error) {
            console.error("Database Query Failed:", error);
            throw error; // Let app.js handle the UI error state
        }
    }
}
