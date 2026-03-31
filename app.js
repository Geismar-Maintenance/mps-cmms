// 1. CONFIGURATION
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech";

// This is a "Guest Badge" that tells Neon to use the 'anon' role permissions
const GUEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJpYXQiOjE1MTYyMzkwMjJ9.Q3Yn-ST6S-5v_9wX-9wX-9wX-9wX-9wX-9wX-9wX-9w";

/**
 * Main Database Controller
 * @param {string} table - The table name (e.g., 'masterparts', 'technicians')
 * @param {string} action - The form action ID
 */
async function dbAction(table, action) {
    console.log(`Attempting to save to ${table}...`);
    
    let payload = {};

    // 2. DATA MAPPING (Matches your HTML IDs to lowercase Postgres columns)
    try {
        if (action === 'addPart') {
            payload = {
                partnumber: document.getElementById('p_no').value.trim(),
                modelnumber: document.getElementById('p_model').value.trim(),
                manufacturer: document.getElementById('p_mfg').value.trim(),
                description: document.getElementById('p_desc').value.trim(),
                unitcost: parseFloat(document.getElementById('p_cost').value) || 0
            };
        } 
        else if (action === 'addWorkOrder') {
            payload = {
                assetid: document.getElementById('wo_asset').value.trim(),
                description: document.getElementById('wo_desc').value.trim(),
                status: 'Open',
                priority: document.getElementById('wo_priority').value
            };
        }

        // 3. THE API CALL (Using the Authorized 'anon' Role)
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GUEST_TOKEN}`, // Identifies as 'anon'
                'Accept': 'application/vnd.pgrst.object+json',
                'Prefer': 'return=representation',
                'Content-Profile': 'public'
            },
            body: JSON.stringify(payload)
        });

        // 4. RESPONSE HANDLING
        if (response.ok) {
            const data = await response.json();
            console.log("Database Success:", data);
            alert(`✅ Success! Record added to ${table}.`);
            clearForm(action);
        } else {
            const error = await response.json();
            console.error("Database Refusal:", error);
            alert(`❌ Database Error: ${error.message}\nHint: ${error.hint || 'Check column names'}`);
        }
    } catch (err) {
        console.error("Connection Failed:", err);
        alert("Could not connect to Neon. Check your internet or API URL.");
    }
}

// UI Helper: Clears the form after a successful save
function clearForm(action) {
    if (action === 'addPart') {
        const fields = ['p_no', 'p_model', 'p_mfg', 'p_desc', 'p_cost'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = '';
        });
    }
}

// Auto-hide the login overlay since we are in testing mode
window.addEventListener('load', () => {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log("Auth Overlay hidden for testing.");
    }
});
