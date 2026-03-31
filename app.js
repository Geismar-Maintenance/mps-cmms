// 1. CONFIGURATION
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";

// Ensure this token is valid for your Neon instance
const GUEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJpYXQiOjE1MTYyMzkwMjJ9.Q3Yn-ST6S-5v_9wX-9wX-9wX-9wX-9wX-9wX-9wX-9w";

/**
 * Main Database Controller
 */
async function dbAction(table, action) {
    console.log(`Attempting to save to ${table}...`);
    
    let payload = {};

    try {
        // 2. DATA MAPPING (Matches HTML IDs and DB Columns exactly: no underscores)
        if (action === 'addPart') {
            payload = {
                partnumber: document.getElementById('partnumber').value.trim(),
                description: document.getElementById('description').value.trim(),
                manufacturer: document.getElementById('manufacturer').value.trim(),
                category: document.getElementById('category').value,
                unitcost: parseFloat(document.getElementById('unitcost').value) || 0,
                modelnumber: document.getElementById('modelnumber').value.trim()
            };
        }

        // 3. THE API CALL
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GUEST_TOKEN}`,
                'Accept': 'application/json',
                'Prefer': 'return=minimal' // Essential to avoid "missing key id" errors
            },
            body: JSON.stringify(payload)
        });

        // 4. RESPONSE HANDLING
        if (response.ok) {
            console.log("Database Success");
            alert(`✅ Success! Part ${payload.partnumber} added to ${table}.`);
            clearForm();
            // Refresh table if the function exists
            if (typeof fetchTableData === 'function') fetchTableData(table);
        } else {
            const error = await response.json();
            console.error("Database Refusal:", error);
            alert(`❌ Database Error: ${error.message}`);
        }

    } catch (err) {
        // Log the actual error to console so we can see if it's a code crash or a network issue
        console.error("System Error:", err);
        alert("Action failed. Check browser console (F12) for the specific error.");
    }
}

// UI Helper: Clears the form
function clearForm() {
    const ids = ['partnumber', 'description', 'manufacturer', 'modelnumber', 'unitcost'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = (id === 'unitcost') ? '0' : '';
    });
}
