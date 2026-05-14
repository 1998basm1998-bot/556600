// التهيئة وقاعدة البيانات
let users = JSON.parse(localStorage.getItem('isp_users')) || [];
let currentUserId = null;

// إعداد الوضع الليلي والنهاري
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

// نظام تسجيل الدخول
function initApp() {
    initTheme();
    if(sessionStorage.getItem('auth') === 'true') {
        document.getElementById('mainNav').style.display = 'flex';
        goHome();
    } else {
        showView('view-login');
    }
}

function checkLogin() {
    let pwd = document.getElementById('loginPassword').value;
    if(pwd === '07802427493') {
        sessionStorage.setItem('auth', 'true');
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('mainNav').style.display = 'flex';
        goHome();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// دوال التاريخ والوقت
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
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${yyyy}/${mm}/${dd} ${hours}:${minutes} ${ampm}`;
}

function calculateTimeStatus(startDateStr, endDateStr) {
    let now = new Date();
    let end = new Date(endDateStr);
    let diffMs = end - now;

    if (diffMs <= 0) {
        return { status: 'غير متصل', text: 'منتهي', colorClass: 'status-offline' };
    }

    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { status: 'متصل', text: `باقي ${diffDays} يوم و ${diffHours} ساعة`, colorClass: 'status-online' };
}

// التبديل بين الواجهات
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}
function goHome() { showView('view-home'); currentUserId = null; renderHome(); }

// تحديث الواجهة الرئيسية وإضافة أزرار التعديل والحذف
function renderHome() {
    const list = document.getElementById('subscribersList');
    list.innerHTML = '';
    
    if(users.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted); margin-top:20px;">لا يوجد مشتركين. اضغط على + للإضافة.</p>';
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
                <p><span class="${timeData.colorClass}">● ${timeData.status}</span> | ${Number(user.price).toLocaleString()} د.ع | ${user.tower}</p>
            </div>
            <div class="user-actions-list">
                <button class="btn-icon-small edit-btn" onclick="openEditModalFromList(${user.id}, event)"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-small delete-btn" onclick="deleteUser(${user.id}, event)"><i class="fas fa-trash"></i></button>
            </div>
        `;
        list.appendChild(card);
    });
}

// إضافة أو تعديل
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

// حفظ المشترك (إصلاح معرفات المشتركين)
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
        if(index !== -1) {
            newUser.history = users[index].history; 
            users[index] = newUser;
        }
    } else {
        if(newUser.price > 0) {
            newUser.history.push({
                id: Date.now(), type: 'deposit', amount: newUser.price,
                date: new Date().toLocaleString('ar-IQ'), balance: newUser.price
            });
        }
        users.push(newUser);
    }

    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals();
    
    // توجيه صحيح بعد الحفظ
    if(fIdVal && currentUserId === finalId && document.getElementById('view-profile').classList.contains('active')) {
        openProfile(finalId);
    } else {
        goHome(); 
    }
}

