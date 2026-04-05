import { neon } from 'https://esm.sh/@neondatabase/serverless';

// 1. GLOBAL STATE & CONFIG
let sql = null;

const MODULE_CONFIG = {
    'parts': {
        title: 'Master Parts Inventory',
        query: () => sql`
            SELECT p.part_number, p.description, p.quantity_on_hand, l.location_code 
            FROM masterparts p 
            LEFT JOIN partlocations l ON p.location_id = l.id 
            ORDER BY l.location_code ASC`
    },
    'wo-search': {
        title: 'Work Order Registry',
        query: () => sql`SELECT id, description, status, assigned_to, created_at FROM workorders ORDER BY created_at DESC`
    },
    'technicians': {
        title: 'Technician Management',
        query: () => sql`SELECT id, name, role, email FROM technicians`
    },
    'locations': {
        title: 'Location Management (100.100.x)',
        query: () => sql`SELECT id, location_code, loc_type FROM partlocations ORDER BY location_code`
    },
    'assets': {
        title: 'Asset Registry',
        query: () => sql`SELECT id, asset_tag, description, model_number FROM assets`
    }
};

// 2. AUTHENTICATION & CONNECTION
document.getElementById('btn-connect').addEventListener('click', async () => {
    const password = document.getElementById('db-password').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    // Pooled Connection String
    const connectionString = `postgresql://neondb_owner:${password}@ep-plain-mouse-aeznlgmn-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    
    try {
        const tempSql = neon(connectionString);
        await tempSql`SELECT 1`; // Connection Handshake
        
        sql = tempSql;
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('db-status-dot').className = 'status-dot bg-success';
        document.getElementById('db-status-text').innerText = "Online (neondb_owner)";
        
        window.showModule('parts'); // Default View

    } catch (err) {
        console.error("Auth Error:", err);
        errorDiv.innerText = "Access Denied. Check npg_ password.";
    }
});

// 3. NAVIGATION & TABLE RENDERING
window.showModule = async (key) => {
    if (!sql) return;

    // Update UI State
    const titleElement = document.getElementById('module-title');
    const container = document.getElementById('data-table-container');
    
    titleElement.innerText = MODULE_CONFIG[key].title;
    container.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';

    try {
        const data = await MODULE_CONFIG[key].query();
        renderTable(data, container);
    } catch (err) {
        console.error("Query Error:", err);
        container.innerHTML = `<div class="alert alert-danger">Error accessing ${key} table.</div>`;
    }
};

function renderTable(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="p-5 text-center text-muted border rounded bg-white">No records found in this node.</div>';
        return;
    }

    let html = `<table class="table table-hover bg-white border shadow-sm rounded align-middle">
        <thead class="table-light"><tr>`;
    
    // Build Headers from Keys
    Object.keys(data[0]).forEach(key => {
        html += `<th class="small fw-bold text-muted text-uppercase">${key.replace('_', ' ')}</th>`;
    });
    
    html += `</tr></thead><tbody>`;

    // Build Rows
    data.forEach(row => {
        html += `<tr>`;
        Object.values(row).forEach(val => {
            html += `<td class="small">${val === null ? '-' : val}</td>`;
        });
        html += `</tr>`;
    });

    container.innerHTML = html + `</tbody></table>`;
}

// 4. DYNAMIC MODAL & FORM LOGIC
window.openModal = function(actionType) {
    const modalTitle = document.getElementById('modal-title-text');
    const modalBody = document.getElementById('modal-body-content');
    const submitBtn = document.getElementById('modal-submit-btn');

    modalBody.innerHTML = ''; // Reset

    if (actionType === 'add-part') {
        modalTitle.innerText = "Admin: Register New Part";
        modalBody.innerHTML = `
            <input type="text" id="p-num" class="form-control mb-2" placeholder="Part Number">
            <input type="text" id="p-desc" class="form-control mb-2" placeholder="Description">
            <select id="p-loc" class="form-select mb-2"><option>Loading Locations...</option></select>
            <input type="number" id="p-qty" class="form-control" placeholder="Initial Quantity" value="0">
        `;
        window.populateLocations();
        submitBtn.onclick = () => window.saveNewPart();
    } 
    
    else if (actionType === 'issue-part') {
        modalTitle.innerText = "Issue Part (-)";
        modalBody.innerHTML = `
            <input type="text" id="issue-search" class="form-control mb-2" placeholder="Part Number">
            <input type="number" id="issue-qty" class="form-control mb-2" placeholder="Qty to Remove">
            <input type="text" id="issue-wo" class="form-control" placeholder="Work Order #">
        `;
        submitBtn.onclick = () => alert("Logic for Issue Pending Development");
    }

    const modalElement = document.getElementById('actionModal');
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalElement);
    bsModal.show();
};

// 5. HELPER FUNCTIONS (SQL Actions)
window.populateLocations = async function() {
    const select = document.getElementById('p-loc');
    try {
        const locations = await sql`SELECT id, location_code FROM partlocations ORDER BY location_code`;
        select.innerHTML = '<option value="">Select Storage Address...</option>';
        locations.forEach(loc => {
            select.innerHTML += `<option value="${loc.id}">${loc.location_code}</option>`;
        });
    } catch (e) {
        select.innerHTML = '<option>Error loading locations</option>';
    }
};

window.saveNewPart = async function() {
    const partNum = document.getElementById('p-num').value;
    const desc = document.getElementById('p-desc').value;
    const locId = document.getElementById('p-loc').value;
    const qty = document.getElementById('p-qty').value;

    try {
        await sql`INSERT INTO masterparts (part_number, description, location_id, quantity_on_hand)
                  VALUES (${partNum}, ${desc}, ${locId}, ${qty})`;
        alert("Part saved to Geismar Node!");
        bootstrap.Modal.getInstance(document.getElementById('actionModal')).hide();
        window.showModule('parts'); // Refresh Table
    } catch (err) {
        alert("Failed to save part. Ensure Part Number is unique.");
    }
};

window.filterTable = function() {
    const val = document.getElementById('global-search').value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none');
};
