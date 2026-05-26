var FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 120 120%22%3E%3Crect width=%22120%22 height=%22120%22 rx=%2220%22 fill=%22%231a1a1a%22/%3E%3Ctext x=%2260%22 y=%2268%22 text-anchor=%22middle%22 font-size=%2218%22 fill=%22%23e63946%22 font-family=%22Arial%22%3EBurger%3C/text%3E%3C/svg%3E';
var products = normalizeProducts(DEFAULT_PRODUCTS);
var discounts = normalizeDiscounts(DEFAULT_DISCOUNTS);
var siteSettings = normalizeSettings(DEFAULT_SITE_SETTINGS);
var cart = normalizeCartItems(parseStoredCart(), products);
var currentTab = 'burgers';
var currentSearch = '';
var currentProduct = null;
var currentSizeIdx = 0;
var pdpQty = 1;
var activeOffers = [];
var currentOffer = null;
var offerQty = 1;

function parseStoredCart() {
    try {
        return JSON.parse(localStorage.getItem('burgerlab_cart') || '[]');
    } catch (error) {
        return [];
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setupSearchSync();
    bindAnchors();
    renderStorefront();
    subscribeToStoreData();
});

function subscribeToStoreData() {
    if (!window.db) {
        setStoreNotice('تعذر الاتصال بفايرستور الآن، تم عرض القائمة الاحتياطية.', true);
        return;
    }
    trackVisit();
    db.collection('products').orderBy('id').onSnapshot(function (snapshot) {
        var next = [];
        snapshot.forEach(function (docSnap) {
            next.push(normalizeProduct(docSnap.data()));
        });
        if (next.length) {
            products = normalizeProducts(next);
            cart = normalizeCartItems(cart, products);
            saveCart();
            renderStorefront();
        }
    }, function () {
        setStoreNotice('تعذر تحديث القائمة لحظياً.', true);
    });
    db.collection('discounts').onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (docSnap) {
            list.push(normalizeDiscount(docSnap.data()));
        });
        discounts = normalizeDiscounts(list);
        renderStorefront();
    });
    db.collection('settings').doc('config').onSnapshot(function (docSnap) {
        if (docSnap.exists) {
            siteSettings = normalizeSettings(docSnap.data());
            renderStorefront();
        }
    });
    db.collection('deals').onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (docSnap) { list.push(docSnap.data()); });
        renderOffersBanner(list);
    });
}

function setStoreNotice(message, isWarning) {
    var notice = document.getElementById('storeNotice');
    if (!notice) return;
    if (!message) {
        notice.style.display = 'none';
        notice.textContent = '';
        return;
    }
    notice.style.display = 'block';
    notice.textContent = message;
    notice.style.borderColor = isWarning ? 'rgba(255,140,0,0.32)' : 'rgba(230,57,70,0.26)';
}

function trackVisit() {
    if (!window.db) return;
    var now = new Date();
    var monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var docRef = db.collection('analytics').doc('visits');
    docRef.get().then(function (docSnap) {
        var data = docSnap.exists ? docSnap.data() : {};
        var current = Number(data[monthKey] || 0);
        var update = {};
        update[monthKey] = current + 1;
        return docRef.set(update, { merge: true });
    }).catch(function () {});
}

