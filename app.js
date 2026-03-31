// This adds a temporary bridge that attaches the correct headers for you
const API_BASE_URL = "https://cors-anywhere.herokuapp.com/https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";

// const API_BASE_URL = "https://ep-restless-art-aejfppri.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1";

// Helper function for API calls
async function apiRequest(endpoint, method, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation' // Tells PostgREST to return the created/updated row
        }
    };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
        if (!response.ok) throw new Error(await response.text());
        return await response.json();
    } catch (err) {
        console.error("API Error:", err);
        alert("Operation Failed: " + err.message);
    }
}

// 1. ADD MASTER PART
async function addPart() {
    const data = {
        PartNumber: document.getElementById('p_no').value,
        ModelNumber: document.getElementById('p_model').value,
        Description: document.getElementById('p_desc').value,
        Manufacturer: document.getElementById('p_mfg').value,
        UnitCost: parseFloat(document.getElementById('p_cost').value)
    };
    
    const res = await apiRequest('MasterParts', 'POST', data);
    if (res) alert("Success: Part added to Global Catalog.");
}

// 2. ADD TECHNICIAN
async function addTech() {
    const data = { Username: document.getElementById('tech_name').value, Role: 'Mechanic' };
    const res = await apiRequest('Users', 'POST', data);
    if (res) alert("Success: Technician registered.");
}

// 3. CREATE WORK ORDER
async function createWO() {
    const data = {
        AssetID: parseInt(document.getElementById('wo_asset').value),
        Description: document.getElementById('wo_desc').value,
        Status: 'Open'
    };
    const res = await apiRequest('WorkOrders', 'POST', data);
    if (res) alert("Success: Work Order #" + res[0].WONumber + " is now Open.");
}

// 4. ISSUE PART (Logic: Create a Transaction)
// PostgREST handles the 'Insert'. To subtract from Inventory, 
// we typically use a Database Trigger in Neon to keep it automated.
async function issuePart() {
    const data = {
        PartNumber: document.getElementById('i_part').value,
        WONumber: parseInt(document.getElementById('i_wo').value),
        QtyChange: -Math.abs(parseInt(document.getElementById('i_qty').value)) // Force negative
    };
    const res = await apiRequest('Transactions', 'POST', data);
    if (res) alert("Success: Part issued and stock transaction recorded.");
}