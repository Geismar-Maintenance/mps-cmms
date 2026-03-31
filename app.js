// 1. DYNAMIC CONFIGURATION
// Ensure this matches your Neon Project Settings > PostgREST URL
const API_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech";

/**
 * Main function to handle all database interactions.
 * @param {string} table - The PostgreSQL table name (case-sensitive)
 * @param {string} actionType - The logical action (e.g., 'addPart')
 */
async function dbAction(table, actionType) {
    const token = sessionStorage.getItem('mps_token');
    
    if (!token) {
        alert("No active session. Please log in with your JWT.");
        location.reload();
        return;
    }

    let payload = {};

    // 2. DATA MAPPING (Matches your index.html IDs to Database Columns)
    // IMPORTANT: PostgreSQL usually expects lowercase column names.
    try {
        if (actionType === 'addPart') {
            payload = {
                partnumber: document.getElementById('p_no').value.trim(),
                modelnumber: document.getElementById('p_model').value.trim(),
                manufacturer: document.getElementById('p_mfg').value.trim(),
                description: document.getElementById('p_desc').value.trim(),
                unitcost: parseFloat(document.getElementById('p_cost').value) || 0
            };
        } 
        else if (actionType === 'updateStock') {
            payload = {
                partnumber: document.getElementById('r_part').value.trim(),
                facilityid: parseInt(document.getElementById('r_fac').value),
                quantity: parseInt(document.getElementById('r_qty').value),
                ownergroup: document.getElementById('r_owner').value,
                binlocation: document.getElementById('r_bin').value.trim()
            };
        }
        else if (actionType === 'addTech') {
            payload = {
                fullname: document.getElementById('t_name').value.trim(),
                techlevel: document.getElementById('t_level').value,
                contactemail: document.getElementById('t_email').value.trim(),
                contactphone: document.getElementById('t_phone').value.trim()
            };
        }

        // 3. THE API CALL
        const response = await fetch(`${API_URL}/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.pgrst.object+json',
                'Prefer': 'return=representation',
                'Content-Profile': 'public' // Explicitly targets the public schema
            },
            body: JSON.stringify(payload)
        });

        // 4. RESPONSE HANDLING
        if (response.ok) {
            const data = await response.json();
            console.log("Success:", data);
            alert(`Record saved successfully to ${table}!`);
            clearForm(actionType);
        } else {
            const errorData = await response.json();
            console.error("Database Error:", errorData);
            
            // Specific error handling for industrial users
            if (response.status === 401) {
                alert("Session Expired or Invalid Token. Please log in again.");
                logout();
            } else if (response.status === 400) {
                alert(`Data Error: ${errorData.message || 'Check column names and formatting.'}`);
            } else {
                alert(`System Error: ${errorData.hint || errorData.message}`);
            }
        }
    } catch (err) {
        console.error("Network/Connection Error:", err);
        alert("Failed to connect to the database. Check your internet or CORS settings.");
    }
}

// Helper to clear forms after successful entry
function clearForm(type) {
    if (type === 'addPart') {
        document.querySelectorAll('#pane-inv input, #pane-inv textarea').forEach(i => i.value = '');
    }
}

// Auth UI Helpers
function saveToken() {
    const token = document.getElementById('user-token').value.trim();
    if (token.startsWith('ey')) {
        sessionStorage.setItem('mps_token', token);
        document.getElementById('auth-overlay').style.display = 'none';
    } else {
        document.getElementById('login-err').innerText = "Invalid JWT Format. Must start with 'ey'.";
    }
}

function logout() {
    sessionStorage.removeItem('mps_token');
    location.reload();
}

// Check auth status on load
window.addEventListener('load', () => {
    if (sessionStorage.getItem('mps_token')) {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) overlay.style.display = 'none';
    }
});
