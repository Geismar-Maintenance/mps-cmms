import { neon } from 'https://esm.sh/@neondatabase/serverless';

let sql = null;

// 1. MODULE CONFIG
const MODULE_CONFIG = {
    'parts': { title: 'Master Inventory', query: () => sql`SELECT p.part_number, p.description, p.quantity_on_hand, l.location_code FROM masterparts p LEFT JOIN partlocations l ON p.location_id = l.id ORDER BY l.location_code ASC` },
    'wo-search': { title: 'Work Orders', query: () => sql`SELECT id, description, status FROM workorders` },
    'locations': { title: 'Bin Addresses', query: () => sql`SELECT location_code, loc_type FROM partlocations ORDER BY location_code` }
};

// 2. CONNECT LOGIC
document.getElementById('btn-connect').addEventListener('click', async () => {
    const password = document.getElementById('db-password').value.trim();
    const errorDiv = document.getElementById('login-error');
    if (!password) return;

    const connStr = `postgresql://neondb_owner:${password}@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    
    try {
        const tempSql = neon(connStr);
        await tempSql`SELECT 1`;
        sql = tempSql;
        
        document.getElementById('login-overlay').style.display = 'none';
        const dot = document.getElementById('db-status-dot');
        if (dot) dot.className = 'status-dot bg-success';
        document.getElementById('db-status-text').innerText = "Online";
        
        window.showModule('parts');
    } catch (err) {
        if (errorDiv) errorDiv.innerText = "Connection Failed.";
    }
});

// 3. NAVIGATION
window.showModule = async (key) => {
    if (!sql) return;
    const container = document.getElementById('data-table-container');
    document.getElementById('module-title').innerText = MODULE_CONFIG[key].title;
    container.innerHTML = '<div class="spinner-border text-primary m-5"></div>';

    try {
        const data = await MODULE_CONFIG[key].query();
        renderTable(data, container);
    } catch (err) {
        container.innerHTML = "Error loading data.";
    }
};

function renderTable(data, container) {
    if (!data.length) { container.innerHTML = "Table empty."; return; }
    let html = `<table class="table table-hover border"><thead><tr>${Object.keys(data[0]).map(k => `<th>${k.toUpperCase()}</th>`).join('')}</tr></thead><tbody>`;
    data.forEach(row => { html += `<tr>${Object.values(row).map(v => `<td>${v || '-'}</td>`).join('')}</tr>`; });
    container.innerHTML = html + `</tbody></table>`;
}

// 4. MODAL LOGIC
window.openModal = function(type) {
    const body = document.getElementById('modal-body-content');
    const title = document.getElementById('modal-title-text');
    const submit = document.getElementById('modal-submit-btn');

    if (type === 'add-part') {
        title.innerText = "Admin: Add New Part";
        body.innerHTML = `<input id="p-num" class="form-control mb-2" placeholder="Part #"><input id="p-desc" class="form-control" placeholder="Description">`;
        submit.onclick = () => alert("Add Logic Pending");
    } else if (type === 'issue-part') {
        title.innerText = "Issue Part (-)";
        body.innerHTML = `<input id="i-num" class="form-control mb-2" placeholder="Part #"><input type="number" id="i-qty" class="form-control" placeholder="Qty">`;
        submit.onclick = () => alert("Issue Logic Pending");
    }

    new bootstrap.Modal(document.getElementById('actionModal')).show();
};

window.filterTable = () => {
    const val = document.getElementById('global-search').value.toLowerCase();
    document.querySelectorAll('tbody tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none');
};
