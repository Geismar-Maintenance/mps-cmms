// 1. CONFIGURATION
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";

// This is the "Guest" token that identifies you as the 'anon' role we authorized in SQL
const GUEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJpYXQiOjE1MTYyMzkwMjJ9.Q3Yn-ST6S-5v_9wX-9wX-9wX-9wX-9wX-9wX-9wX-9w";

/**
 * Main Database Controller
 */
async function dbAction(table, action) {
    console.log(`Attempting to save to ${table}...`);
    
    let payload = {};

    try {
        // 2. DATA MAPPING (Matches your new lowercase HTML IDs)
        if (action === 'addPart') {
            payload = {
                partnumber: document.getElementById('partnumber').value.trim(),
                description: document.getElementById('description').value.trim(),
                manufacturer: document.getElementById('manufacturer').value.trim(),
                category: document.getElementById('category').value,
                unitcost: parseFloat(document.getElementById('unitcost').value) || 0,
                modelnumber: document.getElementById('modelnumber').value.trim(),
            };
        }

        // 3. THE API CALL
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GUEST_TOKEN}`,
                'Accept': 'application/json',
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
            clearForm();
        } else {
            const error = await response.json();
            console.error("Database Refusal:", error);
            alert(`❌ Database Error: ${error.message}`);
        }

    } catch (err) {
        // This is the "catch" block that was missing!
        console.error("Connection Failed:", err);
        alert("Could not connect to Neon. Check your internet or API URL.");
    }
}

// UI Helper: Clears the form
function clearForm() {
    const ids = ['partnumber', 'description', 'manufacturer', 'modelnumber', 'unitcost', 'inventories', 'transactions'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = (id === 'unitcost' || id === 'inventories') ? '0' : '';
    });
}
