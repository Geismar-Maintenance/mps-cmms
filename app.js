/**
 * MPS-CMMS Core Logic
 * Handles Module Navigation and Database Actions
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("MPS-CMMS Initialized.");
    
    // Form Submission Listeners
    document.getElementById('formAddPart').addEventListener('submit', (e) => handleFormSubmit(e, 'masterparts'));
    document.getElementById('formAddWO').addEventListener('submit', (e) => handleFormSubmit(e, 'workorders'));
});

/**
 * Module Toggling Logic
 */
function showModule(moduleId) {
    // 1. Hide all modules
    document.querySelectorAll('.module-section').forEach(sec => sec.classList.remove('active'));
    
    // 2. Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // 3. Show target module
    const target = document.getElementById(moduleId);
    target.classList.add('active');
    
    // 4. Update UI Header and Nav
    const activeLink = document.querySelector(`[onclick="showModule('${moduleId}')"]`);
    activeLink.classList.add('active');
    document.getElementById('module-title').innerText = activeLink.innerText.trim();
}

/**
 * Modal Opener Logic
 */
function openCreateModal() {
    const activeModule = document.querySelector('.module-section.active').id;
    
    if (activeModule === 'wo-mgmt') {
        new bootstrap.Modal(document.getElementById('modalAddWO')).show();
    } else if (activeModule === 'part-mgmt') {
        new bootstrap.Modal(document.getElementById('modalAddPart')).show();
    } else {
        alert("Management module for this section is still under development.");
    }
}

/**
 * Database Action Handler
 * Prepares form data to be sent to the Neon API
 */
async function handleFormSubmit(event, table) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    console.log(`Submitting to ${table}:`, data);

    // Placeholder for dbAction integration
    try {
        // Here you would call your Neon/PostgREST endpoint
        // Example: await dbAction('POST', table, data);
        
        alert(`${table} entry saved successfully!`);
        event.target.reset();
        bootstrap.Modal.getInstance(event.target.closest('.modal')).hide();
    } catch (error) {
        console.error("Database Error:", error);
        alert("Failed to save data. Check console for details.");
    }
}

/**
 * Optional: Function to refresh table data from Neon
 */
async function refreshTableData(table) {
    // This would fetch from your Neon endpoint and populate the <tbody>
    console.log(`Fetching fresh data for ${table}...`);
}