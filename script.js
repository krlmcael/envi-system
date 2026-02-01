// Database Simulation
let users = JSON.parse(localStorage.getItem('envi_users')) || [
    { username: 'admin', pass: 'admin123', name: 'System Admin', role: 'admin', status: 'Approved' }
];
let records = JSON.parse(localStorage.getItem('scrap_db')) || [];
let currentUser = null;

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
    } else {
        alert("Wrong credentials!");
    }
}

function logout() { location.reload(); }

// --- NAVIGATION ---
function showPage(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'admin-dashboard') { renderChart(); renderAdminTable(); }
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

// --- ADMIN FUNCTIONS ---
function addUser() {
    const name = document.getElementById('new-name').value;
    const user = document.getElementById('new-username').value;
    const role = document.getElementById('new-role').value;
    if(!name || !user) return alert("Complete the fields!");
    users.push({ username: user, pass: '1234', name: name, role: role, status: 'Approved' });
    localStorage.setItem('envi_users', JSON.stringify(users));
    renderUserList();
    alert("User Created! Default Pass: 1234");
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

// --- SCRAP RECORDS ---
document.getElementById('scrap-form').onsubmit = (e) => {
    e.preventDefault();
    records.push({
        id: Date.now(), owner: currentUser.username, date: document.getElementById('date').value,
        personnel: document.getElementById('personnel').value, qty: document.getElementById('qty').value,
        type: document.getElementById('scrap-type').value
    });
    localStorage.setItem('scrap_db', JSON.stringify(records));
    alert("Record Saved!"); e.target.reset();
};

function renderUserRecords() {
    const myRecs = records.filter(r => r.owner === currentUser.username);
    document.getElementById('scrap-list').innerHTML = myRecs.map(r => `
        <tr><td>${r.date}</td><td>${r.personnel}</td><td>${r.type}</td><td>${r.qty}</td>
        <td><button class="btn-delete" onclick="deleteRec(${r.id})">Delete</button></td></tr>`).join('');
}

function deleteRec(id) { records = records.filter(r => r.id !== id); localStorage.setItem('scrap_db', JSON.stringify(records)); renderUserRecords(); }

function renderAdminTable() {
    document.getElementById('admin-all-records').innerHTML = records.map(r => `
        <tr><td>${r.date}</td><td>${r.owner}</td><td>${r.type}</td><td>${r.qty}</td></tr>`).join('');
}

// --- EXPORT & CHART ---
function exportToExcel() {
    let csv = "Date,User,Type,Quantity,Personnel\n";
    records.forEach(r => csv += `${r.date},${r.owner},${r.type},${r.qty},${r.personnel}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ENVI_Report.csv'; a.click();
}

function renderChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    const types = ['Garbage', 'Carton', 'Waste Pallet', 'Pallet'];
    const counts = types.map(t => records.filter(r => r.type === t).reduce((sum, r) => sum + parseInt(r.qty), 0));
    new Chart(ctx, { type: 'bar', data: { labels: types, datasets: [{ label: 'Total Scrap Quantity', data: counts, backgroundColor: '#00205B' }] } });
}
