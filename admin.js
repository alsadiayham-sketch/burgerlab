var ADMIN_USER = 'hamoody';
var ADMIN_PASS = '5555';
var FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 rx=%2220%22 fill=%22%231a1a1a%22/%3E%3Ctext x=%2260%22 y=%2268%22 text-anchor=%22middle%22 font-size=%2218%22 fill=%22%23e63946%22 font-family=%22Arial%22%3EBurger%3C/text%3E%3C/svg%3E';
var MENU_CATEGORIES = ['برجر لحم', 'برجر دجاج', 'عروض', 'تندر دجاج', 'أطفال', 'إضافات', 'سلطات', 'مشروبات'];
var products = normalizeProducts(DEFAULT_PRODUCTS);
var orders = [];
var siteSettings = normalizeSettings(DEFAULT_SITE_SETTINGS);
var monthlyVisits = 0;
var unsubscribers = [];
var readyFlags = { products: false, orders: false, settings: false };

document.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('burgerlab_admin') === 'true') {
        showAdmin();
        initializeAdmin();
    }
});

function setLoading(loading) {
    var loader = document.getElementById('adminLoader');
    if (loader) loader.style.display = loading ? 'block' : 'none';
}

function setStatus(message, kind) {
    var node = document.getElementById('adminStatus');
    if (!node) return;
    node.textContent = message;
    node.style.color = '#f5f5f5';
    if (kind === 'error') node.style.color = '#ff9ca3';
    if (kind === 'success') node.style.color = '#bbf7d0';
    if (kind === 'warning') node.style.color = '#ffd5a1';
}

function showAdmin() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

function handleLogin(event) {
    event.preventDefault();
    var user = document.getElementById('loginUser').value.trim();
    var pass = document.getElementById('loginPass').value;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem('burgerlab_admin', 'true');
        showAdmin();
        initializeAdmin();
        return;
    }
    document.getElementById('loginError').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
}

function logout() {
    sessionStorage.removeItem('burgerlab_admin');
    clearSubscriptions();
    window.location.reload();
}

function clearSubscriptions() {
    var i;
    for (i = 0; i < unsubscribers.length; i += 1) {
        if (typeof unsubscribers[i] === 'function') unsubscribers[i]();
    }
    unsubscribers = [];
}

function switchTab(tabId, button) {
    var tabs = document.querySelectorAll('.tab-content');
    var buttons = document.querySelectorAll('.tab-btn');
    var i;
    for (i = 0; i < tabs.length; i += 1) tabs[i].classList.remove('active');
    for (i = 0; i < buttons.length; i += 1) buttons[i].classList.remove('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    if (button) button.classList.add('active');
}

function initializeAdmin() {
    setLoading(true);
    setStatus('جارٍ مزامنة البيانات من فايرستور...', '');
    populateCategorySelect();
    renderProductsTable();
    renderOrdersTable();
    renderDashboard();
    loadSettingsForm();

    if (!window.db) {
        setLoading(false);
        setStatus('تعذر الاتصال بفايرستور، تعمل اللوحة على البيانات الافتراضية فقط.', 'warning');
        return;
    }

    ensureSeedIfEmpty().then(function () {
        subscribeToData();
    }).catch(function () {
        setLoading(false);
        setStatus('حدث خطأ أثناء تهيئة البيانات.', 'error');
    });
}

function ensureSeedIfEmpty() {
    return db.collection('products').limit(1).get().then(function (snapshot) {
        if (!snapshot.empty) return true;
        setStatus('القائمة فارغة، جارٍ تنفيذ Seed Data...', 'warning');
        return seedFirestoreData(false);
    });
}

function subscribeToData() {
    clearSubscriptions();
    subscribeToDeals();
    subscribeToVisits();
    unsubscribers.push(db.collection('products').orderBy('id').onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (docSnap) { list.push(normalizeProduct(docSnap.data())); });
        products = normalizeProducts(list);
        readyFlags.products = true;
        populateCategorySelect();
        renderProductsTable();
        renderDashboard();
        checkReady();
    }, function () {
        setStatus('تعذر تحميل القائمة.', 'error');
        setLoading(false);
    }));

    unsubscribers.push(db.collection('orders').orderBy('date', 'desc').onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (docSnap) {
            var data = docSnap.data() || {};
            data._docId = docSnap.id;
            list.push(data);
        });
        orders = list;
        readyFlags.orders = true;
        renderOrdersTable();
        renderDashboard();
        checkReady();
    }, function () {
        setStatus('تعذر تحميل الطلبات.', 'error');
        setLoading(false);
    }));

    unsubscribers.push(db.collection('settings').doc('config').onSnapshot(function (docSnap) {
        if (docSnap.exists) siteSettings = normalizeSettings(docSnap.data());
        readyFlags.settings = true;
        loadSettingsForm();
        checkReady();
    }, function () {
        setStatus('تعذر تحميل الإعدادات.', 'error');
        setLoading(false);
    }));
}