function renderOffersBanner(dealsList) {
    var banner = document.getElementById('offersBanner');
    var track = document.getElementById('offersBannerTrack');
    var section = document.getElementById('offersSection');
    if (!banner || !track) return;
    var now = new Date();
    var activeDeals = [];
    var i;
    for (i = 0; i < dealsList.length; i += 1) {
        var deal = dealsList[i];
        if (deal.active !== 'active' && deal.active !== true) continue;
        if (deal.startDate && new Date(deal.startDate) > now) continue;
        if (deal.endDate && new Date(deal.endDate) < now) continue;
        activeDeals.push(deal);
    }
    activeOffers = activeDeals;
    // Banner
    if (!activeDeals.length) {
        banner.style.display = 'none';
        if (section) section.style.display = 'none';
        return;
    }
    var bannerHtml = '';
    var bannerTexts = [];
    for (i = 0; i < activeDeals.length; i += 1) {
        var text = activeDeals[i].name || '';
        if (activeDeals[i].description) text += ' - ' + activeDeals[i].description;
        if (text) bannerTexts.push(text);
    }
    var doubled = bannerTexts.concat(bannerTexts);
    for (i = 0; i < doubled.length; i += 1) {
        bannerHtml += '<span>' + escapeHtml(doubled[i]) + '</span>';
    }
    track.innerHTML = bannerHtml;
    banner.style.display = 'flex';

    // Offers section cards
    if (section) {
        var cardsHtml = '';
        for (i = 0; i < activeDeals.length; i += 1) {
            var d = activeDeals[i];
            var details = '';
            if (d.type === 'combo' && d.combo) {
                var parts = [];
                if (d.combo.sandwichQty) parts.push(d.combo.sandwichQty + ' ساندويش');
                if (d.combo.friesQty) parts.push(d.combo.friesQty + ' بطاطا');
                if (d.combo.drinksQty) parts.push(d.combo.drinksQty + ' مشروب');
                if (d.combo.sauces) parts.push('صوصات');
                details = parts.join(' + ');
            } else if (d.description) {
                details = d.description;
            }
            cardsHtml += '<div class="offer-card" onclick="openOfferModal(' + i + ')" style="cursor:pointer;">';
            cardsHtml += '<span class="offer-badge">عرض 🔥</span>';
            cardsHtml += '<h4>' + escapeHtml(d.name || '') + '</h4>';
            if (details) cardsHtml += '<p>' + escapeHtml(details) + '</p>';
            cardsHtml += '<div class="offer-price">' + formatCurrency(d.price || 0) + ' <small>فقط</small></div>';
            cardsHtml += '</div>';
        }
        section.innerHTML = cardsHtml;
        section.style.display = activeDeals.length ? 'grid' : 'none';
    }
}

function setupSearchSync() {
    var navInput = document.getElementById('navSearchInput');
    var menuInput = document.getElementById('menuSearchInput');

    function handleInput(value, source) {
        currentSearch = String(value || '');
        if (source !== 'nav' && navInput) navInput.value = currentSearch;
        if (source !== 'menu' && menuInput) menuInput.value = currentSearch;
        renderMenuSections();
    }

    if (navInput) {
        navInput.addEventListener('input', function () {
            handleInput(this.value, 'nav');
        });
    }
    if (menuInput) {
        menuInput.addEventListener('input', function () {
            handleInput(this.value, 'menu');
        });
    }
}

