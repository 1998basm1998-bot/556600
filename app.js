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
initTheme();

// دوال التاريخ والوقت
function formatDateTimeLocal(date) {
    let d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

// تعديل صيغة التاريخ لتطابق الصورة
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
        // تعديل "منتهي الصلاحية" إلى "منتهي" لتطابق الصورة
        return { status: 'غير متصل', text: 'منتهي', colorClass: 'status-offline' };
    }

    let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { 
        status: 'متصل', 
        text: `باقي ${diffDays} يوم و ${diffHours} ساعة`, 
        colorClass: 'status-online' 
    };
}

// تحديث الواجهة الرئيسية
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
                <p><span class="${timeData.colorClass}">● ${timeData.status}</span> | ${user.price} د.ع | ${user.tower}</p>
            </div>
            <div class="user-action">
                <i class="fas fa-chevron-left" style="color:var(--text-muted);"></i>
            </div>
        `;
        list.appendChild(card);
    });
}

// التبديل بين الواجهات
function showView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}
function goHome() { showView('view-home'); currentUserId = null; renderHome(); }

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

// تعديل بيانات المشترك
function openEditModal() {
    document.getElementById('userMenu').classList.remove('active'); 
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
    let id = document.getElementById('f-id').value;
    let startDateObj = new Date(document.getElementById('f-start-date').value || new Date());
    let endDateObj = new Date(startDateObj.getTime() + (30 * 24 * 60 * 60 * 1000)); // إضافة 30 يوم

    let newUser = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value,
        package: document.getElementById('f-package').value || 'Default',
        price: document.getElementById('f-price').value || 0,
        tower: document.getElementById('f-tower').value || 'N/A',
        user: document.getElementById('f-user').value || 'N/A',
        ip: '100.' + Math.floor(Math.random()*255) + '.x.x',
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        history: []
    };

    if(!newUser.name || !newUser.phone) { alert("الاسم ورقم الهاتف مطلوبان!"); return; }

    if (id) {
        let index = users.findIndex(u => u.id == id);
        newUser.history = users[index].history; 
        users[index] = newUser;
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
    if(id) openProfile(newUser.id); else renderHome(); 
}

// بروفايل المشترك
function openProfile(id) {
    currentUserId = id;
    let user = users.find(u => u.id === id);
    if(!user) return;

    let timeData = calculateTimeStatus(user.startDate, user.endDate);

    // تحديث البيانات في الواجهة مع تنسيق الرقم المالي بالفواصل
    let formattedPrice = Number(user.price || 0).toLocaleString('en-US');
    document.getElementById('p-name').innerText = user.name;
    document.getElementById('p-deposit').innerText = `${formattedPrice} د.ع`;
    document.getElementById('p-package').innerText = user.package;
    document.getElementById('p-tower').innerText = user.tower;
    document.getElementById('p-user').innerText = user.user;
    document.getElementById('p-phone').innerText = user.phone;
    
    let statusEl = document.getElementById('p-status');
    // إخفاء النص "متصل/غير متصل" والإبقاء على النقطة فقط في حقل الحالة لتطابق الصورة
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

function stopSubscription() {
    toggleMenu();
    if(confirm('هل أنت متأكد من إيقاف المشترك فوراً؟')) {
        let user = users.find(u => u.id === currentUserId);
        user.endDate = new Date().toISOString(); // تعيين الانتهاء للوقت الحالي
        localStorage.setItem('isp_users', JSON.stringify(users));
        openProfile(currentUserId);
    }
}

// القائمة والواتساب والسجل
function toggleMenu() { document.getElementById('userMenu').classList.toggle('active'); }

function openShareModal() {
    let user = users.find(u => u.id === currentUserId);
    let timeData = calculateTimeStatus(user.startDate, user.endDate);
    
    let text = `مرحباً ${user.name}،\n\nنود إعلامك بأن اشتراكك من النوع ${user.package} ينتهي بتاريخ ${formatDateDisplay(user.endDate)}.\nبرج: ${user.tower}\nالديون: ${user.price} د.ع\n\nفي حال احتجت لأي مساعدة، لا تتردد في التواصل معنا.`;
    
    document.getElementById('shareText').value = text;
    document.getElementById('shareModal').classList.add('active');
}

function sendWhatsApp() {
    let user = users.find(u => u.id === currentUserId);
    let text = encodeURIComponent(document.getElementById('shareText').value);
    let phone = user.phone;
    if(phone.startsWith('0')) phone = '964' + phone.substring(1);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    closeModals();
}

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

window.onload = renderHome;