function checkReady() {
    if (readyFlags.products && readyFlags.orders && readyFlags.settings) {
        setLoading(false);
        setStatus('تمت مزامنة البيانات بنجاح.', 'success');
    }
}

function statCard(title, value, subtitle) {
    return '<div class="stat-card"><h4>' + escapeHtml(title) + '</h4><strong>' + escapeHtml(String(value)) + '</strong><span>' + escapeHtml(subtitle) + '</span></div>';
}

function renderDashboard() {
    var totalRevenue = 0;
    var dinein = 0;
    var takeout = 0;
    var pending = 0;
    var i;
    var categoryCounts = {};
    for (i = 0; i < orders.length; i += 1) {
        totalRevenue += Number(orders[i].total || 0) || 0;
        if (orders[i].orderMode === 'takeout') takeout += 1; else dinein += 1;
        if (orders[i].status === 'new' || orders[i].status === 'processing') pending += 1;
    }
    for (i = 0; i < products.length; i += 1) {
        categoryCounts[products[i].category] = (categoryCounts[products[i].category] || 0) + 1;
    }
    document.getElementById('statsGrid').innerHTML = [
        statCard('أصناف القائمة', products.length, 'إجمالي الأصناف المعروضة'),
        statCard('إجمالي الطلبات', orders.length, 'كل الطلبات المحفوظة'),
        statCard('طلبات قيد المتابعة', pending, 'جديد + قيد التحضير'),
        statCard('زيارات هذا الشهر', monthlyVisits, 'عدد مرات فتح الموقع'),
        statCard('طلبات داخل المطعم', dinein, 'بدون عنوان'),
        statCard('طلبات سفري', takeout, 'غير شامل سعر التوصيل')
    ].join('');
    renderLatestOrders();
    renderTopCategories(categoryCounts, totalRevenue);
}

function renderLatestOrders() {
    var node = document.getElementById('latestOrders');
    if (!node) return;
    if (!orders.length) {
        node.innerHTML = '<div class="mini-card">لا توجد طلبات حتى الآن.</div>';
        return;
    }
    var html = '<div class="list-stack">';
    var max = Math.min(5, orders.length);
    var i;
    for (i = 0; i < max; i += 1) {
        html += '<div class="mini-card"><strong>' + escapeHtml(orders[i].id || '-') + '</strong><div>' + escapeHtml(orders[i].customerName || '-') + ' • ' + escapeHtml(formatDateTime(orders[i].date)) + '</div><div>' + escapeHtml(orders[i].orderMode === 'takeout' ? 'سفري' : 'داخل المطعم') + ' • ' + escapeHtml(orders[i].totalDisplay || formatCurrency(orders[i].total || 0)) + '</div></div>';
    }
    html += '</div>';
    node.innerHTML = html;
}

function renderTopCategories(categoryCounts, totalRevenue) {
    var node = document.getElementById('topCategories');
    if (!node) return;
    var keys = [];
    var key;
    for (key in categoryCounts) if (categoryCounts.hasOwnProperty(key)) keys.push(key);
    keys.sort(function (a, b) { return categoryCounts[b] - categoryCounts[a]; });
    var html = '<div class="list-stack">';
    html += '<div class="mini-card"><strong>إجمالي المبيعات</strong><div>' + formatCurrency(totalRevenue) + '</div></div>';
    if (!keys.length) {
        html += '<div class="mini-card">لا توجد أصناف مصنفة حالياً.</div>';
    } else {
        var i;
        for (i = 0; i < Math.min(5, keys.length); i += 1) {
            html += '<div class="mini-card"><strong>' + escapeHtml(keys[i]) + '</strong><div>' + categoryCounts[keys[i]] + ' صنف</div></div>';
        }
    }
    html += '</div>';
    node.innerHTML = html;
}