function bindAnchors() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    var i;
    for (i = 0; i < anchors.length; i += 1) {
        anchors[i].addEventListener('click', function (event) {
            var target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

function renderStorefront() {
    applySettings();
    updateActiveTabUI();
    renderMenuSections();
    updateCartBadge();
    renderCart();
}

function applySettings() {
    var heroSubtitle = document.getElementById('heroSubtitle');
    var aboutText = document.getElementById('aboutText');
    var instagramLink = document.getElementById('instagramLink');
    var whatsappLink = document.getElementById('whatsappLink');
    if (heroSubtitle) heroSubtitle.textContent = siteSettings.heroSubtitle;
    if (aboutText) aboutText.innerHTML = escapeHtml(siteSettings.aboutText).replace(/\n/g, '<br>');
    if (instagramLink) instagramLink.href = siteSettings.instagramLink;
    if (whatsappLink) whatsappLink.href = buildWhatsAppUrl(siteSettings.whatsappNumber, 'مرحبا، أريد الاستفسار عن منيو Burger Lab.');
}

function setActiveTab(tabId, button) {
    currentTab = tabId;
    updateActiveTabUI(button);
    renderMenuSections();
}

function updateActiveTabUI(clickedButton) {
    var buttons = document.querySelectorAll('.menu-tab');
    var i;
    for (i = 0; i < buttons.length; i += 1) {
        if (buttons[i].getAttribute('data-tab') === currentTab) buttons[i].classList.add('active');
        else buttons[i].classList.remove('active');
    }
    if (clickedButton) clickedButton.classList.add('active');
}

function getVisibleProducts() {
    var categories = getCategoriesForTab(currentTab);
    var result = [];
    var i;
    for (i = 0; i < products.length; i += 1) {
        if (categories.indexOf(products[i].category) >= 0 && matchesSearch(products[i], currentSearch)) {
            result.push(products[i]);
        }
    }
    return result;
}

function renderMenuSections() {
    var container = document.getElementById('menuSections');
    if (!container) return;
    var visible = getVisibleProducts();
    var categories = getCategoriesForTab(currentTab);
    var html = '';
    var i;
    if (!visible.length) {
        container.innerHTML = '<div class="empty-state">لا توجد عناصر مطابقة داخل هذا القسم الآن.</div>';
        return;
    }
    for (i = 0; i < categories.length; i += 1) {
        var categoryProducts = [];
        var j;
        for (j = 0; j < visible.length; j += 1) {
            if (visible[j].category === categories[i]) categoryProducts.push(visible[j]);
        }
        if (!categoryProducts.length) continue;
        html += '<section class="menu-category-card">';
        html += '<div class="menu-category-head"><h3>' + escapeHtml(categories[i]) + '</h3><span>' + categoryProducts.length + ' صنف</span></div>';
        html += '<div class="menu-items-list">';
        for (j = 0; j < categoryProducts.length; j += 1) html += renderMenuItemCard(categoryProducts[j]);
        html += '</div></section>';
    }
    container.innerHTML = html;
}

function renderMenuItemCard(product) {
    var sizeData = getSizeData(product, 0);
    var pricing = getFinalPrice(product, 0, discounts);
    var sizeSelectHtml = '';
    var badge = '';
    if (product.sizes.length > 1) {
        sizeSelectHtml += '<select id="sizeSelect-' + product.id + '" onchange="updateCardSelection(' + product.id + ', this.value)">';
        var i;
        for (i = 0; i < product.sizes.length; i += 1) sizeSelectHtml += '<option value="' + i + '">' + escapeHtml(getSizeLabel(product.sizes[i])) + '</option>';
        sizeSelectHtml += '</select>';
    } else {
        sizeSelectHtml = '<div class="size-note">' + escapeHtml(getSizeLabel(sizeData)) + '</div>';
    }
    if (product.status === 'special') badge = '<span class="status-badge special">عرض مميز</span>';
    if (product.status === 'bestseller') badge = '<span class="status-badge bestseller">الأكثر طلباً</span>';
    if (product.status === 'soldout') badge = '<span class="status-badge soldout">غير متوفر حالياً</span>';

    return [
        '<article class="menu-item-card ' + (product.status === 'soldout' ? 'soldout' : '') + '">',
        '<div class="item-thumb"><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'' + FALLBACK_IMAGE + '\'" loading="lazy"></div>',
        '<div class="item-main">',
        badge,
        '<h4>' + escapeHtml(product.name) + '</h4>',
        '<div class="item-meta"><span>' + escapeHtml(product.category) + '</span><span id="cardSizeHint-' + product.id + '">' + escapeHtml(getSizeHint(sizeData)) + '</span></div>',
        '<p class="item-desc">' + escapeHtml(product.description) + '</p>',
        '<div class="item-size-row">',
        sizeSelectHtml,
        '<span class="price-note">الوجبة = ساندويش + بطاطا + مشروب</span>',
        '</div>',
        '</div>',
        '<div class="item-actions">',
        '<div id="cardPrice-' + product.id + '" class="item-price">' + buildPriceHTML(pricing) + '</div>',
        '<div class="item-cta">',
        '<button type="button" class="btn-secondary" onclick="openPDP(' + product.id + ')">التفاصيل</button>',
        '<button type="button" class="btn-primary" onclick="addToCart(' + product.id + ')" ' + (product.status === 'soldout' ? 'disabled' : '') + '>' + (product.status === 'soldout' ? 'غير متوفر' : 'أضف') + '</button>',
        '</div>',
        '</div>',
        '</article>'
    ].join('');
}

function updateCardSelection(productId, sizeIdx) {
    var product = findProductById(products, productId);
    if (!product) return;
    var sizeData = getSizeData(product, sizeIdx);
    var pricing = getFinalPrice(product, sizeIdx, discounts);
    var priceNode = document.getElementById('cardPrice-' + productId);
    var hintNode = document.getElementById('cardSizeHint-' + productId);
    if (priceNode) priceNode.innerHTML = buildPriceHTML(pricing);
    if (hintNode) hintNode.textContent = getSizeHint(sizeData);
}

function buildPriceHTML(pricing) {
    var html = '<span>' + formatCurrency(pricing.final) + '</span>';
    if (pricing.hasDiscount) html += '<span class="old-price">' + formatCurrency(pricing.original) + '</span>';
    return html;
}

function getSelectedCardSize(productId) {
    var select = document.getElementById('sizeSelect-' + productId);
    if (!select) return 0;
    return parseInt(select.value, 10) || 0;
}

function findCartItem(productId, sizeIdx) {
    var i;
    for (i = 0; i < cart.length; i += 1) {
        if (Number(cart[i].id) === Number(productId) && Number(cart[i].sizeIdx) === Number(sizeIdx)) return cart[i];
    }
    return null;
}

function addToCart(productId) {
    var product = findProductById(products, productId);
    if (!product || product.status === 'soldout') return;
    var sizeIdx = getSelectedCardSize(productId);
    var pricing = getFinalPrice(product, sizeIdx, discounts);
    var existing = findCartItem(productId, sizeIdx);
    if (existing) existing.qty += 1;
    else cart.push({ id: Number(productId), sizeIdx: sizeIdx, qty: 1, price: pricing.final });
    saveCart();
    updateCartBadge();
    renderCart();
}

function saveCart() {
    localStorage.setItem('burgerlab_cart', JSON.stringify(normalizeCartItems(cart, products)));
}

function updateCartBadge() {
    var badge = document.getElementById('cartBadge');
    if (!badge) return;
    var totalQty = 0;
    var i;
    for (i = 0; i < cart.length; i += 1) totalQty += Number(cart[i].qty) || 0;
    if (!totalQty) {
        badge.style.display = 'none';
        return;
    }
    badge.style.display = 'flex';
    badge.textContent = totalQty;
}

function toggleCart() {
    var sidebar = document.getElementById('cartSidebar');
    var overlay = document.getElementById('cartOverlay');
    if (!sidebar || !overlay) return;
    var isOpen = sidebar.classList.contains('active');
    if (isOpen) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCart();
    }
}

function renderCart() {
    var itemsNode = document.getElementById('cartItems');
    var footer = document.getElementById('cartFooter');
    var totalNode = document.getElementById('cartTotal');
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (!itemsNode || !footer || !totalNode || !checkoutBtn) return;
    if (!cart.length) {
        itemsNode.innerHTML = '<div class="cart-empty"><div><strong>السلة فاضية</strong><p>أضف أصنافك المفضلة وابدأ الطلب.</p></div></div>';
        footer.style.display = 'none';
        return;
    }
    var html = '';
    var total = 0;
    var i;
    for (i = 0; i < cart.length; i += 1) {
        if (cart[i].isOffer) {
            var offerTotal = (cart[i].offerPrice || 0) * cart[i].qty;
            total += offerTotal;
            html += '<div class="cart-item">';
            html += '<div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🔥</div>';
            html += '<div class="cart-item-info"><h4>' + escapeHtml(cart[i].offerName || 'عرض') + '</h4><span>' + escapeHtml((cart[i].selectedNames || []).join('، ')) + '</span><div class="cart-item-price">' + formatCurrency(offerTotal) + '</div></div>';
            html += '<div class="cart-item-actions">';
            html += '<div class="qty-selector"><button type="button" onclick="updateOfferQty(' + i + ', -1)">−</button><span>' + cart[i].qty + '</span><button type="button" onclick="updateOfferQty(' + i + ', 1)">+</button></div>';
            html += '<button type="button" onclick="removeOfferFromCart(' + i + ')">حذف</button>';
            html += '</div></div>';
            continue;
        }
        var product = findProductById(products, cart[i].id);
        if (!product) continue;
        var sizeData = getSizeData(product, cart[i].sizeIdx);
        var pricing = getFinalPrice(product, cart[i].sizeIdx, discounts);
        var lineTotal = pricing.final * cart[i].qty;
        total += lineTotal;
        html += '<div class="cart-item">';
        html += '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" onerror="this.src=\'' + FALLBACK_IMAGE + '\'">';
        html += '<div class="cart-item-info"><h4>' + escapeHtml(product.name) + '</h4><span>' + escapeHtml(getSizeLabel(sizeData)) + ' • ' + escapeHtml(getSizeHint(sizeData)) + '</span><div class="cart-item-price">' + formatCurrency(lineTotal) + '</div></div>';
        html += '<div class="cart-item-actions">';
        html += '<div class="qty-selector"><button type="button" onclick="updateCartQty(' + cart[i].id + ', ' + cart[i].sizeIdx + ', -1)">−</button><span>' + cart[i].qty + '</span><button type="button" onclick="updateCartQty(' + cart[i].id + ', ' + cart[i].sizeIdx + ', 1)">+</button></div>';
        html += '<button type="button" onclick="removeFromCart(' + cart[i].id + ', ' + cart[i].sizeIdx + ')">حذف</button>';
        html += '</div></div>';
    }
    itemsNode.innerHTML = html;
    footer.style.display = 'grid';
    totalNode.textContent = formatCurrency(total);
    checkoutBtn.classList.remove('btn-disabled');
}

function updateOfferQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        removeOfferFromCart(index);
        return;
    }
    saveCart();
    renderCart();
    updateCartBadge();
}

function removeOfferFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartBadge();
}

function updateCartQty(productId, sizeIdx, delta) {
    var item = findCartItem(productId, sizeIdx);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId, sizeIdx);
        return;
    }
    saveCart();
    renderCart();
    updateCartBadge();
}

function removeFromCart(productId, sizeIdx) {
    var next = [];
    var i;
    for (i = 0; i < cart.length; i += 1) {
        if (!(Number(cart[i].id) === Number(productId) && Number(cart[i].sizeIdx) === Number(sizeIdx))) next.push(cart[i]);
    }
    cart = next;
    saveCart();
    renderCart();
    updateCartBadge();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    updateCartBadge();
}

function openPDP(productId) {
    currentProduct = findProductById(products, productId);
    currentSizeIdx = 0;
    pdpQty = 1;
    if (!currentProduct) return;
    document.getElementById('pdpImage').innerHTML = '<img src="' + escapeHtml(currentProduct.image) + '" alt="' + escapeHtml(currentProduct.name) + '" onerror="this.src=\'' + FALLBACK_IMAGE + '\'">';
    document.getElementById('pdpCategory').textContent = currentProduct.category;
    document.getElementById('pdpName').textContent = currentProduct.name;
    document.getElementById('pdpDescription').textContent = currentProduct.description;
    document.getElementById('pdpQty').textContent = '1';
    renderPDPSizes();
    updatePDPDisplay();
    document.getElementById('pdpModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function renderPDPSizes() {
    var sizeSection = document.getElementById('pdpSizeSection');
    var sizesNode = document.getElementById('pdpSizes');
    var html = '';
    var i;
    if (!currentProduct || !sizeSection || !sizesNode) return;
    if (currentProduct.sizes.length <= 1) {
        sizeSection.style.display = 'none';
        sizesNode.innerHTML = '';
        return;
    }
    sizeSection.style.display = 'grid';
    for (i = 0; i < currentProduct.sizes.length; i += 1) {
        html += '<button type="button" class="pdp-size-btn ' + (i === currentSizeIdx ? 'active' : '') + '" onclick="selectPDPSize(' + i + ')">' + escapeHtml(getSizeLabel(currentProduct.sizes[i])) + '</button>';
    }
    sizesNode.innerHTML = html;
}

function selectPDPSize(index) {
    currentSizeIdx = index;
    renderPDPSizes();
    updatePDPDisplay();
}

function updatePDPDisplay() {
    if (!currentProduct) return;
    var sizeData = getSizeData(currentProduct, currentSizeIdx);
    var pricing = getFinalPrice(currentProduct, currentSizeIdx, discounts);
    var addBtn = document.getElementById('pdpAddBtn');
    document.getElementById('pdpPrice').innerHTML = buildPriceHTML(pricing);
    document.getElementById('pdpSizeHint').textContent = getSizeHint(sizeData);
    addBtn.disabled = currentProduct.status === 'soldout';
    addBtn.textContent = currentProduct.status === 'soldout' ? 'غير متوفر حالياً' : 'أضف للسلة';
}

function changePDPQty(delta) {
    pdpQty += delta;
    if (pdpQty < 1) pdpQty = 1;
    if (pdpQty > 99) pdpQty = 99;
    document.getElementById('pdpQty').textContent = String(pdpQty);
}

function addFromPDP() {
    if (!currentProduct || currentProduct.status === 'soldout') return;
    var pricing = getFinalPrice(currentProduct, currentSizeIdx, discounts);
    var existing = findCartItem(currentProduct.id, currentSizeIdx);
    if (existing) existing.qty += pdpQty;
    else cart.push({ id: currentProduct.id, sizeIdx: currentSizeIdx, qty: pdpQty, price: pricing.final });
    saveCart();
    updateCartBadge();
    renderCart();
    closePDP();
    toggleCart();
}

function closePDP(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('pdpModal').style.display = 'none';
    document.body.style.overflow = '';
    currentProduct = null;
}

function toggleMobileMenu() {
    var menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.classList.toggle('active');
}

// ===================== OFFER MODAL =====================

function openOfferModal(index) {
    var deal = activeOffers[index];
    if (!deal) return;
    currentOffer = deal;
    offerQty = 1;
    document.getElementById('offerModalName').textContent = deal.name || '';
    document.getElementById('offerModalDesc').textContent = deal.description || '';
    document.getElementById('offerModalPrice').textContent = formatCurrency(deal.price || 0);
    document.getElementById('offerModalQty').textContent = '1';

    // Build details
    var detailsHtml = '';
    if (deal.type === 'combo' && deal.combo) {
        detailsHtml += '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;margin-bottom:10px;">';
        detailsHtml += '<strong style="display:block;margin-bottom:8px;">محتويات العرض:</strong>';
        if (deal.combo.sandwichQty) detailsHtml += '<div>🍔 ' + deal.combo.sandwichQty + ' ساندويش</div>';
        if (deal.combo.friesQty) detailsHtml += '<div>🍟 ' + deal.combo.friesQty + ' بطاطا</div>';
        if (deal.combo.drinksQty) detailsHtml += '<div>🥤 ' + deal.combo.drinksQty + ' مشروب</div>';
        if (deal.combo.sauces) detailsHtml += '<div>🫙 صوصات</div>';
        detailsHtml += '</div>';
    } else if (deal.type === 'category') {
        detailsHtml += '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;">';
        detailsHtml += '<strong>القسم:</strong> ' + escapeHtml(deal.category || '') + '<br>';
        detailsHtml += '<strong>الكمية:</strong> ' + (deal.qty || 2) + ' قطع';
        detailsHtml += '</div>';
    } else if (deal.type === 'multi_category') {
        detailsHtml += '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;">';
        detailsHtml += '<strong>الأقسام:</strong> ' + escapeHtml((deal.categories || []).join('، ')) + '<br>';
        detailsHtml += '<strong>الكمية:</strong> ' + (deal.qty || 2) + ' قطع';
        detailsHtml += '</div>';
    } else if (deal.type === 'all') {
        detailsHtml += '<div style="background:rgba(255,255,255,0.04);border-radius:14px;padding:14px;">';
        detailsHtml += '<strong>كل أصناف القائمة</strong> — ' + (deal.qty || 2) + ' قطع';
        detailsHtml += '</div>';
    }
    document.getElementById('offerModalDetails').innerHTML = detailsHtml;

    // Build selections (user picks which items they want)
    var selectionsHtml = '';
    var selectableItems = getOfferSelectableItems(deal);
    if (selectableItems.length > 1) {
        var maxPicks = getOfferMaxPicks(deal);
        selectionsHtml += '<div style="margin-bottom:8px;display:flex;align-items:center;gap:12px;"><strong>اختر ' + maxPicks + ' أصناف:</strong>';
        if (selectableItems.length <= maxPicks) {
            selectionsHtml += '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:0.85rem;color:var(--accent);"><input type="checkbox" onchange="selectAllOfferItems(this,' + maxPicks + ')" style="accent-color:var(--accent);"> تحديد الكل</label>';
        }
        selectionsHtml += '</div>';
        selectionsHtml += '<div class="offer-selections-grid">';
        var i;
        for (i = 0; i < selectableItems.length; i += 1) {
            selectionsHtml += '<label class="offer-select-item">';
            selectionsHtml += '<input type="checkbox" value="' + selectableItems[i].id + '" onchange="validateOfferSelections(' + maxPicks + ')">';
            selectionsHtml += '<span>' + escapeHtml(selectableItems[i].name) + '</span>';
            selectionsHtml += '</label>';
        }
        selectionsHtml += '</div>';
    }
    document.getElementById('offerModalSelections').innerHTML = selectionsHtml;

    document.getElementById('offerModal').style.display = 'flex';
}

function getOfferSelectableItems(deal) {
    var items = [];
    var i;
    var swType = deal.sandwichType || 'any';
    if (deal.type === 'combo' && deal.combo && deal.combo.sandwiches) {
        var comboSwType = deal.combo.sandwichType || '';
        for (i = 0; i < deal.combo.sandwiches.length; i += 1) {
            var p = findProductById(products, deal.combo.sandwiches[i]);
            if (p) {
                if (comboSwType && p.sandwichType !== comboSwType) continue;
                items.push(p);
            }
        }
    } else if (deal.type === 'specific' && deal.items) {
        for (i = 0; i < deal.items.length; i += 1) {
            var p2 = findProductById(products, deal.items[i]);
            if (p2) items.push(p2);
        }
    } else if (deal.type === 'category' && deal.category) {
        for (i = 0; i < products.length; i += 1) {
            if (products[i].category !== deal.category) continue;
            if (swType !== 'any' && products[i].sandwichType !== swType) continue;
            items.push(products[i]);
        }
    } else if (deal.type === 'multi_category' && deal.categories) {
        for (i = 0; i < products.length; i += 1) {
            if (deal.categories.indexOf(products[i].category) < 0) continue;
            if (swType !== 'any' && products[i].sandwichType !== swType) continue;
            items.push(products[i]);
        }
    } else if (deal.type === 'all') {
        for (i = 0; i < products.length; i += 1) {
            if (swType !== 'any' && products[i].sandwichType !== swType) continue;
            items.push(products[i]);
        }
    }
    return items;
}

function getOfferMaxPicks(deal) {
    if (deal.type === 'combo' && deal.combo) return deal.combo.sandwichQty || 4;
    return deal.qty || 2;
}

function validateOfferSelections(max) {
    var container = document.getElementById('offerModalSelections');
    if (!container) return;
    var grid = container.querySelector('.offer-selections-grid');
    if (!grid) return;
    var checked = grid.querySelectorAll('input[type=checkbox]:checked');
    var unchecked = grid.querySelectorAll('input[type=checkbox]:not(:checked)');
    var i;
    if (checked.length >= max) {
        for (i = 0; i < unchecked.length; i += 1) unchecked[i].disabled = true;
    } else {
        var all = grid.querySelectorAll('input[type=checkbox]');
        for (i = 0; i < all.length; i += 1) all[i].disabled = false;
    }
}

function selectAllOfferItems(masterCheckbox, max) {
    var container = document.getElementById('offerModalSelections');
    if (!container) return;
    var grid = container.querySelector('.offer-selections-grid');
    if (!grid) return;
    var all = grid.querySelectorAll('input[type=checkbox]');
    var i;
    if (masterCheckbox.checked) {
        for (i = 0; i < all.length && i < max; i += 1) {
            all[i].checked = true;
            all[i].disabled = false;
        }
        for (; i < all.length; i += 1) {
            all[i].checked = false;
            all[i].disabled = true;
        }
    } else {
        for (i = 0; i < all.length; i += 1) {
            all[i].checked = false;
            all[i].disabled = false;
        }
    }
}

function closeOfferModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('offerModal').style.display = 'none';
    currentOffer = null;
}

