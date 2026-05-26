var DEFAULT_PRODUCTS = [];

var DEFAULT_DISCOUNTS = [];

var DEFAULT_SITE_SETTINGS = {
    whatsappNumber: '972569236758',
    heroSubtitle: 'أطعم برجر بالبلد',
    aboutText: 'برجر لاب يقدّم برجر لحم ودجاج بطعم قوي ومكونات طازجة يومياً.\n\nنحضّر الساندويشات والوجبات بسرعة، ونهتم بالتفاصيل من أول قضمة لآخر صوص.\n\nلطلبات داخل المطعم أو سفري، إحنا جاهزين.',
    instagramLink: 'https://www.instagram.com/burger._.lab/',
    tiktokLink: ''
};

var BRANDS_DATA = [];

var CATEGORY_TABS = [
    { id: 'burgers', label: 'البرجر', categories: ['برجر لحم', 'برجر دجاج', 'أطفال'] },
    { id: 'meals', label: 'الوجبات', categories: ['عروض', 'تندر دجاج'] },
    { id: 'extras', label: 'الإضافات والسلطات', categories: ['إضافات', 'سلطات'] },
    { id: 'drinks', label: 'المشروبات', categories: ['مشروبات'] }
];

function normalizeSizeEntry(entry) {
    return {
        size: String(entry && entry.size ? entry.size : 'عادي').trim() || 'عادي',
        unit: String(entry && entry.unit ? entry.unit : 'قطعة').trim() || 'قطعة',
        price: Number(entry && entry.price ? entry.price : 0) || 0
    };
}

function normalizeProduct(product) {
    var source = product || {};
    var sizes = [];
    var i;
    if (source.sizes && source.sizes.length) {
        for (i = 0; i < source.sizes.length; i += 1) {
            sizes.push(normalizeSizeEntry(source.sizes[i]));
        }
    } else {
        sizes.push(normalizeSizeEntry({ size: source.size || 'عادي', unit: source.unit || 'قطعة', price: source.price || 0 }));
    }
    return {
        id: Number(source.id) || new Date().getTime(),
        name: String(source.name || '').trim(),
        brand: String(source.brand || '').trim(),
        category: String(source.category || '').trim(),
        description: String(source.description || '').trim(),
        sizes: sizes,
        discount: Number(source.discount || 0) || 0,
        image: String(source.image || '').trim(),
        status: String(source.status || 'normal').trim() || 'normal',
        sandwichType: String(source.sandwichType || '').trim()
    };
}

function normalizeProducts(list) {
    return (Array.isArray(list) ? list : []).map(normalizeProduct).sort(function (a, b) {
        return a.id - b.id;
    });
}

function normalizeDiscount(discount) {
    var source = discount || {};
    var values = [];
    if (source.values && source.values.length) {
        values = source.values;
    } else if (source.value) {
        values = String(source.value).split(',');
    }
    values = values.map(function (value) { return String(value).trim(); }).filter(function (value) { return !!value; });
    return {
        id: String(source.id || new Date().getTime()),
        type: String(source.type || 'manual'),
        value: values.join(', '),
        values: values,
        percentage: Number(source.percentage || 0) || 0,
        description: String(source.description || '').trim(),
        expiresAt: String(source.expiresAt || '').trim()
    };
}

function normalizeDiscounts(list) {
    return (Array.isArray(list) ? list : []).map(normalizeDiscount);
}

function extractWhatsappNumber(input) {
    var raw = String(input || '').trim();
    if (!raw) return DEFAULT_SITE_SETTINGS.whatsappNumber;
    if (raw.indexOf('wa.me/') >= 0) raw = raw.split('wa.me/')[1];
    return raw.replace(/[^0-9]/g, '');
}

function buildWhatsAppUrl(number, message) {
    var safeNumber = extractWhatsappNumber(number);
    var text = message ? '?text=' + encodeURIComponent(message) : '';
    return 'https://wa.me/' + safeNumber + text;
}