function buildStatusPill(status) {
    var labels = { normal: 'عادي', bestseller: 'الأكثر طلباً', special: 'مميز', soldout: 'غير متوفر', new: 'جديد', processing: 'قيد التحضير', completed: 'مكتمل', cancelled: 'ملغي' };
    return '<span class="status-pill ' + escapeHtml(status) + '">' + escapeHtml(labels[status] || status) + '</span>';
}

function formatSizesAndPrices(product) {
    var parts = [];
    var i;
    for (i = 0; i < product.sizes.length; i += 1) parts.push(escapeHtml(getSizeLabel(product.sizes[i])) + ' - ' + formatCurrency(product.sizes[i].price));
    return parts.join('<br>');
}

function renderProductsTable() {
    var body = document.getElementById('productsTableBody');
    if (!body) return;
    if (!products.length) {
        body.innerHTML = '<tr><td colspan="7">لا توجد أصناف حالياً.</td></tr>';
        return;
    }
    var html = '';
    var i;
    for (i = 0; i < products.length; i += 1) {
        html += '<tr>';
        html += '<td><img src="' + escapeHtml(products[i].image) + '" alt="' + escapeHtml(products[i].name) + '" onerror="this.src=\'' + FALLBACK_IMAGE + '\'"></td>';
        html += '<td>' + escapeHtml(products[i].name) + '</td>';
        html += '<td>' + escapeHtml(products[i].category) + '</td>';
        html += '<td>' + escapeHtml(products[i].description) + '</td>';
        html += '<td>' + formatSizesAndPrices(products[i]) + '</td>';
        html += '<td>' + buildStatusPill(products[i].status || 'normal') + '</td>';
        html += '<td><div class="row-actions"><button type="button" class="edit-btn" onclick="openProductModal(' + products[i].id + ')">تعديل</button><button type="button" class="delete-btn" onclick="deleteProduct(' + products[i].id + ')">حذف</button></div></td>';
        html += '</tr>';
    }
    body.innerHTML = html;
}

function populateCategorySelect() {
    var select = document.getElementById('productCategory');
    if (!select) return;
    var html = '';
    var i;
    for (i = 0; i < MENU_CATEGORIES.length; i += 1) html += '<option value="' + escapeHtml(MENU_CATEGORIES[i]) + '">' + escapeHtml(MENU_CATEGORIES[i]) + '</option>';
    select.innerHTML = html;
}

function createEmptySize() { return { size: 'عادي', unit: 'قطعة', price: '' }; }

function addSizeRow(sizeData) {
    var container = document.getElementById('sizesContainer');
    var row = document.createElement('div');
    var item = sizeData || createEmptySize();
    row.className = 'size-row';
    row.innerHTML = [
        '<div><label>الاسم</label><input type="text" class="size-name" value="' + escapeHtml(item.size) + '" placeholder="ساندويش / وجبة / عادي"></div>',
        '<div><label>الوحدة</label><input type="text" class="size-unit" value="' + escapeHtml(item.unit || 'قطعة') + '" placeholder="قطعة"></div>',
        '<div><label>السعر</label><input type="number" min="0" class="size-price" value="' + escapeHtml(String(item.price)) + '" placeholder="₪"></div>',
        '<button type="button" class="remove-size-btn" onclick="removeSizeRow(this)">حذف</button>'
    ].join('');
    container.appendChild(row);
}

function removeSizeRow(button) {
    var container = document.getElementById('sizesContainer');
    if (container.children.length <= 1) return;
    container.removeChild(button.parentNode);
}

function openProductModal(productId) {
    var product = productId ? findProductById(products, productId) : null;
    document.getElementById('productModalTitle').textContent = product ? 'تعديل الصنف' : 'إضافة صنف';
    document.getElementById('productId').value = product ? product.id : '';
    document.getElementById('productName').value = product ? product.name : '';
    document.getElementById('productDescription').value = product ? product.description : '';
    document.getElementById('productImage').value = product ? product.image : '';
    document.getElementById('productStatus').value = product ? product.status : 'normal';
    populateCategorySelect();
    document.getElementById('productCategory').value = product ? product.category : MENU_CATEGORIES[0];
    var container = document.getElementById('sizesContainer');
    container.innerHTML = '';
    var sizes = product && product.sizes && product.sizes.length ? product.sizes : [createEmptySize()];
    var i;
    for (i = 0; i < sizes.length; i += 1) addSizeRow(sizes[i]);
    document.getElementById('productModal').style.display = 'flex';
}

