// 1. CONFIGURATION
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1/";

// Ensure this token is valid for your Neon instance
const GUEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJpYXQiOjE1MTYyMzkwMjJ9.Q3Yn-ST6S-5v_9wX-9wX-9wX-9wX-9wX-9wX-9wX-9w";

/**
 * Main Database Controller
 */
async function dbAction(table, action) {
    console.log(`Attempting to save to ${table}...`);
    
    let payload = {};

    try {
        // 2. DATA MAPPING
        // These IDs must match the 'id' attribute in your HTML EXACTLY
        if (action === 'addPart') {
            const elPart = document.getElementById('partnumber');
            const elDesc = document.getElementById('description');
            const elManu = document.getElementById('manufacturer');
            const elCat  = document.getElementById('category');
            const elCost = document.getElementById('unitcost');
            const elMod  = document.getElementById('modelnumber');

            // Safety check: If any element is missing, stop and alert
            if (!elPart || !elDesc || !elManu || !elCat || !elCost || !elMod) {
                throw new Error("One or more form fields are missing from the HTML.");
            }

            payload = {
                partnumber: elPart.value.trim(),
                description: elDesc.value.trim(),
                manufacturer: elManu.value.trim(),
                category: elCat.value,
                unitcost: parseFloat(elCost.value) || 0,
                modelnumber: elMod.value.trim()
            };
        }

        // 3. THE API CALL
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GUEST_TOKEN}`,
                'Accept': 'application/json',
                'Prefer': 'return=minimal' 
            },
            body: JSON.stringify(payload)
        });

        // 4. RESPONSE HANDLING
        if (response.ok) {
            console.log("Database Success");
            alert(`✅ Success! Part ${payload.partnumber} added to ${table}.`);
            clearForm();
        } else {
            const error = await response.json();
            console.error("Database Refusal:", error);
            alert(`❌ Database Error: ${error.message}`);
        }

    } catch (err) {
        console.error("System Error Details:", err);
        alert(`Action failed: ${err.message}`);
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
