import { neon } from 'https://esm.sh/@neondatabase/serverless';

let sql = null;

const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'locations': 'partlocations'
};

// 1. Connection Logic
document.getElementById('btn-connect').addEventListener('click', async () => {
    const password = document.getElementById('db-password').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    if (!password) return;

    const connStr = `postgresql://neondb_owner:${password}@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    
    try {
        const tempSql = neon(connStr);
        await tempSql`SELECT 1`; // Test
        
        sql = tempSql;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('db-status-dot').className = 'status-dot bg-success';
        document.getElementById('db-status-text').innerText = "Online";
        
        loadModuleData('parts'); // Initial load

    } catch (err) {
        console.error("Connection Failed:", err);
        errorDiv.innerText = "Invalid Password or Neon Error.";
    }
});

// 2. Data Fetching
async function loadModuleData(moduleKey) {
    if (!sql) return;

    const tableName = TABLE_MAP[moduleKey];
    const container = document.getElementById('data-table-container');
    document.getElementById('module-title').innerText = moduleKey.replace('-', ' ');

    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div><br>Querying Geismar Node...</div>';

    try {
        // Simple query to ensure it doesn't hang
        const data = await sql`SELECT * FROM ${sql.unsafe(tableName)} LIMIT 100`;
        renderTable(data, container);
    } catch (err) {
        console.error("Query Error:", err);
        container.innerHTML = `<div class="alert alert-danger">Access Denied to ${tableName}</div>`;
    }
}

// 3. Rendering
function renderTable(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = "Table is empty.";
        return;
    }

    let html = `<table class="table table-hover table-bordered bg-white shadow-sm"><thead><tr>`;
    Object.keys(data[0]).forEach(key => {
        html += `<th class="bg-light text-uppercase small">${key.replace('_', ' ')}</th>`;
    });
    html += `</tr></thead><tbody>`;

    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td class="small">${val === null ? '-' : val}</td>`;
        });
        html += `</tr>`;
    });

    container.innerHTML = html + `</tbody></table>`;
}

// Ensure functions are available to HTML
window.loadModuleData = loadModuleData;