function closeModal(modalId) {
    var node = document.getElementById(modalId);
    if (node) node.style.display = 'none';
}

function collectSizes() {
    var rows = document.querySelectorAll('#sizesContainer .size-row');
    var sizes = [];
    var i;
    for (i = 0; i < rows.length; i += 1) {
        var name = rows[i].querySelector('.size-name').value.trim();
        var unit = rows[i].querySelector('.size-unit').value.trim() || 'قطعة';
        var price = parseFloat(rows[i].querySelector('.size-price').value || '0');
        if (!name || !(price >= 0)) continue;
        sizes.push({ size: name, unit: unit, price: price });
    }
    return sizes;
}

function saveProduct(event) {
    event.preventDefault();
    var sizes = collectSizes();
    if (!sizes.length) {
        alert('أضف حجماً واحداً على الأقل مع السعر.');
        return;
    }
    var currentId = parseInt(document.getElementById('productId').value, 10);
    var nextId = currentId;
    if (!nextId) {
        nextId = 1;
        var i;
        for (i = 0; i < products.length; i += 1) nextId = Math.max(nextId, Number(products[i].id) + 1);
    }
    var productData = normalizeProduct({
        id: nextId,
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value.trim(),
        sizes: sizes,
        image: document.getElementById('productImage').value.trim() || FALLBACK_IMAGE,
        status: document.getElementById('productStatus').value,
        brand: ''
    });
    if (!window.db) {
        alert('فايرستور غير متاح حالياً.');
        return;
    }
    setLoading(true);
    db.collection('products').doc(String(productData.id)).set(productData).then(function () {
        setLoading(false);
        closeModal('productModal');
        setStatus('تم حفظ الصنف بنجاح.', 'success');
    }).catch(function () {
        setLoading(false);
        setStatus('تعذر حفظ الصنف.', 'error');
    });
}

function deleteProduct(productId) {
    if (!confirm('هل تريد حذف هذا الصنف؟')) return;
    if (!window.db) {
        alert('فايرستور غير متاح حالياً.');
        return;
    }
    setLoading(true);
    db.collection('products').doc(String(productId)).delete().then(function () {
        setLoading(false);
        setStatus('تم حذف الصنف.', 'success');
    }).catch(function () {
        setLoading(false);
        setStatus('تعذر حذف الصنف.', 'error');
    });
}

function renderOrdersTable() {
    var body = document.getElementById('ordersTableBody');
    if (!body) return;
    var search = (document.getElementById('orderSearchInput') || {}).value || '';
    var statusFilter = (document.getElementById('orderStatusFilter') || {}).value || 'all';
    search = search.toLowerCase();
    var filtered = [];
    var i;
    for (i = 0; i < orders.length; i += 1) {
        var haystack = String((orders[i].customerName || '') + ' ' + (orders[i].customerPhone || '')).toLowerCase();
        if (statusFilter !== 'all' && orders[i].status !== statusFilter) continue;
        if (search && haystack.indexOf(search) < 0) continue;
        filtered.push(orders[i]);
    }
    if (!filtered.length) {
        body.innerHTML = '<tr><td colspan="7">لا توجد طلبات مطابقة.</td></tr>';
        return;
    }
    var html = '';
    for (i = 0; i < filtered.length; i += 1) {
        html += '<tr onclick="toggleOrderDetails(\'' + escapeHtml(filtered[i].id) + '\')">';
        html += '<td>' + escapeHtml(filtered[i].id || '-') + '</td>';
        html += '<td>' + escapeHtml(formatDateTime(filtered[i].date)) + '</td>';
        html += '<td>' + escapeHtml(filtered[i].customerName || '-') + '</td>';
        html += '<td>' + escapeHtml(filtered[i].customerPhone || '-') + '</td>';
        html += '<td>' + escapeHtml(filtered[i].orderMode === 'takeout' ? 'سفري' : 'داخل المطعم') + '</td>';
        html += '<td>' + escapeHtml(filtered[i].totalDisplay || formatCurrency(filtered[i].total || 0)) + '</td>';
        html += '<td>' + buildStatusSelect(filtered[i]) + '</td>';
        html += '</tr>';
        html += '<tr class="order-details-row" id="order-details-' + escapeHtml(filtered[i].id) + '" style="display:none;"><td colspan="7">' + renderOrderDetails(filtered[i]) + '</td></tr>';
    }
    body.innerHTML = html;
}

