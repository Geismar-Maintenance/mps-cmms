import { NeonBridge } from './neon-bridge.js';

/**
 * MAIN APPLICATION LOGIC
 * Initializes the connection and renders the Geismar Maintenance Dashboard.
 */
async function initDashboard() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    const dataContainer = document.getElementById('data-container');

    try {
        console.log("Initializing Geismar Maintenance Portal...");
        const bridge = new NeonBridge();

        // 1. Connection Heartbeat
        const heartbeat = await bridge.query("SELECT NOW() as server_time;");
        
        if (heartbeat) {
            console.log("Connection Established:", heartbeat[0].server_time);
            statusDot.className = 'status-dot status-online'; // Turns Green
            statusText.innerText = "Online (Direct Connection)";
            
            // 2. Fetch Data (Replace 'parts' with your actual table name)
            // If you don't have a table yet, this will catch the error below.
            const data = await bridge.query("SELECT * FROM parts LIMIT 20;");
            
            if (data && data.length > 0) {
                renderTable(data, dataContainer);
            } else {
                dataContainer.innerHTML = `
                    <div class="alert alert-info">
                        Connected to Neon! No records found in the 'parts' table yet.
                    </div>`;
            }
        }
    } catch (err) {
        console.error("App Initialization Error:", err);
        statusText.innerText = "Connection Failed";
        dataContainer.innerHTML = `
            <div class="alert alert-danger shadow-sm">
                <strong>Connection Error:</strong> ${err.message}<br>
                <small>Check your connection string and firewall settings.</small>
            </div>`;
    }
}

/**
 * Builds a Bootstrap table dynamically from any database result.
 */
function renderTable(data, container) {
    let html = `
        <table class="table table-striped table-hover align-middle">
            <thead class="table-dark">
                <tr>`;
    
    // Create Headers from the first row keys
    Object.keys(data[0]).forEach(key => {
        html += `<th>${key.toUpperCase().replace('_', ' ')}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    // Create Rows
    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td>${val === null ? '-' : val}</td>`;
        });
        html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// Fire it up
initDashboard();