// حذف المشترك
function deleteUser(id, event) {
    if(event) event.stopPropagation(); 
    if(confirm('هل أنت متأكد من حذف هذا المشترك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        users = users.filter(u => u.id !== id);
        localStorage.setItem('isp_users', JSON.stringify(users));
        
        if(currentUserId === id && document.getElementById('view-profile').classList.contains('active')) {
            goHome();
        } else {
            renderHome();
        }
    }
}

// بروفايل المشترك
function openProfile(id) {
    currentUserId = id;
    let user = users.find(u => u.id === id);
    if(!user) return;

    let timeData = calculateTimeStatus(user.startDate, user.endDate);
    let formattedPrice = Number(user.price || 0).toLocaleString('en-US');
    
    document.getElementById('p-name').innerText = user.name;
    document.getElementById('p-deposit').innerText = `${formattedPrice} د.ع`;
    document.getElementById('p-package').innerText = user.package;
    document.getElementById('p-tower').innerText = user.tower;
    document.getElementById('p-user').innerText = user.user;
    
    // عرض الهاتف بشكل كامل مع مفتاح الدولة شكلياً في الملف
    let displayPhone = user.phone;
    if(displayPhone.startsWith('0')) displayPhone = displayPhone.substring(1);
    document.getElementById('p-phone').innerText = `+964 ${displayPhone}`;
    
    let statusEl = document.getElementById('p-status');
    statusEl.innerHTML = `<i class="fas fa-circle" style="color: ${timeData.colorClass === 'status-online' ? 'var(--success-green)' : 'var(--text-main)'}"></i>`;

    document.getElementById('p-days').innerText = timeData.text;
    document.getElementById('p-end-date').innerText = formatDateDisplay(user.endDate);

    showView('view-profile');
}

// تجديد وإيقاف الاشتراك
function openRenewModal() {
    document.getElementById('r-date').value = formatDateTimeLocal(new Date());
    document.getElementById('renewModal').classList.add('active');
}

function confirmRenew() {
    let user = users.find(u => u.id === currentUserId);
    let selectedDate = new Date(document.getElementById('r-date').value);
    let endDateObj = new Date(selectedDate.getTime() + (30 * 24 * 60 * 60 * 1000));

    user.startDate = selectedDate.toISOString();
    user.endDate = endDateObj.toISOString();
    
    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals();
    openProfile(currentUserId);
}

// الواتساب - إصلاح رقم الهاتف
function openShareModal() {
    let user = users.find(u => u.id === currentUserId);
    let text = `مرحباً ${user.name}،\n\nنود إعلامك بأن اشتراكك من النوع ${user.package} ينتهي بتاريخ ${formatDateDisplay(user.endDate)}.\nبرج: ${user.tower}\nالديون: ${user.price} د.ع\n\nفي حال احتجت لأي مساعدة، لا تتردد في التواصل معنا.`;
    document.getElementById('shareText').value = text;
    document.getElementById('shareModal').classList.add('active');
}

function sendWhatsApp() {
    let user = users.find(u => u.id === currentUserId);
    let text = encodeURIComponent(document.getElementById('shareText').value);
    let phone = user.phone || "";
    
    // فلترة الرقم ليقبله الواتساب بدقة (حذف أي حروف، وحذف الصفر و 964 إذا كررها المستخدم)
    phone = phone.replace(/\D/g, ''); 
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.startsWith('964')) phone = phone.substring(3);
    
    let finalPhone = '964' + phone; // دمج مفتاح الدولة النهائي
    window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');
    closeModals();
}

// العمليات المالية
function openDepositModal() {
    document.getElementById('t-amount').value = '';
    document.getElementById('depositModal').classList.add('active');
}

function saveTransaction() {
    let user = users.find(u => u.id === currentUserId);
    let type = document.getElementById('t-type').value;
    let amount = parseFloat(document.getElementById('t-amount').value);
    if(!amount || amount <= 0) return;

    let currentBalance = parseFloat(user.price) || 0;
    let newBalance = type === 'deposit' ? currentBalance + amount : currentBalance - amount;

    user.history.unshift({
        id: Date.now(), type: type, amount: amount,
        date: new Date().toLocaleString('ar-IQ'), balance: newBalance
    });
    user.price = newBalance;
    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals(); openProfile(currentUserId); 
}

// السجل
function openHistory() {
    let user = users.find(u => u.id === currentUserId);
    let list = document.getElementById('historyList');
    list.innerHTML = '';
    if(user.history.length === 0) { list.innerHTML = '<p style="text-align:center;">لا يوجد سجل حركات.</p>'; } 
    else {
        user.history.forEach(tx => {
            let isDeposit = tx.type === 'deposit';
            list.innerHTML += `
                <div class="history-card">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div class="history-icon ${isDeposit ? 'bg-green' : 'bg-orange'}"><i class="fas ${isDeposit ? 'fa-money-bill-wave' : 'fa-hand-holding-usd'}"></i></div>
                        <div>
                            <h4>${isDeposit ? 'إيداع' : 'إضافة دين'} ${tx.amount} د.ع</h4>
                            <p>${tx.date}</p><p style="font-size:11px; margin-top:4px;">الرصيد الكلي بعد: ${tx.balance} د.ع</p>
                        </div>
                    </div>
                </div>`;
        });
    }
    showView('view-history');
}

function closeHistory() { showView('view-profile'); }

function filterUsers() {
    let val = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.user-card').forEach(card => {
        let name = card.querySelector('h4').innerText.toLowerCase();
        card.style.display = name.includes(val) ? 'flex' : 'none';
    });
}

// تشغيل التطبيق عند التحميل
window.onload = initApp;