function buildStatusSelect(order) {
    var statuses = ['new', 'processing', 'completed', 'cancelled'];
    var html = '<select class="order-status-select" onclick="event.stopPropagation()" onchange="updateOrderStatus(\'' + escapeHtml(order.id) + '\', this.value)">';
    var i;
    for (i = 0; i < statuses.length; i += 1) html += '<option value="' + statuses[i] + '" ' + (order.status === statuses[i] ? 'selected' : '') + '>' + ({ new: 'جديد', processing: 'قيد التحضير', completed: 'مكتمل', cancelled: 'ملغي' }[statuses[i]]) + '</option>';
    html += '</select>';
    return html;
}

function renderOrderDetails(order) {
    var itemsHtml = '';
    var i;
    for (i = 0; i < (order.items || []).length; i += 1) {
        itemsHtml += '<div class="order-detail-item"><strong>' + escapeHtml(order.items[i].name) + '</strong><div>' + escapeHtml(order.items[i].sizeLabel) + ' × ' + order.items[i].qty + '</div><div>' + formatCurrency(order.items[i].lineTotal) + '</div></div>';
    }
    return [
        '<div class="order-details">',
        '<div class="order-detail-items">' + itemsHtml + '</div>',
        '<div class="order-meta">',
        '<div class="mini-card"><strong>بيانات العميل</strong><div>الاسم: ' + escapeHtml(order.customerName || '-') + '</div><div>الهاتف: ' + escapeHtml(order.customerPhone || '-') + '</div><div>العنوان: ' + escapeHtml(order.address || '-') + '</div></div>',
        '<div class="mini-card"><strong>ملخص الطلب</strong><div>النوع: ' + escapeHtml(order.orderMode === 'takeout' ? 'سفري' : 'داخل المطعم') + '</div><div>المجموع: ' + escapeHtml(order.totalDisplay || formatCurrency(order.total || 0)) + '</div><div>الملاحظات: ' + escapeHtml(order.notes || '-') + '</div></div>',
        '</div></div>'
    ].join('');
}

function toggleOrderDetails(orderId) {
    var row = document.getElementById('order-details-' + orderId);
    if (!row) return;
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
}

function updateOrderStatus(orderId, nextStatus) {
    if (!window.db) {
        alert('فايرستور غير متاح حالياً.');
        return;
    }
    db.collection('orders').doc(String(orderId)).update({ status: nextStatus }).then(function () {
        setStatus('تم تحديث حالة الطلب.', 'success');
    }).catch(function () {
        setStatus('تعذر تحديث حالة الطلب.', 'error');
    });
}

function loadSettingsForm() {
    document.getElementById('settingWhatsapp').value = siteSettings.whatsappNumber || '';
    document.getElementById('settingHero').value = siteSettings.heroSubtitle || '';
    document.getElementById('settingInstagram').value = siteSettings.instagramLink || '';
    document.getElementById('settingAbout').value = siteSettings.aboutText || '';
}

function saveSettings(event) {
    event.preventDefault();
    var next = normalizeSettings({
        whatsappNumber: document.getElementById('settingWhatsapp').value,
        heroSubtitle: document.getElementById('settingHero').value,
        instagramLink: document.getElementById('settingInstagram').value,
        aboutText: document.getElementById('settingAbout').value
    });
    if (!window.db) {
        alert('فايرستور غير متاح حالياً.');
        return;
    }
    setLoading(true);
    db.collection('settings').doc('config').set(next, { merge: true }).then(function () {
        siteSettings = next;
        setLoading(false);
        setStatus('تم حفظ الإعدادات.', 'success');
    }).catch(function () {
        setLoading(false);
        setStatus('تعذر حفظ الإعدادات.', 'error');
    });
}

function runSeed(force) {
    if (!window.db) {
        alert('فايرستور غير متاح حالياً.');
        return;
    }
    setLoading(true);
    setStatus('جارٍ تنفيذ Seed Data...', 'warning');
    seedFirestoreData(force).then(function (result) {
        setLoading(false);
        if (result && result.seeded) {
            setStatus('تمت تعبئة البيانات بنجاح (' + result.products + ' صنف).', 'success');
        } else {
            setStatus('لم يتم تنفيذ Seed لأن البيانات موجودة مسبقاً.', 'warning');
        }
    }).catch(function (error) {
        setLoading(false);
        setStatus((error && error.message) || 'تعذر تنفيذ Seed Data.', 'error');
    });
}