function normalizeSettings(settings) {
    var source = settings || {};
    return {
        whatsappNumber: extractWhatsappNumber(source.whatsappNumber || source.whatsappLink || DEFAULT_SITE_SETTINGS.whatsappNumber),
        heroSubtitle: String(source.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
        aboutText: String(source.aboutText || DEFAULT_SITE_SETTINGS.aboutText),
        instagramLink: String(source.instagramLink || DEFAULT_SITE_SETTINGS.instagramLink),
        tiktokLink: String(source.tiktokLink || DEFAULT_SITE_SETTINGS.tiktokLink)
    };
}

function getSizeData(product, sizeIdx) {
    if (!product || !product.sizes || !product.sizes.length) {
        return normalizeSizeEntry({ size: 'عادي', unit: 'قطعة', price: 0 });
    }
    var idx = parseInt(sizeIdx, 10);
    if (isNaN(idx) || idx < 0 || idx >= product.sizes.length) idx = 0;
    return product.sizes[idx];
}

function getSizeLabel(sizeData) {
    return String(sizeData && sizeData.size ? sizeData.size : 'عادي');
}

function getSizeHint(sizeData) {
    var label = getSizeLabel(sizeData);
    if (label === 'وجبة') return 'يشمل الساندويش + بطاطا + مشروب';
    if (label === 'ساندويش') return 'ساندويش فقط';
    return 'قطعة';
}

function getProductDiscountPercent(product, discounts) {
    var maxDiscount = Number(product && product.discount ? product.discount : 0) || 0;
    var list = normalizeDiscounts(discounts || []);
    var today = new Date().toISOString().slice(0, 10);
    var i;
    for (i = 0; i < list.length; i += 1) {
        if (list[i].expiresAt && list[i].expiresAt < today) continue;
        if (list[i].type === 'all') maxDiscount = Math.max(maxDiscount, list[i].percentage);
        if (list[i].type === 'category' && list[i].values.indexOf(product.category) >= 0) {
            maxDiscount = Math.max(maxDiscount, list[i].percentage);
        }
    }
    return maxDiscount;
}

function getFinalPrice(product, sizeIdx, discounts) {
    var sizeData = getSizeData(product, sizeIdx);
    var base = Number(sizeData.price || 0) || 0;
    var discountPercent = getProductDiscountPercent(product, discounts || []);
    if (discountPercent > 0) {
        return {
            original: base,
            final: Math.round(base * (1 - discountPercent / 100)),
            hasDiscount: true,
            discountPercent: discountPercent
        };
    }
    return { original: base, final: base, hasDiscount: false, discountPercent: 0 };
}

function findProductById(list, id) {
    var safeList = Array.isArray(list) ? list : [];
    var target = Number(id);
    var i;
    for (i = 0; i < safeList.length; i += 1) {
        if (Number(safeList[i].id) === target) return safeList[i];
    }
    return null;
}

function normalizeCartItems(cartItems, productsList) {
    var safeItems = Array.isArray(cartItems) ? cartItems : [];
    var result = [];
    var i;
    for (i = 0; i < safeItems.length; i += 1) {
        var item = safeItems[i];
        var product = findProductById(productsList, item.id || item.productId);
        var maxSizeIndex = product && product.sizes && product.sizes.length ? product.sizes.length - 1 : 0;
        var sizeIdx = parseInt(item.sizeIdx, 10);
        if (isNaN(sizeIdx) || sizeIdx < 0) sizeIdx = 0;
        if (sizeIdx > maxSizeIndex) sizeIdx = maxSizeIndex;
        if (!item.id && !item.productId) continue;
        result.push({
            id: Number(item.id || item.productId),
            sizeIdx: sizeIdx,
            qty: Math.max(1, parseInt(item.qty, 10) || 1),
            price: Number(item.price || (product ? getSizeData(product, sizeIdx).price : 0)) || 0
        });
    }
    return result;
}

function formatCurrency(value) {
    return '₪' + (Number(value) || 0);
}

function formatDateTime(value) {
    var date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('ar-PS', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function makeOrderId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    var i;
    for (i = 0; i < 6; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return 'BL-' + code;
}

function formatProductPrice(product, discounts) {
    if (!product || !product.sizes || !product.sizes.length) return formatCurrency(0);
    if (product.sizes.length === 1) return formatCurrency(getFinalPrice(product, 0, discounts || []).final);
    var parts = [];
    var i;
    for (i = 0; i < product.sizes.length; i += 1) {
        parts.push(getSizeLabel(product.sizes[i]) + ' ' + formatCurrency(getFinalPrice(product, i, discounts || []).final));
    }
    return parts.join(' • ');
}

function matchesSearch(product, query) {
    if (!query) return true;
    var text = [product.name, product.category, product.description].join(' ').toLowerCase();
    return text.indexOf(String(query).toLowerCase()) >= 0;
}

function getCategoriesForTab(tabId) {
    var i;
    for (i = 0; i < CATEGORY_TABS.length; i += 1) {
        if (CATEGORY_TABS[i].id === tabId) return CATEGORY_TABS[i].categories.slice();
    }
    return [];
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
