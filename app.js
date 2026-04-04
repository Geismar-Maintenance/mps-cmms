import { NeonBridge } from './neon-bridge.js';

const bridge = new NeonBridge();

document.addEventListener('DOMContentLoaded', async () => {
    const session = await bridge.getSession();

    if (session) {
        document.body.classList.add('active-app');
        setupSignOut();
        loadWorkOrders();
    } else {
        bridge.renderLogin('neon-auth-ui');
    }
});

function setupSignOut() {
    const btn = document.getElementById('signOut');
    if (btn) {
        btn.onclick = () => {
            localStorage.removeItem('mps_session');
            window.location.reload();
        };
    }
}

async function loadWorkOrders() {
    const tbody = document.getElementById('wo-table-body');
    // We will eventually pull this from: 
    // https://ep-plain-mouse-aeznlgmn.apirest.c-2.us-east-2.aws.neon.tech/neondb/rest/v1/WorkOrders
    
    tbody.innerHTML = `
        <tr>
            <td>1001</td>
            <td>GEIS-MAUSER-L1</td>
            <td>Check Neon Integration Status</td>
            <td><span class="badge bg-success">Complete</span></td>
            <td>Verified</td>
        </tr>`;
}