// ===================== DEALS MANAGEMENT =====================

var deals = [];

function subscribeToVisits() {
    if (!window.db) return;
    unsubscribers.push(db.collection('analytics').doc('visits').onSnapshot(function (docSnap) {
        var data = docSnap.exists ? docSnap.data() : {};
        var now = new Date();
        var monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        monthlyVisits = Number(data[monthKey] || 0);
        renderDashboard();
    }, function () {}));
}

function subscribeToDeals() {
    if (!window.db) return;
    unsubscribers.push(db.collection('deals').orderBy('createdAt', 'desc').onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (docSnap) {
            var data = docSnap.data() || {};
            data._docId = docSnap.id;
            list.push(data);
        });
        deals = list;
        renderDealsTable();
    }, function () {
        setStatus('تعذر تحميل العروض.', 'error');
    }));
}

function getDealTypeLabel(type) {
    var labels = {
        combo: 'كومبو',
        category: 'قسم كامل',
        multi_category: 'أقسام متعددة',
        specific: 'أصناف محددة',
        all: 'كل القائمة'
    };
    return labels[type] || type;
}

function getDealDetailsText(deal) {
    if (deal.type === 'all') return 'كل أصناف القائمة';
    if (deal.type === 'category') return 'قسم: ' + (deal.category || '-');
    if (deal.type === 'multi_category') return 'أقسام: ' + (deal.categories || []).join('، ');
    if (deal.type === 'combo') {
        var combo = deal.combo || {};
        var parts = [];
        if (combo.sandwichQty) parts.push(combo.sandwichQty + ' ساندويش');
        if (combo.friesQty) parts.push(combo.friesQty + ' بطاطا');
        if (combo.drinksQty) parts.push(combo.drinksQty + ' مشروب');
        if (combo.sauces) parts.push('صوصات');
        return parts.join(' + ') || '-';
    }
    if (deal.type === 'specific') {
        var names = [];
        var i;
        for (i = 0; i < (deal.items || []).length; i += 1) {
            var p = findProductById(products, deal.items[i]);
            if (p) names.push(p.name);
        }
        return names.length ? names.join('، ') : '-';
    }
    return '-';
}

function renderDealsTable() {
    var body = document.getElementById('dealsTableBody');
    if (!body) return;
    if (!deals.length) {
        body.innerHTML = '<tr><td colspan="6">لا توجد عروض حالياً. أضف عرضاً جديداً!</td></tr>';
        return;
    }
    var html = '';
    var i;
    for (i = 0; i < deals.length; i += 1) {
        var deal = deals[i];
        var sizeLabel = deal.sizeType === 'sandwich' ? '(ساندويش فقط)' : deal.sizeType === 'meal' ? '(وجبة فقط)' : '(أي حجم)';
        html += '<tr>';
        html += '<td><strong>' + escapeHtml(deal.name || '-') + '</strong></td>';
        html += '<td>' + escapeHtml(getDealTypeLabel(deal.type)) + '</td>';
        html += '<td style="max-width:250px;">' + escapeHtml(getDealDetailsText(deal)) + '<br><small>' + escapeHtml(String(deal.qty || 2)) + ' قطع ' + escapeHtml(sizeLabel) + '</small></td>';
        html += '<td><strong style="color:var(--accent);">' + formatCurrency(deal.price || 0) + '</strong></td>';
        html += '<td>' + buildDealStatusPill(deal.active) + '</td>';
        html += '<td><div class="row-actions"><button type="button" class="edit-btn" onclick="openDealModal(\'' + escapeHtml(deal._docId) + '\')">تعديل</button><button type="button" class="delete-btn" onclick="deleteDeal(\'' + escapeHtml(deal._docId) + '\')">حذف</button></div></td>';
        html += '</tr>';
    }
    body.innerHTML = html;
}

function buildDealStatusPill(active) {
    if (active === 'active' || active === true) return '<span class="status-pill bestseller">فعّال</span>';
    return '<span class="status-pill soldout">غير فعّال</span>';
}

