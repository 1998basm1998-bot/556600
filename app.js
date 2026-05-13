// التهيئة وقاعدة البيانات المحلية
let users = JSON.parse(localStorage.getItem('isp_users')) || [];
let currentUserId = null;

// دالة تحديث الواجهة الرئيسية
function renderHome() {
    const list = document.getElementById('subscribersList');
    list.innerHTML = '';
    
    if(users.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">لا يوجد مشتركين. اضغط على + للإضافة.</p>';
        return;
    }

    users.forEach(user => {
        let card = document.createElement('div');
        card.className = 'user-card';
        card.onclick = () => openProfile(user.id);
        card.innerHTML = `
            <div class="user-info">
                <h4>${user.name}</h4>
                <p><span style="color: ${user.status === 'متصل' ? '#10B981' : '#EF4444'}">● ${user.status}</span> | ${user.price} د.ع | ${user.tower}</p>
            </div>
            <div class="user-action">
                <i class="fas fa-chevron-left" style="color:#ccc;"></i>
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

// إدارة النوافذ المنبثقة (Modals)
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
    document.getElementById('userModal').classList.add('active');
}

function openEditModal() {
    toggleMenu(); // غلق القائمة المنسدلة
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
    document.getElementById('userModal').classList.add('active');
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// حفظ أو تعديل بيانات المشترك
function saveUser() {
    let id = document.getElementById('f-id').value;
    let newUser = {
        id: id ? parseInt(id) : Date.now(),
        name: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value,
        package: document.getElementById('f-package').value || 'Default',
        price: document.getElementById('f-price').value || 0,
        tower: document.getElementById('f-tower').value || 'N/A',
        user: document.getElementById('f-user').value || 'N/A',
        ip: '100.' + Math.floor(Math.random()*255) + '.x.x', // توليد IP وهمي للتجربة
        status: 'متصل',
        history: []
    };

    if(!newUser.name || !newUser.phone) {
        alert("الاسم ورقم الهاتف مطلوبان!"); return;
    }

    if (id) {
        // تحديث
        let index = users.findIndex(u => u.id == id);
        newUser.history = users[index].history; // الحفاظ على السجل القديم
        users[index] = newUser;
    } else {
        // إضافة جديدة وتسجيل أول إيداع في السجل
        if(newUser.price > 0) {
            newUser.history.push({
                id: Date.now(),
                type: 'deposit',
                amount: newUser.price,
                date: new Date().toLocaleString('ar-IQ'),
                balance: newUser.price
            });
        }
        users.push(newUser);
    }

    localStorage.setItem('isp_users', JSON.stringify(users));
    closeModals();
    
    if(id) openProfile(newUser.id); // إذا كان تعديل، ارجع للبروفايل
    else renderHome(); // إذا إضافة جديدة، ارجع للرئيسية
}

// فتح بروفايل المشترك
function openProfile(id) {
    currentUserId = id;
    let user = users.find(u => u.id === id);
    if(!user) return;

    document.getElementById('p-name').innerText = user.name;
    document.getElementById('p-deposit').innerText = user.price;
    document.getElementById('p-package').innerText = user.package;
    document.getElementById('p-tower').innerText = user.tower;
    document.getElementById('p-user').innerText = user.user;
    document.getElementById('p-ip').innerText = user.ip;
    document.getElementById('p-days').innerText = "30 يوم"; // يمكن برمجتها كمعادلة زمنية لاحقاً

    showView('view-profile');
}

// القائمة المنسدلة (تعديل/إيقاف)
function toggleMenu() {
    document.getElementById('userMenu').classList.toggle('active');
}

// نظام المشاركة والواتساب
function openShareModal() {
    let user = users.find(u => u.id === currentUserId);
    if(!user) return;

    let text = `مرحباً ${user.name}،\n\nنود إعلامك بأن اشتراكك من النوع ${user.package} قد تم تفعيله بنجاح.\nبرج: ${user.tower}\nقيمة الاشتراك: ${user.price} د.ع\n\nفي حال احتجت لأي مساعدة، لا تتردد في التواصل معنا.`;
    
    document.getElementById('shareText').value = text;
    document.getElementById('shareModal').classList.add('active');
}

function sendWhatsApp() {
    let user = users.find(u => u.id === currentUserId);
    let text = encodeURIComponent(document.getElementById('shareText').value);
    
    // تنظيف رقم الهاتف (إزالة الأصفار الزائدة وتحويله للصيغة الدولية للعراق)
    let phone = user.phone;
    if(phone.startsWith('0')) phone = '964' + phone.substring(1);
    
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    closeModals();
}

// السجل المالي (إيداع / دين)
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
        id: Date.now(),
        type: type,
        amount: amount,
        date: new Date().toLocaleString('ar-IQ'),
        balance: newBalance
    });

    user.price = newBalance; // تحديث الرصيد الكلي
    localStorage.setItem('isp_users', JSON.stringify(users));
    
    closeModals();
    openProfile(currentUserId); // تحديث الواجهة
}

function openHistory() {
    let user = users.find(u => u.id === currentUserId);
    let list = document.getElementById('historyList');
    list.innerHTML = '';

    if(user.history.length === 0) {
        list.innerHTML = '<p style="text-align:center;">لا يوجد سجل حركات.</p>';
    } else {
        user.history.forEach(tx => {
            let isDeposit = tx.type === 'deposit';
            list.innerHTML += `
                <div class="history-card">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div class="history-icon ${isDeposit ? 'bg-green' : 'bg-orange'}">
                            <i class="fas ${isDeposit ? 'fa-money-bill-wave' : 'fa-hand-holding-usd'}"></i>
                        </div>
                        <div>
                            <h4>${isDeposit ? 'إيداع' : 'إضافة دين'} ${tx.amount} د.ع</h4>
                            <p>${tx.date}</p>
                            <p style="font-size:11px; margin-top:4px;">الرصيد الكلي بعد: ${tx.balance} د.ع</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    showView('view-history');
}

function closeHistory() { showView('view-profile'); }

// بحث
function filterUsers() {
    let val = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.user-card').forEach(card => {
        let name = card.querySelector('h4').innerText.toLowerCase();
        card.style.display = name.includes(val) ? 'flex' : 'none';
    });
}

// تشغيل الواجهة عند فتح الصفحة
window.onload = renderHome;
