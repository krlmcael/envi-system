// Database Simulation
let users = JSON.parse(localStorage.getItem('envi_users')) || [
    { username: 'admin', pass: 'admin123', name: 'System Admin', role: 'admin', status: 'Approved' }
];
let records = JSON.parse(localStorage.getItem('scrap_db')) || [];
let charts = {}; // Storage para sa Chart instances

// --- LOGIN & LOGOUT ---
function login() {
    const userIn = document.getElementById('login-user').value;
    const passIn = document.getElementById('login-pass').value;
    const found = users.find(u => u.username === userIn && u.pass === passIn);

    if (found) {
        if (found.status === 'Disapproved') return alert("Account Disapproved.");
        currentUser = found;
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('logout-btn').classList.remove('hidden');
        showPage(found.role === 'admin' ? 'admin-dashboard' : 'user-add-scrap');
        updateNav();
    } else { alert("Wrong credentials!"); }
}

function logout() { location.reload(); }

// --- NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'admin-dashboard') { renderCharts(); renderAdminTable(); }
    if(id === 'admin-users') renderUserList();
    if(id === 'user-view-scrap') renderUserRecords();
}

function updateNav() {
    const nav = document.getElementById('nav-links');
    if(currentUser.role === 'admin') {
        nav.innerHTML = `<button onclick="showPage('admin-dashboard')">Dashboard</button>
                         <button onclick="showPage('admin-users')">Add User</button>`;
    } else {
        nav.innerHTML = `<button onclick="showPage('user-add-scrap')">Add Scrap</button>
                         <button onclick="showPage('user-view-scrap')">View/Edit</button>`;
    }
}

// --- ADMIN: CHART LOGIC (Based on Added Scrap) ---
function renderCharts() {
    const types = ['Garbage', 'Carton', 'Waste Pallet', 'Pallet'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1. Data: Scrap per Month
    const monthlyData = months.map((m, index) => {
        return records.filter(r => new Date(r.date).getMonth() === index)
                      .reduce((sum, r) => sum + parseInt(r.qty || 0), 0);
    });

    // 2. Data: Total per Type
    const typeCounts = types.map(t => 
        records.filter(r => r.type === t).reduce((sum, r) => sum + parseInt(r.qty || 0), 0)
    );

    // 3. Data: Ranked (Most to Least)
    const sortedScrap = types.map((t, i) => ({ name: t, val: typeCounts[i] }))
                             .sort((a, b) => b.val - a.val);

    // 4. Data: User Performance
    const userList = [...new Set(records.map(r => r.owner))];
    const userTotals = userList.map(u => 
        records.filter(r => r.owner === u).reduce((sum, r) => sum + parseInt(r.qty || 0), 0)
    );

    // Iwas-overlap: Destroy existing charts
    Object.values(charts).forEach(c => c.destroy());

    // --- GRAPH 1: Monthly Trend ---
    charts.monthly = new Chart(document.getElementById('monthlyTrendChart'), {
        type: 'line',
        data: { labels: months, datasets: [{ label: 'Total Scrap Volume', data: monthlyData, borderColor: '#00205B', tension: 0.3, fill: true, backgroundColor: 'rgba(0,32,91,0.1)' }] }
    });

    // --- GRAPH 2: Scrap by Type ---
    charts.type = new Chart(document.getElementById('scrapQtyChart'), {
        type: 'bar',
        data: { labels: types, datasets: [{ label: 'Quantity', data: typeCounts, backgroundColor: ['#00205B', '#E60012', '#666', '#999'] }] }
    });

    // --- GRAPH 3: Most to Least (Doughnut) ---
    charts.rank = new Chart(document.getElementById('rankChart'), {
        type: 'doughnut',
        data: { labels: sortedScrap.map(s => s.name), datasets: [{ data: sortedScrap.map(s => s.val), backgroundColor: ['#00205B', '#E60012', '#D1D1D1', '#333'] }] }
    });

    // --- GRAPH 4: User Most Scrap (Horizontal) ---
    charts.user = new Chart(document.getElementById('userPerformanceChart'), {
        type: 'bar',
        data: { labels: userList, datasets: [{ label: 'Handled by User', data: userTotals, backgroundColor: '#28a745' }] },
        options: { indexAxis: 'y' }
    });
}

// --- ADMIN: TABLE & USER MGMT ---
function renderAdminTable() {
    document.getElementById('admin-all-records').innerHTML = records.map(r => 
        `<tr><td>${r.date}</td><td>${r.owner}</td><td>${r.type}</td><td>${r.qty}</td></tr>`).join('');
}

function addUser() {
    const name = document.getElementById('new-name').value;
    const user = document.getElementById('new-username').value;
    const role = document.getElementById('new-role').value;
    if(!name || !user) return alert("Fill up all fields!");
    users.push({ username: user, pass: '1234', name: name, role: role, status: 'Approved' });
    localStorage.setItem('envi_users', JSON.stringify(users));
    renderUserList(); alert("User Created! Password: 1234");
}

function renderUserList() {
    document.getElementById('user-list-body').innerHTML = users.map((u, i) => `
        <tr><td>${u.name}</td><td>${u.role}</td>
        <td><select onchange="updateStatus(${i}, this.value)">
            <option ${u.status=='Approved'?'selected':''}>Approved</option>
            <option ${u.status=='Disapproved'?'selected':''}>Disapproved</option>
        </select></td>
        <td><button class="btn-delete" onclick="deleteUser(${i})">Delete</button></td></tr>`).join('');
}
function updateStatus(i, v) { users[i].status = v; localStorage.setItem('envi_users', JSON.stringify(users)); }
function deleteUser(i) { users.splice(i,1); localStorage.setItem('envi_users', JSON.stringify(users)); renderUserList(); }

// --- USER: ADD/VIEW SCRAP ---
document.getElementById('scrap-form').onsubmit = (e) => {
    e.preventDefault();
    records.push({
        id: Date.now(), owner: currentUser.username, date: document.getElementById('date').value,
        personnel: document.getElementById('personnel').value, qty: parseInt(document.getElementById('qty').value),
        type: document.getElementById('scrap-type').value
    });
    localStorage.setItem('scrap_db', JSON.stringify(records));
    alert("Record Saved Successfully!"); e.target.reset();
};

function renderUserRecords() {
    const myRecs = records.filter(r => r.owner === currentUser.username);
    document.getElementById('scrap-list').innerHTML = myRecs.map(r => `
        <tr><td>${r.date}</td><td>${r.personnel}</td><td>${r.type}</td><td>${r.qty}</td>
        <td><button class="btn-delete" onclick="deleteRec(${r.id})">Delete</button></td></tr>`).join('');
}
function deleteRec(id) { records = records.filter(r => r.id !== id); localStorage.setItem('scrap_db', JSON.stringify(records)); renderUserRecords(); }

function exportToExcel() {
    let csv = "Date,User Source,Scrap Type,Quantity,Personnel\n";
    records.forEach(r => csv += `${r.date},${r.owner},${r.type},${r.qty},${r.personnel}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ENVI_TEAM_Final_Report.csv'; a.click();
}