function changeOfferQty(delta) {
    offerQty = Math.max(1, offerQty + delta);
    document.getElementById('offerModalQty').textContent = offerQty;
}

function addOfferToCart() {
    if (!currentOffer) return;
    var deal = currentOffer;
    var selectedItems = [];
    var container = document.getElementById('offerModalSelections');
    if (container) {
        var checked = container.querySelectorAll('input[type=checkbox]:checked');
        var i;
        for (i = 0; i < checked.length; i += 1) {
            selectedItems.push(Number(checked[i].value));
        }
    }
    // Validate selections if there are options
    var selectableItems = getOfferSelectableItems(deal);
    var maxPicks = getOfferMaxPicks(deal);
    if (selectableItems.length > 1 && selectedItems.length < maxPicks) {
        alert('الرجاء اختيار ' + maxPicks + ' أصناف لإكمال العرض.');
        return;
    }

    // Build offer cart item
    var offerItem = {
        id: 'offer_' + (deal.name || '').replace(/\s/g, '_') + '_' + Date.now(),
        isOffer: true,
        offerName: deal.name,
        offerPrice: deal.price,
        selectedItems: selectedItems,
        qty: offerQty,
        deal: deal
    };

    // Build name for display
    var names = [];
    for (i = 0; i < selectedItems.length; i += 1) {
        var p = findProductById(products, selectedItems[i]);
        if (p) names.push(p.name);
    }
    offerItem.selectedNames = names;

    cart.push(offerItem);
    saveCart();
    renderCart();
    updateCartBadge();
    closeOfferModal();
    toggleCart();
}
