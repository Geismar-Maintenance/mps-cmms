import { neon } from 'https://esm.sh/@neondatabase/serverless';

// 1. Global State
let sql = null;

// Your verified Geismar table mapping
const TABLE_MAP = {
    'parts': 'masterparts',
    'work-orders': 'workorders',
    'assets': 'assets',
    'locations': 'partlocations',
    'technicians': 'technicians'
};

// 2. Authentication Logic
document.getElementById('btn-connect').addEventListener('click', async () => {
    const passwordInput = document.getElementById('db-password');
    const errorDiv = document.getElementById('login-error');
    const password = passwordInput.value.trim();
    
    if (!password) {
        errorDiv.innerText = "Please enter your npg_ password.";
        return;
    }

    // Using the Pooled Connection String you verified
    const connectionString = `postgresql://neondb_owner:${password}@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    
    try {
        errorDiv.className = "text-info small mt-2";
        errorDiv.innerText = "Connecting to Geismar Node...";
        
        const tempSql = neon(connectionString);
        
        // Handshake: Using the required Tagged Template literal syntax
        await tempSql`SELECT 1`;
        
        // Success: Unlock the UI
        sql = tempSql;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('db-status-dot').className = 'bi bi-circle-fill text-success me-2';
        document.getElementById('db-status-text').innerText = "Online (Authenticated)";
        
        // Load the default inventory view
        loadModuleData('parts');

    } catch (err) {
        console.error("Connection Failed:", err);
        errorDiv.className = "text-danger small mt-2";
        errorDiv.innerText = "Connection Refused. Check password or Neon Permissions.";
    }
});

// 3. Data Fetching Logic
async function loadModuleData(moduleKey) {
    if (!sql) return;

    const tableName = TABLE_MAP[moduleKey];
    const container = document.getElementById('data-table-container');
    
    // Show Loading State
    container.innerHTML = `
        <div class="p-5 text-center text-muted">
            <div class="spinner-border spinner-border-sm mb-2"></div>
            <br>Querying Geismar Node: ${tableName}...
        </div>`;

    try {
        /**
         * FIX: Using Tagged Templates as required by Neon Driver.
         * We use sql.unsafe() because SQL parameters ($1, $2) 
         * do not work for Table Names.
         */
        const data = await sql`SELECT * FROM ${sql.unsafe(tableName)} LIMIT 100`;
        
        renderTable(data, container);

    } catch (err) {
        console.error("Query Error:", err);
        container.innerHTML = `
            <div class="p-5 text-center text-danger">
                <i class="bi bi-exclamation-octagon fs-1"></i>
                <h6 class="mt-3">Access Denied: ${tableName}</h6>
                <p class="small">Ensure table permissions are granted in Neon.</p>
            </div>`;
    }
}

// 4. UI Rendering Logic
function renderTable(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="p-5 text-center text-muted">Table is empty.</div>`;
        return;
    }

    let html = `<table class="table table-hover align-middle mb-0">
