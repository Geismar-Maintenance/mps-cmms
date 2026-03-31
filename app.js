// 1. CONFIGURATION (No trailing slash here to avoid the double-slash error)
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";
const GUEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJpYXQiOjE1MTYyMzkwMjJ9.Q3Yn-ST6S-5v_9wX-9wX-9wX-9wX-9wX-9wX-9wX-9w"; 

async function dbAction(table, action) {
    try {
        // 2. PAYLOAD MAPPING (Matches your HTML IDs and DB columns)
        const payload = {
            partnumber: document.getElementById('partnumber').value.trim(),
            description: document.getElementById('description').value.trim(),
            manufacturer: document.getElementById('manufacturer').value.trim(),
            category: document.getElementById('category').value,
            unitcost: parseFloat(document.getElementById('unitcost').value) || 0,
            modelnumber: document.getElementById('modelnumber').value.trim()
        };

        // 3. THE FETCH (Notice the single forward slash between URL and table)
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GUEST_TOKEN}`,
                'Accept': 'application/json',
                'Prefer': 'return=minimal' // This bypasses the "missing key id" error
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("✅ Success! Part saved to Neon.");
            document.getElementById('partsForm').reset();
        } else {
            const errData = await response.json();
            console.error("Database Error:", errData);
            alert(`❌ Error: ${errData.message}`);
        }
    } catch (err) {
        console.error("Network/Fetch Error:", err);
        alert("Fetch failed. Check the console (F12) for CORS or URL errors.");
    }
}

// 4. EVENT LISTENER (The "Bulletproof" way to handle the button click)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('partsForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevents the page from refreshing and killing the fetch
            dbAction('masterparts', 'addPart');
        });
    }
