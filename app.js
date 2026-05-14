let users = JSON.parse(localStorage.getItem('isp_users')) || [];
let currentUserId = null;

function initTheme() {
    let isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeIcon').classList.replace('fa-moon', 'fa-sun');
    }
}
function toggleTheme() {
    let body = document.body;
    let icon = document.getElementById('themeIcon');
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// فتح التطبيق مباشرة (تم حذف شاشة تسجيل الدخول)
function initApp() {
    initTheme();
    goHome();
}

function formatDateTimeLocal(date) {
    let d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function formatDateDisplay(dateStr) {
    let d = new Date(dateStr);
    let yyyy = d.getFullYear();
    let mm = String(d.getMonth() + 1).padStart(2, '0');
    let dd = String(d.getDate()).padStart(2, '0');
    let hours = d.getHours();
    let minutes = String(d.getMinutes()).padStart(2, '0');
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${yyyy}/${mm}/${dd} ${hours}:${minutes} ${ampm}`;
}

function calculateTimeStatus(startDateStr, endDateStr) {
    let now = new Date();
    let end = new Date(endDateStr);
    let diffMs = end - now;
    if (diffMs <= 0) return { status: 'غير متصل', text: 'منتهي', colorClass: 'status-offline' };
    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { status: 'متصل', text: `باقي ${diffDays} يوم و ${diffHours} ساعة`, colorClass: 'status-online' };
}

function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}
function goHome() { showView('view-home'); currentUserId = null; renderHome(); }

function renderHome() {
    const list = document.getElementById('subscribersList');
    list.innerHTML = '';
    if(users.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">لا يوجد مشتركين.</p>';
        return;
    }
    users.forEach(user => {
        let timeData = calculateTimeStatus(user.startDate, user.endDate);
        let card = document.createElement('div');
        card.className = 'user-card';
        card.onclick = () => openProfile(user.id);
        card.innerHTML = `
            <div class="user-info">
                <h4>${user.name}</h4>
                <p><span class="${timeData.colorClass}">● ${timeData.status}</span> | ${Number(user.price).toLocaleString()} د.ع</p>
            </div>
            <div class="user-actions-list">
                <button class="btn-icon-small edit-btn" onclick="openEditModalFromList(${user.id}, event)"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-small delete-btn" onclick="deleteUser(${user.id}, event)"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
}

function openAddModal() {
    currentUserId = null;
    document.getElementById('modalTitle').innerText = 'إضافة مشترك جديد';
    document.getElementById('f-id').value = '';
    document.getElementById('f-name').value = '';
    document.getElementById('f-phone').value = '';
    document.getElementById('f-package').value = '';
    document.getElementById('f-price').value = '';
    document.getElementById('f-tower').value = '';
    document.getElementById('f-user').value = '';
    document.getElementById('f-start-date').value = formatDateTimeLocal(new Date());
    document.getElementById('userModal').classList.add('active');
}

function openEditModalFromList(id, event) {
    event.stopPropagation();
    currentUserId = id;
    openEditModal();
}

function openEditModal() {
    let user = users.find(u => u.id === currentUserId);
    if(!user) return;
    document.getElementById('modalTitle').innerText = 'تعديل معلومات المشترك';
    document.getElementById('f-id').value = user.id;
    document.getElementById('f-name').value = user.name;
    document.getElementById('f-phone').value = user.phone;
    document.getElementById('f-package').value = user.package;
    document.getElementById('f-price').value = user.price;
    document.getElementById('f-tower').value = user.tower;
    document.getElementById('f-user').value = user.user;
    document.getElementById('f-start-date').value = formatDateTimeLocal(user.startDate);
    document.getElementById('userModal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function saveUser() {
    let fIdVal = document.getElementById('f-id').value;
    let finalId = fIdVal ? parseInt(fIdVal) : Date.now(); 
    let startDateObj = new Date(document.getElementById('f-start-date').value || new Date());
    let endDateObj = new Date(startDateObj.getTime() + (30 * 24 * 60 * 60 * 1000));
    let newUser = {
        id: finalId,
        name: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value,
        package: document.getElementById('f-package').value || 'Default',
        price: document.getElementById('f-price').value || 0,
        tower: document.getElementById('f-tower').value || 'N/A',
        user: document.getElementById('f-user').value || 'N/A',
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        history: []
    };
    if(!newUser.name || !newUser.phone) { alert("الاسم ورقم الهاتف مطلوبان!"); return; }
    if (fIdVal) {
        let index = users.findIndex(u => u.id === finalId);
        if(index !== -1) { newUser.history = users[index].history; users[index] = newUser; }
    } else {
        users.push(newUser);
    }
    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals();
    goHome();
}

function deleteUser(id, event) {
    if(event) event.stopPropagation(); 
    if(confirm('هل أنت متأكد؟')) {
        users = users.filter(u => u.id !== id);
        localStorage.setItem('isp_users', JSON.stringify(users));
        goHome();
    }
}

function openProfile(id) {
    currentUserId = id;
    let user = users.find(u => u.id === id);
    if(!user) return;
    let timeData = calculateTimeStatus(user.startDate, user.endDate);
    document.getElementById('p-name').innerText = user.name;
    document.getElementById('p-deposit').innerText = `${Number(user.price).toLocaleString()} د.ع`;
    document.getElementById('p-package').innerText = user.package;
    document.getElementById('p-tower').innerText = user.tower;
    document.getElementById('p-user').innerText = user.user;
    
    // جعل الرقم قابل للاتصال
    let cleanPhone = user.phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    let finalPhone = '964' + cleanPhone;
    let phoneLink = document.getElementById('p-phone');
    phoneLink.innerText = `+964 ${cleanPhone}`;
    phoneLink.href = `tel:${finalPhone}`;
    
    let statusEl = document.getElementById('p-status');
    statusEl.innerHTML = `<i class="fas fa-circle" style="color: ${timeData.colorClass === 'status-online' ? 'var(--success-green)' : 'var(--text-main)'}"></i>`;
    document.getElementById('p-days').innerText = timeData.text;
    document.getElementById('p-end-date').innerText = formatDateDisplay(user.endDate);
    showView('view-profile');
}

function openRenewModal() {
    document.getElementById('r-date').value = formatDateTimeLocal(new Date());
    document.getElementById('renewModal').classList.add('active');
}

function confirmRenew() {
    let user = users.find(u => u.id === currentUserId);
    let selectedDate = new Date(document.getElementById('r-date').value);
    user.startDate = selectedDate.toISOString();
    user.endDate = new Date(selectedDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals();
    openProfile(currentUserId);
}

function sendWhatsApp() {
    let user = users.find(u => u.id === currentUserId);
    let text = encodeURIComponent(document.getElementById('shareText').value);
    let phone = user.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    window.open(`https://wa.me/964${phone}?text=${text}`, '_blank');
    closeModals();
}

function openShareModal() {
    let user = users.find(u => u.id === currentUserId);
    document.getElementById('shareText').value = `مرحباً ${user.name}، ينتهي اشتراكك بتاريخ ${formatDateDisplay(user.endDate)}.`;
    document.getElementById('shareModal').classList.add('active');
}

function saveTransaction() {
    let user = users.find(u => u.id === currentUserId);
    let amount = parseFloat(document.getElementById('t-amount').value);
    if(!amount) return;
    user.price = document.getElementById('t-type').value === 'deposit' ? parseFloat(user.price) + amount : parseFloat(user.price) - amount;
    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals(); openProfile(currentUserId);
}

window.onload = initApp;