function onDealTypeChange() {
    var type = document.getElementById('dealType').value;
    document.getElementById('dealCategoryWrap').style.display = type === 'category' ? '' : 'none';
    document.getElementById('dealMultiCategoryWrap').style.display = type === 'multi_category' ? '' : 'none';
    document.getElementById('dealSpecificWrap').style.display = type === 'specific' ? '' : 'none';
    document.getElementById('dealComboWrap').style.display = type === 'combo' ? '' : 'none';
    // Hide qty/size for combo (combo has its own qty fields)
    document.getElementById('dealQty').parentNode.style.display = type === 'combo' ? 'none' : '';
    document.getElementById('dealSizeType').parentNode.style.display = type === 'combo' ? 'none' : '';
    if (type === 'multi_category') populateDealMultiCategories();
    if (type === 'specific') populateDealSpecificItems();
    if (type === 'combo') populateComboSandwiches();
}

function populateDealCategorySelect(selected) {
    var select = document.getElementById('dealCategory');
    if (!select) return;
    var html = '';
    var i;
    for (i = 0; i < MENU_CATEGORIES.length; i += 1) {
        html += '<option value="' + escapeHtml(MENU_CATEGORIES[i]) + '" ' + (MENU_CATEGORIES[i] === selected ? 'selected' : '') + '>' + escapeHtml(MENU_CATEGORIES[i]) + '</option>';
    }
    select.innerHTML = html;
}

function populateDealMultiCategories(selected) {
    var container = document.getElementById('dealMultiCategories');
    if (!container) return;
    var selectedArr = selected || [];
    var html = '';
    var i;
    for (i = 0; i < MENU_CATEGORIES.length; i += 1) {
        var checked = selectedArr.indexOf(MENU_CATEGORIES[i]) >= 0 ? 'checked' : '';
        html += '<label class="checkbox-item"><input type="checkbox" value="' + escapeHtml(MENU_CATEGORIES[i]) + '" ' + checked + '><span>' + escapeHtml(MENU_CATEGORIES[i]) + '</span></label>';
    }
    container.innerHTML = html;
}

function populateDealSpecificItems(selected) {
    var container = document.getElementById('dealSpecificItems');
    if (!container) return;
    var selectedArr = selected || [];
    var html = '';
    var i;
    for (i = 0; i < products.length; i += 1) {
        var checked = selectedArr.indexOf(products[i].id) >= 0 ? 'checked' : '';
        html += '<label class="checkbox-item"><input type="checkbox" value="' + products[i].id + '" ' + checked + '><span>' + escapeHtml(products[i].name) + ' (' + escapeHtml(products[i].category) + ')</span></label>';
    }
    container.innerHTML = html;
}

function populateComboSandwiches(selected) {
    var container = document.getElementById('comboSandwiches');
    if (!container) return;
    var selectedArr = selected || [];
    var html = '';
    var i;
    // Show only burger/chicken/tender items (sandwich-type products)
    var sandwichCategories = ['برجر لحم', 'برجر دجاج', 'تندر دجاج', 'أطفال'];
    for (i = 0; i < products.length; i += 1) {
        if (sandwichCategories.indexOf(products[i].category) < 0) continue;
        var checked = selectedArr.indexOf(products[i].id) >= 0 ? 'checked' : '';
        html += '<label class="checkbox-item"><input type="checkbox" value="' + products[i].id + '" ' + checked + '><span>' + escapeHtml(products[i].name) + '</span></label>';
    }
    container.innerHTML = html;
}

function getCheckedValues(containerId, asNumbers) {
    var container = document.getElementById(containerId);
    if (!container) return [];
    var inputs = container.querySelectorAll('input[type=checkbox]:checked');
    var values = [];
    var i;
    for (i = 0; i < inputs.length; i += 1) {
        values.push(asNumbers ? Number(inputs[i].value) : inputs[i].value);
    }
    return values;
}

