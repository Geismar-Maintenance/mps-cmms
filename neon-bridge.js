import { NeonBridge } from './neon-bridge.js';

const NEON_AUTH_URL = 'https://ep-plain-mouse-aeznlgmn.neonauth.c-2.us-east-2.aws.neon.tech/neondb/auth';

const bridge = new NeonBridge({
    authUrl: NEON_AUTH_URL
});

async function init() {
    const session = await bridge.getSession();

    if (session) {
        // Show App
        document.body.classList.add('active-app');
        loadData();
    } else {
        // Show Login
        bridge.renderLogin('neon-auth-ui');
    }
}

async function loadData() {
    const tbody = document.getElementById('wo-table-body');
    // For now, we show a placeholder. 
    // In the next step, we will connect bridge.query() to your Postgres tables.
    tbody.innerHTML = `
        <tr>
            <td>1001</td>
            <td>LINE-04-WRAP</td>
            <td>Replace main drive belt</td>
            <td><span class="badge bg-danger">High</span></td>
            <td>In Progress</td>
        </tr>`;
}

document.getElementById('signOut').onclick = () => {
    localStorage.removeItem('mps_session');
    window.location.reload();
};

init();