function openDealModal(dealDocId) {
    var deal = null;
    if (dealDocId) {
        var i;
        for (i = 0; i < deals.length; i += 1) {
            if (deals[i]._docId === dealDocId) { deal = deals[i]; break; }
        }
    }
    document.getElementById('dealModalTitle').textContent = deal ? 'تعديل العرض' : 'إضافة عرض';
    document.getElementById('dealId').value = deal ? deal._docId : '';
    document.getElementById('dealName').value = deal ? deal.name : '';
    document.getElementById('dealPrice').value = deal ? deal.price : '';
    document.getElementById('dealQty').value = deal ? (deal.qty || 2) : 2;
    document.getElementById('dealSizeType').value = deal ? (deal.sizeType || 'any') : 'any';
    document.getElementById('dealDescription').value = deal ? (deal.description || '') : '';
    document.getElementById('dealActive').value = deal ? (deal.active || 'active') : 'active';
    document.getElementById('dealType').value = deal ? (deal.type || 'combo') : 'combo';

    populateDealCategorySelect(deal ? deal.category : '');
    onDealTypeChange();

    if (deal && deal.type === 'multi_category') populateDealMultiCategories(deal.categories || []);
    if (deal && deal.type === 'specific') populateDealSpecificItems(deal.items || []);
    if (deal && deal.type === 'combo') {
        var combo = deal.combo || {};
        populateComboSandwiches(combo.sandwiches || []);
        document.getElementById('comboSandwichQty').value = combo.sandwichQty || 4;
        document.getElementById('comboFriesQty').value = combo.friesQty || 2;
        document.getElementById('comboDrinksQty').value = combo.drinksQty || 2;
        document.getElementById('comboSauces').value = combo.sauces ? 'yes' : 'no';
    }

    document.getElementById('dealModal').style.display = 'flex';
}

function saveDeal(event) {
    event.preventDefault();
    var type = document.getElementById('dealType').value;
    var dealData = {
        name: document.getElementById('dealName').value.trim(),
        type: type,
        price: Number(document.getElementById('dealPrice').value) || 0,
        qty: Number(document.getElementById('dealQty').value) || 2,
        sizeType: document.getElementById('dealSizeType').value,
        description: document.getElementById('dealDescription').value.trim(),
        active: document.getElementById('dealActive').value,
        createdAt: new Date().toISOString()
    };

    if (type === 'category') {
        dealData.category = document.getElementById('dealCategory').value;
    } else if (type === 'multi_category') {
        dealData.categories = getCheckedValues('dealMultiCategories', false);
        if (!dealData.categories.length) { alert('اختر قسماً واحداً على الأقل.'); return; }
    } else if (type === 'specific') {
        dealData.items = getCheckedValues('dealSpecificItems', true);
        if (!dealData.items.length) { alert('اختر صنفاً واحداً على الأقل.'); return; }
    } else if (type === 'combo') {
        var comboSandwiches = getCheckedValues('comboSandwiches', true);
        if (!comboSandwiches.length) { alert('اختر ساندويش واحد على الأقل للكومبو.'); return; }
        dealData.combo = {
            sandwiches: comboSandwiches,
            sandwichQty: Number(document.getElementById('comboSandwichQty').value) || 0,
            friesQty: Number(document.getElementById('comboFriesQty').value) || 0,
            drinksQty: Number(document.getElementById('comboDrinksQty').value) || 0,
            sauces: document.getElementById('comboSauces').value === 'yes'
        };
    }

    if (!dealData.name) { alert('أدخل اسم العرض.'); return; }
    if (!dealData.price) { alert('أدخل سعر العرض.'); return; }

    if (!window.db) { alert('فايرستور غير متاح حالياً.'); return; }

    var docId = document.getElementById('dealId').value || ('deal_' + Date.now());
    // Preserve original createdAt on edit
    if (document.getElementById('dealId').value) {
        var i;
        for (i = 0; i < deals.length; i += 1) {
            if (deals[i]._docId === docId && deals[i].createdAt) {
                dealData.createdAt = deals[i].createdAt;
                break;
            }
        }
    }

    setLoading(true);
    db.collection('deals').doc(docId).set(dealData).then(function () {
        setLoading(false);
        closeModal('dealModal');
        setStatus('تم حفظ العرض بنجاح.', 'success');
    }).catch(function () {
        setLoading(false);
        setStatus('تعذر حفظ العرض.', 'error');
    });
}

function deleteDeal(dealDocId) {
    if (!confirm('هل تريد حذف هذا العرض؟')) return;
    if (!window.db) { alert('فايرستور غير متاح حالياً.'); return; }
    setLoading(true);
    db.collection('deals').doc(dealDocId).delete().then(function () {
        setLoading(false);
        setStatus('تم حذف العرض.', 'success');
    }).catch(function () {
        setLoading(false);
        setStatus('تعذر حذف العرض.', 'error');
    });
}
