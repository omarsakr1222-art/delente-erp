// debug: avoid blocking alerts during load
console.log('بدء تحميل الكود');

let observer;

const initIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        // Disconnect the observer before making changes to the DOM to prevent infinite loops.
        if (observer) {
            observer.disconnect();
        }

        window.lucide.createIcons();

        // Reconnect the observer after changes are made.
        if (observer) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
    }
};

// Create an observer instance to watch for dynamically added icons.
observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any added nodes need icons.
            const hasLucideIcons = Array.from(mutation.addedNodes).some(
                (node) =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node.hasAttribute('data-lucide') || node.querySelector('[data-lucide]'))
            );
            if (hasLucideIcons) {
                initIcons();
                // Once icons are initialized for this batch of mutations, we can stop.
                break;
            }
        }
    }
});

// Initial icon creation and start of observation.
document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});

// A fallback for any icons that might have been missed.
window.addEventListener('load', initIcons);
// زر توليد الأدوار الناقصة (إداري فقط)
document.addEventListener('click', function(e){
    const btn = e.target.closest('#seed-missing-roles-btn');
    if (!btn) return;
    try {
        const role = (typeof getUserRole==='function')? getUserRole(): 'user';
        if (role !== 'admin') { alert('هذه العملية للمشرف فقط'); return; }
        const statusEl = document.getElementById('seed-roles-status');
        if (statusEl) statusEl.textContent = 'جاري الفحص...';
        if (!window.db) { if (statusEl) statusEl.textContent='Firestore غير جاهز'; return; }
        const users = (window.state && Array.isArray(state.users)) ? window.state.users : [];
        const forcedAdmins = new Set((window.FORCED_ADMINS||[]).map(e=>String(e).toLowerCase()));
        const forcedReviewers = new Set((window.FORCED_REVIEWERS||[]).map(e=>String(e).toLowerCase()));
        const missing = [];
        users.forEach(u => {
            const uid = u._id || u.uid || u.id; const email = (u.email||'').toLowerCase();
            if (!uid) return;
            if (u.role) return; // لديه دور بالفعل في users
            if (forcedAdmins.has(email) || forcedReviewers.has(email)) return; // أدوار إجبارية
            missing.push({ uid, email });
        });
        if (missing.length === 0) { if (statusEl) statusEl.textContent='لا توجد أدوار ناقصة.'; return; }
        if (statusEl) statusEl.textContent = 'إنشاء '+missing.length+' مستند دور...';
        const ops = missing.map(m => window.db.collection('roles').doc(m.uid).set({ role: 'rep', email: m.email, createdAt: firebase.firestore.FieldValue.serverTimestamp() }));
        Promise.allSettled(ops).then(results => {
            const ok = results.filter(r=>r.status==='fulfilled').length;
            const fail = results.length - ok;
            if (statusEl) statusEl.textContent = 'تم إنشاء '+ok+' / '+results.length+'؛ فشل '+fail+'.';
            document.dispatchEvent(new Event('role-ready'));
        }).catch(err => { if (statusEl) statusEl.textContent='خطأ: '+err.message; });
    } catch(err){ console.warn('seed-missing-roles error', err); }
});

// Ensure constants and utility functions are defined at the top level
const DEFAULT_PRODUCTS = [
     {id: '1', name: 'لبن جاموسى', price: 44.00, category: 'dairy'}, {id: '3', name: 'زبادى بلدى', price: 9.00, category: 'multi'}, {id: '4', name: 'ارز باللبن', price: 17.50, category: 'multi'}, {id: '18', name: 'قريش كاملة الدسم', price: 100.00, category: 'dairy'}, {id: '11', name: 'قريش خالية الدسم', price: 95.00, category: 'dairy'}, {id: '14', name: 'ذبدة جاموسي 900 جم', price: 315.00, category: 'multi'}, {id: '13', name: 'ذبدة بقرى 900', price: 280.00, category: 'multi'}, {id: '30', name: 'مش قطع', price: 150.00, category: 'dairy'}, {id: '32', name: 'مش كريمى', price: 120.00, category: 'dairy'}, {id: '200', name: 'صوص شيدر', price: 200.00, category: 'dairy'}, {id: '201', name: 'نستو', price: 190.00, category: 'dairy'}, {id: '56', name: 'فيتا سادة نباتى', price: 110.00, category: 'dairy'}, {id: '57', name: 'فيتا فلفل نباتى', price: 110.00, category: 'dairy'}, {id: '53', name: 'ملح خفيف نباتى', price: 110.00, category: 'dairy'}, {id: '153', name: 'ملح خفيف طبيعى', price: 170.00, category: 'dairy'}, {id: '156', name: 'فيتا سادة طبيعى', price: 170.00, category: 'dairy'}, {id: '157', name: 'فيتا فلفل طبيعى', price: 170.00, category: 'dairy'}, {id: '59', name: 'سمنة جاموسى 200 جم', price: 100.00, category: 'multi'}, {id: '60', name: 'سمنة بقرى 200 جم', price: 90.00, category: 'multi'}, {id: '154', name: 'جبنة كيري طبيعى', price: 150.00, category: 'dairy'}, {id: '12', name: 'قشطة بلدى', price: 200.00, category: 'dairy'}, {id: '42', name: 'مورتة وزن', price: 150.00, category: 'dairy'}, {id: '52', name: 'مورتة 300 جم', price: 65.00, category: 'multi'}, {id: '41', name: 'سمنة جاموسى 800 جم', price: 360.00, category: 'multi'}, {id: '43', name: 'سمنة جاموسى 500 جم', price: 230.00, category: 'multi'}, {id: '44', name: 'سمنة بقرى 800 جم', price: 340.00, category: 'multi'}, {id: '45', name: 'سمنةة بقرى 500 جم', price: 220.00, category: 'multi'}, {id: '20', name: 'موزوريلا 900 جم طبيعى', price: 190.00, category: 'multi'}, {id: '21', name: 'موزوريلا 350 جم طبيعى', price: 80.00, category: 'multi'}, {id: '61', name: 'موزوريلا وزن طبيعى', price: 170.00, category: 'multi'}, {id: '39', name: 'ارز فخار', price: 25.00, category: 'multi'}, {id: '40', name: 'زبادى فخار', price: 17.50, category: 'multi'}, {id: '98', name: 'لبنة تركى', price: 150.00, category: 'dairy'}
];

let state = { 
    customers: [], 
    products: [], 
    sales: [], 
    priceLists: [], 
    dispatchNotes: [], 
    reps: [], 
    promotions: [],
    settings: { salesTarget: 10000 },
    stockEntries: {},
    lastSyncTimestamp: null,
    invoiceHighlights: {},
    highlightCounter: 0 
};

// DOM Elements (defined here for wider scope access)
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.bottom-nav-item');
const headerTitle = document.getElementById('header-title');
const reportsSubnav = document.getElementById('reports-subnav');
const loadingModal = document.getElementById('loading-modal');
const customConfirmModal = document.getElementById('custom-confirm-modal');
const dialogTitle = document.getElementById('dialog-title');
const dialogMessage = document.getElementById('dialog-message');
const dialogActions = document.getElementById('dialog-actions');
const dialogConfirmBtn = document.getElementById('dialog-confirm-btn');
const dialogCancelBtn = document.getElementById('dialog-cancel-btn');

// Forms (defined here for wider scope access)
const saleModal = document.getElementById('sale-modal');
const customerModal = document.getElementById('customer-modal');
const repModal = document.getElementById('rep-modal'); 
const productModal = document.getElementById('product-modal');
const priceListModal = document.getElementById('price-list-modal');
const promotionModal = document.getElementById('promotion-modal');
const dateRangeModal = document.getElementById('date-range-modal');
const dispatchNoteModal = document.getElementById('dispatch-note-modal');
const viewDispatchNoteModal = document.getElementById('view-dispatch-note-modal');
const settlementModal = document.getElementById('settlement-modal'); 
const reconciliationModal = document.getElementById('reconciliation-modal');
const repSalesSummaryModal = document.getElementById('rep-sales-summary-modal');
const dailySalesReportModal = document.getElementById('daily-sales-report-modal');
const customerSalesReportModal = document.getElementById('customer-sales-report-modal');
const aiModal = document.getElementById('ai-modal'); 
const loginModal = document.getElementById('login-modal'); // NEW

// Forms References
const saleForm = document.getElementById('sale-form');
const customerForm = document.getElementById('customer-form');
const repForm = document.getElementById('rep-form'); 
const productForm = document.getElementById('product-form');
const priceListForm = document.getElementById('price-list-form');
const promotionForm = document.getElementById('promotion-form');
const dateRangeForm = document.getElementById('date-range-form');
const dispatchNoteForm = document.getElementById('dispatch-note-form');
// const settlementForm = document.getElementById('settlement-form'); // settlement form might not exist

// NEW Authentication Elements
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const logoutBtn = document.getElementById('logout-btn');

// Spreadsheet Entry Elements (defined here for wider scope access)
const spreadsheetRepSelect = document.getElementById('spreadsheet-rep');
const spreadsheetCustomerSelect = document.getElementById('spreadsheet-customer');
const spreadsheetDateInput = document.getElementById('spreadsheet-date');
const spreadsheetEntryBody = document.getElementById('spreadsheet-entry-body');
const spreadsheetAddRowBtn = document.getElementById('spreadsheet-add-row-btn');
const spreadsheetSaveAllBtn = document.getElementById('spreadsheet-save-all-btn');
const unifiedInvoiceNumberInput = document.getElementById('unified-invoice-number'); // Reference to the unified input
const reportsSubnavItems = document.querySelectorAll('.reports-subnav-item');
const dispatchItemsContainer = document.getElementById('dispatch-items-container');

// Report Page Elements
const reportContentAreas = document.querySelectorAll('#page-reports [data-report-content]');
const dailyReportDateInput = document.getElementById('daily-report-date');
const dailyReportRepSelect = document.getElementById('daily-report-rep');
const rangeStartDateInput = document.getElementById('range-start-date');
const rangeEndDateInput = document.getElementById('range-end-date');
const rangeReportRepSelect = document.getElementById('range-report-rep');
const monthlyReportMonthInput = document.getElementById('monthly-report-month');
const monthlyReportRepSelect = document.getElementById('monthly-report-rep');
const reportOutputArea = document.getElementById('report-output-area');

// Chart instances
let sales7DaysChart;
let topRepsChart;
let topProductsChart;
let topCustomersChart;

// Utility Functions
const arabicMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function formatArabicDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatArabicDateTime(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hour}:${minute}`;
}

const formatCurrency = (num) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(num || 0);
const findCustomer = (id) => {
    const sid = id != null ? String(id) : '';
    return state.customers.find(c => String(c.id) === sid || String(c._id) === sid);
};
const findProduct = (id) => {
    const sid = id != null ? String(id) : '';
    return state.products.find(p => String(p.id) === sid) ||
           state.products.find(p => String(p._id) === sid) ||
           state.products.find(p => String(p.sku) === sid);
};
const findPriceList = (id) => state.priceLists.find(pl => pl.id === id);
const findRep = (name) => state.reps.find(r => r.name === name);
const openModal = (modal) => {
    modal.classList.remove('modal-hidden');
    modal.classList.add('modal-visible');
    if (modal.id === 'date-range-modal') {
        // Ensure customers are loaded and then update the list
        // Assuming state.customers is already populated by this point
        updateCustomerList();
    }
}
const closeModal = (modal) => { modal.classList.add('modal-hidden'); modal.classList.remove('modal-visible'); }

// Company logo helpers
function getCompanyLogoUrl() {
    try {
        if (state.settings && state.settings.companyLogo) return state.settings.companyLogo;
        return window.DEFAULT_COMPANY_LOGO_URL || '';
    } catch (e) { return window.DEFAULT_COMPANY_LOGO_URL || ''; }
}
function renderCompanyLogo() {
    try {
        const url = getCompanyLogoUrl();
        const img = document.getElementById('company-logo-img');
        if (!img) return;
        if (url) {
            img.src = url;
            img.style.display = '';
            // also apply watermark for the app using this url
            try { applyWatermark(url); } catch(e) { console.warn('applyWatermark from renderCompanyLogo failed', e); }
        } else {
            img.src = '';
            img.style.display = 'none';
            // remove watermark if exists
            try { applyWatermark(''); } catch(e) { console.warn('remove watermark failed', e); }
        }
    } catch (e) { console.warn('renderCompanyLogo error', e); }
}
// Watermark helper: inject CSS that places the logo as a centered watermark
function applyWatermark(url) {
    try {
        const head = document.head || document.getElementsByTagName('head')[0];
        let style = document.getElementById('company-watermark-style');
        // if no URL provided, remove existing watermark style and return
        if (!url) {
            if (style && style.parentNode) style.parentNode.removeChild(style);
            return;
        }
        const safeUrl = url.replace(/\)/g, '%29');
        const css = `
            #app-container { position: relative; }
            /* Full-screen centered faint watermark covering the viewport */
            #app-container::before {
                content: "";
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 140vmin;
                height: 140vmin;
                background-image: url("${safeUrl}");
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
                opacity: 0.12;
                pointer-events: none;
                z-index: 0;
                filter: saturate(0%) brightness(1.1);
            }
            /* Ensure content stacks above watermark */
            #app-container > * { position: relative; z-index: 1; }
            /* Print: slightly darker watermark and full-page */
            @media print {
                #app-container::before { opacity: 0.15; width: 220vmin; height: 220vmin; background-size: contain; position: fixed; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        `;
        if (!style) {
            style = document.createElement('style');
            style.id = 'company-watermark-style';
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
        } else {
            style.textContent = css;
        }
    } catch (e) {
        console.warn('applyWatermark error', e);
    }
}

// --- Debts Summary Utilities ---
function computeDebtsSummary() {
    // Try state.sales first; fallback to table rows if empty
    const rows = [];
    if (Array.isArray(state.sales) && state.sales.length) {
        state.sales.forEach(s => {
            // Expecting fields: customerName, repName, total, paid, remaining
            const total = Number(s.total || 0);
            const paid = Number(s.paid || 0);
            const remaining = Number(s.remaining != null ? s.remaining : (total - paid));
            rows.push({ customer: s.customerName || s.customer || 'غير معروف', rep: s.repName || s.rep || 'غير معروف', total, paid, remaining });
        });
    } else {
        // Parse any existing rows in the debts table
        const tbody = document.getElementById('debts-detail-body');
        if (tbody) {
            Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
                const tds = tr.querySelectorAll('td');
                if (!tds || tds.length < 7) return;
                const customer = tds[0].textContent.trim();
                const date = tds[1].textContent.trim();
                const invoice = tds[2].textContent.trim();
                const total = Number((tds[3].textContent || '').replace(/[^0-9.-]+/g, '')) || 0;
                const paid = Number((tds[4].textContent || '').replace(/[^0-9.-]+/g, '')) || 0;
                const remaining = Number((tds[5].textContent || '').replace(/[^0-9.-]+/g, '')) || (total - paid);
                const rep = tds[6].textContent.trim() || 'غير معروف';
                rows.push({ customer, rep, total, paid, remaining });
            });
        }
    }

    // Aggregate by customer and by rep
    const byCustomer = {};
    const byRep = {};
    let totalRemaining = 0;
    rows.forEach(r => {
        if (!byCustomer[r.customer]) byCustomer[r.customer] = { total:0, paid:0, remaining:0 };
        if (!byRep[r.rep]) byRep[r.rep] = { total:0, paid:0, remaining:0 };
        byCustomer[r.customer].total += r.total;
        byCustomer[r.customer].paid += r.paid;
        byCustomer[r.customer].remaining += r.remaining;
        byRep[r.rep].total += r.total;
        byRep[r.rep].paid += r.paid;
        byRep[r.rep].remaining += r.remaining;
        totalRemaining += r.remaining;
    });

    return { byCustomer, byRep, totalRemaining };
}

function showDebtsSummaryModal(e) {
    // If called from nav click, allow navigation behavior to occur then open modal after a short delay
    if (e && e.preventDefault) {
        // let normal nav happen (switchPage) but also show modal
    }
    const summary = computeDebtsSummary();

    const custTbody = document.querySelector('#debts-by-customer tbody');
    const repTbody = document.querySelector('#debts-by-rep tbody');
    custTbody.innerHTML = '';
    repTbody.innerHTML = '';

    Object.keys(summary.byCustomer).sort().forEach(name => {
        const item = summary.byCustomer[name];
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="text-right px-2 py-1">${name}</td><td class="text-center px-2 py-1">${formatCurrency(item.total)}</td><td class="text-center px-2 py-1">${formatCurrency(item.paid)}</td><td class="text-center px-2 py-1">${formatCurrency(item.remaining)}</td>`;
        custTbody.appendChild(tr);
    });

    Object.keys(summary.byRep).sort().forEach(name => {
        const item = summary.byRep[name];
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="text-right px-2 py-1">${name}</td><td class="text-center px-2 py-1">${formatCurrency(item.total)}</td><td class="text-center px-2 py-1">${formatCurrency(item.paid)}</td><td class="text-center px-2 py-1">${formatCurrency(item.remaining)}</td>`;
        repTbody.appendChild(tr);
    });

    const totalEl = document.getElementById('debts-summary-total');
    if (totalEl) totalEl.textContent = formatCurrency(summary.totalRemaining);

    openModal(document.getElementById('debts-summary-modal'));
}

// Remove auto-popup behavior per user request
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('debts-nav-btn');
    if (btn) {
        // Only handle navigation, no auto-popup
        btn.addEventListener('click', function(ev) {
            // Default navigation behavior only
        });
    }
});

// --- NEW: Manual Review Highlighting Functions ---
const REVIEW_COLORS = ['highlight-blue', 'highlight-green', 'highlight-purple', 'highlight-orange', 'highlight-teal'];
const LOCAL_REVIEW_KEY = 'mandoobi_review_state';

function loadReviewState() {
    try {
        const savedState = localStorage.getItem(LOCAL_REVIEW_KEY);
        return savedState ? JSON.parse(savedState) : {};
    } catch (e) {
        console.error("Failed to load review state:", e);
        return {};
    }
}

function saveReviewState(reviewState) {
    try {
        localStorage.setItem(LOCAL_REVIEW_KEY, JSON.stringify(reviewState));
    } catch (e) {
        console.error("Failed to save review state:", e);
    }
}

function toggleReviewColor(saleId, element) {
    const reviewState = loadReviewState();
    const existingColor = reviewState[saleId];

    // Remove all palette colors from the element to start fresh.
    element.classList.remove(...REVIEW_COLORS);

    if (existingColor) {
        // If it was already colored, just remove it from the state.
        delete reviewState[saleId];
    } else {
        // If it's a new item to color, use the global counter.
        // Ensure the counter is a number.
        if (typeof state.highlightCounter !== 'number') {
            state.highlightCounter = 0;
        }
        
        const colorIndex = state.highlightCounter % REVIEW_COLORS.length;
        const nextColor = REVIEW_COLORS[colorIndex];
        
        // Store the class name in the review state.
        reviewState[saleId] = nextColor;
        element.classList.add(nextColor);
        
        // Increment the main state's counter for the next new item.
        state.highlightCounter++;
    }
    
    saveReviewState(reviewState); // Saves the color mapping {saleId: 'class-name'}
    saveState(); // Saves the main state, including the incremented counter
}


// --- All Function Definitions START ---

function updateIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function customDialog({ message, title = 'إشعار', isConfirm = false, confirmText = 'تأكيد', confirmClass = 'bg-blue-600 hover:bg-blue-700' }) {
     return new Promise(resolve => {
        let confirmBtn = document.getElementById('dialog-confirm-btn');
        let cancelBtn = document.getElementById('dialog-cancel-btn');

        if (!dialogTitle || !dialogMessage || !confirmBtn || !cancelBtn) {
            console.error("Custom dialog elements are missing in the DOM.");
            setTimeout(() => resolve(isConfirm ? false : true), 10);
            return;
        }
        
        dialogTitle.textContent = title;
        dialogMessage.textContent = message;
        
        confirmBtn.textContent = confirmText;
        confirmBtn.className = `flex-1 text-white px-4 py-2 rounded-lg font-semibold ${confirmClass}`;
        
        dialogActions.classList.toggle('justify-between', isConfirm);
        dialogActions.classList.toggle('justify-center', !isConfirm);
        cancelBtn.classList.toggle('hidden', !isConfirm);
        cancelBtn.textContent = 'إلغاء';

        const oldConfirmBtn = confirmBtn;
        const newConfirmBtn = oldConfirmBtn.cloneNode(true);
        if (oldConfirmBtn.parentNode) {
            oldConfirmBtn.parentNode.replaceChild(newConfirmBtn, oldConfirmBtn);
        }
        
        const oldCancelBtn = cancelBtn;
        const newCancelBtn = oldCancelBtn.cloneNode(true);
        if (oldCancelBtn.parentNode) {
            oldCancelBtn.parentNode.replaceChild(newCancelBtn, oldCancelBtn);
        }
        
        newConfirmBtn.addEventListener('click', () => {
            closeModal(customConfirmModal);
            resolve(true);
        }, { once: true });

        if (isConfirm) {
            newCancelBtn.addEventListener('click', () => {
                closeModal(customConfirmModal);
                resolve(false);
            }, { once: true });
        }
        
        openModal(customConfirmModal);
    });
}

function populateRepDropdown(selectEl, selectedRepName = '') {
    if (!selectEl) return;
    let repNames = (state.reps||[]).map(r => r.name).filter(n => !!n);
    const prev = selectedRepName || selectEl.value;
    // تخصيص زر الإدخال السريع ليظهر فقط اسم المندوب الحالي إذا لم يكن أدمن
    if (selectEl.id === 'spreadsheet-rep') {
        let role = typeof getUserRole === 'function' ? getUserRole() : 'rep';
        let currentEmail = (window.auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : null;
        if (role === 'rep' && currentEmail) {
            // ابحث عن اسم المندوب المرتبط بهذا الإيميل
            const currentRep = (state.reps||[]).find(r => (r.email||'').toLowerCase() === currentEmail);
            if (currentRep) {
                repNames = [currentRep.name];
            } else {
                repNames = [];
            }
        }
    }
    let html = '<option value="">-- جميع المناديب --</option>';
    html += repNames.map(name => `<option value="${name}" ${name === prev ? 'selected' : ''}>${name}</option>`).join('');
    selectEl.innerHTML = html;
    // Restore previous selection if still present
    if (prev && repNames.includes(prev)) selectEl.value = prev;
}

function populateRepDropdownReports(selectEl, selectedRepName = '') {
    const repNames = state.reps.map(r => r.name);
    selectEl.innerHTML = '<option value="all">-- كل المناديب --</option>' + repNames.map(name => 
        `<option value="${name}" ${name === selectedRepName ? 'selected' : ''}>${name}</option>`
    ).join('');
}

// Helper: العثور على مندوب بالاسم أو المعرّف (تجنّب تكرار التعريف)
if (typeof window.findRep !== 'function') {
    window.findRep = function(name){
        try { return (state.reps||[]).find(r => r.name === name || r.id === name) || null; } catch(e){ return null; }
    };
}

// ===== تصحيح مشاكل توقف التطبيق بسبب دوال ناقصة من الكود القديم =====
// تهيئة آمنة للحالة العامة إن لم تكن موجودة
window.state = window.state || {};

// تعريف DEFAULT_PRODUCTS فارغ لتفادي أخطاء ensureFinishedFromState
if (typeof window.DEFAULT_PRODUCTS === 'undefined') window.DEFAULT_PRODUCTS = [];

// دالة تنسيق عملة بسيطة (جنيه مصري أو رقم مجرد)
if (typeof window.formatCurrency !== 'function') {
    window.formatCurrency = function(v){
        try { return Number(v||0).toLocaleString('ar-EG', { minimumFractionDigits: 0 }); } catch(e){ return String(v||'0'); }
    };
}

// البحث عن عميل حسب المعرّف
if (typeof window.findCustomer !== 'function') {
    window.findCustomer = function(id){
        try { return (state.customers||[]).find(c => (c.id||c._id) === id) || null; } catch(e){ return null; }
    };
}

// دالة بديلة قديمة كانت تستعمل للاسم updateCustomerList — نجعلها تستدعي renderCustomerList
if (typeof window.updateCustomerList !== 'function') {
    window.updateCustomerList = function(filter, chain){
        try { if (typeof renderCustomerList === 'function') renderCustomerList(filter||''); } catch(e){ console.warn('updateCustomerList stub failed', e); }
    };
}

function updatePromotionOriginalPriceDisplay(productId) {
     const product = findProduct(productId);
     const displayEl = document.getElementById('original-price-display');
     const priceEl = document.getElementById('current-product-price');
     if (product) {
         priceEl.textContent = formatCurrency(product.price);
         displayEl.classList.remove('hidden');
     } else {
         displayEl.classList.add('hidden');
     }
}



function getActivePromotionPrice(productId, customerId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const relevantOffers = state.promotions.filter(p => p.productId === productId);
    let activeOffer = relevantOffers.find(p => {
        const isTargetingThisCustomer = p.customerId === customerId;
        if (!isTargetingThisCustomer) return false;
        const startDate = new Date(p.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(p.endDate);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
    });
    if (!activeOffer) {
        activeOffer = relevantOffers.find(p => {
            const isTargetingAll = !p.customerId;
            if (!isTargetingAll) return false;
            const startDate = new Date(p.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(p.endDate);
            endDate.setHours(23, 59, 59, 999);
            return today >= startDate && today <= endDate;
        });
    }
    return activeOffer ? activeOffer.price : null;
}

const supermarketChains = {
    exception: ["اكسبشن ماركت"],
    awladragab: ["اولاد رجب"],
    samysalama: ["سامي سلامه"],
    gomlamarket: ["جملة ماركت"],
    dreams: ["دريمز فرع 1", "دريمز فرع 2"]
};

const updateCustomerList = (filter = '', chain = 'all') => {
     const statementCustomerList = document.getElementById('statement-customer-list');
     if (!statementCustomerList) return;
     statementCustomerList.innerHTML = '';

     console.log('updateCustomerList called with:', { filter, chain });
     console.log('Initial state.customers:', state.customers);

     let filteredCustomers = state.customers;
     const allChains = loadChains();

     if (chain !== 'all' && supermarketChains[chain]) {
         const branches = supermarketChains[chain];
         console.log('Filtering by chain. Branches:', branches);
         filteredCustomers = filteredCustomers.filter(c => {
             const match = branches.some(branch => c.name.toLowerCase().includes(branch.toLowerCase()));
             // console.log(`Customer: ${c.name}, Branch: ${branches}, Match: ${match}`);
             return match;
         });
         console.log('Customers after chain filter:', filteredCustomers);
     }

     if (filter) {
         filteredCustomers = filteredCustomers.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
         console.log('Customers after text filter:', filteredCustomers);
     }

     if (filteredCustomers.length === 0) {
         const el = document.createElement('label');
         el.className = 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md';
         el.innerHTML = `
              <span class="text-sm text-red-500">لا توجد نتائج مطابقة.</span>
         `;
         statementCustomerList.appendChild(el);
     } else {
         filteredCustomers.forEach(customer => {
             const el = document.createElement('label');
             el.className = 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md';
             el.innerHTML = `
                  <input type="checkbox" value="${customer.id}" class="rounded text-blue-600 focus:ring-blue-500 ml-1">
                  <span class="text-sm">${customer.name}</span>
             `;
             statementCustomerList.appendChild(el);
         });
         
         // Add chains as options
         if (allChains.length > 0) {
             allChains.forEach(chain => {
                 const el = document.createElement('label');
                 el.className = 'flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded-md bg-blue-50';
                 el.innerHTML = `
                      <input type="checkbox" value="chain-${chain.id}" class="rounded text-blue-600 focus:ring-blue-500 ml-1">
                      <span class="text-sm font-medium">[سلسلة] ${chain.name}</span>
                 `;
                 statementCustomerList.appendChild(el);
             });
         }
     }
};

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for the new select
    const supermarketChainFilter = document.getElementById('supermarket-chain-filter');
    if(supermarketChainFilter) {
        supermarketChainFilter.addEventListener('change', (e) => {
            const chain = e.target.value;
            const filter = document.getElementById('statement-customer-search').value;
            updateCustomerList(filter, chain);
        });
    }

    // Modify the existing event listener for the search input
    const statementCustomerSearch = document.getElementById('statement-customer-search');
    if(statementCustomerSearch){
        statementCustomerSearch.addEventListener('input', (e) => {
            const filter = e.target.value;
            const chain = document.getElementById('supermarket-chain-filter') ? document.getElementById('supermarket-chain-filter').value : 'all';
            
            // Also filter chains by search text
            const statementCustomerList = document.getElementById('statement-customer-list');
            if (!statementCustomerList) return;
            
            // Re-build list with search filter for chains too
            let filteredCustomers = state.customers;
            const allChains = loadChains();
            
            if (chain !== 'all' && supermarketChains[chain]) {
                const branches = supermarketChains[chain];
                filteredCustomers = filteredCustomers.filter(c => {
                    const match = branches.some(branch => c.name.toLowerCase().includes(branch.toLowerCase()));
                    return match;
                });
            }
            
            if (filter) {
                filteredCustomers = filteredCustomers.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
            }
            
            statementCustomerList.innerHTML = '';
            
            if (filteredCustomers.length === 0 && (!filter || filter.length === 0)) {
                const el = document.createElement('label');
                el.className = 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md';
                el.innerHTML = '<span class="text-sm text-red-500">لا توجد نتائج مطابقة.</span>';
                statementCustomerList.appendChild(el);
            } else {
                filteredCustomers.forEach(customer => {
                    const el = document.createElement('label');
                    el.className = 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded-md';
                    el.innerHTML = `
                         <input type="checkbox" value="${customer.id}" class="rounded text-blue-600 focus:ring-blue-500 ml-1">
                         <span class="text-sm">${customer.name}</span>
                    `;
                    statementCustomerList.appendChild(el);
                });
                
                // Add filtered chains
                if (allChains.length > 0 && (!filter || filter.length === 0)) {
                    allChains.forEach(chain => {
                        const el = document.createElement('label');
                        el.className = 'flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded-md bg-blue-50';
                        el.innerHTML = `
                             <input type="checkbox" value="chain-${chain.id}" class="rounded text-blue-600 focus:ring-blue-500 ml-1">
                             <span class="text-sm font-medium">[سلسلة] ${chain.name}</span>
                        `;
                        statementCustomerList.appendChild(el);
                    });
                } else if (allChains.length > 0 && filter) {
                    // Show chains that match the search
                    const filteredChains = allChains.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
                    filteredChains.forEach(chain => {
                        const el = document.createElement('label');
                        el.className = 'flex items-center gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded-md bg-blue-50';
                        el.innerHTML = `
                             <input type="checkbox" value="chain-${chain.id}" class="rounded text-blue-600 focus:ring-blue-500 ml-1">
                             <span class="text-sm font-medium">[سلسلة] ${chain.name}</span>
                        `;
                        statementCustomerList.appendChild(el);
                    });
                }
            }
        });
    }
});

// +++ NEW FUNCTIONS FOR DETAILED SALE MODAL +++

function populateProductDropdown(selectEl, selectedId = '') {
    selectEl.innerHTML = '<option value="">-- اختر منتج --</option>' + state.products.map(p => 
        `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name} (${p.id})</option>`
    ).join('');
}

// تحديث أسعار جميع بنود المبيعات عند تغيير العروض (لاستعادة السعر الأصلي عند انتهاء فترة العرض)
function updateAllSalePrices() {
    const container = document.getElementById('sale-items-container');
    if (!container) return;
    
    container.querySelectorAll('.sale-item-row').forEach(row => {
        const productSelect = row.querySelector('.sale-item-product');
        const quantity = parseInt(row.querySelector('.sale-item-quantity').value) || 0;
        const priceInput = row.querySelector('.sale-item-price');
        const totalDisplay = row.querySelector('.sale-item-total-display');
        
        const productId = productSelect.value;
        const customerId = document.getElementById('sale-customer')?.value || '';
        let price = 0;

        if (productId) {
            const product = findProduct(productId);
            let basePrice = product ? product.price : 0;

            // Check price list
            if (customerId) {
                const customer = findCustomer(customerId);
                if (customer && customer.priceListId) {
                    const priceList = findPriceList(customer.priceListId);
                    if (priceList && priceList.productPrices[productId] !== undefined) {
                        basePrice = priceList.productPrices[productId];
                    }
                }
            }
            
            // Check promotion - هذا سيعيد null إذا انتهت فترة العرض
            const promotionPrice = getActivePromotionPrice(productId, customerId);
            price = (promotionPrice !== null) ? promotionPrice : basePrice;
        }

        priceInput.value = price.toFixed(2);
        const itemTotal = quantity * price;
        totalDisplay.textContent = formatCurrency(itemTotal);
    });
    
    updateSaleSummary();
}

function addSaleItemRow(item = {}) {
    const container = document.getElementById('sale-items-container');
    const row = document.createElement('tr');
    row.className = 'sale-item-row';
    row.innerHTML = `
        <td class="px-4 py-2"><select class="sale-item-product w-full p-2 border rounded-md" required>${state.products.length > 0 ? '' : '<option>لا توجد منتجات</option>'}</select></td>
        <td class="px-4 py-2"><input class="sale-item-quantity p-2 border rounded-md text-center" type="number" value="${(item.quantity != null && item.quantity !== undefined && item.quantity !== '') ? item.quantity : ''}" placeholder="0"></td>
        <td class="px-4 py-2"><input class="sale-item-price p-2 border rounded-md text-center bg-gray-100" type="number" value="${item.price || 0}" readonly></td>
        <td class="px-4 py-2"><span class="sale-item-total-display font-semibold">0 ج.م</span></td>
        <td class="px-2 py-2 text-center"><button type="button" class="delete-sale-item-btn text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-5 h-5"></i></button></td>
    `;

    const productSelect = row.querySelector('.sale-item-product');
    populateProductDropdown(productSelect, item.productId || '');
    
    container.appendChild(row);
    updateIcons();

    // Function to update row price and total
    const updateRow = () => {
        const productId = productSelect.value;
        const quantity = parseInt(row.querySelector('.sale-item-quantity').value) || 0;
        const priceInput = row.querySelector('.sale-item-price');
        const totalDisplay = row.querySelector('.sale-item-total-display');
        
        const customerId = document.getElementById('sale-customer').value;
        let price = 0;

        if (productId) {
            const product = findProduct(productId);
            let basePrice = product ? product.price : 0;

            // Check price list
            if (customerId) {
                const customer = findCustomer(customerId);
                if (customer && customer.priceListId) {
                    const priceList = findPriceList(customer.priceListId);
                    if (priceList && priceList.productPrices[productId] !== undefined) {
                        basePrice = priceList.productPrices[productId];
                    }
                }
            }
            
            // Check promotion
            const promotionPrice = getActivePromotionPrice(productId, customerId);
            price = (promotionPrice !== null) ? promotionPrice : basePrice;
            try {
                if (product && /قريش|قريش/i.test(product.name)) {
                    const customer = customerId ? findCustomer(customerId) : null;
                    const priceList = (customer && customer.priceListId) ? findPriceList(customer.priceListId) : null;
                    const listOverride = priceList ? priceList.productPrices[productId] : undefined;
                    console.debug('DEBUG Pricing (sale modal row)', {
                        productId,
                        productName: product ? product.name : '',
                        basePrice: (product ? product.price : 0),
                        priceListId: customer ? customer.priceListId : '',
                        priceListOverride: listOverride,
                        promotionPrice,
                        finalPrice: price
                    });
                }
            } catch(_){ }
        }

        priceInput.value = price.toFixed(2);
        const itemTotal = quantity * price;
        totalDisplay.textContent = formatCurrency(itemTotal);
        updateSaleSummary(); // Update grand total
    };

    // Add event listeners
    productSelect.addEventListener('change', updateRow);
    row.querySelector('.sale-item-quantity').addEventListener('input', updateRow);
    row.querySelector('.delete-sale-item-btn').addEventListener('click', () => {
        row.remove();
        updateSaleSummary();
    });

    // Add listener to customer dropdown to update all item prices if customer changes
    document.getElementById('sale-customer').addEventListener('change', updateRow);

    updateRow(); // Initial call to set price/total
}

function updateSaleSummary() {
    // Subtotal (sum of line price * qty)
    let subtotal = 0;
    const rows = Array.from(document.querySelectorAll('#sale-items-container .sale-item-row'));
    rows.forEach(row => {
        const quantity = parseFloat(row.querySelector('.sale-item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.sale-item-price').value) || 0;
        subtotal += quantity * price;
    });

    const discountPercent = parseFloat(document.getElementById('sale-discount').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const additionPercent = parseFloat(document.getElementById('sale-addition')?.value) || 0;
    const additionAmount = subtotal * (additionPercent / 100);

    // Taxable base after discount and addition (addition is applied as in UI)
    const taxableSubtotal = subtotal - discountAmount + additionAmount;

    // Compute VAT per line using each product's vat_rate (percentage expressed as fraction)
    let vatTotal = 0;
    try {
        rows.forEach(row => {
            const productId = row.querySelector('.sale-item-product')?.value;
            const quantity = parseFloat(row.querySelector('.sale-item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.sale-item-price').value) || 0;
            const product = productId ? findProduct(productId) : null;
            const vatRate = (product && product.vat_rate) ? Number(product.vat_rate) / 100 : 0;
            // apply global discount proportionally on each line for VAT base
            const lineBaseAfterDiscount = quantity * price * (1 - (discountPercent/100));
            const lineVat = lineBaseAfterDiscount * vatRate;
            vatTotal += lineVat;
        });
    } catch(e){ console.warn('VAT calc error', e); }

    // Withholding: 1% of taxable subtotal if customer has taxNumber
    let withholding = 0;
    try {
        const customerId = document.getElementById('sale-customer')?.value;
        const customer = customerId ? findCustomer(customerId) : null;
        if (customer && (customer.taxNumber || customer.taxNumber === 0 || customer.taxNumber === '')) {
            // treat non-empty taxNumber as tax-entity
            if (customer.taxNumber && String(customer.taxNumber).trim().length) {
                withholding = round2(taxableSubtotal * 0.01);
            }
        }
    } catch(e){ console.warn('withholding calc error', e); }

    const totalBeforeWithholding = round2(taxableSubtotal + round2(vatTotal));
    const finalPayable = round2(totalBeforeWithholding - withholding);

    // Update UI
    document.getElementById('sale-subtotal-text').textContent = formatCurrency(round2(subtotal));
    document.getElementById('sale-discount-text').textContent = formatCurrency(round2(discountAmount));
    // add/update addition line
    let additionLine = document.getElementById('sale-addition-line');
    if (!additionLine) {
        const summary = document.getElementById('sale-summary');
        if (summary) {
            additionLine = document.createElement('div');
            additionLine.id = 'sale-addition-line';
            additionLine.className = 'flex justify-between text-green-600';
            additionLine.innerHTML = '<span>الإضافة:</span><span id="sale-addition-text">0 ج.م</span>';
            const discountLine = document.getElementById('sale-discount-text')?.parentElement;
            if (discountLine) discountLine.insertAdjacentElement('afterend', additionLine);
            else summary.insertBefore(additionLine, summary.querySelector('hr'));
        }
    }
    const additionTextEl = document.getElementById('sale-addition-text');
    if (additionTextEl) additionTextEl.textContent = formatCurrency(round2(additionAmount));

    const vatEl = document.getElementById('sale-vat-text'); if (vatEl) vatEl.textContent = formatCurrency(round2(vatTotal));
    const withEl = document.getElementById('sale-withholding-text'); if (withEl) withEl.textContent = formatCurrency(round2(withholding));
    const finalEl = document.getElementById('sale-final-text'); if (finalEl) finalEl.textContent = formatCurrency(finalPayable);
    // keep legacy total display (before withholding) for compatibility
    document.getElementById('sale-total-text').textContent = formatCurrency(totalBeforeWithholding);

    // Update paid amount based on status
    const statusSelect = document.getElementById('sale-status');
    const paidAmountContainer = document.getElementById('paid-amount-container');
    const paidAmountInput = document.getElementById('sale-paid-amount');
    
    if (statusSelect.value === 'paid') {
        paidAmountInput.value = finalPayable.toFixed(2);
        paidAmountContainer.classList.add('hidden');
    } else if (statusSelect.value === 'due') {
        paidAmountInput.value = 0;
        paidAmountContainer.classList.add('hidden');
    } else { // partial
        paidAmountContainer.classList.remove('hidden');
    }
}

function openSaleModal(id = null) {
    saleForm.reset();
    document.getElementById('sale-items-container').innerHTML = '';
    populateRepDropdown(document.getElementById('sale-rep'));
    populateCustomerDropdown(document.getElementById('sale-customer'));
    // elements for toggling editable selects vs readonly displays
    const repSelectEl = document.getElementById('sale-rep');
    const custSelectEl = document.getElementById('sale-customer');
    const repDisplayEl = document.getElementById('sale-rep-display');
    const custDisplayEl = document.getElementById('sale-customer-display');
    
    const paidAmountContainer = document.getElementById('paid-amount-container');
    const statusSelect = document.getElementById('sale-status');
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';

    if (id) {
        // Edit Mode
        const sale = state.sales.find(s => s.id === id);
        if (!sale) {
            customDialog({ message: 'لم يتم العثور على الفاتورة.', title: 'خطأ' });
            return;
        }
        document.getElementById('sale-modal-title').textContent = `تعديل فاتورة رقم: ${sale.invoiceNumber}`;
        document.getElementById('sale-id').value = sale.id;
        // keep selects populated for internal logic but show readonly displays to prevent edits
        try { if (repSelectEl) repSelectEl.value = sale.repName; } catch(e){}
        try { if (custSelectEl) custSelectEl.value = sale.customerId; } catch(e){}
        try { if (repDisplayEl) { repDisplayEl.value = sale.repName || ''; repDisplayEl.style.display = 'block'; } } catch(e){}
        try { if (custDisplayEl) { custDisplayEl.value = (typeof findCustomer === 'function' ? (findCustomer(sale.customerId)?.name || '') : (sale.customerName || '')) ; custDisplayEl.style.display = 'block'; } } catch(e){}
        try { if (repSelectEl) repSelectEl.style.display = 'none'; } catch(e){}
        try { if (custSelectEl) custSelectEl.style.display = 'none'; } catch(e){}
        document.getElementById('sale-date').value = new Date(sale.date).toISOString().split('T')[0];
        document.getElementById('sale-invoice-number').value = sale.invoiceNumber;
        document.getElementById('sale-notes').value = sale.notes || '';
        document.getElementById('sale-discount').value = sale.discount || 0;
        document.getElementById('sale-addition').value = sale.additionPercent || sale.addition || 0;
        
        statusSelect.value = sale.status;
        if (sale.status === 'partial') {
            paidAmountContainer.classList.remove('hidden');
            document.getElementById('sale-paid-amount').value = (((sale.paidAmount !== null && sale.paidAmount !== undefined) ? sale.paidAmount : (((sale.firstPayment ? sale.firstPayment : 0) + (sale.secondPayment ? sale.secondPayment : 0)))));
        } else {
            paidAmountContainer.classList.add('hidden');
        }

        sale.items.forEach(item => addSaleItemRow(item));

        // Show ETA upload button for admin only in edit mode
        try {
            const etaBtn = document.getElementById('eta-upload-from-modal-btn');
            if (etaBtn) {
                if (role === 'admin') {
                    etaBtn.classList.remove('hidden');
                    etaBtn.dataset.id = sale.id;
                    // Remove previous listener if any
                    const newBtn = etaBtn.cloneNode(true);
                    etaBtn.parentNode.replaceChild(newBtn, etaBtn);
                    newBtn.addEventListener('click', async ()=>{
                        try { await window.uploadSaleToEta(sale.id); } catch(e){ console.warn('modal eta upload failed', e); }
                    });
                    updateIcons();
                } else {
                    etaBtn.classList.add('hidden');
                }
            }
        } catch(_){ }

        // إن كان المستخدم مندوباً، تحكم في الصلاحيات بناءً على وقت الفاتورة
        if (role === 'rep') {
            try {
                // حساب عمر الفاتورة
                let createdTime = null;
                if (sale && sale.createdAt) {
                    if (typeof sale.createdAt.toDate === 'function') {
                        createdTime = sale.createdAt.toDate();
                    } else {
                        createdTime = new Date(sale.createdAt);
                    }
                }
                
                const ageMs = createdTime ? (Date.now() - createdTime.getTime()) : Infinity;
                const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
                const isWithinEditWindow = ageMs <= EDIT_WINDOW_MS;
                
                const form = document.getElementById('sale-form');
                const title = document.getElementById('sale-modal-title');
                
                if (isWithinEditWindow) {
                    // السماح بالتعديل خلال 15 دقيقة
                    const remainingMinutes = Math.ceil((EDIT_WINDOW_MS - ageMs) / 60000);
                    if (title) {
                        title.textContent = `${title.textContent} (متبقي: ${remainingMinutes} دقيقة للتعديل)`;
                    }
                    
                    // تفعيل الحقول والأزرار للتعديل
                    form.querySelectorAll('input, select, textarea').forEach(el => {
                        el.disabled = false;
                        el.classList.remove('opacity-70', 'cursor-not-allowed', 'bg-gray-100');
                    });
                    
                    // تفعيل الأزرار (إضافة، حذف، حفظ)
                    form.querySelectorAll('button').forEach(el => {
                        if (el.id === 'add-sale-item-btn') {
                            el.style.display = 'inline-block';
                            el.disabled = false;
                            return;
                        }
                        if (el.className.includes('remove-item-btn')) {
                            el.style.display = 'inline-block';
                            el.disabled = false;
                            return;
                        }
                        if (el.id === 'cancel-sale-btn') {
                            el.disabled = false;
                            return;
                        }
                        if (el.type === 'submit') {
                            el.disabled = false;
                            el.classList.remove('opacity-50', 'cursor-not-allowed');
                        }
                    });
                    
                    // تفعيل زر الحفظ في footer
                    const submitBtn = document.querySelector('footer [type="submit"][form="sale-form"]');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                } else {
                    // تعطيل التعديل بعد 15 دقيقة (عرض فقط)
                    if (title) {
                        title.textContent = `[عرض فقط - انتهت المهلة] ${title.textContent}`;
                    }
                    
                    // تعطيل جميع الحقول
                    form.querySelectorAll('input, select, textarea').forEach(el => {
                        el.disabled = true;
                        el.classList.add('opacity-70', 'cursor-not-allowed', 'bg-gray-100');
                    });
                    
                    // تعطيل جميع الأزرار ما عدا الإلغاء
                    form.querySelectorAll('button').forEach(el => {
                        if (el.id === 'cancel-sale-btn') {
                            el.disabled = false;
                            return;
                        }
                        if (el.id === 'add-sale-item-btn') {
                            el.style.display = 'none';
                            return;
                        }
                        if (el.className.includes('remove-item-btn')) {
                            el.style.display = 'none';
                            return;
                        }
                        el.disabled = true;
                        el.classList.add('opacity-50', 'cursor-not-allowed');
                    });
                    
                    // تعطيل زر الحفظ
                    const submitBtn = document.querySelector('footer [type="submit"][form="sale-form"]');
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                }
            } catch(err) {
                console.warn('Error handling rep edit window:', err);
            }
        }
        
    } else {
        // Add Mode (User doesn't want this, but the function needs to support it)
        document.getElementById('sale-modal-title').textContent = 'إضافة عملية بيع';
        document.getElementById('sale-id').value = '';
        document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
        // ensure selects are visible for creating a new sale
        try { if (repSelectEl) repSelectEl.style.display = 'block'; } catch(e){}
        try { if (custSelectEl) custSelectEl.style.display = 'block'; } catch(e){}
        try { if (repDisplayEl) repDisplayEl.style.display = 'none'; } catch(e){}
        try { if (custDisplayEl) custDisplayEl.style.display = 'none'; } catch(e){}
        statusSelect.value = 'paid';
        paidAmountContainer.classList.add('hidden');
        addSaleItemRow(); // Add one empty row
        try { const etaBtn = document.getElementById('eta-upload-from-modal-btn'); if (etaBtn) etaBtn.classList.add('hidden'); } catch(_){ }
    }
    
    updateSaleSummary();
    openModal(saleModal);
}

async function saveSale(e) {
    e.preventDefault();
    const id = document.getElementById('sale-id').value;
    const repName = document.getElementById('sale-rep').value;
    const customerId = document.getElementById('sale-customer').value;
    const date = document.getElementById('sale-date').value;
    const invoiceNumber = document.getElementById('sale-invoice-number').value;

    if (!repName || !customerId || !date || !invoiceNumber) {
        await customDialog({ message: 'الرجاء ملء بيانات المندوب، العميل، التاريخ، ورقم الفاتورة.', title: 'بيانات ناقصة' });
        return;
    }

    const items = [];
    let subtotal = 0;
    const itemRows = document.querySelectorAll('#sale-items-container .sale-item-row');
    if (itemRows.length === 0) {
        await customDialog({ message: 'الرجاء إضافة منتج واحد على الأقل للفاتورة.', title: 'بيانات ناقصة' });
        return;
    }
    
    let saleNeedsReview = false;
    for (const row of itemRows) {
        const productId = row.querySelector('.sale-item-product').value;
        const quantity = parseInt(row.querySelector('.sale-item-quantity').value);
        const price = parseFloat(row.querySelector('.sale-item-price').value);
        
        // Check quantity for zero, but allow negative for returns
        if (!productId || isNaN(quantity) || quantity === 0 || isNaN(price)) {
            await customDialog({ message: 'أحد المنتجات في الفاتورة به بيانات غير صحيحة (الكمية يجب أن تكون رقم غير صفري).', title: 'بيانات ناقصة' });
            return;
        }
        
        const itemTotal = quantity * price;
        // Determine expected/base price for this product (consider customer-specific price lists and promotions)
        try {
            const prod = findProduct(productId) || {};
            let expectedPrice = (prod.price != null) ? Number(prod.price) : 0;
            try {
                const customer = findCustomer(customerId);
                if (customer && customer.priceListId) {
                    const pl = findPriceList(customer.priceListId);
                    if (pl && pl.productPrices && pl.productPrices[productId] !== undefined) expectedPrice = Number(pl.productPrices[productId]);
                }
            } catch(_){ }
            try {
                const promoPrice = getActivePromotionPrice(productId, customerId);
                if (promoPrice !== null && promoPrice !== undefined) expectedPrice = Number(promoPrice);
            } catch(_){ }

            const isAdjusted = Math.abs((Number(price) || 0) - (Number(expectedPrice) || 0)) > 0.005;
            if (isAdjusted) saleNeedsReview = true;
            items.push({ productId, quantity, price, itemTotal, adjusted: isAdjusted, expectedPrice }); // store adjusted flag and expected price
        } catch(e){
            items.push({ productId, quantity, price, itemTotal, adjusted: false });
        }
        subtotal += itemTotal;
    }
    
    const discountPercent = parseFloat(document.getElementById('sale-discount').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const additionPercent = parseFloat(document.getElementById('sale-addition').value) || 0;
    const additionAmount = subtotal * (additionPercent / 100);
    const finalTotal = subtotal - discountAmount + additionAmount;

    // Compute VAT and withholding so they are persisted with the sale
    const taxableSubtotal = subtotal - discountAmount + additionAmount;
    let vatTotal = 0;
    try {
        items.forEach(i => {
            try {
                const prod = findProduct(i.productId) || {};
                const vatRate = (prod && prod.vat_rate) ? Number(prod.vat_rate) / 100 : 0;
                const lineBaseAfterDiscount = (Number(i.quantity) || 0) * (Number(i.price) || 0) * (1 - (discountPercent/100));
                vatTotal += lineBaseAfterDiscount * vatRate;
            } catch(e){ /* ignore line errors */ }
        });
    } catch(e){ console.warn('VAT compute failed', e); }
    vatTotal = round2(vatTotal);

    let withholding = 0;
    try {
        const customer = customerId ? findCustomer(customerId) : null;
        if (customer && customer.taxNumber && String(customer.taxNumber).trim().length) {
            withholding = round2(taxableSubtotal * 0.01);
        }
    } catch(e){ console.warn('withholding compute failed', e); }
    
    let status = document.getElementById('sale-status').value;
    let paidAmount = 0;
    
    // If it's a return, paid amount calculation is irrelevant/complex, stick to zero unless manually entered for simplicity
    if (finalTotal < 0) {
        status = 'due'; // Returns are usually 'due' (company owes customer) or simply tracked as returns
        paidAmount = 0;
    } else if (status === 'paid') {
        paidAmount = finalTotal;
    } else if (status === 'due') {
        paidAmount = 0;
    } else { // partial
        paidAmount = parseFloat(document.getElementById('sale-paid-amount').value) || 0;
        if (paidAmount >= finalTotal) {
            await customDialog({ message: 'المبلغ المدفوع جزئياً يساوي أو أكبر من الإجمالي. سيتم اعتبار الفاتورة "مدفوعة بالكامل".', title: 'تنبيه' });
            status = 'paid';
            paidAmount = finalTotal;
        }
    }

    const saleData = {
        id: id || db.collection('sales').doc().id, // Generate Firestore ID if new
        date: new Date(date + 'T12:00:00Z').toISOString(),
        createdAt: id ? (state.sales.find(s=>s.id === id).createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        repName: repName,
        customerId: customerId,
        invoiceNumber: parseInt(invoiceNumber),
        items: items.map(i => ({...i, discountPercent: 0})), // Simplified, spreadsheet saves discount per item
        subtotal: round2(subtotal),
        total: finalTotal,
        taxAmount: vatTotal,
        withholdingAmount: withholding,
        status: status,
        paidAmount: paidAmount,
        discount: discountPercent,
        additionPercent: additionPercent,
        notes: document.getElementById('sale-notes').value.trim(),
        taxFilingStatus: id ? (state.sales.find(s=>s.id === id).taxFilingStatus || '') : '' // Preserve tax status on edit
    };

    // If any item was marked adjusted, set reviewStatus to 'pending' so admin/reviewer can approve.
    try {
        if (saleNeedsReview) {
            saleData.reviewStatus = 'pending';
            saleData.reviewReason = 'adjusted';
            try { saleData.reviewRequestedBy = (auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : null; } catch(_){ }
            saleData.reviewRequestedAt = new Date().toISOString();
        } else {
            // preserve existing reviewStatus if editing
            if (id) {
                const existing = state.sales.find(s=>s.id===id);
                if (existing && existing.reviewStatus) saleData.reviewStatus = existing.reviewStatus;
            }
        }
    } catch(e){ console.warn('Setting review flag failed', e); }

    try {
        showLoading('جارٍ حفظ الفاتورة...');

        // حفظ عبر Firestore بدلاً من push محلي
        saleData.includeInCash = true;
        saleData.collectionReportCreated = saleData.collectionReportCreated || false;
        saleData.paidToSafe = saleData.paidToSafe || false;

        if (id) {
            await updateSale(id, saleData);
        } else {
            await addSale(saleData);
        }

        hideLoading();
        closeModal(saleModal);
        // onSnapshot سيعيد تحديث القوائم تلقائياً
        // Also sync cash data to cloud
        try {
            if (typeof window.debouncedSaveCash === 'function') {
                window.debouncedSaveCash();
            }
        } catch(e){ console.warn('Cash cloud sync after sale save failed', e); }
        await customDialog({ message: 'تم حفظ الفاتورة بنجاح في السحابة.', title: 'نجاح', confirmClass: 'bg-green-600 hover:bg-green-700' });
    } catch (error) {
        hideLoading(); // Hide loading indicator on error
        console.error('Error saving sale locally:', error);
        await customDialog({ message: 'فشل حفظ الفاتورة: ' + (error && error.message ? error.message : String(error)), title: 'خطأ في الحفظ', confirmClass: 'bg-red-600 hover:bg-red-700' });
    }
}

// --- END NEW FUNCTIONS ---

function loadState() {
    // تم إلغاء التحميل المحلي الكامل. إرجاع حالة افتراضية فقط إن لم تكن موجودة.
    if (!window.state) {
        window.state = { customers: [], products: [], sales: [], priceLists: [], dispatchNotes: [], reps: [], promotions: [], settings: { salesTarget: 10000 }, stockEntries: {}, invoiceHighlights: {}, highlightCounter: 0 };
    }
    // CRITICAL: Load stockEntries from localStorage if not already loaded
    try {
        if (!window.state.stockEntries || Object.keys(window.state.stockEntries).length === 0) {
            const saved = localStorage.getItem('stock_entries');
            if (saved) {
                window.state.stockEntries = JSON.parse(saved);
                console.log('✅ Restored stockEntries from localStorage');
            }
        }
    } catch(e){ console.warn('loadState: failed to restore stockEntries', e); }
    return window.state;
}

// If we detect an empty sales list but local backups exist, offer to restore the latest one.
// Previously this immediately prompted the user to restore a local backup
// when no sales were found. That caused an intrusive modal on startup.
// We'll skip the interactive restore prompt and instead silently log
// that backups exist (so the app doesn't interrupt the user).
(function() {
    try {
        if ((!state.sales || state.sales.length === 0)) {
            const backupsRaw = localStorage.getItem('mandoobiAppState_backups');
            const backups = backupsRaw ? JSON.parse(backupsRaw) : [];
            if (backups && backups.length > 0) {
                // Do NOT prompt the user automatically. Keep backups available for manual restore.
                console.info(`Found ${backups.length} local backups; automatic restore prompt suppressed.`);
            }
        }
    } catch (e) {
        console.warn('Auto-restore check failed', e);
    }
})();

function saveState() {
    try {
        // If CLOUD_ONLY is enabled (Firebase initialized and user requested cloud-only), skip all local writes
        if (!window.CLOUD_ONLY) {
            try {
                localStorage.setItem('mandoobiAppState', JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save main state to localStorage', e);
            }

            // Also keep a short rolling history of backups to help recovery
            try {
                const key = 'mandoobiAppState_backups';
                const raw = localStorage.getItem(key);
                const backups = raw ? JSON.parse(raw) : [];
                // push latest snapshot (keep small to avoid huge localStorage)
                backups.unshift({ ts: new Date().toISOString(), data: state });
                // limit to 12 entries
                while (backups.length > 12) backups.pop();
                localStorage.setItem(key, JSON.stringify(backups));
            } catch (e) {
                // non-fatal
                console.warn('Failed to save state backup', e);
            }
        } else {
            // In cloud-only mode we intentionally avoid persisting locally.
            console.debug('CLOUD_ONLY: skipping local save and scheduling cloud save');
        }
    } catch (e) {
        console.warn('saveState wrapper error', e);
    }

    // Schedule a debounced cloud save if Firebase is available
    try {
        if (window.db && window.auth) {
            scheduleCloudSave();
        } else if (window.CLOUD_ONLY) {
            console.warn('CLOUD_ONLY enabled but Firebase not initialized; state will not be persisted to cloud yet.');
        }
    } catch (e) { console.warn('Failed to schedule cloud save', e); }
}
// Expose saveState globally for index.html
window.saveState = saveState;

// Debounced cloud-save scheduler.
// Ensures auth is available (attempts anonymous sign-in if needed), coalesces rapid saves,
// and retries once on transient failure with simple backoff.
function scheduleCloudSave(delayMs = 900) {
    // حفظ الحالة الكامل لم يعد مستخدماً؛ الإبقاء للتوافق فقط بدون دخول مجهول.
    if (!window.db || !window.auth || !auth.currentUser) return;
    if (window.__cloudSaveTimer) clearTimeout(window.__cloudSaveTimer);
    window.__cloudSaveTimer = setTimeout(async ()=>{
        window.__cloudSaveTimer = null;
        try { await saveStateToFirebase(); } catch(e){ console.warn('Deprecated cloud save failed', e); }
    }, delayMs);
}

// Function to save state to Firebase
async function saveStateToFirebase() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('No user logged in, skipping Firebase save');
            return;
        }

        // Sanitize state إلى JSON مسموح فقط (بدون دوال / عقد DOM) لتجنب خطأ invalid nested entity
        function safeSerialize(val, depth=0){
            if (depth > 6) return undefined; // حاجز حماية
            if (val === null) return null;
            const t = typeof val;
            if (t === 'string' || t === 'number' || t === 'boolean') return val;
            if (Array.isArray(val)) return val.map(v => safeSerialize(v, depth+1)).filter(v => v !== undefined);
            if (t === 'object') {
                if (val instanceof Date) return val.toISOString();
                if (val.nodeType || (val.ownerDocument && val.defaultView)) return undefined; // DOM Node
                const out = {}; Object.keys(val).forEach(k => {
                    const v = val[k];
                    if (typeof v === 'function') return;
                    const sv = safeSerialize(v, depth+1);
                    if (sv !== undefined) out[k] = sv;
                });
                return out;
            }
            return undefined; // تخطي رموز ودوال وأشياء خاصة
        }
        const cleanState = safeSerialize(state) || {};
        const userData = {
            appState: cleanState,
            lastUpdated: new Date().toISOString(),
            email: currentUser.email
        };

        await db.collection('users').doc(currentUser.uid).set(userData, { merge: true });
        console.log('✅ State saved to Firebase successfully');
    } catch (error) {
        console.warn('⚠️ Failed to save state to Firebase:', error);
        // Don't block the app if Firebase fails
    }
}

// Function to load state from Firebase
async function loadStateFromFirebase() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('No user logged in, skipping Firebase load');
            return null;
        }

        const docSnapshot = await db.collection('users').doc(currentUser.uid).get();
        if (docSnapshot.exists && docSnapshot.data().appState) {
            console.log('✅ State loaded from Firebase successfully');
            return docSnapshot.data().appState;
        } else {
            console.log('No data found in Firebase for this user');
            return null;
        }
    } catch (error) {
        console.warn('⚠️ Failed to load state from Firebase:', error);
        return null;
    }
}

// مهاجره طارئة: لو مجموعة sales فاضية لكن في مبيعات مخزّنة داخل users/{uid}.appState.sales
// نستوردها مرة واحدة إلى مجموعة sales القياسية.
async function migrateSalesFromUserDocIfFound(){
    try {
        if (!window.db || !window.auth) return;
        const u = auth.currentUser; if (!u) return;
        // لا تكرر الهجرة أكثر من مرة على هذا الجهاز
        const MIG_KEY = 'migrated_sales_from_userdoc_v1';
        if (localStorage.getItem(MIG_KEY) === 'done') return;

        // لو عندنا بالفعل بيانات مبيعات في الذاكرة أو في المجموعة، لا نعمل هجرة
        if (Array.isArray(window.state?.sales) && window.state.sales.length > 0) return;
        const salesSnap = await db.collection('sales').limit(1).get().catch(()=>null);
        if (salesSnap && !salesSnap.empty) return;

        const userDoc = await db.collection('users').doc(u.uid).get();
        const appState = userDoc.exists ? (userDoc.data() || {}).appState : null;
        const legacySales = Array.isArray(appState?.sales) ? appState.sales : [];
        if (!legacySales.length) return;

        console.warn('Migrating sales from users/' + u.uid + '.appState.sales -> sales collection. Count=', legacySales.length);
        let batch = db.batch(); let pending = 0;
        function commitIfNeeded(force){ return force || pending >= 450 ? batch.commit().then(()=>{ batch = db.batch(); pending = 0; }) : Promise.resolve(); }

        for (const s of legacySales){
            try {
                const sid = String(s.id || s.invoiceNumber || db.collection('sales').doc().id);
                const items = Array.isArray(s.items) ? s.items.map(it => ({
                    productId: it.productId || it.id || it.code || '',
                    qty: Number(it.qty || it.quantity || it.q || 0),
                    price: Number(it.price || it.p || 0)
                })) : [];
                const total = Number(s.total || s.finalTotal || s.amount || 0);
                const paidAmount = Number(s.paidAmount || s.paid || 0);
                const discountPercent = Number(s.discountPercent || s.discount || 0);
                const dateIso = s.date ? new Date(s.date).toISOString() : new Date().toISOString();
                const docRef = db.collection('sales').doc(sid);
                batch.set(docRef, {
                    id: sid,
                    invoiceNumber: s.invoiceNumber || null,
                    customerId: s.customerId || (s.customer && (s.customer.id || s.customerId)) || null,
                    repName: s.repName || s.repId || '',
                    items,
                    total,
                    paidAmount,
                    status: s.status || 'due',
                    discountPercent,
                    taxFilingStatus: s.taxFilingStatus || '',
                    date: dateIso,
                    createdAt: serverTs(),
                    updatedAt: serverTs()
                }, { merge: true });
                pending++; await commitIfNeeded(false);
            } catch(e){ console.warn('migrate sale record failed', e); }
        }
        await commitIfNeeded(true);
        localStorage.setItem(MIG_KEY, 'done');
        console.log('✅ Migration of legacy sales complete');
    } catch(e){ console.warn('migrateSalesFromUserDocIfFound error', e); }
}

function getStatusBadge(status) {
    let text, color; if (status === 'paid') { text = 'مدفوع'; color = 'bg-green-100 text-green-800'; } else if (status === 'due') { text = 'آجل'; color = 'bg-red-100 text-red-800'; } else if (status === 'partial') { text = 'جزئي'; color = 'bg-yellow-100 text-yellow-800'; } else { text = 'غير محدد'; color = 'bg-gray-100 text-gray-800'; } return `<span class="text-xs font-medium px-2.5 py-0.5 rounded-full ${color}">${text}</span>`;
}

function getTaxStatusBadge(sale) {
    const customer = findCustomer(sale.customerId); 
    // FIX: Use `requiresTaxFiling` which is correctly set in loadState
    const requiresFiling = customer?.requiresTaxFiling;

    if (!requiresFiling) { return ''; } // No badge if not required
    
    const taxStatus = sale.taxFilingStatus;
    const isFiled = taxStatus && taxStatus.trim().toLowerCase() === 'تم';

    if (isFiled) {
        // Blue "Filed" button (to differentiate from 'Paid' green badge)
        return `
            <button 
                class="tax-status-toggle-btn text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1"
                data-id="${sale.id}"
            >
                <i data-lucide="check" class="w-3 h-3"></i> تم الرفع
            </button>
        `;
    } else {
        // Red "Not Filed" button
        const statusText = taxStatus && taxStatus.trim() !== '' ? taxStatus : 'لم يتم الرفع';
        return `
            <button 
                class="tax-status-toggle-btn text-xs font-medium px-2.5 py-0.5 rounded-full tax-not-filed-badge flex items-center gap-1"
                data-id="${sale.id}"
            >
                <i data-lucide="x" class="w-3 h-3"></i> ${statusText}
            </button>
        `;
    }
}

function populatePriceListDropdown(selectEl, selectedPriceListId = '') {
    selectEl.innerHTML = '<option value="">-- بدون قائمة --</option>' + state.priceLists.map(pl => `<option value="${pl.id}" ${pl.id === selectedPriceListId ? 'selected' : ''}>${pl.name}</option>`).join('');
}

function populateCustomerDropdown(selectEl, selectedCustomerId = '') {
    selectEl.innerHTML = '<option value="">-- اختر عميل --</option>' + state.customers.map(c => `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function checkAndShowAutoStatement() {
     const today = new Date(); const day = today.getDate(); const year = today.getFullYear(); const month = today.getMonth(); const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); const isStatementDay = [10, 20, lastDayOfMonth].includes(day); if (!isStatementDay) return; const periodIdentifier = `${year}-${month}-${day}`; const lastShownIdentifier = localStorage.getItem('lastStatementShown'); if (lastShownIdentifier === periodIdentifier) return; let startDate, endDate; endDate = new Date(year, month, day); if (day <= 10) startDate = new Date(year, month, 1); else if (day <= 20) startDate = new Date(year, month, 11); else startDate = new Date(year, month, 21); const exceptionCustomerIds = state.customers.filter(c => c.name.includes("اكسبشن ماركت")).map(c => c.id); if (exceptionCustomerIds.length === 0) return; const endDateForCheck = new Date(endDate); endDateForCheck.setHours(23,59,59,999); const hasRelevantSales = state.sales.some(sale => { const saleDate = new Date(sale.date); return exceptionCustomerIds.includes(sale.customerId) && saleDate >= startDate && saleDate <= endDateForCheck; }); if (hasRelevantSales) { localStorage.setItem('lastStatementShown', periodIdentifier); generateAndShowStatement(startDate, endDate, exceptionCustomerIds, 'كشف حساب تلقائي', 'اكسبشن ماركت (جميع الفروع)'); }
}

function renderPriceListsPage() {
    const container = document.getElementById('all-price-lists-container');
    if (!container) return;
    // Render only when price-lists page is active/visible to avoid heavy work during background updates
    try {
        const page = document.getElementById('page-price-lists');
        const hiddenByDisplay = page && (page.style.display === 'none' || !page.classList.contains('active'));
        if (!page || hiddenByDisplay) { return; }
    } catch(_){}
    // Defensive: make sure container is visible and cleared
    try { container.style.display = ''; } catch(e) {}
    container.innerHTML = '';
    // Debug log
    try { console.log('renderPriceListsPage called — priceLists:', (state.priceLists || []).length, 'products:', (state.products || []).length); } catch(e) {}

    // 1. Find and display customers without a price list
    const customersWithoutPriceList = state.customers.filter(c => !c.priceListId);
    if (customersWithoutPriceList.length > 0) {
        const noListEl = document.createElement('div');
        noListEl.className = 'bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm mb-6';
        const customerNames = customersWithoutPriceList.map(c => `<span class="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">${c.name}</span>`).join('');
        noListEl.innerHTML = `
            <h3 class="font-bold text-lg text-yellow-800 mb-3">عملاء بدون قائمة أسعار محددة</h3>
            <p class="text-sm text-gray-600 mb-3">هؤلاء العملاء يستخدمون الأسعار الافتراضية للمنتجات. يمكنك تعيين قائمة أسعار لهم من صفحة "العملاء".</p>
            <div class="flex flex-wrap gap-2">
                ${customerNames}
            </div>
        `;
        container.appendChild(noListEl);
    }

    if (!state.priceLists || state.priceLists.length === 0) {
        container.innerHTML += '<p class="text-center text-gray-500 p-4 bg-gray-100 rounded-lg">لا توجد قوائم أسعار معرفة.</p>';
        return;
    }

    // Create a mapping of which customers use which price list
    const customersByPriceList = {};
    state.customers.forEach(customer => {
        if (customer.priceListId) {
            if (!customersByPriceList[customer.priceListId]) {
                customersByPriceList[customer.priceListId] = [];
            }
            customersByPriceList[customer.priceListId].push(customer.name);
        }
    });

    state.priceLists.sort((a, b) => a.name.localeCompare(b.name)).forEach(priceList => {
        const productPrices = priceList.productPrices || {};
        const productItems = Object.keys(productPrices).map(productId => {
            const product = findProduct(productId);
            const price = productPrices[productId];
            if (!product) return ''; // Skip if product not found
            return `
                <li class="flex justify-between items-center py-2 px-3 hover:bg-gray-50 text-sm">
                    <span>${product.name} <span class="text-xs text-gray-400">(${product.id})</span></span>
                    <span class="font-bold text-blue-600">${formatCurrency(price)}</span>
                </li>
            `;
        }).join('');

        // Get customers associated with this price list
        const associatedCustomers = customersByPriceList[priceList.id] || [];
        const customersHtml = associatedCustomers.length > 0
            ? `<div class="mt-4 pt-3 border-t border-gray-100">
                   <h4 class="font-semibold text-sm text-gray-700 mb-2">العملاء المطبق عليهم هذه القائمة:</h4>
                   <div class="flex flex-wrap gap-2">
                       ${associatedCustomers.map(name => `<span class="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">${name}</span>`).join('')}
                   </div>
               </div>`
            : '<p class="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">هذه القائمة غير مطبقة على أي عميل حالياً.</p>';

        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg border shadow-sm mb-4';
        el.innerHTML = `
            <h3 class="font-bold text-lg text-gray-800">${priceList.name}</h3>
            <div class="max-h-60 overflow-y-auto mt-3 pr-2">
                ${productItems.length > 0 ? `<ul class="divide-y divide-gray-200">${productItems}</ul>` : '<p class="text-sm text-gray-500">لا توجد أسعار خاصة في هذه القائمة.</p>'}
            </div>
            ${customersHtml}
        `;
        container.appendChild(el);
    });
    updateIcons();
}

// ===== Price Lists Page (single selection) =====
function normalizeSpaces(s){ return (s||'').toString().replace(/\s+/g,' ').trim(); }
function initPriceListsPage(){
    try {
        const modeSel = document.getElementById('pl-filter-mode');
        const sel = document.getElementById('pl-selector');
        const printBtn = document.getElementById('pl-print');
        const imageBtn = document.getElementById('pl-image');
        const discountInput = document.getElementById('pl-global-discount');
        if (!modeSel || !sel) return;
        populatePlSelector();
        modeSel.onchange = () => populatePlSelector();
        sel.onchange = () => renderSelectedPriceList();
        if (printBtn) printBtn.onclick = () => printSection('pl-sheet-container');
        if (imageBtn) imageBtn.onclick = () => generateReportImage('pl-sheet-container');
        if (discountInput){
            discountInput.addEventListener('input', () => renderSelectedPriceList());
        }
        renderSelectedPriceList();
    } catch(e){ console.warn('initPriceListsPage error', e); }
}
function populatePlSelector(){
    const modeSel = document.getElementById('pl-filter-mode');
    const sel = document.getElementById('pl-selector');
    if (!modeSel || !sel) return;
    const mode = modeSel.value || 'customer';
    if (mode === 'customer'){
        // Exclude specific customers per request
        const excluded = new Set(['عميل جمله واحد','عميل قطاعي اثنين','عميل  قطاعي اثنين'].map(normalizeSpaces));
        const options = [];
        
        // Add customers
        const list = (state.customers||[])
          .filter(c => !excluded.has(normalizeSpaces(c.name)))
          .sort((a,b)=> (a.name||'').localeCompare(b.name||''));
        options.push(...list.map(c => `<option value="cust:${c.id}">${escapeHtml(c.name||'')}</option>`));
        
        // Add chains
        const chains = loadChains();
        if (chains.length > 0) {
            options.push('<optgroup label="السلاسل">');
            chains.forEach(chain => {
                options.push(`<option value="chain:${chain.id}">[سلسلة] ${escapeHtml(chain.name||'')}</option>`);
            });
            options.push('</optgroup>');
        }
        
        sel.innerHTML = options.join('');
    } else {
        const list = (state.priceLists||[]).slice().sort((a,b)=> (a.name||'').localeCompare(b.name||''));
        sel.innerHTML = list.map(pl => `<option value="pl:${pl.id}">${escapeHtml(pl.name||pl.id)}</option>`).join('');
    }
}
function renderSelectedPriceList(){
    const modeSel = document.getElementById('pl-filter-mode');
    const sel = document.getElementById('pl-selector');
    const dateEl = document.getElementById('pl-date');
    const custNameEl = document.getElementById('pl-customer-name');
    if (!sel) return;
    const v = sel.value || '';
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('ar-EG');
    if (v.startsWith('cust:')){
        const cid = v.slice(5);
        const c = (state.customers||[]).find(x => (x.id||x._id) === cid);
        const plId = c?.priceListId || '';
        if (custNameEl) custNameEl.textContent = c ? (c.name||'') : '';
        renderPriceListSheet(plId, c?.name||'');
    } else if (v.startsWith('chain:')){
        const chainId = v.slice(6);
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (custNameEl) custNameEl.textContent = chain ? '[سلسلة] ' + chain.name : '';
        // For chains, we don't have a single price list, so show a message or show first customer's price list
        if (chain && chain.customerIds.length > 0){
            const firstCustId = chain.customerIds[0];
            const firstCust = (state.customers||[]).find(x => (x.id||x._id) === firstCustId);
            const plId = firstCust?.priceListId || '';
            renderPriceListSheet(plId, chain.name||'');
        } else {
            renderPriceListSheet('', chain?.name||'');
        }
    } else if (v.startsWith('pl:')){
        const plId = v.slice(3);
        if (custNameEl) custNameEl.textContent = '';
        renderPriceListSheet(plId, '');
    }
    updateIcons();
}
// تحديد الأصناف المسموح تعديل باركودها (زبادي / أرز / سمنة / موزاريلا / المعلبات)
function isBarcodeEditable(name){
    try {
        const n = (name||'').replace(/\s+/g,' ').trim();
        return /(زبادي|زبادى|أرز|رز|سمنة|موزاريلا|موزريلا|مورتة|المورتة|معلبات)/.test(n);
    } catch(e){ return false; }
}
function renderPriceListSheet(priceListId, customerName){
    const cont = document.getElementById('pl-sheet-container');
    if (!cont){ return; }
    cont.innerHTML = '';
    const pl = (state.priceLists||[]).find(x => x.id === priceListId) || null;
    if (!pl){
        cont.innerHTML = '<div class="text-center text-gray-500 p-6">لا توجد قائمة أسعار محددة لهذا الاختيار.</div>';
        return;
    }
    const prices = pl.productPrices || {};
    const discountInput = document.getElementById('pl-global-discount');
    const discountPercent = discountInput ? Math.max(0, Number(discountInput.value||0)) : 0;
    const rows = Object.keys(prices).map(pid => {
        const prod = findProduct(pid) || { id: pid, name: pid, unit: '', sku: '' };
        return { pid, name: prod.name||pid, unit: prod.unit||'', barcode: prod.barcode||prod.sku||'', price: Number(prices[pid]||0) };
    }).sort((a,b)=> a.name.localeCompare(b.name));
    const thead = `<thead><tr>
        <th>م</th>
        <th>الكود</th>
        <th>الصنف</th>
        <th>باركود</th>
        <th>الوحدة</th>
        <th>السعر</th>
        <th>ضريبة</th>
        <th>خصم</th>
        <th>صافي السعر</th>
    </tr></thead>`;
    let i = 0; const tbody = rows.map(r => {
        i++;
        const discountAmt = discountPercent ? (r.price * discountPercent / 100) : 0;
        const net = r.price - discountAmt;
        const editable = isBarcodeEditable(r.name);
        const barcodeCell = editable
            ? `<input type="text" class="barcode-input border rounded px-1 py-0.5 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-blue-400" data-pid="${escapeHtml(r.pid)}" value="${escapeHtml(r.barcode||'')}" placeholder="باركود" />`
            : `${escapeHtml(r.barcode||'')}`;
        return `<tr>
            <td>${i}</td>
            <td>${escapeHtml(r.pid)}</td>
            <td class="name">${escapeHtml(r.name)}</td>
            <td>${barcodeCell}</td>
            <td>${escapeHtml(r.unit||'')}</td>
            <td>${formatCurrency(r.price)}</td>
            <td></td>
            <td>${discountPercent ? formatCurrency(discountAmt) : ''}</td>
            <td>${formatCurrency(net)}</td>
        </tr>`;
    }).join('');
    cont.innerHTML = `<table class="price-sheet">${thead}<tbody>${tbody}</tbody></table>`;

    // مستمع حفظ الباركود
    function handleBarcodeSave(e){
        const el = e.target;
        if (!el.classList.contains('barcode-input')) return;
        const val = el.value.trim();
        const pid = el.getAttribute('data-pid');
        if (!pid || !window.db) return;
        el.disabled = true;
        updateProduct(pid, { barcode: val }).then(()=>{
            try {
                const prod = (state.products||[]).find(p => (p.id||p._id) === pid);
                if (prod) prod.barcode = val;
            } catch(e){}
            el.classList.remove('border-red-400');
            el.classList.add('border-green-400');
        }).catch(()=>{
            el.classList.add('border-red-400');
        }).finally(()=>{
            el.disabled = false;
        });
    }
    cont.querySelectorAll('input.barcode-input').forEach(inp => {
        inp.addEventListener('change', handleBarcodeSave);
        inp.addEventListener('blur', handleBarcodeSave);
    });
}

// ===== Remove unwanted customers once (delete from Firestore) =====
async function attemptDeleteSpecificCustomersOnce(){
    try {
        if (!window.db) return;
        // رفع نسخة المفتاح حتى تُنفّذ العملية مجدداً بناءً على طلب المستخدم
        const FLAG_KEY = 'deleted_named_customers_v3';
        if (localStorage.getItem(FLAG_KEY) === 'done') return;
        const variants = [
            'عميل جمله واحد','عميل جملة واحد','عميل  جملة واحد','عميل  جمله واحد',
            'عميل قطاعي اثنين','عميل  قطاعي اثنين','عميل قطاعى اثنين','عميل  قطاعى اثنين'
        ];
        const normSet = new Set(variants.map(v => normalizeSpaces(v)));
        const targets = (state.customers||[]).filter(c => normSet.has(normalizeSpaces(c.name)));
        for (const c of targets){
            try { await db.collection('customers').doc(c.id||c._id).delete(); } catch(e){ /* ignore */ }
        }
        if (targets.length) localStorage.setItem(FLAG_KEY,'done');
    } catch(e){ /* ignore */ }
}

// ===== Inquiry Report Logic (استعلام عن مبيعات العملاء: نطاق تاريخ + عملاء متعددين) =====
function initInquiryDropdown(){
    try {
        const multiSel = document.getElementById('inq-customers');
        if (!multiSel) return;
        const previous = new Set(Array.from(multiSel.selectedOptions).map(o => o.value));
        
        // Build options: customers + chains
        const options = [];
        
        // Add customers
        (state.customers||[])
            .filter(c => !/اكسبشن/.test(c.name||'') || !/(حلواني|حلوانى)/.test(c.name||''))
            .forEach(c => {
                options.push(`<option value="${c.id||c._id}" ${previous.has(c.id||c._id)?'selected':''}>${escapeHtml(c.name||'')}</option>`);
            });
        
        // Add chains
        const chains = loadChains();
        if (chains.length > 0) {
            options.push('<optgroup label="السلاسل">');
            chains.forEach(chain => {
                options.push(`<option value="chain-${chain.id}" ${previous.has('chain-'+chain.id)?'selected':''}>[سلسلة] ${escapeHtml(chain.name||'')}</option>`);
            });
            options.push('</optgroup>');
        }
        
        multiSel.innerHTML = options.join('');
    } catch(e){ console.warn('initInquiryDropdown failed', e); }
}
function generateInquiryReport(){
    const fromStr = document.getElementById('inq-date-from')?.value || '';
    const toStr = document.getElementById('inq-date-to')?.value || '';
    const multiSel = document.getElementById('inq-customers');
    const selectedIds = multiSel ? Array.from(multiSel.selectedOptions).map(o=>o.value) : [];
    const headEl = document.getElementById('inq-report-head');
    const bodyEl = document.getElementById('inq-report-body');
    const summaryEl = document.getElementById('inq-summary');
    const breakdownEl = document.getElementById('inq-customers-breakdown');
    if (!headEl || !bodyEl) return;
    if (!fromStr || !toStr){ bodyEl.innerHTML = '<tr><td colspan="5" class="text-center text-red-600">اختر تاريخ البداية والنهاية.</td></tr>'; return; }
    const start = new Date(fromStr+'T00:00:00');
    const end = new Date(toStr+'T23:59:59');
    if (start > end){ bodyEl.innerHTML = '<tr><td colspan="5" class="text-center text-red-600">النطاق غير صحيح.</td></tr>'; return; }
    
    // Expand chain IDs to actual customer IDs
    let expandedIds = [];
    const chains = loadChains();
    selectedIds.forEach(id => {
        if (id.startsWith('chain-')) {
            const chainId = id.substring(6);
            const chain = chains.find(c => c.id === chainId);
            if (chain) expandedIds.push(...(chain.customerIds || []));
        } else {
            expandedIds.push(id);
        }
    });
    
    const includeAll = selectedIds.length === 0;
    const idSet = new Set(expandedIds);
    const prodAgg = {}; // pid -> { name, qty, totalValue, unitPrice }
    const filteredSales = (state.sales||[]).filter(s => {
        const d = new Date(s.date);
        if (isNaN(d)) return false;
        if (d < start || d > end) return false;
        if (!includeAll && !idSet.has(s.customerId)) return false;
        return true;
    });
    filteredSales.forEach(s => {
        (s.items||[]).forEach(it => {
            const pid = it.productId || it.pid || it.productID; const prod = findProduct(pid); if (!prod) return;
            const qty = Number(it.quantity||it.qty||0);
            const price = Number(it.unitPrice||it.price||(prod.price||0));
            if (!prodAgg[pid]) prodAgg[pid] = { name: prod.name||pid, qty:0, totalValue:0, unitPrice: price };
            prodAgg[pid].qty += qty;
            prodAgg[pid].totalValue += qty * price;
        });
    });
    const productIds = Object.keys(prodAgg).sort((a,b)=> (prodAgg[a].name||'').localeCompare(prodAgg[b].name||''));
    headEl.innerHTML = '<tr><th>الكود</th><th>اسم الصنف</th><th>الكمية الإجمالية</th><th>متوسط السعر</th><th>المبلغ الإجمالي</th></tr>';
    let totalAll = 0, totalQtyAll = 0;
    const rowsHtml = productIds.map(pid => {
        const p = prodAgg[pid];
        totalAll += p.totalValue; totalQtyAll += p.qty;
        return `<tr><td>${escapeHtml(pid)}</td><td class='prod-name'>${escapeHtml(p.name)}</td><td class='qty-cell'>${p.qty}</td><td>${formatCurrency(p.unitPrice)}</td><td class='total-cell'>${formatCurrency(p.totalValue)}</td></tr>`;
    }).join('');
    bodyEl.innerHTML = rowsHtml || '<tr><td colspan="5" class="text-center text-gray-500">لا توجد بيانات في الفترة المختارة.</td></tr>';
    const distinctCustomers = new Set(filteredSales.map(s=>s.customerId)).size;
    summaryEl.innerHTML = `
        <div class='card'><span>عدد الأصناف</span><span class='val'>${productIds.length}</span></div>
        <div class='card'><span>إجمالي الكمية</span><span class='val'>${totalQtyAll}</span></div>
        <div class='card'><span>إجمالي القيمة</span><span class='val'>${formatCurrency(totalAll)}</span></div>
        <div class='card'><span>عدد العملاء</span><span class='val'>${distinctCustomers}</span></div>`;
    // Breakdown per customer
    if (breakdownEl){
        const custAgg = {};
        filteredSales.forEach(s => {
            if (!custAgg[s.customerId]) custAgg[s.customerId] = { qty:0, value:0 };
            (s.items||[]).forEach(it => {
                const q = Number(it.quantity||it.qty||0);
                const pr = Number(it.unitPrice||it.price||0);
                custAgg[s.customerId].qty += q;
                custAgg[s.customerId].value += q * pr;
            });
        });
        const rowsCust = Object.entries(custAgg).map(([cid, data]) => {
            const cObj = (state.customers||[]).find(c => (c.id||c._id) === cid);
            return `<tr><td>${escapeHtml(cObj?.name||cid||'')}</td><td class='text-center'>${data.qty}</td><td class='text-center'>${formatCurrency(data.value)}</td></tr>`;
        }).join('');
        breakdownEl.innerHTML = rowsCust ? `<h3 class='font-bold mb-2 text-sm'>تفصيل حسب العميل</h3><table class='text-xs w-full border-collapse'><thead><tr class='bg-gray-700 text-white'><th class='p-1 border'>العميل</th><th class='p-1 border'>إجمالي الكمية</th><th class='p-1 border'>إجمالي القيمة</th></tr></thead><tbody>${rowsCust}</tbody></table>` : '';
    }
    updateIcons();
}
document.addEventListener('DOMContentLoaded', function(){
    try { initPriceListsPage(); } catch(e){}
    try { initInquiryDropdown(); } catch(e){}
    const genBtn = document.getElementById('inq-generate-btn');
    const printBtn = document.getElementById('inq-print-btn');
    const imgBtn = document.getElementById('inq-image-btn');
    if (genBtn) genBtn.addEventListener('click', generateInquiryReport);
    if (printBtn) printBtn.addEventListener('click', ()=> printSection('page-inquiry'));
    if (imgBtn) imgBtn.addEventListener('click', ()=> generateReportImage('page-inquiry'));
    // live filter
    const filterInput = document.getElementById('inq-customer-filter');
    if (filterInput){
        filterInput.addEventListener('input', () => {
            const term = filterInput.value.trim();
            const multiSel = document.getElementById('inq-customers');
            if (!multiSel) return;
            const selected = new Set(Array.from(multiSel.selectedOptions).map(o=>o.value));
            multiSel.innerHTML = (state.customers||[])
                .filter(c => !/اكسبشن/.test(c.name||'') || !/(حلواني|حلوانى)/.test(c.name||''))
                .filter(c => !term || (c.name||'').includes(term))
                .map(c => `<option value="${c.id||c._id}" ${selected.has(c.id||c._id)?'selected':''}>${escapeHtml(c.name||'')}</option>`)
                .join('');
        });
    }
});

// Add quick listeners for debts page action buttons (show reps / show customers)
document.addEventListener('DOMContentLoaded', () => {
    const showRepsBtn = document.getElementById('debts-show-reps-btn');
    const showCustomersBtn = document.getElementById('debts-show-customers-btn');
    if (showRepsBtn) {
        showRepsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to rep-debts page which lists all reps and their balances
            if (typeof navigateTo === 'function') navigateTo('rep-debts');
        });
    }
    if (showCustomersBtn) {
        showCustomersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to customers page
            if (typeof navigateTo === 'function') navigateTo('customers');
        });
    }
});

// Refresh button handler: force a re-render of debts table
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('debts-refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                if (typeof renderDebts === 'function') renderDebts();
            } catch (err) {
                console.error('Failed to refresh debts:', err);
            }
        });
    }
});

function navigateTo(pageId) {
    // تحديث الفترة النشطة للصفحات التي تتطلب الشهر الحالي
    if (pageId === 'sales' || pageId === 'reports' || pageId === 'debts') {
        try { ensureDefaultActivePeriod(); } catch(e){}
    }
    
    // Restrict pages by role (central guard)
    try {
        if (!canAccessPage(pageId)) {
            if (typeof lastRequestedPage !== 'undefined' && lastRequestedPage === pageId) {
                try { customDialog({ title:'غير مصرح', message:'صلاحياتك لا تسمح بفتح هذه الصفحة.' }); } catch(_) { alert('غير مصرح'); }
            }
            pageId = 'dashboard';
        }
    } catch(e){}
    // Avoid redundant heavy re-renders when navigating to the same page repeatedly
    try {
        if (window.__currentPage === pageId) { updateIcons(); return; }
        window.__currentPage = pageId;
    } catch(_){}
    // Clear inline display and classes for all pages, rely purely on CSS
    document.querySelectorAll('.page').forEach(p => { p.classList.remove('active'); p.style.display=''; }); 
    const pageEl = document.getElementById(`page-${pageId}`); 
    
    // Handle reports page activation differently
    if (pageId === 'reports') {
        pageEl.classList.add('active');
        reportsSubnav.classList.add('active');
        initializeReportsPage();
    } else {
         // Deactivate reports subnav for all other pages
        reportsSubnav.classList.remove('active'); 
    }
    
    if (pageEl) { pageEl.classList.add('active'); } else { console.error(`Page element not found for ID: page-${pageId}`); } 
    
    document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active')); 
    const navButton = document.querySelector(`.bottom-nav-item[data-page="${pageId}"]`); 
    if (navButton) navButton.classList.add('active'); 
    
    const titles = { dashboard: 'لوحة المعلومات والتقارير', 'spreadsheet-entry': 'إدخال سريع', sales: 'جميع المبيعات', dispatch: 'أذونات الاستلام', reports: 'التقارير التفصيلية', promotions: 'العروض الترويجية', customers: 'العملاء', reps: 'إدارة المناديب', 'rep-debts': 'مديونات المناديب', 'total-bills': 'إجمالي الفواتير', 'price-lists': 'قوائم الأسعار', settings: 'الإعدادات', 'finished-products': 'الإنتاج التام', 'raw-materials': 'الخامات', packaging: 'مواد التعبئة والتغليف', 'stock-control': 'التحكم في المخزون', 'collection-receipt': 'كشف التحصيل', 'cash': 'الكاش', 'taxes': 'الضرائب', 'costs': 'التكاليف' }; 
    headerTitle.textContent = titles[pageId] || 'تطبيق مندوبي'; 
    // if leaving stock-control, hide internal subviews
    if(pageId !== 'stock-control'){
        try{
            document.querySelectorAll('.stock-subpage').forEach(s=>s.classList.add('hidden'));
            ['stock-subbtn-finished-products','stock-subbtn-raw-materials','stock-subbtn-packaging'].forEach(id=>{const b=document.getElementById(id); if(b) b.classList.remove('ring','ring-2');});
        }catch(e){}
    }
    
    if (pageId === 'dashboard') { 
        renderDashboard(); 
        renderSales7DaysChart(); 
        renderTopRepsChart(); 
        renderTopProductsChart(); 
        renderTopCustomersChart(); 
    } else if (pageId === 'sales') {
        // تحديث فوري لصفحة المبيعات مع الفترة النشطة
        try { 
            renderAllSales('', '', 'all');
            console.log(`Sales page loaded with activePeriod: ${window.state?.activePeriod}`);
        } catch(e){ console.warn('renderAllSales failed', e); }
    } else if (pageId === 'spreadsheet-entry') { 
        initializeSpreadsheetPage(); 
    } else if (pageId === 'promotions') { 
        renderPromotions(); 
    } else if (pageId === 'debts') { 
        renderDebts(); 
    } else if (pageId === 'rep-debts') { 
        renderRepDebts(); 
    } else if (pageId === 'total-bills'){
        initTotalBillsPage();
    } else if (pageId === 'stock-control') {
        try { 
            if (window.inventorySystem && window.inventorySystem.loadInventoryData) {
                // Render the visible default tab (finished) first
                window.inventorySystem.loadInventoryData('finished');
            }
        } catch(e){ console.warn('loadInventoryData failed', e); }
    } else if (pageId === 'finished-products') {
        try { renderStockLedgerForFinishedProducts(); } catch(e){ console.warn('renderFinishedProducts failed', e); }
    } else if (pageId === 'dispatch') {
        try { initializeNewDispatchGrid(); } catch(_){}
        try { renderDispatchPage(); } catch(_){}
    } else if (pageId === 'price-lists') {
        initPriceListsPage();
    } else if (pageId === 'production') {
        try { 
            // First try to load from Firebase to get latest data
            if (window.loadProductionsFromFirebase) {
                window.loadProductionsFromFirebase().then(() => {
                    if (window.renderProductionsList) window.renderProductionsList();
                }).catch(err => {
                    console.warn('Firebase load failed, using local data:', err);
                    if (window.renderProductionsList) window.renderProductionsList();
                });
            } else if (window.renderProductionsList) {
                window.renderProductionsList();
            }
        } catch(err) { 
            console.warn('renderProductionsList failed:', err); 
        }
    } else if (pageId === 'cash') {
        try { renderCash(); } catch(e){ console.warn('renderCash failed', e); }
    } else if (pageId === 'taxes') {
        try { renderTaxesPage(); } catch(e){ console.warn('renderTaxesPage failed', e); }
    } else if (pageId === 'costs') {
        try { renderCostsPage(); } catch(e){ console.warn('renderCostsPage failed', e); }
    }
    updateIcons();
}

// إخفاء أزرار الصفحات غير المسموح بها حسب الدور
function applyRoleNavRestrictions(){
    try {
        const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        const buttons = Array.from(document.querySelectorAll('.bottom-nav .bottom-nav-item'));
        const allow = ROLE_PAGE_ALLOW[role];
        if (!allow || allow === 'ALL') { buttons.forEach(btn => btn.style.display = ''); return; }
        buttons.forEach(btn => {
            const p = btn.getAttribute('data-page');
            if (allow.has(p)) btn.style.display = '';
            else btn.style.display = 'none';
        });
    } catch(_){ }
}
// Expose applyRoleNavRestrictions globally for index.html
window.applyRoleNavRestrictions = applyRoleNavRestrictions;

document.addEventListener('DOMContentLoaded', applyRoleNavRestrictions);
// إعادة تطبيق إخفاء الأيقونات بعد 1 و 3 ثوانٍ لضمان أن الدور تم تحميله
setTimeout(applyRoleNavRestrictions, 1000);
setTimeout(applyRoleNavRestrictions, 3000);



// Unified local-date formatter -> YYYY-MM-DD (avoids UTC shifts)
function getISODateString(input){
    try {
        if (!input) return null;
        const d = (input instanceof Date) ? input : new Date(input);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    } catch(_) { return null; }
}

function getPreviousDate(dateString) {
    const base = getISODateString(dateString) ? new Date(dateString) : new Date();
    base.setDate(base.getDate() - 1);
    return getISODateString(base);
}

function renderStockLedger() {
    // Support pages where the stock-control inputs/table were moved.
    const stockDateEl = document.getElementById('stock-control-date');
    const finishedDateEl = document.getElementById('finished-products-date');
    const date = getISODateString((stockDateEl && stockDateEl.value) ? stockDateEl.value : (finishedDateEl && finishedDateEl.value) ? finishedDateEl.value : new Date());
    const prevDate = getPreviousDate(date);
    // Prefer stock-control table, fallback to finished-products table if moved
    const body = document.getElementById('stock-control-table-body') || document.getElementById('finished-products-table-body');
    if (!body) {
        // Nothing to render here (table moved). Update icons to keep UI consistent and return.
        try { updateStockControlIcons(); } catch(_){}
        return;
    }
    body.innerHTML = '';

    const prevDayBalances = state.stockEntries[prevDate] || {};
    const currentDayEntries = state.stockEntries[date] || {};
    const dispatchesForDate = state.dispatchNotes.filter(d => getISODateString(d && d.date ? d.date : null) === date);

    if (state.products.length === 0) {
        body.innerHTML = `<tr><td colspan="10" class="text-center p-4 text-gray-500">الرجاء إضافة منتجات أولاً من صفحة الإعدادات.</td></tr>`;
        return;
    }

    state.products.forEach(product => {
        let openingBalanceValue = currentDayEntries[product.id]?.opening;
        if (openingBalanceValue === undefined) {
            openingBalanceValue = (prevDayBalances[product.id]?.actual !== undefined) ? prevDayBalances[product.id].actual : 0;
        }

        // ===== حساب الإرسالات والمرجعات الجيدة من Dispatch Notes =====
        const totalDispatched = dispatchesForDate.reduce((sum, dispatch) => {
            const item = dispatch.items.find(i => i.productId === product.id);
            return sum + (item ? (item.quantity || 0) : 0);
        }, 0);

        const totalGoodReturns = dispatchesForDate.reduce((sum, dispatch) => {
            const item = dispatch.items.find(i => i.productId === product.id);
            return sum + (item ? (item.goodReturn || 0) : 0);
        }, 0);

        // ===== الإنتاج =====
        const productionQty = currentDayEntries[product.id]?.production || 0;

        // ===== صيغة الرصيد الدفتري =====
        // Book Balance = Opening Balance + Production - (Total Dispatched - Total Good Returns)
        const netOutbound = totalDispatched - totalGoodReturns;
        
        const row = document.createElement('tr');
        row.dataset.productId = product.id;
        row.innerHTML = `
            <td class="px-2 py-2 text-sm font-medium text-gray-800 text-right">${product.name}</td>
            <td class="px-2 py-2 stock-col-initial"><input type="number" class="w-20 p-1 border rounded text-center opening-balance" value="${openingBalanceValue}"></td>
            <td class="px-2 py-2 text-center text-sm font-semibold text-blue-700 stock-col-production">${productionQty}</td>
            <td class="px-2 py-2 stock-col-production-input"><input type="number" class="w-20 p-1 border rounded text-center production-qty" value="${productionQty}"></td>
            <td class="px-2 py-2 text-center text-sm font-semibold text-orange-600 stock-col-dispatched">${totalDispatched}</td>
            <td class="px-2 py-2 text-center text-sm font-semibold text-green-700 stock-col-good-returns">${totalGoodReturns}</td>
            <td class="px-2 py-2 text-center text-sm font-bold stock-col-book">0</td>
            <td class="px-2 py-2 stock-col-actual"><input type="number" class="w-20 p-1 border rounded text-center actual-balance"></td>
            <td class="px-2 py-2 text-center text-sm font-bold stock-col-diff">0</td>
            <td class="px-2 py-2 text-center text-sm font-semibold stock-col-diff-text"></td>
        `;
        body.appendChild(row);

        const openingBalanceInput = row.querySelector('.opening-balance');
        const productionInput = row.querySelector('.production-qty');
        const actualBalanceInput = row.querySelector('.actual-balance');
        const bookBalanceCell = row.querySelector('.stock-col-book');
        const diffCell = row.querySelector('.stock-col-diff');
        const diffTextCell = row.querySelector('.stock-col-diff-text');

        function updateRowCalculations() {
            const openingBalance = parseInt(openingBalanceInput.value) || 0;
            const productionInputQty = parseInt(productionInput.value) || 0;
            
            // Book Balance = Opening Balance + Production - (Total Dispatched - Total Good Returns)
            const bookBalance = openingBalance + productionInputQty - netOutbound;
            bookBalanceCell.textContent = bookBalance;

            const actualBalance = parseInt(actualBalanceInput.value);
            if (!isNaN(actualBalance)) {
                const difference = actualBalance - bookBalance;
                diffCell.textContent = difference;
                if (difference > 0) {
                    diffTextCell.textContent = 'زيادة';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-green-700 stock-col-diff-text';
                } else if (difference < 0) {
                    diffTextCell.textContent = 'عجز';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-red-700 stock-col-diff-text';
                } else {
                    diffTextCell.textContent = 'مطابق';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-gray-700 stock-col-diff-text';
                }
            } else {
                diffCell.textContent = '-';
                diffTextCell.textContent = '';
            }
        }

        openingBalanceInput.addEventListener('focus', (e) => {
            e.target.dataset.previousValue = e.target.value;
        });

        openingBalanceInput.addEventListener('change', async (e) => {
            const confirmed = await customDialog({
                title: 'تأكيد تعديل الرصيد',
                message: 'هل أنت متأكد أنك تريد تعديل الرصيد المبدئي يدوياً؟',
                isConfirm: true,
                confirmText: 'نعم، عدل',
                confirmClass: 'bg-orange-500 hover:bg-orange-600'
            });

            if (confirmed) {
                const newValue = parseInt(e.target.value);
                if (!isNaN(newValue)) {
                    if (!state.stockEntries[date]) state.stockEntries[date] = {};
                    if (!state.stockEntries[date][product.id]) state.stockEntries[date][product.id] = {};
                    state.stockEntries[date][product.id].opening = newValue;

                    // 1. Update State
                    window._finishedGridState = window._finishedGridState || {};
                    window._finishedGridState[product.id] = Object.assign(window._finishedGridState[product.id]||{}, { opening: newValue });
                    // 2. SAVE LOCALLY IMMEDIATELY (Do not wait for cloud)
                    try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState)); } catch(e){}
                    try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(e){}
                    // 3. Debounce Cloud Save
                    try { saveFinishedProductsDebounced(); } catch(e){}

                    updateRowCalculations();
                }
            } else {
                e.target.value = e.target.dataset.previousValue;
            }
        });

        // load saved values (if any) to avoid race/wipe
        const saved = (window._finishedGridState && window._finishedGridState[product.id]) ? window._finishedGridState[product.id] : {};
        if (saved.production !== undefined) productionInput.value = saved.production; else productionInput.value = currentDayEntries[product.id]?.production || 0;
        const bookBalance = parseInt(bookBalanceCell.textContent);
        if (saved.actual !== undefined && saved.actual !== null) actualBalanceInput.value = saved.actual; else actualBalanceInput.value = currentDayEntries[product.id]?.actual ?? bookBalance;
        const saveFinishedProductsDebounced = (typeof window.debouncedFinishedSave === 'function') ? window.debouncedFinishedSave : function(){};

        // persist helper for this row
        function persistFinishedRow() {
            try {
                window._finishedGridState = window._finishedGridState || {};
                window._finishedGridState[product.id] = Object.assign(window._finishedGridState[product.id]||{}, {
                    production: (productionInput && productionInput.value) ? Number(productionInput.value) : 0,
                    actual: (actualBalanceInput && actualBalanceInput.value) ? Number(actualBalanceInput.value) : null,
                    opening: (openingBalanceInput && openingBalanceInput.value) ? Number(openingBalanceInput.value) : 0,
                    updatedAt: new Date().toISOString()
                });
                try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState || {})); } catch(e){}
                if (typeof window.debouncedFinishedSave === 'function') window.debouncedFinishedSave();
            } catch(e){ console.warn('persist finished row failed', e); }
        }

        productionInput.addEventListener('input', function(e){
            updateRowCalculations();
            window.__finishedTouched = true; // FIXED: Mark as touched for cloud save
            try { persistFinishedRow(); } catch(e){ console.warn('persistFinishedRow failed', e); }
            try {
                // Force local save immediately (ensure no CLOUD_ONLY suppression)
                const productId = product.id;
                const value = (productionInput && productionInput.value) ? Number(productionInput.value) : 0;
                const finishedState = window._finishedGridState || {};
                finishedState[productId] = Object.assign(finishedState[productId]||{}, { production: value, updatedAt: new Date().toISOString() });
                try { localStorage.setItem('finished_products_grid', JSON.stringify(finishedState)); } catch(e){}
                try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(e){}
                try { saveFinishedProductsDebounced(); } catch(e){}
            } catch(e){ console.warn('forced local save (production) failed', e); }
        });

        actualBalanceInput.addEventListener('input', function(e){
            updateRowCalculations();
            window.__finishedTouched = true; // FIXED: Mark as touched for cloud save
            try { persistFinishedRow(); } catch(e){ console.warn('persistFinishedRow failed', e); }
            try {
                // Force local save immediately (ensure no CLOUD_ONLY suppression)
                const productId = product.id;
                const val = (actualBalanceInput && actualBalanceInput.value) ? Number(actualBalanceInput.value) : null;
                const finishedState = window._finishedGridState || {};
                finishedState[productId] = Object.assign(finishedState[productId]||{}, { actual: val, updatedAt: new Date().toISOString() });
                try { localStorage.setItem('finished_products_grid', JSON.stringify(finishedState)); } catch(e){}
                try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(e){}
                try { saveFinishedProductsDebounced(); } catch(e){}
            } catch(e){ console.warn('forced local save (actual) failed', e); }
        });

        // Initial calculation
        updateRowCalculations();
        updateRowCalculations();
    });
    updateStockControlIcons();
}

function saveStockBalances() {
    const dateEl = document.getElementById('stock-control-date') || document.getElementById('finished-products-date');
    const date = dateEl ? dateEl.value : null;
    if (!date) {
        customDialog({ title: 'خطأ', message: 'الرجاء تحديد تاريخ أولاً.' });
        return;
    }

    if (!state.stockEntries[date]) {
        state.stockEntries[date] = {};
    }

    let rows = document.querySelectorAll('#stock-control-table-body tr');
    if (!rows || rows.length === 0) {
        // fallback to finished-products table if stock-control table was moved
        rows = document.querySelectorAll('#finished-products-table-body tr');
    }
    rows.forEach(row => {
        const productId = row.dataset.productId;
        const actualBalanceInput = row.querySelector('.actual-balance');
        const productionInput = row.querySelector('.production-qty');
        if (productId) {
            if (!state.stockEntries[date][productId]) {
                state.stockEntries[date][productId] = {};
            }
            const actualBalance = parseInt(actualBalanceInput.value);
            if (!isNaN(actualBalance)) {
                state.stockEntries[date][productId].actual = actualBalance;
            }
            const productionQty = parseInt(productionInput.value);
            if (!isNaN(productionQty)) {
                state.stockEntries[date][productId].production = productionQty;
            }
        }
    });

    // Force local persistence for finished-products regardless of CLOUD_ONLY
    try {
        // persist per-grid quick state
        try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState || {})); } catch(e){}
        // persist full stock entries snapshot as well so recovery can use it
        try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(e){}
    } catch(e){ /* ignore */ }

    // then persist overall app state (this may be suppressed for CLOUD_ONLY inside saveState,
    // but we've already written the critical finished-products data locally above)
    saveState();
    customDialog({ title: 'تم الحفظ', message: `تم حفظ الرصيد الفعلي والإنتاج لليوم التالي بتاريخ ${formatArabicDate(date)}.` });
    try { alert('تم حفظ بيانات الإنتاج التام بنجاح ✅'); } catch(e){}
    updateStockControlIcons();
}

function updateStockControlIcons() {
    // Count products by category
    const finishedProductsCount = state.products.filter(p => p.category && p.category.toLowerCase().includes('انتاج|تام|منتج')).length;
    const rawMaterialsCount = state.products.filter(p => p.category && p.category.toLowerCase().includes('خامة|مواد خام|مادة خام')).length;
    const packagingCount = state.products.filter(p => p.category && (p.category.toLowerCase().includes('تعبئة') || p.category.toLowerCase().includes('تغليف') || p.category.toLowerCase().includes('عبوة') || p.category.toLowerCase().includes('ورق') || p.category.toLowerCase().includes('كيس'))).length;

    document.getElementById('stock-finished-products-count').textContent = finishedProductsCount;
    document.getElementById('stock-raw-materials-count').textContent = rawMaterialsCount;
    document.getElementById('stock-packaging-count').textContent = packagingCount;

    updateIcons();
}

function scrollToStockTable() {
    const table = document.getElementById('stock-control-table');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showStockSubview(name){
    try{
        // Before switching away, flush any pending grid saves for the currently visible subpage
        try {
            const visible = Array.from(document.querySelectorAll('.stock-subpage')).find(s => !s.classList.contains('hidden'));
            if (visible) {
                const id = visible.id || '';
                if (id.includes('raw') && typeof window.saveRawGridStateNow === 'function') {
                    try { window.saveRawGridStateNow(); } catch(e){ console.warn('flush raw save failed', e); }
                }
                if (id.includes('pack') && typeof window.savePackGridStateNow === 'function') {
                    try { window.savePackGridStateNow(); } catch(e){ console.warn('flush pack save failed', e); }
                }
                if (id.includes('finished') && typeof window.saveFinishedProductsNow === 'function') {
                    try { window.saveFinishedProductsNow(); } catch(e){ /* best-effort */ }
                }
            }
        } catch(e){ /* ignore flush errors */ }

        document.querySelectorAll('.stock-subpage').forEach(s=>s.classList.add('hidden'));
        // deactivate buttons
        ['stock-subbtn-finished-products','stock-subbtn-raw-materials','stock-subbtn-packaging'].forEach(id=>{const b=document.getElementById(id); if(b) b.classList.remove('ring','ring-2');});
        if(!name) return;
        const map = {
            'finished-products':'subpage-finished-products',
            'raw-materials':'subpage-raw-materials',
            'packaging':'subpage-packaging'
        };
        const subId = map[name];
        const subEl = subId ? document.getElementById(subId) : null;
        if(subEl) subEl.classList.remove('hidden');
        // highlight button
        const btn = document.getElementById('stock-subbtn-'+name);
        if(btn) btn.classList.add('ring','ring-2');

        // render content for visible subview
        if(name === 'finished-products') renderStockLedgerForFinishedProducts();
        if(name === 'raw-materials') renderRawMaterials();
        if(name === 'packaging') renderPackaging();
    }catch(e){console.warn('showStockSubview', e)}
}

function renderFinishedProducts() {
    // Redirect to the correct render function
    if (typeof renderStockLedgerForFinishedProducts === 'function') {
        renderStockLedgerForFinishedProducts();
    }
}

function renderStockLedgerForFinishedProducts() {
    // Ensure we pick up the latest local finished-products grid immediately
    try { window._finishedGridState = Object.assign({}, window._finishedGridState || {}, JSON.parse(localStorage.getItem('finished_products_grid') || '{}')); } catch(e) { window._finishedGridState = window._finishedGridState || {}; }
    // CRITICAL: Ensure stock_entries are loaded from localStorage
    try { if (window.state && !window.state.stockEntries) window.state.stockEntries = JSON.parse(localStorage.getItem('stock_entries') || '{}'); } catch(e){}
    const dateInput = document.getElementById('finished-products-date').value;
    const date = getISODateString(dateInput || new Date());
    const prevDate = getPreviousDate(date);
    const body = document.getElementById('finished-products-table-body');
    body.innerHTML = '';

    // Diagnostics
    try {
        const prodCount = Array.isArray(state.products) ? state.products.length : 0;
        const prevCount = state.stockEntries[prevDate] ? Object.keys(state.stockEntries[prevDate]).length : 0;
        const curCount = state.stockEntries[date] ? Object.keys(state.stockEntries[date]).length : 0;
        console.log('🧪 Finished Render → date:', date, '| products:', prodCount, '| prev entries:', prevCount, '| today entries:', curCount);
    } catch(_){ }

    const prevDayBalances = state.stockEntries[prevDate] || {};
    const currentDayEntries = state.stockEntries[date] || {};
    const salesForDate = (Array.isArray(state.sales) ? state.sales : []).filter(s => {
        try { return getISODateString(s && s.date ? s.date : null) === date; } catch(_) { return false; }
    });
    const dispatchesForDate = (Array.isArray(state.dispatchNotes) ? state.dispatchNotes : []).filter(d => {
        try { return getISODateString(d && d.date ? d.date : null) === date; } catch(_) { return false; }
    });
    try { console.log('🧪 Finished Render → sales:', salesForDate.length, '| dispatches:', dispatchesForDate.length); } catch(_){ }

    if (state.products.length === 0) {
        body.innerHTML = `<tr><td colspan="9" class="text-center p-4 text-gray-500">الرجاء إضافة منتجات أولاً من صفحة الإعدادات.</td></tr>`;
        return;
    }

    state.products.forEach(product => {
        let openingBalanceValue = currentDayEntries[product.id]?.opening;
        if (openingBalanceValue === undefined) {
            const prevActual = (prevDayBalances[product.id]?.actual !== undefined) ? prevDayBalances[product.id].actual : undefined;
            openingBalanceValue = (prevActual !== undefined) ? prevActual : 0;
            // Auto carry-over: write opening from yesterday's actual if missing
            try {
                if (!state.stockEntries[date]) state.stockEntries[date] = {};
                if (!state.stockEntries[date][product.id]) state.stockEntries[date][product.id] = {};
                if (prevActual !== undefined) {
                    state.stockEntries[date][product.id].opening = prevActual;
                    // Mirror to finished grid state for cloud sync
                    window._finishedGridState = window._finishedGridState || {};
                    window._finishedGridState[product.id] = Object.assign(window._finishedGridState[product.id]||{}, { opening: prevActual, updatedAt: new Date().toISOString() });
                    try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(_){ }
                    try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState || {})); } catch(_){ }
                    try { if (typeof window.debouncedFinishedSave === 'function') window.debouncedFinishedSave(); } catch(_){ }
                }
            } catch(_){ }
        }

        const totalInward = dispatchesForDate.reduce((sum, dispatch) => {
            const item = dispatch.items.find(i => i.productId === product.id);
            return sum + (item ? (item.quantity || 0) : 0);
        }, 0);

        const totalOutbound = salesForDate.reduce((sum, sale) => {
            const item = sale.items.find(i => i.productId === product.id);
            return sum + (item ? (item.quantity || 0) : 0);
        }, 0);
        try { console.log('🧪 Row', product.id, product.name, '→ open:', openingBalanceValue, 'in:', totalInward, 'out:', totalOutbound); } catch(_){ }
        
        const row = document.createElement('tr');
        row.dataset.productId = product.id;
        row.innerHTML = `
            <td class="px-2 py-2 text-sm font-medium text-gray-800 text-right">${product.name}</td>
            <td class="px-2 py-2 stock-col-initial"><input type="number" class="w-20 p-1 border rounded text-center opening-balance" value="${openingBalanceValue}"></td>
            <td class="px-2 py-2 text-center text-sm stock-col-inward">${totalInward}</td>
            <td class="px-2 py-2 stock-col-production"><input type="number" class="w-20 p-1 border rounded text-center production-qty" value="${currentDayEntries[product.id]?.production || 0}"></td>
            <td class="px-2 py-2 text-center text-sm stock-col-outbound">${totalOutbound}</td>
            <td class="px-2 py-2 text-center text-sm font-bold stock-col-book">0</td>
            <td class="px-2 py-2 stock-col-actual"><input type="number" class="w-20 p-1 border rounded text-center actual-balance"></td>
            <td class="px-2 py-2 text-center text-sm font-bold stock-col-diff">0</td>
            <td class="px-2 py-2 text-center text-sm font-semibold stock-col-diff"></td>
        `;
        body.appendChild(row);

        const openingBalanceInput = row.querySelector('.opening-balance');
        const productionInput = row.querySelector('.production-qty');
        const actualBalanceInput = row.querySelector('.actual-balance');
        const bookBalanceCell = row.querySelector('.stock-col-book');
        const diffCell = row.querySelector('.stock-col-diff');
        const diffTextCell = row.querySelectorAll('.stock-col-diff')[1];

        function updateRowCalculations() {
            const openingBalance = parseInt(openingBalanceInput.value) || 0;
            const productionQty = parseInt(productionInput.value) || 0;
            const bookBalance = openingBalance + totalInward + productionQty - totalOutbound;
            bookBalanceCell.textContent = bookBalance;

            const actualBalance = parseInt(actualBalanceInput.value);
            if (!isNaN(actualBalance)) {
                const difference = actualBalance - bookBalance;
                diffCell.textContent = difference;
                if (difference > 0) {
                    diffTextCell.textContent = 'زيادة';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-green-700 stock-col-diff';
                } else if (difference < 0) {
                    diffTextCell.textContent = 'عجز';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-red-700 stock-col-diff';
                } else {
                    diffTextCell.textContent = 'مطابق';
                    diffTextCell.className = 'px-2 py-2 text-center text-sm font-semibold text-gray-700 stock-col-diff';
                }
            } else {
                diffCell.textContent = '-';
                diffTextCell.textContent = '';
            }
        }

        openingBalanceInput.addEventListener('focus', (e) => {
            e.target.dataset.previousValue = e.target.value;
        });

        openingBalanceInput.addEventListener('change', async (e) => {
            const confirmed = await customDialog({
                title: 'تأكيد تعديل الرصيد',
                message: 'هل أنت متأكد أنك تريد تعديل الرصيد المبدئي يدوياً؟',
                isConfirm: true,
                confirmText: 'نعم، عدل',
                confirmClass: 'bg-orange-500 hover:bg-orange-600'
            });

            if (confirmed) {
                const newValue = parseInt(e.target.value);
                if (!isNaN(newValue)) {
                    if (!state.stockEntries[date]) state.stockEntries[date] = {};
                    if (!state.stockEntries[date][product.id]) state.stockEntries[date][product.id] = {};
                    state.stockEntries[date][product.id].opening = newValue;

                    // Persist immediately to localStorage (bypass CLOUD_ONLY suppression)
                    try {
                        window.__finishedTouched = true; // FIXED: Mark as touched for cloud save
                        window._finishedGridState = window._finishedGridState || {};
                        window._finishedGridState[product.id] = Object.assign(window._finishedGridState[product.id]||{}, { opening: newValue, updatedAt: new Date().toISOString() });
                        try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState || {})); } catch(e){}
                        try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries || {})); } catch(e){}
                        if (typeof window.debouncedFinishedSave === 'function') window.debouncedFinishedSave();
                    } catch(e){ console.warn('persist finished opening failed', e); }

                    updateRowCalculations();
                }
            } else {
                e.target.value = e.target.dataset.previousValue;
            }
        });

        productionInput.addEventListener('input', updateRowCalculations);
        actualBalanceInput.addEventListener('input', updateRowCalculations);
        
        // Initial calculation
        updateRowCalculations();
        const bookBalance = parseInt(bookBalanceCell.textContent);
        actualBalanceInput.value = currentDayEntries[product.id]?.actual ?? bookBalance;
        updateRowCalculations();
    });
}

function saveStockBalancesForFinishedProducts() {
    const rawDateVal = document.getElementById('finished-products-date').value;
    const date = getISODateString(rawDateVal || new Date());
    if (!date) {
        customDialog({ title: 'خطأ', message: 'الرجاء تحديد تاريخ أولاً.' });
        return;
    }

    if (!state.stockEntries[date]) {
        state.stockEntries[date] = {};
    }

    const rows = document.querySelectorAll('#finished-products-table-body tr');
    rows.forEach(row => {
        const productId = row.dataset.productId;
        const actualBalanceInput = row.querySelector('.actual-balance');
        const productionInput = row.querySelector('.production-qty');
        const openingBalanceInput = row.querySelector('.opening-balance');
        if (productId) {
            if (!state.stockEntries[date][productId]) {
                state.stockEntries[date][productId] = {};
            }
            
            // CRITICAL: Save actual (including 0, not just if non-NaN)
            const actualBalance = actualBalanceInput ? parseInt(actualBalanceInput.value) : 0;
            state.stockEntries[date][productId].actual = !isNaN(actualBalance) ? actualBalance : 0;
            
            // CRITICAL: Save production (including 0)
            const productionQty = productionInput ? parseInt(productionInput.value) : 0;
            state.stockEntries[date][productId].production = !isNaN(productionQty) ? productionQty : 0;
            
            // CRITICAL: Save opening (including 0)
            const openingVal = openingBalanceInput ? parseInt(openingBalanceInput.value) : 0;
            state.stockEntries[date][productId].opening = !isNaN(openingVal) ? openingVal : 0;
            
            // FIXED: Also save to _finishedGridState for cloud sync
            try {
                window._finishedGridState = window._finishedGridState || {};
                if (!window._finishedGridState[productId]) window._finishedGridState[productId] = {};
                window._finishedGridState[productId].actual = !isNaN(actualBalance) ? actualBalance : 0;
                window._finishedGridState[productId].production = !isNaN(productionQty) ? productionQty : 0;
                window._finishedGridState[productId].opening = !isNaN(openingVal) ? openingVal : 0;
                window._finishedGridState[productId].updatedAt = new Date().toISOString();
            } catch(e){ console.warn('Update _finishedGridState failed', e); }
        }
    });

    // Log what we're about to save
    console.log('💾 saveStockBalancesForFinishedProducts → date:', date, '| entries count:', Object.keys(state.stockEntries[date] || {}).length);
    try {
        // Debug: log a few entries to verify values
        const sampleEntries = Object.entries(state.stockEntries[date] || {}).slice(0, 3);
        sampleEntries.forEach(([k, v]) => console.log('  Entry', k, '→', v));
    } catch(_){ }
    
    // SAVE LOCALLY IMMEDIATELY (do not wait for cloud)
    try { localStorage.setItem('stock_entries', JSON.stringify(state.stockEntries)); } catch(e){}
    try { localStorage.setItem('finished_products_grid', JSON.stringify(window._finishedGridState || {})); } catch(e){}
    // Mark as touched for cloud save
    window.__finishedTouched = true;
    // Then queue cloud sync
    try { 
        if (typeof window.debouncedFinishedSave === 'function') {
            window.debouncedFinishedSave();
        } else if (typeof saveFinishedProductsDebounced === 'function') {
            saveFinishedProductsDebounced();
        }
    } catch(e){ console.warn('Cloud sync failed', e); }

    // Enterprise-grade: persist this day's entries to a dedicated collection (stockEntries/{YYYY-MM-DD})
    try { if (typeof window.saveStockEntriesToCloud === 'function') window.saveStockEntriesToCloud(String(date)); } catch(e){ console.warn('saveStockEntriesToCloud failed', e); }
    customDialog({ title: 'تم الحفظ', message: `تم حفظ الرصيد الفعلي والإنتاج لليوم التالي بتاريخ ${formatArabicDate(date)}.` });
    updateStockControlIcons();
}

// ===== Enterprise-grade Stock Persistence: per-day Firestore documents =====
// Writes authoritative stock entries to collection stockEntries/{date}
(function(){
    // Guard install once
    if (window.__stockEntriesHelpersInstalled) return;
    window.__stockEntriesHelpersInstalled = true;

    window.__stockEntriesUnsub = null;
    window.__stockEntriesDocId = null;

    window.installStockEntriesListenerForDate = function(date){
        try {
            const dayId = getISODateString(date || new Date());
            if (!dayId || !window.db) return;
            if (window.__stockEntriesDocId === dayId && typeof window.__stockEntriesUnsub === 'function') return; // already subscribed
            try { if (typeof window.__stockEntriesUnsub === 'function') { window.__stockEntriesUnsub(); } } catch(_){ }
            window.__stockEntriesUnsub = null; window.__stockEntriesDocId = null;
            const ref = db.collection('stockEntries').doc(String(dayId));
            window.__stockEntriesUnsub = ref.onSnapshot(function(snap){
                try {
                    if (!snap || !snap.exists) return;
                    if (snap.metadata && snap.metadata.hasPendingWrites) return; // ignore local echo
                    const d = snap.data() || {};
                    const entries = (d && d.entries && typeof d.entries === 'object') ? d.entries : {};
                    // Merge into state for this day only
                    try {
                        if (!window.state) window.state = {};
                        if (!window.state.stockEntries) window.state.stockEntries = {};
                        window.state.stockEntries[dayId] = entries;
                        // Mirror to localStorage snapshot (all dates)
                        try { localStorage.setItem('stock_entries', JSON.stringify(window.state.stockEntries || {})); } catch(_){ }
                    } catch(e){ console.warn('apply stockEntries/day failed', e); }
                    // If finished-products view is visible for this day, re-render
                    try {
                        const cur = document.getElementById('finished-products-date');
                        const curDay = getISODateString(cur && cur.value ? cur.value : new Date());
                        if (curDay === dayId && typeof renderStockLedgerForFinishedProducts === 'function') {
                            renderStockLedgerForFinishedProducts();
                        }
                    } catch(_){ }
                } catch(e){ console.warn('stockEntries onSnapshot failed', e); }
            }, function(err){ console.warn('stockEntries listener error', err); });
            window.__stockEntriesDocId = dayId;
        } catch(e){ console.warn('installStockEntriesListenerForDate failed', e); }
    };

    window.saveStockEntriesToCloud = async function(date){
        try {
            const dayId = getISODateString(date || new Date());
            if (!dayId) return false;
            // Build payload from authoritative in-memory state for that day
            const entries = (window.state && window.state.stockEntries && window.state.stockEntries[dayId]) ? window.state.stockEntries[dayId] : {};
            // Always mirror to local first
            try { localStorage.setItem('stock_entries', JSON.stringify(window.state && window.state.stockEntries || {})); } catch(_){ }
            if (!window.db) { console.warn('saveStockEntriesToCloud: db not ready'); return false; }
            const meta = { updatedAt: serverTs() };
            try {
                const user = (window.auth && auth.currentUser) ? auth.currentUser : null;
                if (user) { meta.updatedBy = (user.email||user.uid||'user'); }
            } catch(_){ }
            // Write per-day doc
            await db.collection('stockEntries').doc(String(dayId)).set({ date: String(dayId), entries: entries || {}, ...meta }, { merge: true });
            // Best-effort: keep legacy aggregated snapshot in settings/costLists for backward-compat
            try {
                await db.collection('settings').doc('costLists').set({ stockEntries: (window.state && window.state.stockEntries) || {}, updatedAt: serverTs() }, { merge: true });
            } catch(_){ }
            console.log('✅ stockEntries saved to cloud (stockEntries/'+dayId+')', { products: Object.keys(entries||{}).length });
            return true;
        } catch(e){ console.warn('saveStockEntriesToCloud failed', e); return false; }
    };
})();

function renderRawMaterials() {
    // Always rehydrate latest grid snapshot from localStorage (in case a debounced save just flushed)
    try { window._rawGridState = JSON.parse(localStorage.getItem('raw_materials_grid') || '{}'); } catch(e){ window._rawGridState = window._rawGridState || {}; }
    try { window._packGridState = JSON.parse(localStorage.getItem('packaging_grid') || '{}'); } catch(e){ window._packGridState = window._packGridState || {}; }
    // Install shared helpers once to persist grids (localStorage + Firestore)
    if (!window._gridHelpersInstalled) {
        window._gridHelpersInstalled = true;
        window._rawGridSaveTimer = null;
        window._packGridSaveTimer = null;
        window.saveRawGridStateNow = async function(){
            try { localStorage.setItem('raw_materials_grid', JSON.stringify(window._rawGridState || {})); } catch(e){}
            try { if (window.db) await db.collection('settings').doc('costLists').set({ rawMaterials: window._rawGridState, updatedAt: serverTs() }, { merge:true }); } catch(e){}
        };
        window.debouncedRawSave = function(){ clearTimeout(window._rawGridSaveTimer); window._rawGridSaveTimer = setTimeout(window.saveRawGridStateNow, 700); };
        window.savePackGridStateNow = async function(){
            try { localStorage.setItem('packaging_grid', JSON.stringify(window._packGridState || {})); } catch(e){}
            try { if (window.db) await db.collection('settings').doc('costLists').set({ packaging: window._packGridState, updatedAt: serverTs() }, { merge:true }); } catch(e){}
        };
        window.debouncedPackSave = function(){ clearTimeout(window._packGridSaveTimer); window._packGridSaveTimer = setTimeout(window.savePackGridStateNow, 700); };
    }

    const date = document.getElementById('raw-materials-date').value || new Date().toISOString().split('T')[0];
    const body = document.getElementById('raw-materials-table-body');
    if(!body) return;
    body.innerHTML = '';

    console.log('renderRawMaterials - Loaded State:', window._rawGridState);

    // قائمة الخامات المعرّفة مسبقاً
    const rawMaterialsList = [
        'لبن بودرة', 'بروتين مركز', 'بديل زبدة', 'هاى كريم 200', 'هاى كريم 100', 'اناتو', 'كلورفيل',
        'S20', 'B3', 'نياسين', 'نتاميسين', 'سوربات بوتاسيوم', 'كلوريد كالسيوم', 'منفحة ميكروبية',
        'GDL', 'ديرى جيل 121', 'ملح طعام', 'انتى فوم', 'نشا', 'مياه', 'كريمة جاموسى', 'كريمة بقرى',
        'CR 15', 'فانيليا', 'مستكة', 'مياه ورد', 'هاى كريم 21', 'لاكته 810', 'ايس كريم بودرة',
        'كريم شانتيه بودر', 'سكر', 'ارز', 'طعم الشيدر', 'طعم الرومى', 'طعم جودة', 'طعم النستو',
        'ملح ليمون', 'خامات حفظ المش', 'صوص مش', 'صودا كاوية', 'طعم زبدة', 'طعم كريمة', 'لاكتة 815',
        'لاكتة 825', 'اكسجين', 'كربونات', 'طعم حليب', 'بادى زبادى', 'هاى كريم 500', 'طعم قشطة',
        'لبن خالى الدسم', 'طعم جبنة قديمة', 'حامض', 'سلفات صوديوم', 'طعم امنتال', 'طعم شيدر زبدة',
        'بروكسايد', 'شطة حمراء', 'جبنه رومى مبشور', 'كريموس200', 'زيت عباد', 'لاكتة s33', 'طعم سمن بلدى',
        'ستريك اسيد', 'معقم يد', 'اسيتون', 'مكسب طعم كريمة', 'لون شيكولاتة غامق'
    ];

    if (rawMaterialsList.length === 0) {
        body.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">لا توجد خامات معرّفة.</td></tr>`;
        return;
    }

    rawMaterialsList.forEach((materialName, index) => {
        const row = document.createElement('tr');
        const materialId = 'raw-' + index;
        row.dataset.productId = materialId;

        // load any saved values first to avoid race when setting inputs
        const saved = (window._rawGridState && window._rawGridState[materialName]) ? window._rawGridState[materialName] : {};
        const unitPriceVal = (saved.unitPrice !== undefined) ? saved.unitPrice : 0;
        const openingVal = (saved.opening !== undefined) ? saved.opening : 0;
        const inboundVal = (saved.inbound !== undefined) ? saved.inbound : 0;
        const usageVal = (saved.usage !== undefined) ? saved.usage : 0;
        const actualVal = (saved.actual !== undefined && saved.actual !== null) ? saved.actual : '';

        row.innerHTML = `
            <td class="px-2 py-2 text-sm font-medium text-gray-800 text-right">${materialName}</td>
            <td class="px-2 py-2 text-center bg-blue-50"><input type="number" class="w-24 p-1 border rounded text-center unit-price" step="any" value="${unitPriceVal}"></td>
            <td class="px-2 py-2 text-center bg-blue-50"><input type="number" class="w-20 p-1 border rounded text-center opening-balance" value="${openingVal}"></td>
            <td class="px-2 py-2 text-center bg-blue-50"><input type="number" class="w-20 p-1 border rounded text-center inbound-qty" value="${inboundVal}"></td>
            <td class="px-2 py-2 text-center bg-blue-50"><input type="number" class="w-20 p-1 border rounded text-center usage-qty" value="${usageVal}"></td>
            <td class="px-2 py-2 text-center bg-blue-50 font-bold book-balance">0</td>
            <td class="px-2 py-2 bg-blue-50"><input type="number" class="w-20 p-1 border rounded text-center actual-balance" value="${actualVal}"></td>
            <td class="px-2 py-2 text-center font-bold difference">0</td>
        `;
        body.appendChild(row);

        const unitPriceInput = row.querySelector('.unit-price');
        const openingInput = row.querySelector('.opening-balance');
        const inboundInput = row.querySelector('.inbound-qty');
        const usageInput = row.querySelector('.usage-qty');
        const bookBalanceCell = row.querySelector('.book-balance');
        const actualBalanceInput = row.querySelector('.actual-balance');
        const differenceCell = row.querySelector('.difference');

        function updateCalculations() {
            const opening = parseInt(openingInput.value) || 0;
            const inbound = parseInt(inboundInput.value) || 0;
            const usage = parseInt(usageInput.value) || 0;
            const bookBalance = opening + inbound - usage;
            bookBalanceCell.textContent = bookBalance;

            const actual = parseInt(actualBalanceInput.value);
            if (!isNaN(actual)) {
                differenceCell.textContent = actual - bookBalance;
            } else {
                differenceCell.textContent = '-';
            }

            // persist to local state and schedule cloud save
            try {
                window._rawGridState = window._rawGridState || {};
                const newUnitPrice = (unitPriceInput && unitPriceInput.value) ? Number(unitPriceInput.value) : 0;
                const oldPrice = (window._rawGridState[materialName] && window._rawGridState[materialName].unitPrice) || 0;
                window._rawGridState[materialName] = {
                    unitPrice: newUnitPrice,
                    opening: opening,
                    inbound: inbound,
                    usage: usage,
                    actual: (!isNaN(actual) ? actual : null),
                    bookBalance: bookBalance,
                    updatedAt: new Date().toISOString()
                };
                // mark raw grid as touched so cloud writer knows to include it
                try { window.__rawTouched = true; } catch(_){}
                if (typeof window.debouncedRawSave === 'function') window.debouncedRawSave();
                
                // === PRICE SYNC: Raw Materials => Costing System ===
                if (newUnitPrice !== oldPrice && newUnitPrice !== 0) {
                    try {
                        // Primary: Search in window.costRaw
                        let costItem = (Array.isArray(window.costRaw) && window.costRaw.find(i => i && i.name && i.name.toLowerCase() === materialName.toLowerCase()));
                        if (costItem) {
                            costItem.cost = newUnitPrice;
                            costItem.lastPrice = newUnitPrice;
                            costItem.lastPriceDate = new Date().toISOString();
                            if (typeof window.saveCostListsToFirebase === 'function') window.saveCostListsToFirebase();
                            console.log(`✅ Price synced for Raw Material "${materialName}": ${newUnitPrice}`);
                        }
                    } catch(e){ console.warn('Price sync for raw materials failed', e); }
                }
                
                // === STOCK SYNC: Raw Materials => Costing System ===
                if (!isNaN(actual)) {
                    try {
                        let costItem = (Array.isArray(window.costRaw) && window.costRaw.find(i => i && i.name && i.name.toLowerCase() === materialName.toLowerCase()));
                        if (costItem) {
                            costItem.stock = actual;
                            if (typeof window.saveCostListsToFirebase === 'function') window.saveCostListsToFirebase(true);
                            console.log(`✅ Stock synced for Raw Material "${materialName}": ${actual}`);
                        }
                    } catch(e){ console.warn('Stock sync for raw materials failed', e); }
                }
            } catch(e){ console.warn('persist raw grid failed', e); }
        }

        openingInput.addEventListener('input', updateCalculations);
        inboundInput.addEventListener('input', updateCalculations);
        usageInput.addEventListener('input', updateCalculations);
        actualBalanceInput.addEventListener('input', updateCalculations);
        if (unitPriceInput) unitPriceInput.addEventListener('input', updateCalculations);

        // initial calculation
        updateCalculations();
    });
}

function renderPackaging() {
    // Rehydrate latest grid snapshots from localStorage to pick recent changes
    try { window._rawGridState = JSON.parse(localStorage.getItem('raw_materials_grid') || '{}'); } catch(e){ window._rawGridState = window._rawGridState || {}; }
    try { window._packGridState = JSON.parse(localStorage.getItem('packaging_grid') || '{}'); } catch(e){ window._packGridState = window._packGridState || {}; }
    // relies on helpers installed by renderRawMaterials
    if (!window._gridHelpersInstalled) {
        // ensure helpers exist even if renderRawMaterials hasn't run
        window._rawGridSaveTimer = window._rawGridSaveTimer || null;
        window._packGridSaveTimer = window._packGridSaveTimer || null;
        window.savePackGridStateNow = window.savePackGridStateNow || (async function(){ try { localStorage.setItem('packaging_grid', JSON.stringify(window._packGridState || {})); } catch(e){} try { if (window.db) await db.collection('settings').doc('costLists').set({ packaging: window._packGridState, updatedAt: serverTs() }, { merge:true }); } catch(e){} });
        window.debouncedPackSave = window.debouncedPackSave || function(){ clearTimeout(window._packGridSaveTimer); window._packGridSaveTimer = setTimeout(window.savePackGridStateNow, 700); };
    }

    const dateEl = document.getElementById('packaging-date');
    const date = dateEl ? (dateEl.value || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    const body = document.getElementById('packaging-table-body');
    if(!body) return;
    body.innerHTML = '';

    console.log('renderPackaging - Loaded State:', window._packGridState);

    // Gather packaging items from state.products (if any) and from cost lists (costPack)
    const prodPack = Array.isArray(state.products) ? state.products.filter(p => p && p.category && (p.category.toString().toLowerCase().includes('تعبئة') || p.category.toString().toLowerCase().includes('تغليف') || p.category.toString().toLowerCase().includes('عبوة') || p.category.toString().toLowerCase().includes('ورق') || p.category.toString().toLowerCase().includes('كيس'))) : [];
    const costPackArr = Array.isArray(window.costPack) ? window.costPack : [];

    // Combine uniquely by name (case-insensitive)
    const seen = new Set();
    const combined = [];
    prodPack.forEach(p => {
        const name = (p && (p.name||p.title||p.code)) ? String(p.name||p.title||p.code).trim() : '';
        const key = name.toLowerCase();
        if(!name) return;
        if(!seen.has(key)){
            seen.add(key);
            combined.push({ id: p.id || ('prod-' + Math.random().toString(36).slice(2,8)), name });
        }
    });
    costPackArr.forEach(cp => {
        const name = (cp && (cp.name||cp.code)) ? String(cp.name||cp.code).trim() : '';
        const key = name.toLowerCase();
        if(!name) return;
        if(!seen.has(key)){
            seen.add(key);
            combined.push({ id: cp.id || ('costpack-' + Math.random().toString(36).slice(2,8)), name });
        }
    });

    if (combined.length === 0) {
        body.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">لا توجد عناصر تعبئة/تغليف في قوائم التكاليف أو منتجات التطبيق.</td></tr>`;
        return;
    }

    combined.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.productId = product.id;

        // load saved values first
        const saved = (window._packGridState && window._packGridState[product.name]) ? window._packGridState[product.name] : {};
        const unitPriceVal = (saved.unitPrice !== undefined) ? saved.unitPrice : 0;
        const openingVal = (saved.opening !== undefined) ? saved.opening : 0;
        const inboundVal = (saved.inbound !== undefined) ? saved.inbound : 0;
        const usageVal = (saved.usage !== undefined) ? saved.usage : 0;
        const actualVal = (saved.actual !== undefined && saved.actual !== null) ? saved.actual : '';

        row.innerHTML = `
            <td class="px-2 py-2 text-sm font-medium text-gray-800 text-right">${product.name}</td>
            <td class="px-2 py-2 text-center bg-orange-50"><input type="number" class="w-24 p-1 border rounded text-center unit-price" step="any" value="${unitPriceVal}"></td>
            <td class="px-2 py-2 text-center bg-orange-50"><input type="number" class="w-20 p-1 border rounded text-center opening-balance" value="${openingVal}"></td>
            <td class="px-2 py-2 text-center bg-orange-50"><input type="number" class="w-20 p-1 border rounded text-center inbound-qty" value="${inboundVal}"></td>
            <td class="px-2 py-2 text-center bg-orange-50"><input type="number" class="w-20 p-1 border rounded text-center usage-qty" value="${usageVal}"></td>
            <td class="px-2 py-2 text-center bg-orange-50 font-bold book-balance">0</td>
            <td class="px-2 py-2 bg-orange-50"><input type="number" class="w-20 p-1 border rounded text-center actual-balance" value="${actualVal}"></td>
            <td class="px-2 py-2 text-center font-bold difference">0</td>
        `;
        body.appendChild(row);

        const unitPriceInput = row.querySelector('.unit-price');
        const openingInput = row.querySelector('.opening-balance');
        const inboundInput = row.querySelector('.inbound-qty');
        const usageInput = row.querySelector('.usage-qty');
        const bookBalanceCell = row.querySelector('.book-balance');
        const actualBalanceInput = row.querySelector('.actual-balance');
        const differenceCell = row.querySelector('.difference');

        function updateCalculations() {
            const opening = parseInt(openingInput.value) || 0;
            const inbound = parseInt(inboundInput.value) || 0;
            const usage = parseInt(usageInput.value) || 0;
            const bookBalance = opening + inbound - usage;
            bookBalanceCell.textContent = bookBalance;

            const actual = parseInt(actualBalanceInput.value);
            if (!isNaN(actual)) {
                differenceCell.textContent = actual - bookBalance;
            } else {
                differenceCell.textContent = '-';
            }

            // persist to local state and schedule cloud save
            try {
                window._packGridState = window._packGridState || {};
                const newUnitPrice = (unitPriceInput && unitPriceInput.value) ? Number(unitPriceInput.value) : 0;
                const oldPrice = (window._packGridState[product.name] && window._packGridState[product.name].unitPrice) || 0;
                window._packGridState[product.name] = {
                    unitPrice: newUnitPrice,
                    opening: opening,
                    inbound: inbound,
                    usage: usage,
                    actual: (!isNaN(actual) ? actual : null),
                    bookBalance: bookBalance,
                    updatedAt: new Date().toISOString()
                };
                if (typeof window.debouncedPackSave === 'function') window.debouncedPackSave();
                // mark pack grid as touched so cloud writer knows to include it
                try { window.__packTouched = true; } catch(_){}
                
                // === PRICE SYNC: Packaging => Costing System ===
                if (newUnitPrice !== oldPrice && newUnitPrice !== 0) {
                    try {
                        const costItem = (Array.isArray(window.costPack) && window.costPack.find(i => i && i.name && i.name.toLowerCase() === product.name.toLowerCase()));
                        if (costItem) {
                            costItem.cost = newUnitPrice;
                            costItem.lastPrice = newUnitPrice;
                            costItem.lastPriceDate = new Date().toISOString();
                            if (typeof window.saveCostListsToFirebase === 'function') window.saveCostListsToFirebase();
                            console.log(`✅ Price synced for Packaging "${product.name}": ${newUnitPrice}`);
                        }
                    } catch(e){ console.warn('Price sync for packaging failed', e); }
                }
                
                // === STOCK SYNC: Packaging => Costing System ===
                if (!isNaN(actual)) {
                    try {
                        const costItem = (Array.isArray(window.costPack) && window.costPack.find(i => i && i.name && i.name.toLowerCase() === product.name.toLowerCase()));
                        if (costItem) {
                            costItem.stock = actual;
                            if (typeof window.saveCostListsToFirebase === 'function') window.saveCostListsToFirebase(true);
                            console.log(`✅ Stock synced for Packaging "${product.name}": ${actual}`);
                        }
                    } catch(e){ console.warn('Stock sync for packaging failed', e); }
                }
            } catch(e){ console.warn('persist pack grid failed', e); }
        }

        openingInput.addEventListener('input', updateCalculations);
        inboundInput.addEventListener('input', updateCalculations);
        usageInput.addEventListener('input', updateCalculations);
        actualBalanceInput.addEventListener('input', updateCalculations);
        if (unitPriceInput) unitPriceInput.addEventListener('input', updateCalculations);

        // initial calc
        updateCalculations();
    });
}

// دالة لتعيين تواريخ الشهر الحالي
function setCurrentMonthDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0);
    const lastDayStr = `${year}-${month}-${String(lastDay.getDate()).padStart(2, '0')}`;
    
    const fromDateEl = document.getElementById('filter-from-date');
    const toDateEl = document.getElementById('filter-to-date');
    
    if (fromDateEl) fromDateEl.value = firstDay;
    if (toDateEl) toDateEl.value = lastDayStr;
}

// دالة تهيئة صفحة إجمالي الفواتير
function initTotalBillsPage() {
    // تعيين تواريخ الشهر الحالي افتراضياً
    setCurrentMonthDates();
    // عرض الفواتير
    renderTotalBills();
}

function renderTotalBills(sortKey, sortDirection) {
    const tableBody = document.getElementById('total-bills-table-body');
    const fromDate = document.getElementById('filter-from-date').value;
    const toDate = document.getElementById('filter-to-date').value;
    const customerName = document.getElementById('filter-customer-name').value.toLowerCase();
    const invoiceNumber = document.getElementById('filter-invoice-number').value;

    let filteredSales = state.sales.filter(sale => {
        // آمن: تعامل مع التواريخ غير الصالحة بدون toISOString
        const sd = sale && sale.date ? new Date(sale.date) : null;
        const hasValidDate = sd && !isNaN(sd.getTime());
        const saleDay = hasValidDate ? sd.toISOString().split('T')[0] : null;
        if (fromDate && saleDay && saleDay < fromDate) return false;
        if (toDate && saleDay && saleDay > toDate) return false;
        const customer = findCustomer(sale.customerId);
        if (customerName && customer && !customer.name.toLowerCase().includes(customerName)) return false;
        if (invoiceNumber && String(sale.invoiceNumber || '') !== String(invoiceNumber)) return false;
        // تصفية حسب المندوب الحالي إذا كان دوره مندوب
        let role = typeof getUserRole === 'function' ? getUserRole() : 'rep';
        let currentEmail = (window.auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : null;
        if (role === 'rep' && currentEmail) {
            const emailMatch = ((sale.repEmail||'').toLowerCase() === currentEmail);
            // دعم فواتير الإدارة: المطابقة بالاسم أيضاً
            const currentRep = (state.reps||[]).find(r => (r.email||'').toLowerCase() === currentEmail);
            const repName = currentRep?.name;
            const nameMatch = repName && sale.repName === repName;
            if (!emailMatch && !nameMatch) return false;
        }
        return true;
    });

    // --- NEW: Calculate and display total ---
    const filteredTotal = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalAmountEl = document.getElementById('total-bills-summary-amount');
    if (totalAmountEl) {
        totalAmountEl.textContent = formatCurrency(filteredTotal);
    }
    // --- END NEW ---

    if (sortKey && sortDirection) {
        filteredSales.sort((a, b) => {
            let valA, valB;
            if (sortKey === 'customerName') {
                valA = findCustomer(a.customerId)?.name || '';
                valB = findCustomer(b.customerId)?.name || '';
            } else {
                valA = a[sortKey];
                valB = b[sortKey];
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const reviewState = loadReviewState();
    tableBody.innerHTML = filteredSales.map(sale => {
        const customer = findCustomer(sale.customerId);
        const items = sale.items || [];
        const category = items.length > 0 ? (findProduct(items[0].productId)?.category || 'N/A') : 'N/A';
        const highlightClass = reviewState[sale.id] || '';

        return `
            <tr>
                <td class="p-4"><input type="checkbox" class="total-bill-row-checkbox" value="${sale.id}"></td>
                <td class="px-6 py-4 whitespace-nowrap text-center bg-slate-100">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center font-bold invoice-cell ${highlightClass}" data-id="${sale.id}">${sale.invoiceNumber}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right bg-purple-100">${customer ? customer.name : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right bg-pink-100">${sale.repName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center font-semibold bg-cyan-100">${formatCurrency(sale.total)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${getStatusBadge(sale.status)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right bg-orange-100">${category}</td>
            </tr>
        `;
    }).join('');
}


// Populate chains dropdown
function populateChainsDropdown(selectEl) {
    if (!selectEl) return;
    const chains = loadChains();
    const currentValue = selectEl.value;
    selectEl.innerHTML = '<option value="">جميع السلاسل</option>';
    chains.forEach(chain => {
        const opt = document.createElement('option');
        opt.value = chain.id;
        opt.textContent = chain.name || 'بدون اسم';
        selectEl.appendChild(opt);
    });
    selectEl.value = currentValue;
}

function renderDashboard() {
     const selectedRepName = (document.getElementById('dashboard-rep-filter') || {}).value || '';
     console.debug('renderDashboard called with state.sales length:', (state.sales || []).length, 'activePeriod:', state.activePeriod);
     
     // Helper function للحصول على مبيعات الشهر النشط
     const getActivePeriodSalesLocal = () => {
         const activePeriod = state.activePeriod || '';
         if (!activePeriod) return state.sales || [];
         
         return (state.sales || []).filter(sale => {
             try {
                 const saleDate = sale.date ? new Date(sale.date) : null;
                 if (!saleDate || isNaN(saleDate.getTime())) return false;
                 const saleYearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
                 return saleYearMonth === activePeriod;
             } catch (_) {
                 return false;
             }
         });
     };
     
     const currentMonthSales = getActivePeriodSalesLocal();
     let filteredMonthSales = currentMonthSales;
    
    // Prefer the global target from settings when no rep is selected. If settings target is missing/zero, fall back to sum of rep targets.
    let currentTarget = Number(state.settings?.salesTarget || 0);
    const targetTitleEl = document.getElementById('target-title');
    if (selectedRepName) {
        filteredMonthSales = currentMonthSales.filter(s => s.repName === selectedRepName);
        const targetRep = findRep(selectedRepName);
        currentTarget = targetRep ? (targetRep.target || 0) : 0;
        if (targetTitleEl) targetTitleEl.innerHTML = `الهدف الشهري لـ <span class="text-blue-600">${selectedRepName}</span>`;
    } else {
        // Use settings.salesTarget as the global monthly target. If it's falsy, fall back to the sum of individual rep targets.
        if (!currentTarget || currentTarget <= 0) {
            currentTarget = state.reps.reduce((sum, rep) => sum + (rep.target || 0), 0) || 0;
        }
        if (targetTitleEl) targetTitleEl.textContent = `الهدف الشهري (الإجمالي):`;
    }
    
    const totalSales = filteredMonthSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalCollected = filteredMonthSales.reduce((sum, s) => {
        const paid = s.paidAmount ?? ((s.firstPayment || 0) + (s.secondPayment || 0));
        return sum + (Number(paid) || 0);
    }, 0);
    const totalDue = totalSales - totalCollected;
    console.debug('Dashboard calculated:', {totalSales, totalCollected, totalDue, filteredMonthSalesLength: filteredMonthSales.length, selectedRepName});
    if (document.getElementById('total-sales')) document.getElementById('total-sales').textContent = formatCurrency(totalSales);
    if (document.getElementById('total-collected')) document.getElementById('total-collected').textContent = formatCurrency(totalCollected);
    if (document.getElementById('total-due')) document.getElementById('total-due').textContent = formatCurrency(totalDue);
    if (document.getElementById('sales-count')) document.getElementById('sales-count').textContent = filteredMonthSales.length;
    const progress = currentTarget > 0 ? Math.min((totalSales / currentTarget) * 100, 100) : 0;
    if (document.getElementById('target-amount-display')) document.getElementById('target-amount-display').textContent = formatCurrency(currentTarget);
    const progressBar = document.getElementById('target-progress-bar'); if (progressBar) progressBar.style.width = `${progress}%`;
    if (document.getElementById('target-progress-text')) document.getElementById('target-progress-text').textContent = `${Math.round(progress)}%`;
    const recentSalesList = document.getElementById('recent-sales-list'); if (recentSalesList) recentSalesList.innerHTML = '';
    let recentSales = [...currentMonthSales].reverse();
    if (selectedRepName) { recentSales = recentSales.filter(s => s.repName === selectedRepName); }
    recentSales = recentSales.slice(0, 5);
    if (!recentSalesList) return;
    if (recentSales.length === 0) { recentSalesList.innerHTML = '<p class="text-gray-500 text-center">لا توجد عمليات بيع بعد.</p>'; return; }
    recentSales.forEach(sale => { const customer = findCustomer(sale.customerId); 
    // NEW: Return detection for dashboard recent sales
    const isReturn = sale.total < 0;
    const totalAmountClass = isReturn ? 'text-red-700' : 'text-green-700';

    const el = document.createElement('div'); el.className = 'bg-gray-50 p-3 rounded-lg flex justify-between items-center'; 
    el.innerHTML = `<div><p class="font-bold">${customer && customer.name ? customer.name : (sale.customerName || 'غير معروف')}</p><p class="text-sm text-gray-500"><bdo dir="rtl">${formatArabicDateTime(sale.date)}</bdo></p><p class="text-xs text-blue-600 pt-1">${sale.repName || ''}</p></div><div class="text-left space-y-1"><p class="font-bold ${totalAmountClass}">${formatCurrency(sale.total)}</p>${getStatusBadge(sale.status)}</div>`; recentSalesList.appendChild(el); }); updateIcons();
}

// --- CHART RENDERING FUNCTIONS ---

// Helper function to filter sales by active period
function getActivePeriodSales() {
    const activePeriod = state.activePeriod || '';
    if (!activePeriod) return state.sales || [];
    
    return (state.sales || []).filter(sale => {
        try {
            const saleDate = sale.date ? new Date(sale.date) : null;
            if (!saleDate || isNaN(saleDate.getTime())) return false;
            const saleYearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
            return saleYearMonth === activePeriod;
        } catch (_) {
            return false;
        }
    });
}

function getSalesDataForLast7Days() { 
    // تغيير: عرض المبيعات اليومية للشهر النشط بدلاً من آخر 7 أيام
    const activePeriod = state.activePeriod || '';
    if (!activePeriod) return { labels: [], data: [] };
    
    const [year, month] = activePeriod.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dataMap = new Map();
    const labels = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        labels.push(String(day));
        dataMap.set(dateString, 0);
    }
    
    const monthSales = getActivePeriodSales();
    monthSales.forEach(sale => {
        try {
            const sd = sale.date ? new Date(sale.date) : null;
            if (!sd || isNaN(sd.getTime())) return;
            const saleDateString = sd.toISOString().split('T')[0];
            if (dataMap.has(saleDateString)) {
                dataMap.set(saleDateString, dataMap.get(saleDateString) + (Number(sale.total) || 0));
            }
        } catch (_) { }
    });
    return { labels, data: Array.from(dataMap.values()) }; 
}
function getTopRepsData(count = 5) { 
    const monthSales = getActivePeriodSales();
    const repSalesMap = new Map(); 
    monthSales.forEach(sale => { 
        const repName = sale.repName || 'غير محدد'; 
        repSalesMap.set(repName, (repSalesMap.get(repName) || 0) + sale.total); 
    }); 
    const sortedReps = Array.from(repSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, count); 
    return { labels: sortedReps.map(r => r[0]), data: sortedReps.map(r => r[1]) }; 
}
function getTopProductsData(count = 5) {
    const productQtyMap = new Map();
    const monthSales = getActivePeriodSales();
    monthSales.forEach(sale => {
        try {
            const items = Array.isArray(sale.items) ? sale.items : [];
            items.forEach(item => {
                try {
                    const qty = Number(item && item.quantity ? item.quantity : 0) || 0;
                    const product = findProduct(item && item.productId);
                    const productName = product && product.name ? product.name : (item && item.name ? item.name : 'منتج محذوف');
                    productQtyMap.set(productName, (productQtyMap.get(productName) || 0) + qty);
                } catch (_) { /* ignore item */ }
            });
        } catch (_) { /* ignore sale */ }
    });
    const sortedProducts = Array.from(productQtyMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, count);
    return { labels: sortedProducts.map(p => p[0]), data: sortedProducts.map(p => p[1]) };
}
function getTopCustomersData(count = 5) { 
    const monthSales = getActivePeriodSales();
    const customerSalesMap = new Map(); 
    monthSales.forEach(sale => { 
        const customer = findCustomer(sale.customerId); 
        const customerName = customer ? customer.name : 'عميل محذوف'; 
        customerSalesMap.set(customerName, (customerSalesMap.get(customerName) || 0) + sale.total); 
    }); 
    const sortedCustomers = Array.from(customerSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, count); 
    return { labels: sortedCustomers.map(c => c[0]), data: sortedCustomers.map(c => c[1]) }; 
}
function createOrUpdateChart(chartInstance, canvasId, type, data, options) { 
     if (chartInstance) { chartInstance.data.labels = data.labels; chartInstance.data.datasets[0].data = data.data; chartInstance.update(); return chartInstance; }
     const ctx = document.getElementById(canvasId)?.getContext('2d'); 
     if (!ctx) return null; // Add check for context
     return new Chart(ctx, { type: type, data: { labels: data.labels, datasets: [{ label: options.label || 'القيمة', data: data.data, backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.5)', borderColor: options.borderColor || 'rgba(59, 130, 246, 1)', borderWidth: options.borderWidth || 1, tension: 0.3, ...options.datasetOverrides }] }, options: { responsive: true, maintainAspectRatio: false, rtl: true, plugins: { legend: { labels: { font: { family: 'Cairo' } } } }, scales: { x: { reverse: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.xTitle, text: options.xTitle, font: { family: 'Cairo' } } }, y: { beginAtZero: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.yTitle, text: options.yTitle, font: { family: 'Cairo' } } } }, ...options.overrides } }); 
}
function renderSales7DaysChart() { const data = getSalesDataForLast7Days(); sales7DaysChart = createOrUpdateChart(sales7DaysChart, 'sales-7-days-chart', 'line', data, { label: 'إجمالي المبيعات (ج.م)', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)', yTitle: 'المبيعات (ج.م)', datasetOverrides: { fill: true } }); }
function renderTopRepsChart() { const data = getTopRepsData(5); topRepsChart = createOrUpdateChart(topRepsChart, 'top-reps-chart', 'bar', data, { label: 'قيمة المبيعات (ج.م)', backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: 'rgba(16, 185, 129, 1)', yTitle: 'قيمة المبيعات', overrides: { indexAxis: 'y' } }); }
function renderTopProductsChart() { const data = getTopProductsData(5); topProductsChart = createOrUpdateChart(topProductsChart, 'top-products-chart', 'bar', data, { label: 'الكمية (قطع)', backgroundColor: 'rgba(234, 179, 8, 0.7)', borderColor: 'rgba(234, 179, 8, 1)', yTitle: 'الكمية', overrides: { indexAxis: 'y' } }); }
function renderTopCustomersChart() { const data = getTopCustomersData(5); topCustomersChart = createOrUpdateChart(topCustomersChart, 'top-customers-chart', 'doughnut', data, { label: 'قيمة المبيعات (ج.م)', backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'], borderColor: '#fff', overrides: { parsing: { key: 'data' } }, datasetOverrides: { hoverOffset: 4 } }); }
// --- END CHART FUNCTIONS ---

async function salesListClickHandler(e) {
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    // --- Manual Review Highlighting ---
    const reviewCell = e.target.closest('.invoice-cell'); 
    if (reviewCell) {
        const invoiceSpan = reviewCell.closest('.invoice-review-span');
        if (invoiceSpan) {
            const saleId = invoiceSpan.dataset.id;
            toggleReviewColor(saleId, reviewCell);
            return; // Stop further execution to prevent other buttons from firing
        }
    }

    const editBtn = e.target.closest('.edit-sale-btn');
    const deleteBtn = e.target.closest('.delete-sale-btn');
    const printBtn = e.target.closest('.print-sale-btn');
    const shareImageBtn = e.target.closest('.share-sale-image-btn');
    const etaUploadBtn = e.target.closest('.eta-upload-btn');
    const approveBtn = e.target.closest('.review-sale-btn');
    const reviewOpenBtn = e.target.closest('.review-open-btn');
    const taxToggleBtn = e.target.closest('.tax-status-toggle-btn');

    if (approveBtn) {
        if (role !== 'admin') { await customDialog({ title:'غير مصرح', message:'اعتماد الفاتورة من صلاحيات المشرف فقط.' }); return; }
        try {
            const saleId = approveBtn.getAttribute('data-id');
            await updateSale(saleId, { reviewStatus: 'reviewed' });
        } catch(err){ console.warn('approve review failed', err); }
        return;
    }

    if (reviewOpenBtn) {
        const saleId = reviewOpenBtn.getAttribute('data-id');
        openSaleModal(saleId);
        // بعد فتح المودال، أضف زر اعتماد داخلي إن لزم
        setTimeout(() => {
            try {
                const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
                const sale = (state.sales||[]).find(s=>s.id===saleId);
                if (sale && sale.reviewStatus === 'pending' && (role === 'admin')) {
                    const modal = document.getElementById('sale-modal');
                    if (modal && !modal.querySelector('.modal-review-approve-btn')) {
                        const footer = modal.querySelector('form') || modal;
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'modal-review-approve-btn mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1';
                        btn.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> اعتماد الفاتورة';
                        footer.appendChild(btn);
                        btn.addEventListener('click', async ()=>{
                            try { await updateSale(saleId, { reviewStatus: 'reviewed' }); closeModal(modal); } catch(e){ alert('تعذر الاعتماد'); }
                        });
                        updateIcons();
                    }
                }
            } catch(_){ }
        }, 120);
        return;
    }

    if (editBtn) {
        const saleId = editBtn.dataset.id;
        if (role === 'rep') {
            try {
                const current = AuthSystem.getCurrentUser();
                const sale = (state.sales||[]).find(s=>s.id===saleId);
                
                // 1. Ownership Check: Ensure sale belongs to current user
                const mine = sale && (String(sale.createdBy||'') === String(current?.id||'') || String(sale.repId||'') === String(current?.id||''));
                if (!mine) {
                    await customDialog({ title:'غير مصرح', message:'ليست هذه فاتورتك.' });
                    return;
                }
                
                // 2. Robust Date Parsing: Handle Firestore Timestamp vs string
                let createdTime = null;
                if (sale && sale.createdAt) {
                    if (typeof sale.createdAt.toDate === 'function') {
                        // Firestore Timestamp
                        createdTime = sale.createdAt.toDate();
                    } else {
                        // Try parsing as string/number
                        createdTime = new Date(sale.createdAt);
                    }
                }
                
                // 3. Time Limit: Check if within 15 minutes window
                const ageMs = createdTime ? (Date.now() - createdTime.getTime()) : Infinity;
                const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
                if (ageMs > EDIT_WINDOW_MS) {
                    await customDialog({ title:'انتهت مهلة التعديل', message:'انتهت فترة التعديل (15 دقيقة). لا يمكن تعديل الفاتورة بعد ذلك.' });
                    return;
                }
                
                // 4. Review Status: Ensure not already reviewed
                if (sale.reviewStatus === 'reviewed') {
                    await customDialog({ title:'فاتورة معتمدة', message:'لا يمكن تعديل فاتورة معتمدة بالفعل.' });
                    return;
                }
                
                // All checks passed - open the modal
                openSaleModal(saleId);
            } catch(err) {
                console.warn('Edit button error:', err);
                await customDialog({ title:'خطأ', message:'حدث خطأ أثناء فتح الفاتورة. حاول مرة أخرى.' });
            }
            return;
        }
        openSaleModal(saleId);
    }

    if (deleteBtn) {
        if (role === 'rep') { await customDialog({ title:'صلاحيات', message:'المندوب لا يملك صلاحية حذف الفواتير.' }); return; }
        const saleId = deleteBtn.dataset.id;
        const confirmed = await customDialog({
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد أنك تريد حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.',
            isConfirm: true,
            confirmText: 'نعم، احذف',
            confirmClass: 'bg-red-600 hover:bg-red-700'
        });

        if (confirmed) {
            try {
                await deleteSale(saleId);
                await customDialog({ message: 'تم حذف الفاتورة نهائياً من السحابة.' });
            } catch (err) {
                console.warn('Delete failed', err);
                await customDialog({ message: 'تعذر حذف الفاتورة من السحابة. تحقق من الصلاحيات/الاتصال.' });
            }
        }
    }

    if (printBtn) {
        const saleId = printBtn.getAttribute('data-id');
        try { await window.printSaleById(saleId); } catch(e){ console.warn('printSaleById failed', e); }
        return;
    }

    if (shareImageBtn) {
        const saleId = shareImageBtn.getAttribute('data-id');
        try { await window.shareSaleReceiptImage(saleId); } catch(e){ console.warn('shareSaleReceiptImage failed', e); }
        return;
    }

    if (etaUploadBtn) {
        const roleNow = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        if (roleNow !== 'admin') { await customDialog({ title:'غير مصرح', message:'هذا الإجراء مخصص للمشرف فقط.' }); return; }
        const saleId = etaUploadBtn.getAttribute('data-id');
        try { await window.uploadSaleToEta(saleId); } catch(e){ console.warn('uploadSaleToEta failed', e); }
        return;
    }
    
    
    if (taxToggleBtn) {
        const saleId = taxToggleBtn.dataset.id;
        const sale = state.sales.find(s => s.id === saleId);
        if (sale) {
            const currentStatus = sale.taxFilingStatus || '';
            const isFiled = currentStatus.trim().toLowerCase() === 'تم';
            
            const newStatus = isFiled ? '' : 'تم'; // Toggle status
            sale.taxFilingStatus = newStatus;
            sale.updatedAt = new Date().toISOString();
            
            renderAll(); // Re-render to show the change
            saveState(); // Persist the change
        }
    }
}

// Quick print button logic (asks for invoice number then prints AS IMAGE for thermal)
document.addEventListener('click', async function(e){
    const btn = e.target && (e.target.id === 'sales-quick-print-btn' || (e.target.closest && e.target.closest('#sales-quick-print-btn')));
    if (!btn) return;
    try {
        // Use the image-based thermal printing function
        await window.printAsImageForThermal();
    } catch(err){ 
        console.error('quick print failed', err); 
        alert('فشل الطباعة: ' + (err && err.message ? err.message : err));
    }
});

function renderAllSales(textFilter = '', dateFilter = '', taxStatusFilter = 'all', reviewFilterArg = null) {
     // --- SAFETY CHECK START ---
     if (!window.allSales) window.allSales = [];
     if (!window.sales) window.sales = [];
     if (!window.state) window.state = {};
     if (!Array.isArray(state.sales)) state.sales = [];
     // --- SAFETY CHECK END ---
     
     const salesList = document.getElementById('sales-list'); 
     salesList.innerHTML = '';
     // Defensive guards & debug to diagnose empty-sales regression
     try {
         console.debug('renderAllSales called', { textFilter, dateFilter, taxStatusFilter, stateSalesLength: Array.isArray(state.sales) ? state.sales.length : state.sales });
     } catch (e) { /* ignore console errors */ }

     if (!Array.isArray(state.sales)) state.sales = [];
     // Normalize filters
     textFilter = (textFilter || '').toString().trim();
     dateFilter = (dateFilter || '').toString().trim();

     let filteredSales = [...state.sales];
     // تصفية حسب المندوب الحالي إذا كان دوره مندوب
     let role = typeof getUserRole === 'function' ? getUserRole() : 'rep';
     let currentEmail = (window.auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : null;
     if (role === 'rep' && currentEmail) {
         // Find current rep's name for matching admin-created invoices
         const currentRep = (state.reps||[]).find(r => (r.email||'').toLowerCase() === currentEmail);
         const repName = currentRep?.name;
         
         filteredSales = filteredSales.filter(sale => {
             // Match by email OR by repName (for admin-created invoices)
             const matchByEmail = (sale.repEmail||'').toLowerCase() === currentEmail;
             const matchByName = repName && sale.repName === repName;
             return matchByEmail || matchByName;
         });
     }
    // Read review filter from DOM if not passed
    const reviewStatusFilter = reviewFilterArg || (document.getElementById('review-status-filter')?.value || 'all');

         // MONTHLY PERIOD FILTER (activePeriod) overrides single-day filter
         const activePeriod = (state && state.activePeriod) ? String(state.activePeriod) : '';
         if (activePeriod) {
             // Filter by year-month match
             filteredSales = filteredSales.filter(sale => {
                  try { return new Date(sale.date).toISOString().slice(0,7) === activePeriod; } catch(e){ return false; }
             });
             // Hide daily total (could implement monthly total later)
             try { document.getElementById('daily-total-container').classList.add('hidden'); } catch(e){}
         } else if (dateFilter) {
             // Fallback to legacy daily filter only when no activePeriod enforced
             const dailyFilteredSales = filteredSales.filter(sale => new Date(sale.date).toLocaleDateString('en-CA') === dateFilter);
             const dailyTotal = dailyFilteredSales.reduce((sum, s) => sum + s.total, 0);
             try {
                  document.getElementById('daily-total-amount').textContent = formatCurrency(dailyTotal);
                  document.getElementById('daily-total-container').classList.remove('hidden');
             } catch(e){}
             filteredSales = dailyFilteredSales;
         } else {
             try { document.getElementById('daily-total-container').classList.add('hidden'); } catch(e){}
         }

         // Fallbacks: if filtering yields nothing, show broader data
         if (activePeriod && filteredSales.length === 0) {
             console.warn('Monthly filter returned no sales; showing all sales until data loads');
             filteredSales = [...state.sales];
         }
         if (filteredSales.length === 0) {
             try {
                 const cached = JSON.parse(localStorage.getItem('cache_sales')||'[]');
                 if (Array.isArray(cached) && cached.length) filteredSales = cached;
             } catch(_){}
         }

     if (textFilter) { 
        const lowerCaseFilter = textFilter.toLowerCase(); 
        filteredSales = filteredSales.filter(sale => { 
            const customer = findCustomer(sale.customerId); 
            const customerNameMatch = customer && customer.name.toLowerCase().includes(lowerCaseFilter); 
            const invoiceNumberMatch = sale.invoiceNumber.toString().includes(lowerCaseFilter); 
            const totalMatch = sale.total.toString().includes(lowerCaseFilter) || formatCurrency(sale.total).includes(lowerCaseFilter); 
            return customerNameMatch || invoiceNumberMatch || totalMatch; 
        }); 
    }

    // --- Review status filter ---
    if (reviewStatusFilter === 'pending') {
        filteredSales = filteredSales.filter(s => String(s.reviewStatus||'').toLowerCase() === 'pending');
    } else if (reviewStatusFilter === 'reviewed') {
        filteredSales = filteredSales.filter(s => String(s.reviewStatus||'').toLowerCase() === 'reviewed');
    }
     
     if (taxStatusFilter === 'filed') {
        filteredSales = filteredSales.filter(sale => {
            const customer = findCustomer(sale.customerId);
            if (!customer || !customer.requiresTaxFiling) return false;
            return sale.taxFilingStatus && sale.taxFilingStatus.trim().toLowerCase() === 'تم';
        });
    } else if (taxStatusFilter === 'not-filed') {
        filteredSales = filteredSales.filter(sale => {
            const customer = findCustomer(sale.customerId);
            if (!customer || !customer.requiresTaxFiling) return false;
            return !sale.taxFilingStatus || sale.taxFilingStatus.trim().toLowerCase() !== 'تم';
        });
    }

    // --- NEW: Calculate and display total of what's being shown ---
    const filteredTotal = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const filteredTotalAmountEl = document.getElementById('filtered-total-amount');
    if (filteredTotalAmountEl) {
        filteredTotalAmountEl.textContent = formatCurrency(filteredTotal);
    }
    const filteredCountEl = document.getElementById('filtered-total-count');
    if (filteredCountEl) {
        filteredCountEl.textContent = String(filteredSales.length);
    }
    // --- END NEW ---

     // ترتيب تصاعدي: الأقدم أولاً والأحدث في الأسفل
     try {
         filteredSales.sort((a,b)=>{
             const ta = new Date(a.date||0).getTime();
             const tb = new Date(b.date||0).getTime();
             return ta - tb;
         });
     } catch(_){ /* keep original order as fallback */ }

     if (filteredSales.length === 0) { 
         const cached = JSON.parse(localStorage.getItem('cache_sales')||'[]');
         if (Array.isArray(cached) && cached.length > 0) {
             console.warn('⚠️ renderAllSales: No filtered results; loading from localStorage cache');
             filteredSales = cached;
         } else {
             salesList.innerHTML = '<p class="text-gray-500 text-center mt-8">لا توجد فواتير تطابق بحثك.</p>'; 
             return; 
         }
     }
     
     const reviewState = loadReviewState();
     filteredSales.forEach((sale, index) => { 
        const customer = findCustomer(sale.customerId); 
        
        // NEW: Return Detection and Styling
        const isReturn = sale.total < 0;
        const badgeText = isReturn ? 'مرتجع' : 'فاتورة';
        const badgeColor = isReturn ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
        // Avoid using undefined `index` here — this function doesn't have a row index.
        // Use a stable default background for sales; UI alternating row coloring is handled elsewhere.
        const saleBgColor = isReturn ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
        const totalAmountClass = (String(sale.reviewStatus||'').toLowerCase() === 'pending') ? 'text-red-700' : (isReturn ? 'text-red-700' : 'text-blue-700');
        
        const itemsList = (Array.isArray(sale.items) ? sale.items : []).map((item, itemIndex) => { 
            const product = findProduct(item.productId); 
            const itemName = product ? product.name : 'منتج محذوف'; 
            const itemDiscountFactor = (1 - (item.discountPercent || 0) / 100);
            const itemBase = (item.quantity || 0) * (item.price || 0) * itemDiscountFactor;
            const productVatRate = (product && product.vat_rate) ? Number(product.vat_rate) / 100 : 0;
            const itemTax = round2(itemBase * productVatRate);
            const itemTotal = round2(itemBase + itemTax);
            const itemCode = product ? product.id : 'N/A'; 
            // Use totalAmountClass for item total display color as well if it's a return
            const itemTotalColorClass = isReturn ? 'text-red-700' : 'text-pink-700';

            // Determine if this item was adjusted (entered price differs from expected)
            try {
                const prodForCheck = findProduct(item.productId) || {};
                let expectedP = (prodForCheck.price != null) ? Number(prodForCheck.price) : 0;
                try { const cust = findCustomer(sale.customerId); if (cust && cust.priceListId) { const pl = findPriceList(cust.priceListId); if (pl && pl.productPrices && pl.productPrices[item.productId] !== undefined) expectedP = Number(pl.productPrices[item.productId]); } } catch(_){ }
                try { const promo = getActivePromotionPrice(item.productId, sale.customerId); if (promo !== null && promo !== undefined) expectedP = Number(promo); } catch(_){ }
                const priceDiff = Math.abs((Number(item.price) || 0) - (Number(expectedP) || 0));
                const showAdjusted = (item && item.adjusted === true) || (String(sale.reviewReason||'').toLowerCase() === 'adjusted');
                const priceCellClass = showAdjusted ? 'text-red-600 font-bold' : '';
                return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${itemName}</td><td class="text-center px-3 py-2 sale-item-code-cell">${itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${item.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${item.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell ${priceCellClass}">${formatCurrency(item.price)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(itemTotal)}</td></tr>`; 
            } catch(e) {
                return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${itemName}</td><td class="text-center px-3 py-2 sale-item-code-cell">${itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${item.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${item.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell">${formatCurrency(item.price)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(itemTotal)}</td></tr>`; 
            }
        }).join(''); 
        
        const customerRequiresFiling = customer?.requiresTaxFiling; 
        
        // +++ NEW: Get Tax Number HTML +++
        const customerTaxNumber = customer ? (customer.taxNumber || 'لا يوجد') : 'لا يوجد';
        const taxNumberHtml = `<div class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-center w-full">\r\n                           <p class="text-xs text-gray-700 font-semibold">الرقم الضريبي:</p>\r\n                           <p class="text-sm font-bold text-gray-900">${customerTaxNumber}</p>\r\n                           <a href="https://invoicing.eta.gov.eg/" target="_blank" class="text-xs text-blue-600 hover:underline">المنظومة الإلكترونية</a>\r\n\r\n                       </div>`;
        // +++ END NEW +++
        
        const el = document.createElement('div'); 
        
        // Use the calculated background color
        el.className = `${saleBgColor} p-4 rounded-xl border shadow-md mb-6 transition duration-300 hover:shadow-lg`; 
        
        el.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-4 gap-4">\r\n                    <div class="col-span-3">\r\n                        <p class="font-bold text-lg text-gray-800">\r\n                            ${customer ? customer.name : 'عميل محذوف'} \r\n                            <span class="text-xs font-semibold px-2 py-1 rounded-full ${badgeColor} mr-2">${badgeText}</span>\r\n                            ${sale.isAdminEntry ? `<span class="text-xs font-semibold px-2 py-1 rounded-full bg-purple-600 text-white mr-2" title="تم التسجيل بمعرفة: ${sale.recordedByName || 'إدارة'}"><i data-lucide="shield-check" class="w-3 h-3 inline ml-1"></i> إدارة</span>` : ''}\r\n                            ${customerRequiresFiling ? `<i data-lucide="file-text" class="w-4 h-4 inline text-orange-500 mr-2" title="يتطلب رفع ضريبي"></i>` : ''}\r\n                        </p>\r\n                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                    <span><i data-lucide="calendar" class="w-3 h-3 inline ml-1"></i> فاتورة بتاريخ: <span dir="ltr" style="unicode-bidi: bidi-override; display: inline;">${formatArabicDate(sale.date)}</span></span>
                    <span class="invoice-review-span" data-id="${sale.id}" title="اضغط للتلوين">
                        <i data-lucide="hash" class="w-3 h-3 inline ml-1"></i> رقم الفاتورة: 
                        <span class="invoice-cell text-red-600 font-bold ${reviewState[sale.id] || ''}">
                            ${sale.invoiceNumber || 'N/A'}
                        </span>
                    </span>
                    <span><i data-lucide="user" class="w-3 h-3 inline ml-1"></i> المندوب: <span class="text-blue-600 font-semibold">${sale.repName || 'غير محدد'}</span>${sale.isAdminEntry ? ` <span class="text-xs text-purple-600 font-semibold">(سجل بمعرفة: ${sale.recordedByName || 'إدارة'})</span>` : ''}</span>
                </div>\r\n                        <div class="overflow-x-auto mt-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg shadow-inner">\r\n                            <table class="sale-items-table min-w-full">\r\n                                <thead>\r\n                                    <tr class="text-xs">\r\n                                        <th class="w-2/6 px-3 py-2 text-right">الصنف</th>\r\n                                        <th class="w-1/6 px-3 py-2 text-center">الكود</th>\r\n                                        <th class="w-1/6 text-center px-3 py-2">الكمية</th>\r\n                                        <th class="w-1/6 text-center px-3 py-2">السعر</th>\r\n                                        <th class="w-1/6 text-center px-3 py-2">الإجمالي</th>\r\n                                    </tr>\r\n                                </thead>\r\n                                <tbody>${itemsList}</tbody>\r\n                            </table>\r\n                        </div>\r\n                        <div class="flex gap-4 mt-3 pt-3 border-t">\r\n                            <button data-id="${sale.id}" class="edit-sale-btn text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"><i data-lucide="edit" class="w-4 h-4"></i> تعديل</button>\r\n                            <button data-id="${sale.id}" class="delete-sale-btn text-sm flex items-center gap-1 text-red-600 hover:text-red-800"><i data-lucide="trash-2" class="w-4 h-4"></i> حذف</button>\r\n                        </div>\r\n                    </div>\r\n                    <div class="col-span-1 border-r pr-4 flex flex-col justify-start items-center text-center pt-2">\r\n                        <h4 class="text-sm font-semibold text-gray-600 mb-1">الإجمالي النهائي</h4>\r\n                        <p class="font-bold text-2xl ${totalAmountClass}">${formatCurrency(sale.total)}</p>\r\n                        <div class="flex flex-col gap-1 items-center mt-3">\r\n                            ${getTaxStatusBadge(sale)}\r\n                            ${getStatusBadge(sale.status)}\r\n                        </div>\r\n                        ${taxNumberHtml} <!-- NEW: Inserted variable here -->\r\n                        ${sale.discount > 0 ? `<div class="mt-2 text-xs text-red-600">خصم: ${sale.discount}%</div>` : ''}\r\n                    </div>\r\n                </div>`; 
        try {
            const sideCol = el.querySelector('.col-span-1.border-r.pr-4.flex.flex-col.justify-start.items-center.text-center.pt-2');
            const roleSide = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (sideCol) {
                const printBtnEl = document.createElement('button');
                printBtnEl.setAttribute('data-id', sale.id);
                printBtnEl.className = 'print-sale-btn mb-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                printBtnEl.innerHTML = '<i data-lucide="printer" class="w-4 h-4"></i> طباعة';
                sideCol.insertBefore(printBtnEl, sideCol.firstChild);

                const shareBtnEl = document.createElement('button');
                shareBtnEl.setAttribute('data-id', sale.id);
                shareBtnEl.className = 'share-sale-image-btn mb-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                shareBtnEl.innerHTML = '<i data-lucide="share-2" class="w-4 h-4"></i> صورة';
                sideCol.insertBefore(shareBtnEl, sideCol.firstChild.nextSibling); // after print

                // USB/Direct Print button (third button)
                const usbPrintBtnEl = document.createElement('button');
                usbPrintBtnEl.setAttribute('data-id', sale.id);
                usbPrintBtnEl.className = 'usb-print-sale-btn mb-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                usbPrintBtnEl.innerHTML = '<i data-lucide="printer" class="w-4 h-4"></i> USB';
                sideCol.insertBefore(usbPrintBtnEl, sideCol.firstChild.nextSibling.nextSibling); // after share

                // Bluetooth print button (fourth button)
                const btPrintBtnEl = document.createElement('button');
                btPrintBtnEl.setAttribute('data-id', sale.id);
                btPrintBtnEl.className = 'bt-print-sale-btn mb-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                btPrintBtnEl.innerHTML = '<i class="bi bi-bluetooth"></i> بلوتوث';
                sideCol.insertBefore(btPrintBtnEl, sideCol.firstChild.nextSibling.nextSibling.nextSibling); // after USB

                // RawBT Android Direct Print button (fifth button)
                const rawbtPrintBtnEl = document.createElement('button');
                rawbtPrintBtnEl.setAttribute('data-id', sale.id);
                rawbtPrintBtnEl.className = 'rawbt-print-sale-btn mb-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1';
                rawbtPrintBtnEl.innerHTML = '<i class="bi bi-phone-vibrate"></i> هاتف';
                sideCol.insertBefore(rawbtPrintBtnEl, sideCol.firstChild.nextSibling.nextSibling.nextSibling.nextSibling); // after bluetooth

                // تمت إزالة زر الإرسال للضرائب الخارجي؛ يبقى فقط داخل المودال
            }
        } catch(e){}
        try {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (sale && String(sale.reviewStatus||'').toLowerCase() === 'pending') {
                // Determine why it's pending: adjusted-price vs legacy/manual pending
                const isAdjustedPending = (String(sale.reviewReason||'').toLowerCase() === 'adjusted') || (Array.isArray(sale.items) && sale.items.some(it => it && it.adjusted));

                if (isAdjustedPending) {
                    // Visual highlight: red border for price-adjusted pending reviews
                    try { el.classList.add('ring-2','ring-red-400'); } catch(_){ }
                } else {
                    // Legacy pending (non-price-adjust) uses yellow ring as before
                    try { el.classList.add('ring-2','ring-yellow-300'); } catch(_){ }
                }

                // Add pending badge inside status area (color depends on reason)
                const statusArea = el.querySelector('.flex.flex-col.gap-1.items-center.mt-3');
                if (statusArea) {
                    const pendingTag = document.createElement('span');
                    if (isAdjustedPending) {
                        pendingTag.className = 'text-xs font-semibold bg-red-100 text-red-800 rounded-full px-2 py-0.5';
                        pendingTag.setAttribute('title', 'قيد المراجعة — سعر معدل');
                    } else {
                        pendingTag.className = 'text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5';
                        pendingTag.setAttribute('title', 'قيد المراجعة');
                    }
                    pendingTag.innerHTML = '<i data-lucide="clock" class="w-3 h-3 inline ml-1"></i> قيد المراجعة';
                    statusArea.appendChild(pendingTag);
                }

                // Add approve button for admin only (reviewer/manager are view-only)
                if (role === 'admin') {
                    const actions = el.querySelector('.flex.gap-4.mt-3.pt-3.border-t');
                    if (actions) {
                        const approve = document.createElement('button');
                        approve.setAttribute('data-id', sale.id);
                        approve.className = 'review-sale-btn text-sm flex items-center gap-1 text-green-700 hover:text-green-900';
                        approve.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> اعتماد';
                        actions.appendChild(approve);
                    }
                }
            }
            // Wire action buttons (print / share / bluetooth)
            try {
                const printBtn = el.querySelector('.print-sale-btn');
                if (printBtn) printBtn.addEventListener('click', async (evt) => { 
                    evt.preventDefault(); 
                    try { 
                        // استخدام الطباعة بالصورة مباشرة (أسرع وأفضل للطابعات الحرارية)
                        await window.printAsImageForThermal(sale);
                    } catch(e){ 
                        console.error('print error', e);
                        alert('فشل الطباعة: ' + (e.message || e));
                    }
                });
                const shareBtn = el.querySelector('.share-sale-image-btn');
                if (shareBtn) shareBtn.addEventListener('click', async (evt) => { evt.preventDefault(); try { await window.exportSaleImageById(sale.id); } catch(e){ console.warn('exportSaleImageById error', e);} });
                
                // USB/Direct Print button
                const usbBtn = el.querySelector('.usb-print-sale-btn');
                if (usbBtn) usbBtn.addEventListener('click', async (evt) => {
                    evt.preventDefault();
                    try {
                        if (typeof printViaUSB === 'function') {
                            await printViaUSB(sale);
                        } else {
                            alert('دالة الطباعة عبر USB غير متوفرة');
                        }
                    } catch(e) {
                        console.warn('USB print error', e);
                        alert('خطأ في الطباعة عبر USB: ' + (e && e.message));
                    }
                });
                
                const btBtn = el.querySelector('.bt-print-sale-btn');
                if (btBtn) btBtn.addEventListener('click', async (evt) => { 
                    evt.preventDefault(); 
                    try { 
                        showPrintPreviewModal(sale, () => { 
                            if (typeof window.smartMobilePrintInvoice === 'function') {
                                window.smartMobilePrintInvoice(sale);
                            } else if (typeof performBluetoothPrint === 'function') {
                                performBluetoothPrint(sale);
                            } else if (typeof printInvoiceViaBluetooth === 'function') {
                                printInvoiceViaBluetooth(sale);
                            } else if (typeof printInvoiceBluetooth === 'function') {
                                printInvoiceBluetooth(sale);
                            } else {
                                alert('دالة الطباعة عبر البلوتوث غير متوفرة');
                            }
                        }); 
                    } catch(e){ console.warn('bt print error', e); alert('خطأ في الطباعة عبر البلوتوث: '+(e&&e.message)); } 
                });
                const rawbtBtn = el.querySelector('.rawbt-print-sale-btn');
                if (rawbtBtn) rawbtBtn.addEventListener('click', async (evt) => { 
                    evt.preventDefault(); 
                    try { 
                        if (typeof printInvoiceViaBluetooth === 'function') {
                            await printInvoiceViaBluetooth(sale);
                        } else {
                            alert('دالة طباعة البلوتوث غير متوفرة');
                        }
                    } catch(e){ 
                        console.warn('bluetooth print error', e); 
                        alert('خطأ في الطباعة عبر البلوتوث: '+(e&&e.message)); 
                    } 
                });
            } catch(e){ console.warn('wiring sale action buttons failed', e); }
            // Tax upload status badge
            try {
                const statusArea2 = el.querySelector('.flex.flex-col.gap-1.items-center.mt-3');
                if (statusArea2 && sale) {
                    if (sale.taxUploadStatus === 'uploaded') {
                        const uploadedTag = document.createElement('span');
                        uploadedTag.className = 'text-xs font-semibold bg-green-100 text-green-800 rounded-full px-2 py-0.5 flex items-center gap-1';
                        uploadedTag.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> رفع ضريبي ناجح';
                        statusArea2.appendChild(uploadedTag);
                    } else if (sale.taxUploadStatus === 'error') {
                        const errorTag = document.createElement('span');
                        errorTag.className = 'text-xs font-semibold bg-red-100 text-red-700 rounded-full px-2 py-0.5 flex items-center gap-1';
                        errorTag.innerHTML = '<i data-lucide="alert-triangle" class="w-3 h-3"></i> فشل الرفع';
                        statusArea2.appendChild(errorTag);
                    }
                }
            } catch(_){ }
        } catch(_){ }
        salesList.appendChild(el); 
    }); 
    updateIcons();
}

function renderCustomers(filter = '') {
    const customersList = document.getElementById('customers-list');
    customersList.innerHTML = '';
    const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
    const currentUser = AuthSystem.getCurrentUser();
    const filteredCustomers = (state.customers||[]).filter(c => {
        if (!c || !c.name) return false;
        if (!c.name.toLowerCase().includes(filter.toLowerCase())) return false;
        if (role === 'admin') return true;
        if (role === 'rep' && currentUser) {
            const assigned = c.assignedRepId || '';
            // المندوب: عرض عملائه أو غير المُعيّنين، بدون إدارة
            return !assigned || assigned === currentUser.id;
        }
        return true; // أدوار أخرى
    });
    if (filteredCustomers.length === 0) {
        customersList.innerHTML = '<p class="text-gray-500 text-center mt-8">لا يوجد عملاء. اضغط على زر "إضافة عميل" للبدء.</p>';
        return;
    }
    filteredCustomers.forEach(customer => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg border shadow-sm';
        const address = customer.address || '';
        const isLink = address.startsWith('http');
        const priceList = findPriceList(customer.priceListId);
        const repName = customer.repName || 'غير محدد';
        const taxRequired = customer.requiresTaxFiling;
        const cid = customer.id || customer._id || '';
        const assignedRepId = customer.assignedRepId || '';
        const isMine = assignedRepId && currentUser && currentUser.id === assignedRepId;
        const assignedBadge = assignedRepId
            ? (isMine ? '<span class="text-xs font-semibold bg-green-100 text-green-700 rounded-full px-2 py-0.5">مخصص لك</span>' : '<span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">مخصص</span>')
            : '<span class="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">غير مُعيّن</span>';
        const manageAllowed = (typeof canManageCustomer === 'function') ? canManageCustomer(customer) : true;
        let priceListInfoHTML = `<div class="mt-2"><span class="text-sm text-gray-800 bg-gray-100 rounded-full px-2 py-0.5">بدون قائمة أسعار</span></div>`;
        if (priceList) {
            const discountMatch = priceList.name.match(/\(خصم (.*?)%\)/);
            const baseName = discountMatch ? priceList.name.replace(discountMatch[0], '').trim() : priceList.name;
            let baseTag = `<span class="text-sm text-blue-800 bg-blue-100 rounded-full px-2 py-0.5">${baseName}</span>`;
            let discountTag = discountMatch ? ` <span class="text-sm text-red-800 bg-red-100 rounded-full px-2 py-0.5">خصم ${discountMatch[1]}%</span>` : '';
            priceListInfoHTML = `<div class="mt-2 flex flex-wrap gap-1 items-center">${baseTag}${discountTag}</div>`;
        }
        const taxTag = taxRequired ? `<span class="text-xs font-semibold bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i> يتطلب رفع ضريبي</span>` : '';
        // المندوب لا يملك صلاحية إدارة العملاء (لا تعيين/لا تعديل/لا حذف)
        const claimBtnHtml = (role === 'rep') ? '' : (!assignedRepId ? `<button data-id="${cid}" class="claim-customer-btn text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">تعيين لي</button>` : '');
        const actionsHtml = (role !== 'rep' && manageAllowed)
            ? `<div class="flex"><button data-id="${cid}" class="edit-customer-btn p-2 text-gray-500 hover:text-blue-600" title="تعديل"><i data-lucide="edit" class="w-5 h-5"></i></button><button data-id="${cid}" class="delete-customer-btn p-2 text-gray-500 hover:text-red-600" title="حذف"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`
            : `<div class="flex opacity-50 cursor-not-allowed" title="لا تملك صلاحية تعديل هذا العميل"><button data-id="${cid}" class="p-2 text-gray-400" disabled><i data-lucide="edit" class="w-5 h-5"></i></button><button data-id="${cid}" class="p-2 text-gray-400" disabled><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`;

        el.innerHTML = `<div class="flex justify-between items-start"><div><p class="font-bold text-lg">${customer.name} ${taxRequired ? `<i data-lucide=\"file-text\" class=\"w-4 h-4 inline text-orange-500 mr-2\" title=\"يتطلب رفع ضريبي\"></i>` : ''}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="landmark" class="w-3 h-3"></i> الرقم الضريبي: ${customer.taxNumber || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="phone" class="w-3 h-3"></i> ${customer.phone || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${isLink ? `<a href="${address}" target="_blank" class="text-blue-600 hover:underline">عرض على الخريطة</a>` : address || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="user" class="w-3 h-3"></i> المندوب: <span class="font-semibold text-gray-700">${repName}</span> ${assignedBadge}</p>${priceListInfoHTML}</div><div class="flex flex-col items-end gap-2">${taxTag}${claimBtnHtml}${actionsHtml}<button data-id="${cid}" class="ai-followup-btn text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-purple-200"><span>✨</span> رسالة متابعة</button></div></div>`;
        customersList.appendChild(el);
    });
    updateIcons();
}

// --- ETA TAX INTEGRATION STUBS & HELPERS ---
const taxConfig = {
    vatStandardRate: 0.14,
    taxCodes: {
        T1: { description: 'Value Added Tax', subTypes: { V009: 'General Item sales', V003: 'Exempted good or service' } },
        T4: { description: 'Withholding Tax', subTypes: { W004: 'Services' } }
    },
    uom: { EA: 'Each', KGM: 'Kilogram', LTR: 'Liter', BOX: 'Box', DZ: 'Dozen', M: 'Meter', H: 'Hour', MIN: 'Minute' }
};

// Chain Management (cloud-backed storage)
const CHAINS_LS_KEY = 'customerChains';
function loadChains() { 
    // Load from state.chains (cloud-backed), fallback to localStorage for migration
    if (Array.isArray(state.chains)) return state.chains;
    try { 
        const raw = localStorage.getItem(CHAINS_LS_KEY); 
        const arr = raw ? JSON.parse(raw) : []; 
        if (Array.isArray(arr) && arr.length > 0) {
            // Migrate from localStorage to state
            state.chains = arr;
            saveState();
            console.log('📦 Migrated chains from localStorage to cloud');
        }
        return Array.isArray(arr) ? arr : []; 
    } catch(e){ return []; } 
}
function saveChains(chains){ 
    try{ 
        state.chains = chains || [];
        localStorage.setItem(CHAINS_LS_KEY, JSON.stringify(chains || [])); 
        saveState(); // Save to cloud
        console.log('✅ Chains saved to cloud and localStorage');
    } catch(e){ console.warn('saveChains failed', e); } 
}

function renderChainsDisplay(){
    const chains = loadChains();
    const container = document.getElementById('chains-display');
    if(!container) return;
    if(chains.length === 0) { container.innerHTML = ''; return; }
    
    container.innerHTML = '<div class="bg-blue-50 border border-blue-200 rounded p-3"><div class="text-sm font-semibold mb-2">السلاسل المحفوظة:</div><div class="space-y-2"></div></div>';
    const chainList = container.querySelector('.space-y-2');
    chains.forEach(chain => {
        const customerNames = chain.customerIds.map(cid => { const c = findCustomer(cid); return c ? c.name : cid; }).join(', ');
        const badge = document.createElement('div');
        badge.className = 'flex justify-between items-center bg-white p-2 rounded border border-blue-200 text-sm';
        badge.innerHTML = `
            <div class="cursor-pointer flex-1" data-view-chain-id="${chain.id}"><span class="font-medium text-blue-600 hover:underline">${(chain.name||'').replace(/</g,'&lt;')}</span><br><span class="text-xs text-gray-600">${customerNames || 'بدون عملاء'}</span></div>
            <div class="flex gap-1">
                <button data-chain-id="${chain.id}" class="edit-chain-btn px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">تعديل</button>
                <button data-chain-id="${chain.id}" class="delete-chain-btn px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">حذف</button>
            </div>
        `;
        chainList.appendChild(badge);
    });
}

function openViewChainModal(chainId){
    const chains = loadChains();
    const chain = chains.find(c => c.id === chainId);
    if(!chain) return;
    
    const modal = document.createElement('div');
    modal.id = 'view-chain-modal';
    modal.style.position = 'fixed'; modal.style.left = '0'; modal.style.top = '0'; modal.style.right = '0'; modal.style.bottom = '0'; modal.style.zIndex = '9999';
    
    const customerNames = chain.customerIds.map(cid => { const c = findCustomer(cid); return c ? c.name : cid; });
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40" id="view-chain-backdrop"></div>
        <div class="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-2/3 lg:w-1/2 bg-white rounded shadow-lg p-4 z-50">
            <h3 class="font-semibold mb-3">السلسلة: ${(chain.name||'').replace(/</g,'&lt;')}</h3>
            <div class="mb-4"><label class="block text-sm font-medium mb-2">العملاء في هذه السلسلة:</label><div class="border rounded p-3 bg-gray-50">${customerNames.length > 0 ? customerNames.map(n => `<div class="py-1 text-sm">• ${n}</div>`).join('') : '<div class="text-sm text-gray-500">بدون عملاء</div>'}</div></div>
            <div class="flex justify-end gap-2"><button id="view-chain-edit-btn" data-chain-id="${chainId}" class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">تعديل</button><button id="view-chain-close-btn" class="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">إغلاق</button></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#view-chain-close-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#view-chain-backdrop')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#view-chain-edit-btn')?.addEventListener('click', function(){ 
        modal.remove(); 
        openAddChainModal(chainId); 
    });
}

function openAddChainModal(chainId){
    const chains = loadChains();
    const editChain = chainId ? chains.find(c => c.id === chainId) : null;
    const modal = document.createElement('div');
    modal.id = 'add-chain-modal';
    modal.style.position = 'fixed'; modal.style.left = '0'; modal.style.top = '0'; modal.style.right = '0'; modal.style.bottom = '0'; modal.style.zIndex = '9999';
    
    const title = editChain ? 'تعديل السلسلة' : 'إضافة سلسلة جديدة';
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black/40" id="add-chain-backdrop"></div>
        <div class="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-2/3 lg:w-1/2 bg-white rounded shadow-lg p-4 z-50 max-h-80 overflow-y-auto">
            <h3 class="font-semibold mb-3">${title}</h3>
            <div class="mb-3"><label class="block text-sm font-medium mb-1">اسم السلسلة</label><input id="chain-name-input" class="w-full p-2 border rounded" placeholder="اسم السلسلة" value="${editChain ? (editChain.name||'').replace(/"/g,'&quot;') : ''}"></div>
            <div class="mb-3"><label class="block text-sm font-medium mb-1">العملاء:</label><div id="chain-customers-list" class="max-h-48 overflow-y-auto border rounded p-2 bg-gray-50"></div></div>
            <div class="flex justify-end gap-2"><button id="chain-cancel-btn" class="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">إلغاء</button><button id="chain-save-btn" class="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">حفظ</button></div>
        </div>
    `;
    document.body.appendChild(modal);

    // populate customers
    const listWrap = modal.querySelector('#chain-customers-list');
    const customers = Array.isArray(state.customers) ? state.customers : [];
    if (customers.length === 0) listWrap.innerHTML = '<div class="text-sm text-gray-500">لا يوجد عملاء</div>';
    else {
        const selected = editChain ? (editChain.customerIds || []) : [];
        listWrap.innerHTML = customers.map(c => `<label class="flex items-center gap-2 p-2 hover:bg-blue-100 rounded"><input type="checkbox" data-cid="${c.id}" ${selected.includes(c.id) ? 'checked' : ''} /> <span class="text-sm">${(c.name||'').replace(/</g,'&lt;')}</span></label>`).join('');
    }

    // handlers
    modal.querySelector('#chain-cancel-btn').addEventListener('click', closeAddChainModal);
    modal.querySelector('#add-chain-backdrop')?.addEventListener('click', closeAddChainModal);
    modal.querySelector('#chain-save-btn').addEventListener('click', function(){
        const name = (modal.querySelector('#chain-name-input').value||'').trim();
        if (!name) { alert('الرجاء إدخال اسم السلسلة'); return; }
        const checked = Array.from(modal.querySelectorAll('input[type=checkbox][data-cid]:checked')).map(cb=>cb.getAttribute('data-cid'));
        const allChains = loadChains();
        if (editChain) {
            const idx = allChains.findIndex(c => c.id === editChain.id);
            if(idx >= 0) { allChains[idx].name = name; allChains[idx].customerIds = checked; }
        } else {
            const id = 'chain-' + Date.now().toString(36);
            allChains.push({ id, name, customerIds: checked });
        }
        saveChains(allChains);
        closeAddChainModal();
        renderChainsDisplay();
    });
}
function closeAddChainModal(){ const m = document.getElementById('add-chain-modal'); if(m) m.remove(); }

// wire the Add Chain button and edit/delete handlers
document.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('#add-chain-btn')) { openAddChainModal(); }
    const viewDiv = e.target.closest('[data-view-chain-id]');
    if(viewDiv) { const chainId = viewDiv.getAttribute('data-view-chain-id'); openViewChainModal(chainId); }
    const editBtn = e.target.closest('.edit-chain-btn');
    if(editBtn) { const chainId = editBtn.getAttribute('data-chain-id'); openAddChainModal(chainId); }
    const delBtn = e.target.closest('.delete-chain-btn');
    if(delBtn) {
        const chainId = delBtn.getAttribute('data-chain-id');
        if(confirm('حذف هذه السلسلة؟')) {
            let chains = loadChains();
            chains = chains.filter(c => c.id !== chainId);
            saveChains(chains);
            renderChainsDisplay();
        }
    }
});

// Render chains on page load
function initializeChainsDisplay() { renderChainsDisplay(); }



// Stable canonicalization per ITIDA rules (alphabetic field ordering, drop null/empty, recurse)
function stableCanonical(value) {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== 'object') {
        if (value === '') return undefined; // drop empty strings
        return value; // primitive
    }
    if (Array.isArray(value)) {
        const arr = value.map(v => stableCanonical(v)).filter(v => v !== undefined);
        return arr;
    }
    // Object: sort keys alphabetically
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) {
        const v = stableCanonical(value[k]);
        if (v !== undefined) out[k] = v;
    }
    return out;
}

async function sha256Utf8Canonical(obj) {
    const canonicalObj = stableCanonical(obj);
    const json = JSON.stringify(canonicalObj);
    const enc = new TextEncoder();
    const data = enc.encode(json);
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Discount rule placeholder (requires official clarification): beforeVAT or afterVAT
let discountRule = 'beforeVAT'; // TODO: confirm officially

function computeLineTotals(item, vatRate) {
    const qty = Number(item.quantity || 0);
    const unitPrice = Number(item.price || 0);
    const discountPercent = Number(item.discountPercent || 0);
    let base = unitPrice * qty;
    if (discountRule === 'beforeVAT') {
        base = base * (1 - discountPercent/100);
    }
    const taxAmount = base * vatRate;
    const total = base + taxAmount;
    return { base: round2(base), taxAmount: round2(taxAmount), total: round2(total) };
}

function round2(n){ return Math.round((n + Number.EPSILON)*100)/100; }

// Transform internal sale to ETA invoice JSON (unsigned)
function transformSaleToEtaInvoice(sale) {
        const taxId = '762878835'; // Company Tax ID for EGS format
        const customer = findCustomer(sale.customerId);
        // NEW: Return Detection and Styling
        const isReturn = sale.total < 0;
        const badgeText = isReturn ? 'مرتجع' : 'فاتورة';
        const badgeColor = isReturn ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
        const saleBgColor = isReturn ? 'bg-red-50 border-red-200' : `${(index % 2 === 0) ? 'bg-white' : 'bg-gray-50'} border-gray-200`;
        const totalAmountClass = isReturn ? 'text-red-700' : 'text-blue-700';
        
        // Build lines array with EGS itemCode formatting
        const lines = (sale.items || []).map((item, itemIndex) => {
            const product = findProduct(item.productId);
            const itemName = product && product.name ? product.name : (item.productName || 'منتج غير معروف');
            const itemTotal = item.quantity * (item.price || 0) * (1 - (item.discountPercent || 0) / 100);
            
            // Transform itemCode to EGS format if needed
            let itemCodeValue = product ? product.id : (item.productId || 'N/A');
            let finalItemCode = itemCodeValue;
            
            // If code doesn't start with EG- or GS1 prefix (622), assume it's internal and prefix with EGS format
            if (!finalItemCode.startsWith('EG-') && !finalItemCode.startsWith('622')) {
              finalItemCode = `EG-${taxId}-${finalItemCode}`;
            }
            
            return {
                internalCode: item.productId || String(itemIndex + 1),
                description: itemName,
                itemCode: finalItemCode,
                quantity: item.quantity || 0,
                unitPrice: item.price || 0,
                taxableAmount: round2(itemBase),
                taxAmount: itemTax,
                totalAmount: itemTotal
            };
        });
        
        const itemsList = lines.map((line, itemIndex) => {
            const itemTotalColorClass = isReturn ? 'text-red-700' : 'text-pink-700';
            return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${line.description}</td><td class="text-center px-3 py-2 sale-item-code-cell">${line.itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${line.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${line.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell">${formatCurrency(line.unitPrice)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(line.totalAmount)}</td></tr>`;
        }).join('');
        
        const customerRequiresFiling = customer?.requiresTaxFiling;
        // +++ NEW: Get Tax Number HTML +++
        const customerTaxNumber = customer ? (customer.taxNumber || 'لا يوجد') : 'لا يوجد';
    const invoice = {
        invoiceNumber: sale.invoiceNumber || sale.id,
        issueDateTime: new Date(sale.date).toISOString(),
        currency: 'EGP',
        seller: { name: state.companyName || 'الشركة', taxNumber: state.companyTaxId || '000000000' },
        buyer: { name: customer.name || 'عميل', taxNumber: customer.taxNumber || '', type: 'B2B' },
        totals: {
            totalLines: lines.length,
            totalTaxable: round2(lines.reduce((s,l)=> s + l.taxableAmount,0)),
            totalTax: round2(lines.reduce((s,l)=> s + l.taxAmount,0)),
            totalAmount: round2(lines.reduce((s,l)=> s + l.totalAmount,0))
        },
        lines: lines,
        signature: null // to be filled later by CADES-BES
    };
    return invoice;
}

// Export selected tax invoices to JSON
function exportTaxInvoicesToJson(sales) {
    const invoices = sales.map(transformSaleToEtaInvoice);
    const blob = new Blob([JSON.stringify(invoices, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'eta_invoices.json'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

function exportTaxInvoicesToCsv(sales) {
    const invoices = sales.map(transformSaleToEtaInvoice);
    const header = ['invoiceNumber','issueDateTime','buyerName','buyerTaxNumber','lines','totalTaxable','totalTax','totalAmount'];
    const rows = invoices.map(inv => {
        const lineSummary = inv.lines.map(l=> `${l.itemCode}:${l.quantity}x${l.unitPrice}=${l.totalAmount}`).join('|');
        return [inv.invoiceNumber, inv.issueDateTime, inv.buyer.name, inv.buyer.taxNumber, lineSummary, inv.totals.totalTaxable, inv.totals.totalTax, inv.totals.totalAmount];
    });
    const csv = [header.join(','), ...rows.map(r=> r.map(x=> '"'+String(x).replace(/"/g,'""')+'"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'eta_invoices.csv'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
}

function getCandidateSalesForTaxExport(){
    // Use current state: filter customers requiring tax filing
    return (state.sales||[]).filter(s => {
        const c = findCustomer(s.customerId);
        return c && c.requiresTaxFiling;
    });
}

document.addEventListener('click', function(e){
    if (e.target.closest && e.target.closest('#tax-export-json-btn')) {
        const candidates = getCandidateSalesForTaxExport();
        if (!candidates.length) { alert('لا توجد فواتير لعملاء يتطلبون رفع ضريبي حالياً.'); return; }
        exportTaxInvoicesToJson(candidates);
    }
    if (e.target.closest && e.target.closest('#tax-export-csv-btn')) {
        const candidates = getCandidateSalesForTaxExport();
        if (!candidates.length) { alert('لا توجد فواتير لعملاء يتطلبون رفع ضريبي حالياً.'); return; }
        exportTaxInvoicesToCsv(candidates);
    }
});
// --- END ETA TAX STUBS ---

// توافق مع الاستدعاءات القديمة: بعض المواضع تنادي renderCustomerList
// حافظنا على اسم الدالة الجديدة renderCustomers ونوفّر غلافاً بسيطاً.
function renderCustomerList(filter = '') {
    try { return renderCustomers(filter); } catch(e){ console.warn('renderCustomerList alias failed', e); }
}

function renderReps() {
    const repsList = document.getElementById('reps-list');
    repsList.innerHTML = '';
    if (state.reps.length === 0) {
        repsList.innerHTML = '<p class="text-gray-500 text-center mt-8">لا يوجد مناديب. اضغط على زر "إضافة مندوب" للبدء.</p>';
        return;
    }
    state.reps.forEach(rep => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg border shadow-sm';
        el.innerHTML = `<div class="flex justify-between items-start">
            <div>
                <p class="font-bold text-lg">${rep.name}</p>
                <p class="text-sm text-gray-500 mt-1">السيريال: ${rep.serial || 'لا يوجد'}</p>
                <p class="text-sm text-blue-600 font-semibold mt-1">التارجت: ${formatCurrency(rep.target)}</p>
                <div class="text-sm text-red-600 font-semibold mt-1">
                    رقم الفاتورة القادمة: 
                    <input type="number" class="rep-invoice-input" value="${rep.nextInvoiceNumber || 1}" data-rep-id="${rep.id}" style="width:80px; padding:4px; border: 1px solid #d1d5db; border-radius: 4px; margin-right: 6px;">
                    <button class="rep-invoice-save-btn" data-rep-id="${rep.id}" style="padding: 4px 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">حفظ</button>
                </div>
                <p class="text-sm text-gray-700 mt-1">البريد الإلكتروني: <span class="font-mono text-xs">${rep.email || '-'}</span></p>
            </div>
            <div class="flex">
                <button data-id="${rep.id}" class="edit-rep-btn p-2 text-gray-500 hover:text-blue-600"><i data-lucide="edit" class="w-5 h-5"></i></button>
                <button data-id="${rep.id}" class="delete-rep-btn p-2 text-gray-500 hover:text-red-600"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>`;
        repsList.appendChild(el);
    });
    
    // ربط معالجات حفظ السيريال
    document.querySelectorAll('.rep-invoice-save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const repId = btn.dataset.repId;
            const input = document.querySelector(`.rep-invoice-input[data-rep-id="${repId}"]`);
            if (!input) return;
            const newValue = parseInt(input.value);
            if (isNaN(newValue) || newValue < 1) {
                alert('يرجى إدخال رقم صحيح أكبر من 0');
                return;
            }
            const rep = state.reps.find(r => r.id === repId);
            if (!rep) return;
            rep.nextInvoiceNumber = newValue;
            try {
                await db.collection('reps').doc(repId).set({ nextInvoiceNumber: newValue }, { merge: true });
                console.log('✅ تم تحديث رقم الفاتورة للمندوب', rep.name, 'إلى', newValue);
                btn.textContent = '✓';
                setTimeout(() => { btn.textContent = 'حفظ'; }, 1500);
            } catch(err) {
                alert('فشل حفظ رقم الفاتورة: ' + err.message);
            }
        });
    });
    
    updateIcons();
}

function renderSettings(productFilter = '') {
    // Set sales target input
    const salesTargetInput = document.getElementById('sales-target-input');
    if (salesTargetInput && state.settings) salesTargetInput.value = state.settings.salesTarget || '';
        // ربط زر الحفظ بدالة السحابة
        const saveTargetBtn = document.getElementById('save-target-btn');
        if (saveTargetBtn && salesTargetInput) {
            saveTargetBtn.onclick = function() {
                const newTarget = Number(salesTargetInput.value);
                if (isNaN(newTarget) || newTarget <= 0) {
                    alert('يرجى إدخال هدف شهري صحيح أكبر من صفر');
                    return;
                }
                if (typeof window.saveSalesTargetToCloud === 'function') {
                    saveTargetBtn.disabled = true;
                    saveTargetBtn.textContent = '...جارٍ الحفظ';
                    window.saveSalesTargetToCloud(newTarget)
                        .then(() => {
                            saveTargetBtn.textContent = 'تم الحفظ';
                            setTimeout(() => {
                                saveTargetBtn.textContent = 'حفظ';
                                saveTargetBtn.disabled = false;
                            }, 1200);
                        })
                        .catch(() => {
                            saveTargetBtn.textContent = 'حفظ';
                            saveTargetBtn.disabled = false;
                            alert('تعذر حفظ الهدف الشهري. تحقق من الاتصال أو الصلاحيات.');
                        });
                }
            };
        }
    // set company logo input
    try {
        const logoInput = document.getElementById('company-logo-input');
        if (logoInput) logoInput.value = (state.settings && state.settings.companyLogo) ? state.settings.companyLogo : (window.DEFAULT_COMPANY_LOGO_URL || '');
    } catch (e) {}

    // Active period controls (month selector)
    try {
        const apInput = document.getElementById('active-period-input');
        const apBtn = document.getElementById('active-period-today-btn');
        const apInd = document.getElementById('active-period-indicator');
        const current = __formatPeriod(new Date());
        const active = (window.state && state.activePeriod) ? state.activePeriod : (localStorage.getItem('active_period') || current);
        if (apInput) {
            apInput.value = active;
            apInput.onchange = (e) => {
                const val = (e && e.target && e.target.value) ? String(e.target.value) : current;
                setActivePeriod(val);
                // keep indicator in sync immediately
                if (apInd) apInd.textContent = `الشهر: ${val}`;
            };
        }
        if (apBtn) {
            apBtn.onclick = () => {
                const nowVal = __formatPeriod(new Date());
                if (apInput) apInput.value = nowVal;
                setActivePeriod(nowVal);
                if (apInd) apInd.textContent = `الشهر: ${nowVal}`;
            };
        }
        if (apInd) {
            apInd.textContent = `الشهر: ${active}`;
        }
    } catch (e) { console.warn('renderSettings active-period wiring failed', e); }

    // Products list
    const productsList = document.getElementById('products-list');
    if (productsList) {
        productsList.innerHTML = '';
        const filteredProducts = state.products.filter(p => p.name.toLowerCase().includes((productFilter || '').toLowerCase()));
        if (filteredProducts.length === 0) {
            productsList.innerHTML = '<p class="text-gray-500 text-center text-sm p-4">لا توجد منتجات تطابق بحثك.</p>';
        } else {
            filteredProducts.forEach(product => {
                const el = document.createElement('div');
                el.className = 'bg-white p-2 rounded-md flex justify-between items-center border';
                el.innerHTML = `
                    <div>
                        <p class="font-semibold">${escapeHtml(product.name)} (<span class="text-xs text-blue-500">${escapeHtml(String(product.id))}</span>)</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">${formatCurrency(product.price)}</span>
                        <button data-id="${product.id}" class="edit-product-btn p-1 text-gray-400 hover:text-blue-600"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button data-id="${product.id}" class="delete-product-btn p-1 text-gray-400 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                productsList.appendChild(el);
            });
        }
    }

    // Update the small price-lists container only if it still exists (we moved management to dedicated page)
    const priceListsContainer = document.getElementById('price-lists-container');
    if (priceListsContainer) {
        priceListsContainer.innerHTML = '';
        if (!state.priceLists || state.priceLists.length === 0) {
            priceListsContainer.innerHTML = '<p class="text-gray-500 text-center text-sm p-4">لم تقم بإضافة قوائم أسعار بعد.</p>';
        } else {
            state.priceLists.forEach(pl => {
                const el = document.createElement('div');
                el.className = 'bg-white p-2 rounded-md flex justify-between items-center border';
                el.innerHTML = `
                    <p class="font-semibold">${escapeHtml(pl.name)}</p>
                    <div class="flex items-center gap-2">
                        <button data-id="${pl.id}" class="edit-price-list-btn p-1 text-gray-400 hover:text-blue-600"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button data-id="${pl.id}" class="delete-price-list-btn p-1 text-gray-400 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                `;
                priceListsContainer.appendChild(el);
            });
        }
    }

    updateIcons();

    // GPS controls wiring
    try { if (typeof setupGpsSharingControls === 'function') setupGpsSharingControls(); } catch(e){}
    try { if (typeof renderRepLocations === 'function') renderRepLocations(); } catch(e){}
}

function renderPromotions() {
    // New: render promotions as a compact table to match requested layout
    const listEl = document.getElementById('promotions-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    // Keep batch editor controls in sync
    try {
        const custSel = document.getElementById('batch-promo-customer');
        if (custSel) {
            custSel.innerHTML = '<option value="">جميع العملاء</option>' + (state.customers||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        }
        const from = document.getElementById('batch-promo-from');
        const to = document.getElementById('batch-promo-to');
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (from && !from.value) from.value = todayStr;
        if (to && !to.value) { const d = new Date(); d.setMonth(d.getMonth()+1); to.value = d.toISOString().split('T')[0]; }
    } catch(e){}
    if (!state.promotions || state.promotions.length === 0) {
        listEl.innerHTML = '<p class="text-gray-500 text-center mt-8">لا توجد عروض مسجلة حالياً.</p>';
        return;
    }

    // Build table HTML
    const headerStyle = 'background:#000;padding:8px;color:#ffd54f;text-align:center;font-weight:700;border-bottom:3px solid #333;font-size:15px;';
    const cellStyle = 'padding:10px;border-bottom:1px solid rgba(0,0,0,0.05);text-align:center;font-size:15px;';
    const codeCellStyle = cellStyle + 'background:linear-gradient(90deg,#e9e8ff,#cbd7ff);font-weight:700;color:#0b3d91;';
    const rows = state.promotions.map(promo => {
        const product = findProduct(promo.productId);
        const customer = promo.customerId ? findCustomer(promo.customerId) : null;
        const name = product ? product.name : 'منتج محذوف';
        const code = product ? product.id : '';
        const custName = customer ? customer.name : 'لجميع العملاء';
        // show start/end dates (when the promo starts/ends)
        const fromVal = promo.startDate ? formatArabicDate(promo.startDate) : (promo.from ?? promo.minQty ?? '');
        const toVal = promo.endDate ? formatArabicDate(promo.endDate) : (promo.to ?? promo.maxQty ?? '');
        const price = formatNumberEN(promo.price);

        // determine expiry - تحقق صحيح من انتهاء العرض باستخدام نفس المنطق كـ getActivePromotionPrice
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(promo.endDate);
        endDate.setHours(23, 59, 59, 999);
        const isExpired = today > endDate;

        // Column accent colors (consistent and visible)
        const priceAccentBg = 'background:linear-gradient(90deg,#fff8e1,#ffe0b2);color:#7a3f00;font-weight:700;';
        const productAccentBg = 'background:linear-gradient(90deg,#e8f7ff,#dbeefd);color:#0b3d91;font-weight:600;';
        const dateAccentBg = 'background:linear-gradient(90deg,#f0fff4,#e6fff0);color:#065f46;font-weight:600;';
        const customerAccentBg = 'background:linear-gradient(90deg,#fffdf6,#fff3e8);color:#3b3b3b;';

        // For visibility add a thin colored stripe on the left of key cells
        const priceCellStyle = `${cellStyle} ${priceAccentBg} border-left:6px solid #f59e0b;`;
        const productCellStyle = `${cellStyle} ${productAccentBg} border-left:6px solid #2563eb;`;
        const dateCellStyle = `${cellStyle} ${dateAccentBg} border-left:6px solid #10b981;`;
        const customerCellStyle = `${cellStyle} ${customerAccentBg}`;

        // expired badge remains but colors apply regardless so the UI looks consistent
        const expiredBadge = isExpired ? `<div style="margin-top:6px;font-size:12px;color:#7a1f1f;font-weight:800">منتهي</div>` : '';
        const priceHtml = `${price}${expiredBadge} <button data-promo-id="${promo.id}" class="edit-promo-btn" style="margin-left:8px;background:#2563eb;color:white;border:none;padding:4px 6px;border-radius:4px;font-size:12px;cursor:pointer">تعديل</button>`;

        // subtle alternating row backgrounds for readability
        const rowAltBg = promo.__rowAlt ? 'background:linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.9) 100%);' : '';
        const rowBackground = rowAltBg || 'background:linear-gradient(90deg, rgba(249,224,190,1) 0%, rgba(245,183,77,0.08) 100%);';

        // Toggle alternate rows for nicer banding (based on index if present)
        // (we can't access index inside map easily here, but we can use a fallback plain background)
        return `
            <tr style="${rowBackground}">
                <td style="${priceCellStyle};width:90px;">${priceHtml}</td>
                <td style="${dateCellStyle};width:120px;">${toVal}</td>
                <td style="${dateCellStyle};width:120px;">${fromVal}</td>
                <td style="${productCellStyle};">${escapeHtml(name)}</td>
                <td style="${codeCellStyle};width:62px;">${escapeHtml(code)}</td>
                <td style="${customerCellStyle};width:200px;">${escapeHtml(custName)}</td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div style="overflow:auto;"> 
            <table style="width:100%;border-collapse:separate;border-spacing:0 6px;font-family:Arial, Helvetica, sans-serif;">
                <thead>
                    <tr>
                        <th style="${headerStyle};width:90px;">السعر</th>
                        <th style="${headerStyle};width:120px;">حتى</th>
                        <th style="${headerStyle};width:120px;">من</th>
                        <th style="${headerStyle};">اسم الصنف</th>
                        <th style="${headerStyle};width:62px;">كود</th>
                        <th style="${headerStyle};width:200px;">اسم العميل</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

    listEl.innerHTML = tableHtml;
    updateIcons();

    // Wire edit buttons in promotions table to open the promotion modal
    try {
        listEl.querySelectorAll('.edit-promo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.promoId;
                if (id) openPromotionModal(id);
            });
        });
    } catch (e) { console.warn('Failed to wire promotion edit buttons', e); }
}

// === Batch Promotions logic ===
function addBatchPromoRow(prefill) {
    const tbody = document.getElementById('batch-promo-rows');
    if (!tbody) return;
    const tr = document.createElement('tr');
    const rowBg = 'background:linear-gradient(90deg, rgba(249,224,190,1) 0%, rgba(245,183,77,0.08) 100%);';
    const cellBase = 'padding:8px;border-bottom:1px solid rgba(0,0,0,0.05);text-align:center;font-size:14px;';
    tr.innerHTML = `
        <td style="${cellBase};background:linear-gradient(90deg,#fff8e1,#ffe0b2);color:#7a3f00;font-weight:700;${rowBg}"><input type="number" class="bp-price p-1 border rounded w-24 text-center" step="any" placeholder="0"></td>
        <td style="${cellBase};${rowBg}"><input type="date" class="bp-to p-1 border rounded"></td>
        <td style="${cellBase};${rowBg}"><input type="date" class="bp-from p-1 border rounded"></td>
        <td style="${cellBase};background:linear-gradient(90deg,#e8f7ff,#dbeefd);color:#0b3d91;font-weight:600;${rowBg}"><input type="text" class="bp-name p-1 border rounded w-64" placeholder="اسم الصنف" readonly></td>
        <td style="${cellBase};background:linear-gradient(90deg,#e9e8ff,#cbd7ff);font-weight:700;color:#0b3d91;${rowBg}"><input type="text" class="bp-code p-1 border rounded w-20 text-center" placeholder="كود"></td>
        <td style="${cellBase};${rowBg}"><span class="bp-customer-display"></span></td>
        <td style="${cellBase};${rowBg}"><button type="button" class="bp-del px-2 py-1 bg-red-600 text-white rounded">حذف</button></td>`;
    tbody.appendChild(tr);

    const fromInput = tr.querySelector('.bp-from');
    const toInput = tr.querySelector('.bp-to');
    const codeInput = tr.querySelector('.bp-code');
    const nameInput = tr.querySelector('.bp-name');
    const priceInput = tr.querySelector('.bp-price');
    const custDisplay = tr.querySelector('.bp-customer-display');
    const custSel = document.getElementById('batch-promo-customer');
    const fromGlobal = document.getElementById('batch-promo-from');
    const toGlobal = document.getElementById('batch-promo-to');
    if (fromGlobal && !fromInput.value) fromInput.value = fromGlobal.value;
    if (toGlobal && !toInput.value) toInput.value = toGlobal.value;
    if (custSel) custDisplay.textContent = custSel.options[custSel.selectedIndex]?.text || 'جميع العملاء';

    codeInput.addEventListener('change', () => {
        const p = getProductDetailsByCode(codeInput.value);
        if (p) { nameInput.value = p.name; nameInput.classList.remove('text-red-600'); }
        else { nameInput.value = 'كود غير صحيح'; nameInput.classList.add('text-red-600'); }
    });
    document.getElementById('batch-promo-customer')?.addEventListener('change', () => {
        const sel = document.getElementById('batch-promo-customer');
        if (sel) custDisplay.textContent = sel.options[sel.selectedIndex]?.text || 'جميع العملاء';
    });
    tr.querySelector('.bp-del').addEventListener('click', ()=> tr.remove());

    if (prefill) {
        if (prefill.code) { codeInput.value = prefill.code; codeInput.dispatchEvent(new Event('change')); }
        if (prefill.price) priceInput.value = prefill.price;
        if (prefill.from) fromInput.value = prefill.from;
        if (prefill.to) toInput.value = prefill.to;
    }
}

async function saveBatchPromotions() {
    const custId = document.getElementById('batch-promo-customer')?.value || null;
    const rows = Array.from(document.querySelectorAll('#batch-promo-rows tr'));
    if (!rows.length) { await customDialog({ message:'أضف صفاً واحداً على الأقل.', title:'تنبيه' }); return; }
    if (!window.db) { console.warn('Firestore غير جاهز'); }

    const batch = window.db ? db.batch() : null;
    const toCreateLocal = [];
    let created = 0;
    for (const tr of rows) {
        const code = tr.querySelector('.bp-code').value.trim();
        const nameOk = !tr.querySelector('.bp-name').classList.contains('text-red-600');
        const price = parseFloat(tr.querySelector('.bp-price').value);
        const from = tr.querySelector('.bp-from').value;
        const to = tr.querySelector('.bp-to').value;
        if (!code || !nameOk || !from || !to || isNaN(price) || price <= 0) continue;
        const prod = getProductDetailsByCode(code);
        if (!prod) continue;
        const data = {
            id: db && db.collection ? db.collection('promotions').doc().id : (Date.now()+''+Math.random()).slice(0,16),
            name: `عرض ${prod.name}`,
            productId: String(prod.id),
            price: Number(price),
            customerId: custId || null,
            startDate: from,
            endDate: to,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (batch) {
            const ref = db.collection('promotions').doc(data.id);
            batch.set(ref, data, { merge:false });
        } else {
            toCreateLocal.push(data);
        }
        created++;
    }
    if (!created) { await customDialog({ message:'لا توجد صفوف صالحة للحفظ.', title:'تنبيه' }); return; }
    try {
        if (batch) await batch.commit();
        else {
            // Local fallback
            state.promotions = (state.promotions||[]).concat(toCreateLocal);
        }
        await customDialog({ message:`تم حفظ ${created} عرض`, title:'تم' });
        // Clear grid
        document.getElementById('batch-promo-rows').innerHTML = '';
        renderPromotions();
    } catch (e) {
        console.warn('saveBatchPromotions failed', e);
        await customDialog({ message:'فشل الحفظ. حاول مرة أخرى.', title:'خطأ' });
    }
}

function calculateCustomerBalances() { 
    // Build balances map from sales only so we show only customers who have invoices
    // Normalize keys to strings to avoid mismatches between numeric/string ids
    const map = new Map();
    try {
        (state.sales || []).forEach(sale => {
            const key = String(sale.customerId === undefined || sale.customerId === null ? 'unknown' : sale.customerId);
            const existing = map.get(key) || { name: (findCustomer(sale.customerId)?.name) || ('عميل ' + key), total: 0, paid: 0, balance: 0 };
            existing.total = (existing.total || 0) + (sale.total || 0);
            const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
            existing.paid = (existing.paid || 0) + (Number(paidAmount) || 0);
            map.set(key, existing);
        });
        // compute balance for each entry
        map.forEach((v, k) => { v.balance = (v.total || 0) - (v.paid || 0); });
    } catch (e) {
        console.warn('calculateCustomerBalances error', e);
    }
    return map;
}

// Notification modal flow for Promotions "اخطار"
function openNotifyModal(type) {
    const modal = document.getElementById('notify-modal');
    if (!modal) return;
    const title = modal.querySelector('#notify-modal-title');
    const typeInput = modal.querySelector('#notify-type');
    const productSelect = document.getElementById('notify-product');
    const promoSelect = document.getElementById('notify-promo');
    const newItemInput = document.getElementById('notify-new-item-name');
    const messageShort = document.getElementById('notify-short-text');
    const rowsBody = document.getElementById('notify-rows-body');
    const pasteArea = document.getElementById('notify-paste-area');
    const productContainer = document.getElementById('notify-product-container');
    const promoContainer = document.getElementById('notify-promo-container');
    const newItemContainer = document.getElementById('notify-new-item-container');

    // reset UI
    productContainer.style.display = 'none';
    promoContainer.style.display = 'none';
    newItemContainer.style.display = 'none';
    pasteArea.style.display = 'none';
    // clear rows
    rowsBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 p-4">لا توجد صفوف بعد.</td></tr>';

    // set modal according to type
    if (type === 'prices' || type === 'prices-select') {
        title.textContent = 'اخطار — تغيير سعر';
        typeInput.value = 'prices';
        productContainer.style.display = '';
        productSelect.innerHTML = '<option value="">-- اختر صنف --</option>' + (state.products || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(String(p.id))})</option>`).join('');
    } else if (type === 'new-item') {
        title.textContent = 'اخطار — صنف جديد';
        typeInput.value = 'new-item';
        newItemContainer.style.display = '';
    } else if (type === 'promotions') {
        title.textContent = 'اخطار — عرض';
        typeInput.value = 'promotions';
        promoContainer.style.display = '';
        promoSelect.innerHTML = '<option value="">-- اختر عرض --</option>' + (state.promotions || []).map(pr => `<option value="${pr.id}">${escapeHtml(pr.name || ('عرض ' + pr.id))}</option>`).join('');
    }

    // show modal
    modal.classList.remove('modal-hidden');
    modal.style.display = 'flex';
    // reset customer & global discount
    const notifyCustomer = document.getElementById('notify-customer');
    const notifyGlobal = document.getElementById('notify-global-discount');
    if (notifyCustomer) notifyCustomer.value = '';
    if (notifyGlobal) notifyGlobal.value = '';
    // populate customer select now (ensure it's filled even if state was loaded late)
    try {
        if (notifyCustomer) {
            notifyCustomer.innerHTML = '<option value="">-- غير محدد --</option>' + (state.customers || []).map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
        }
    } catch (e) { console.warn('populate notify-customer failed', e); }
}

function closeNotifyModal() {
    const modal = document.getElementById('notify-modal');
    if (!modal) return;
    modal.classList.add('modal-hidden');
    modal.style.display = 'none';
}

function sendNotification(e) {
    e.preventDefault();
    const form = document.getElementById('notify-form');
    const type = document.getElementById('notify-type-select')?.value || document.getElementById('notify-type')?.value || 'prices';
    const title = document.getElementById('notify-title')?.value || '';
    const shortText = document.getElementById('notify-short-text')?.value || '';
    const productId = document.getElementById('notify-product')?.value || null;
    const promoId = document.getElementById('notify-promo')?.value || null;
    const newItemName = document.getElementById('notify-new-item-name')?.value || null;
    const customerId = document.getElementById('notify-customer')?.value || null;
    const globalDiscount = parseFloat(document.getElementById('notify-global-discount')?.value) || 0;

    // gather rows from table
    const rows = [];
    const rowsBody = document.getElementById('notify-rows-body');
    if (rowsBody) {
        Array.from(rowsBody.querySelectorAll('tr')).forEach(tr => {
            const code = tr.querySelector('.nr-code')?.value || '';
            if (!code) return; // skip empty rows
            const name = tr.querySelector('.nr-name')?.value || '';
            const price = parseFloat(tr.querySelector('.nr-price')?.value) || 0;
            const discount = parseFloat(tr.querySelector('.nr-discount')?.value) || 0;
            const priceAfter = parseFloat(tr.querySelector('.nr-price-after')?.value) || Math.round((price * (1 - (discount/100))) * 100)/100;
            rows.push({ code, name, price, discount, priceAfter });
        });
    }

    state.notifications = state.notifications || [];
    const notif = { id: 'n_' + Date.now(), type, title, shortText, productId, promoId, newItemName, customerId, globalDiscount, rows, date: new Date().toISOString() };
    state.notifications.push(notif);
    // persist notifications so they survive reloads
    try { saveState(); } catch (e) { console.warn('saveState failed after creating notification', e); }
    console.log('Notification created:', notif);
    closeNotifyModal();
    try { renderNotifications(); } catch (e) { console.warn('renderNotifications error', e); }
    alert('تم حفظ الإخطار محلياً. يمكنك عرضه من قسم الأخطار داخل صفحة العروض.');
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    container.innerHTML = '';
    const list = (state.notifications || []).slice().reverse();
    if (list.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center mt-8">لا توجد اخطارات بعد. استخدم زر "اخطار" لإنشاء واحد.</p>';
        return;
    }
    list.forEach(notif => {
        const el = document.createElement('div');
        el.className = 'bg-white p-3 rounded-lg border shadow-sm';
        const title = escapeHtml(notif.title || (notif.type || 'اخطار'));
        const short = escapeHtml(notif.shortText || '');
        const rowsHtml = (notif.rows || []).map(r => `<tr><td class="px-2 py-1 text-right">${escapeHtml(r.code)}</td><td class="px-2 py-1">${escapeHtml(r.name)}</td><td class="px-2 py-1 text-center">${formatCurrency(r.price)}</td><td class="px-2 py-1 text-center">${r.discount || 0}%</td><td class="px-2 py-1 text-center">${formatCurrency(r.priceAfter)}</td></tr>`).join('');
        const tableHtml = notif.rows && notif.rows.length > 0 ? `<div class="overflow-x-auto mt-2"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-2 py-1 text-right">كود</th><th class="px-2 py-1">صنف</th><th class="px-2 py-1 text-center">سعر</th><th class="px-2 py-1 text-center">خصم</th><th class="px-2 py-1 text-center">بعد الخصم</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>` : '';
        el.innerHTML = `<div class="flex justify-between items-start"><div><h4 class="font-semibold">${title}</h4><div class="text-xs text-gray-500">${short}</div></div><div class="text-xs text-gray-500">${new Date(notif.date).toLocaleString()}</div></div>${tableHtml}<div class="flex justify-end gap-2 mt-3"><button data-id="${notif.id}" class="view-notif-btn bg-blue-600 text-white px-3 py-1 rounded-md">عرض</button><button data-id="${notif.id}" class="delete-notif-btn bg-red-100 text-red-600 px-3 py-1 rounded-md">حذف</button></div>`;
        container.appendChild(el);
    });

    // wire view & delete
    container.querySelectorAll('.view-notif-btn').forEach(b => b.addEventListener('click', (e) => {
        const id = b.dataset.id;
        const n = (state.notifications || []).find(x => x.id === id);
        if (!n) return alert('الإخطار غير موجود');
        // open a quick display modal (reuse notify modal in read-only)
        openNotifyModal(n.type);
        // fill fields read-only
        setTimeout(() => {
            document.getElementById('notify-title').value = n.title || '';
            document.getElementById('notify-short-text').value = n.shortText || '';
            // restore customer and global discount if present
            try { if (document.getElementById('notify-customer')) document.getElementById('notify-customer').value = n.customerId || ''; } catch(e){}
            try { if (document.getElementById('notify-global-discount')) document.getElementById('notify-global-discount').value = n.globalDiscount || ''; } catch(e){}
            // fill rows
            const body = document.getElementById('notify-rows-body'); body.innerHTML = '';
            (n.rows || []).forEach(r => addRowPreview(r));
        }, 120);
    }));
    container.querySelectorAll('.delete-notif-btn').forEach(b => b.addEventListener('click', (e) => {
        const id = b.dataset.id;
        state.notifications = (state.notifications || []).filter(x => x.id !== id);
        try { saveState(); } catch (e) { console.warn('saveState failed after deleting notification', e); }
        renderNotifications();
    }));
}

function addRowPreview(r) {
    const body = document.getElementById('notify-rows-body');
    if (!body) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="px-2 py-1 text-right">${escapeHtml(r.code||'')}</td><td class="px-2 py-1">${escapeHtml(r.name||'')}</td><td class="px-2 py-1 text-center">${formatCurrency(r.price||0)}</td><td class="px-2 py-1 text-center">${r.discount||0}%</td><td class="px-2 py-1 text-center">${formatCurrency(r.priceAfter||0)}</td><td></td>`;
    body.appendChild(tr);
}

// Wire dropdown toggle & options
document.addEventListener('click', (ev) => {
    const root = document.getElementById('promotions-notify-root');
    if (!root) return;
    const btn = document.getElementById('promotions-notify-btn');
    const menu = document.getElementById('promotions-notify-menu');
    if (!btn || !menu) return;
    if (btn.contains(ev.target)) {
        // toggle
        if (menu.classList.contains('hidden')) menu.classList.remove('hidden'); else menu.classList.add('hidden');
        return;
    }
    // if clicked an option
    if (ev.target && ev.target.classList && ev.target.classList.contains('notify-option')) {
        const t = ev.target.dataset.notifyType;
        menu.classList.add('hidden');
        openNotifyModal(t);
        return;
    }
    // click outside: hide menu
    if (!root.contains(ev.target)) {
        menu.classList.add('hidden');
    }
});

// Wire notify form submit
document.addEventListener('DOMContentLoaded', () => {
    const notifyForm = document.getElementById('notify-form');
    if (notifyForm) notifyForm.addEventListener('submit', sendNotification);
    // Wire UI inside notify modal: add row, paste area, type selector
    const addRowBtn = document.getElementById('notify-add-row-btn');
    const pasteBtn = document.getElementById('notify-paste-btn');
    const pasteArea = document.getElementById('notify-paste-area');
    const rowsBody = document.getElementById('notify-rows-body');
    const typeSelect = document.getElementById('notify-type-select');
    const productContainer = document.getElementById('notify-product-container');
    const promoContainer = document.getElementById('notify-promo-container');
    const newItemContainer = document.getElementById('notify-new-item-container');

    function addNotifyRow(data = {}) {
        if (!rowsBody) return;
        // remove placeholder row
        if (rowsBody.children.length === 1 && rowsBody.children[0].querySelector('td') && rowsBody.children[0].querySelector('td').colSpan == 6) rowsBody.innerHTML = '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-2 py-1"><input class="nr-code w-full p-1 border rounded text-sm" value="${escapeHtml(data.code||'')}"></td>
            <td class="px-2 py-1"><input class="nr-name w-full p-1 border rounded text-sm" value="${escapeHtml(data.name||'')}"></td>
            <td class="px-2 py-1 text-center"><input type="number" step="any" class="nr-price w-24 p-1 border rounded text-sm text-center" value="${data.price||''}"></td>
            <td class="px-2 py-1 text-center"><input type="number" step="any" class="nr-discount w-20 p-1 border rounded text-sm text-center" value="${data.discount||0}"></td>
            <td class="px-2 py-1 text-center"><input readonly class="nr-price-after w-28 p-1 border rounded text-sm text-center bg-gray-50" value="${data.priceAfter||''}"></td>
            <td class="px-2 py-1 text-center"><button type="button" class="nr-remove text-red-600 px-2 py-1">حذف</button></td>
        `;
        rowsBody.appendChild(tr);
        // attach handlers
        const priceInput = tr.querySelector('.nr-price');
        const discInput = tr.querySelector('.nr-discount');
        const priceAfterInput = tr.querySelector('.nr-price-after');
        const codeInput = tr.querySelector('.nr-code');
        const nameInput = tr.querySelector('.nr-name');
        function recompute() {
            const p = parseFloat(priceInput.value) || 0;
            const d = parseFloat(discInput.value) || 0;
            const after = Math.round((p * (1 - d/100)) * 100) / 100;
            priceAfterInput.value = after === 0 ? '' : after;
        }
        priceInput.addEventListener('input', recompute);
        discInput.addEventListener('input', recompute);
        // when code changed, try to lookup product name and price (respect customer selection)
        function resolveCodeLookup() {
            const code = codeInput.value && codeInput.value.trim();
            if (!code) return;
            // try find product by id first, fallback to product list search
            let prod = findProduct(code) || state.products.find(p => String(p.id) === String(code));
            if (!prod) {
                // try search by barcode or code property if exists
                prod = state.products.find(p => p.code && String(p.code) === String(code));
            }
            if (prod) {
                nameInput.value = prod.name || '';
                // determine base price for selected customer
                const customerId = document.getElementById('notify-customer')?.value || null;
                let basePrice = prod.price || 0;
                if (customerId) {
                    const customer = findCustomer(customerId);
                    if (customer && customer.priceListId) {
                        const pl = findPriceList(customer.priceListId);
                        if (pl && pl.productPrices && pl.productPrices[prod.id] !== undefined) basePrice = pl.productPrices[prod.id];
                    }
                }
                // check active promotions
                const promoPrice = getActivePromotionPrice(prod.id, customerId);
                let finalPrice = promoPrice !== null ? promoPrice : basePrice;
                priceInput.value = parseFloat(finalPrice).toFixed(2);
                recompute();
            }
        }
        // attach multiple triggers (change, blur, Enter key, and small-debounced input)
        codeInput.addEventListener('change', resolveCodeLookup);
        codeInput.addEventListener('blur', resolveCodeLookup);
        let codeInputTimer = null;
        codeInput.addEventListener('input', () => { clearTimeout(codeInputTimer); codeInputTimer = setTimeout(resolveCodeLookup, 300); });
        codeInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); resolveCodeLookup(); } });
        const removeBtn = tr.querySelector('.nr-remove');
        removeBtn.addEventListener('click', () => { tr.remove(); if (rowsBody.children.length === 0) rowsBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 p-4">لا توجد صفوف بعد.</td></tr>'; });
    }

    // helper: parse localized number strings (commas, spaces, etc.) to float
    function parseLocalizedNumber(str) {
        if (str === undefined || str === null) return NaN;
        let s = String(str).trim();
        if (s === '') return NaN;
        // remove thousands separators (commas, spaces)
        s = s.replace(/[,\s\u00A0]/g, '');
        // replace comma decimal with dot if user used comma as decimal and dot not present
        // (already removed commas as thousands separators above), but still handle Arabic decimal comma
        s = s.replace(/،/g, '.');
        // if multiple dots exist, keep last dot as decimal separator
        const parts = s.split('.');
        if (parts.length > 2) {
            const last = parts.pop();
            s = parts.join('') + '.' + last;
        }
        const v = parseFloat(s);
        return isNaN(v) ? NaN : v;
    }

    // apply global discount to all rows
    const globalDiscountInput = document.getElementById('notify-global-discount');
    if (globalDiscountInput) {
        globalDiscountInput.addEventListener('input', () => {
            const v = parseLocalizedNumber(globalDiscountInput.value);
            Array.from(rowsBody.querySelectorAll('tr')).forEach(tr => {
                const disc = tr.querySelector('.nr-discount');
                if (disc) {
                    disc.value = isNaN(v) ? '' : v;
                    // trigger recompute by dispatching input
                    disc.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        });
    }

    // when customer selection changes, re-resolve prices for existing rows
    const notifyCustomerSelect = document.getElementById('notify-customer');
    if (notifyCustomerSelect) {
        // populate options
        notifyCustomerSelect.innerHTML = '<option value="">-- غير محدد --</option>' + (state.customers || []).map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
        notifyCustomerSelect.addEventListener('change', () => {
            const cid = notifyCustomerSelect.value || null;
            Array.from(rowsBody.querySelectorAll('tr')).forEach(tr => {
                const code = tr.querySelector('.nr-code')?.value?.trim();
                const priceInput = tr.querySelector('.nr-price');
                const nameInput = tr.querySelector('.nr-name');
                const discInput = tr.querySelector('.nr-discount');
                const priceAfterInput = tr.querySelector('.nr-price-after');
                if (!code) return;
                const prod = findProduct(code) || state.products.find(p => String(p.id) === String(code) || (p.code && String(p.code) === String(code)));
                if (prod) {
                    nameInput.value = prod.name || '';
                    let basePrice = prod.price || 0;
                    if (cid) {
                        const customer = findCustomer(cid);
                        if (customer && customer.priceListId) {
                            const pl = findPriceList(customer.priceListId);
                            if (pl && pl.productPrices && pl.productPrices[prod.id] !== undefined) basePrice = pl.productPrices[prod.id];
                        }
                    }
                    const promoPrice = getActivePromotionPrice(prod.id, cid);
                    const finalPrice = promoPrice !== null ? promoPrice : basePrice;
                    priceInput.value = parseFloat(finalPrice).toFixed(2);
                    // re-apply global discount if exists
                    const g = parseLocalizedNumber(globalDiscountInput?.value || '');
                    if (!isNaN(g) && g !== '') discInput.value = g;
                    // recompute
                    const p = parseFloat(priceInput.value) || 0;
                    const d = parseFloat(discInput.value) || 0;
                    priceAfterInput.value = Math.round((p * (1 - d/100)) * 100) / 100 || '';
                }
            });
        });
    }

    if (addRowBtn) addRowBtn.addEventListener('click', () => addNotifyRow({price: '', discount: 0}));
    if (pasteBtn && pasteArea) {
        pasteBtn.addEventListener('click', () => { pasteArea.style.display = pasteArea.style.display === 'none' ? '' : 'none'; });
        pasteArea.addEventListener('paste', (ev) => {
            ev.preventDefault();
            const text = (ev.clipboardData || window.clipboardData).getData('text');
            pasteArea.value = text;
            // parse lines
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            lines.forEach(line => {
                // split by tab first, fallback to multiple spaces or comma
                const cols = line.split(/\t|\s{2,}|,/).map(c => c.trim()).filter(c => c !== '');
                // assume first column is code, second maybe name, third price, fourth discount
                const code = cols[0] || '';
                const name = cols[1] || '';
                const priceRaw = cols[2] || '';
                const discRaw = cols[3] || cols[2] || '';
                const price = parseLocalizedNumber(priceRaw) || 0;
                const discount = parseLocalizedNumber(discRaw) || 0;
                const priceAfter = Math.round((price * (1 - discount/100)) * 100) / 100;
                addNotifyRow({ code, name, price: price === 0 ? '' : price, discount: discount === 0 ? 0 : discount, priceAfter });
                // after adding row, try to auto-resolve product and per-customer price
                setTimeout(() => {
                    const last = rowsBody.lastElementChild;
                    if (!last) return;
                    const codeVal = last.querySelector('.nr-code')?.value?.trim();
                    if (codeVal) {
                        const prod = findProduct(codeVal) || state.products.find(p => String(p.id) === String(codeVal) || (p.code && String(p.code) === String(codeVal)));
                        if (prod) {
                            const nameEl = last.querySelector('.nr-name');
                            if (nameEl && (!nameEl.value || nameEl.value.trim() === '')) nameEl.value = prod.name || '';
                            const customerId = document.getElementById('notify-customer')?.value || null;
                            let basePrice = prod.price || 0;
                            if (customerId) {
                                const customer = findCustomer(customerId);
                                if (customer && customer.priceListId) {
                                    const pl = findPriceList(customer.priceListId);
                                    if (pl && pl.productPrices && pl.productPrices[prod.id] !== undefined) basePrice = pl.productPrices[prod.id];
                                }
                            }
                            const promoPrice = getActivePromotionPrice(prod.id, customerId);
                            const finalPrice = promoPrice !== null ? promoPrice : basePrice;
                            const priceEl = last.querySelector('.nr-price');
                            if (priceEl && (!priceEl.value || parseLocalizedNumber(priceEl.value) === 0)) priceEl.value = parseFloat(finalPrice).toFixed(2);
                            const discEl = last.querySelector('.nr-discount');
                            const p = parseFloat((priceEl.value && priceEl.value.trim()) ? parseLocalizedNumber(priceEl.value) : finalPrice) || 0;
                            const d = parseFloat(discEl?.value) || 0;
                            const afterEl = last.querySelector('.nr-price-after');
                            if (afterEl) afterEl.value = Math.round((p * (1 - d/100)) * 100) / 100 || '';
                        }
                    }
                }, 50);
            });
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            const v = typeSelect.value;
            productContainer.style.display = v === 'prices' ? '' : 'none';
            promoContainer.style.display = v === 'promotions' ? '' : 'none';
            newItemContainer.style.display = v === 'new-item' ? '' : 'none';
        });
    }

    // Render notifications list when the page loads
    renderNotifications();
    // Wire promotions/notifications toggle
    const promosBtn = document.getElementById('promotions-view-btn');
    const notifsBtn = document.getElementById('notifications-view-btn');
    const promosList = document.getElementById('promotions-list');
    const notifsList = document.getElementById('notifications-list');
        if (promosBtn && notifsBtn && promosList && notifsList) {
            promosBtn.addEventListener('click', () => {
                promosList.classList.remove('hidden');
                notifsList.classList.add('hidden');
                // active = promos
                promosBtn.classList.add('bg-blue-600','text-white');
                promosBtn.classList.remove('bg-white','text-gray-700','border');
                // deactivate notifs
                notifsBtn.classList.remove('bg-blue-600','text-white');
                notifsBtn.classList.add('bg-white','text-gray-700','border');
            });
            notifsBtn.addEventListener('click', () => {
                notifsList.classList.remove('hidden');
                promosList.classList.add('hidden');
                // active = notifs
                notifsBtn.classList.add('bg-blue-600','text-white');
                notifsBtn.classList.remove('bg-white','text-gray-700','border');
                // deactivate promos
                promosBtn.classList.remove('bg-blue-600','text-white');
                promosBtn.classList.add('bg-white','text-gray-700','border');
            });
        }
    // Wire saving company logo button
    const saveLogoBtn = document.getElementById('save-company-logo-btn');
    if (saveLogoBtn) {
        saveLogoBtn.addEventListener('click', () => {
            const val = (document.getElementById('company-logo-input') || {}).value || '';
            state.settings = state.settings || {};
            state.settings.companyLogo = val.trim();
            saveState();
            renderCompanyLogo();
            try { applyWatermark(state.settings.companyLogo || ''); } catch(e) { console.warn('applyWatermark failed on save', e); }
            alert('تم حفظ رابط الشعار. سيظهر على صفحات التطبيق والتقارير إذا كان الرابط صحيحًا.');
        });
    }
    // Auto-save logo when user pastes/changes the input (so they don't have to press save each time)
    const logoInput = document.getElementById('company-logo-input');
    if (logoInput) {
        const saveLogoFromInput = () => {
            const val = (logoInput.value || '').trim();
            state.settings = state.settings || {};
            state.settings.companyLogo = val;
            try { saveState(); } catch(e) { console.warn('saveState failed while auto-saving logo', e); }
            try { renderCompanyLogo(); } catch(e) {}
            try { applyWatermark(val || ''); } catch(e) { console.warn('applyWatermark failed while auto-saving logo', e); }
        };
        logoInput.addEventListener('change', saveLogoFromInput);
        logoInput.addEventListener('blur', saveLogoFromInput);
    }
    // render company logo initially
    try { renderCompanyLogo(); } catch(e) {}
    // WhatsApp share button: build message from current modal fields and open wa.me
    const shareBtn = document.getElementById('notify-share-wa-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            // build message from modal
            const type = document.getElementById('notify-type-select')?.value || document.getElementById('notify-type')?.value || 'prices';
            const title = document.getElementById('notify-title')?.value || '';
            const shortText = document.getElementById('notify-short-text')?.value || '';
            const logoUrl = document.getElementById('notify-logo-url')?.value || '';
            const customerId = document.getElementById('notify-customer')?.value || '';
            const customerName = customerId ? (findCustomer(customerId)?.name || customerId) : '';
            const rows = [];
            const rowsBody = document.getElementById('notify-rows-body');
            if (rowsBody) {
                Array.from(rowsBody.querySelectorAll('tr')).forEach(tr => {
                    const code = tr.querySelector('.nr-code')?.value || '';
                    if (!code) return;
                    const name = tr.querySelector('.nr-name')?.value || '';
                    const price = tr.querySelector('.nr-price')?.value || '';
                    const discount = tr.querySelector('.nr-discount')?.value || '';
                    const after = tr.querySelector('.nr-price-after')?.value || '';
                    rows.push({ code, name, price, discount, after });
                });
            }
            if ((rows || []).length === 0) return alert('لا توجد صفوف للمشاركة. أضف أصنافاً أولاً.');
            // header by type
            let header = 'Delente ERP تقدم لسيادتكم '; 
            if (type === 'prices') header += 'اسعار الاصناف التالية:'; else if (type === 'promotions') header += 'اسعار العروض التالية:'; else if (type === 'new-item') header = 'Delente ERP — اعلان صنف جديد:';
            let msg = header + '\n';
            if (customerName) msg += 'العميل: ' + customerName + '\n';
            if (title) msg += 'عنوان: ' + title + '\n';
            if (shortText) msg += shortText + '\n';
            msg += '\n';
            // rows
            rows.forEach(r => {
                // format each row compactly
                const parts = [];
                if (r.code) parts.push('كود: ' + r.code);
                if (r.name) parts.push('صنف: ' + r.name);
                if (r.price) parts.push('سعر: ' + r.price);
                if (r.discount) parts.push('خصم: ' + r.discount + '%');
                if (r.after) parts.push('بعد: ' + r.after);
                msg += parts.join(' | ') + '\n';
            });
            if (logoUrl) msg += '\n' + 'شعار الشركة: ' + logoUrl + '\n';
            msg += '\n' + '-- من فريق Delente ERP';
            const waUrl = 'https://wa.me/?text=' + encodeURIComponent(msg);
            window.open(waUrl, '_blank');
        });
    }
});

    function renderDebts() {
    // Initialize variables
    const customerFilterText = (document.getElementById('debt-customer-filter') || {}).value || '';
    const repFilter = (document.getElementById('debt-rep-filter') || {}).value || '';
    const startDateVal = (document.getElementById('debt-start-date') || {}).value || '';
    const endDateVal = (document.getElementById('debt-end-date') || {}).value || '';

    // Populate rep dropdown
    const repSelect = document.getElementById('debt-rep-filter');
    if (repSelect) {
        repSelect.innerHTML = '<option value="">جميع المناديب</option>';
        [...new Set(state.sales.map(s => s.repName))].filter(name => name).sort().forEach(name => {
            repSelect.innerHTML += `<option value="${name}" ${name === repFilter ? 'selected' : ''}>${name}</option>`;
        });
    }

    // Populate customer dropdown with only customers that have at least one invoice (paid or due)
    try {
        const custSelect = document.getElementById('debt-customer-filter');
        if (custSelect) {
            const customerIds = Array.from(new Set((state.sales || []).map(s => s.customerId).filter(id => id !== undefined && id !== null)));
            // Build options preserving previous selection if any
            const prevValue = (custSelect.value || '');
            let options = '<option value="">جميع العملاء</option>';
            customerIds.sort((a,b) => {
                const aName = (findCustomer(a) && findCustomer(a).name) ? findCustomer(a).name.toLowerCase() : String(a);
                const bName = (findCustomer(b) && findCustomer(b).name) ? findCustomer(b).name.toLowerCase() : String(b);
                return aName.localeCompare(bName);
            }).forEach(id => {
                const name = (findCustomer(id) && findCustomer(id).name) ? findCustomer(id).name : ('عميل ' + id);
                options += `<option value="${id}" ${String(id) === String(prevValue) ? 'selected' : ''}>${name}</option>`;
            });
            custSelect.innerHTML = options;
        }
    } catch (e) { console.warn('Failed to populate debt customer select', e); }

    // If no filters provided -> show aggregated debts per customer
    const noFilters = !customerFilterText && !repFilter && !startDateVal && !endDateVal;

    // Small debug output: print counts and show on-screen banner to help diagnose invisible/missing data
    try {
        const debugEl = document.getElementById('debts-debug');
        console.log('renderDebts called', { sales: (state.sales || []).length, customers: (state.customers || []).length, noFilters });
        if (debugEl) {
            debugEl.style.display = 'block';
            try {
                const salesPreview = (state.sales || []).slice(0,5).map(s => ({ invoice: s.invoiceNumber || s.id, date: s.date ? s.date.split('T')[0] : '', total: s.total || 0 }));
                const customersPreview = (state.customers || []).slice(0,5).map(c => ({ id: c.id, name: c.name }));
                const lines = [
                    `السجلات: ${(state.sales || []).length} مبيعات، ${(state.customers || []).length} عملاء`,
                    `عرض ملخص: ${noFilters ? 'نعم' : 'لا'}`,
                    `أمثلة مبيعات: ${salesPreview.map(s => `${s.invoice}:${s.total}`).join(' | ') || 'لا توجد'}`,
                    `أمثلة عملاء: ${customersPreview.map(c => c.name).join(' | ') || 'لا يوجد'}`
                ];
                debugEl.textContent = lines.join(' — ');
            } catch (e) {
                debugEl.textContent = `السجلات: ${(state.sales || []).length} مبيعات، ${(state.customers || []).length} عملاء — عرض ملخص: ${noFilters ? 'نعم' : 'لا'}`;
            }
        }
    } catch (e) { console.warn('Debts debug banner update failed', e); }

    const tbody = document.getElementById('debts-detail-body');
    const emptyMessage = document.getElementById('debts-empty-message');
    if (!tbody) return;
    // Initialize table with empty content and proper styles
    tbody.innerHTML = '';
    const dataCellStyle = 'padding:8px;border:1px solid #ddd;background:white;color:black;font-size:14px;text-align:center;';
    const rightCellStyle = dataCellStyle + 'text-align:right;';
    const centerCellStyle = dataCellStyle + 'text-align:center;';
    const moneyStyle = dataCellStyle + 'font-weight:bold;color:#1d4f91;';

    // Force table styling
    try {
        const table = document.getElementById('debts-detail-table');
        if (table) {
            table.style.cssText = 'width:100% !important;border-collapse:collapse !important;font-family:Arial,sans-serif !important;direction:rtl !important;';
        }
    } catch (e) {}

    // If no filters provided -> show invoice-level rows (all invoices)
    let filteredSales = [];
    if (noFilters) {
        filteredSales = (state.sales || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
    } 

    // Otherwise, apply filters and show invoice-level rows
    const startDate = startDateVal ? new Date(startDateVal + 'T00:00:00') : null;
    const endDate = endDateVal ? new Date(endDateVal + 'T23:59:59') : null;

    if (!filteredSales.length) {
        filteredSales = state.sales.filter(sale => {
        const saleDate = sale.date ? new Date(sale.date) : null;
        if (startDate && saleDate && saleDate < startDate) return false;
        if (endDate && saleDate && saleDate > endDate) return false;
        if (customerFilterText) {
            // If the filter control is a select we expect an id value -> match by id
            const custControl = document.getElementById('debt-customer-filter');
            if (custControl && custControl.tagName === 'SELECT') {
                if (String(sale.customerId) !== String(customerFilterText)) return false;
            } else {
                const custName = (findCustomer(sale.customerId)?.name || '').toLowerCase();
                if (!custName.includes(customerFilterText.toLowerCase())) return false;
            }
        }
        if (repFilter) {
            if (!sale.repName || sale.repName.toLowerCase() !== repFilter.toLowerCase()) return false;
        }
        return true;
    }).sort((a,b) => new Date(b.date) - new Date(a.date));
    }

    // Apply "Show Unpaid Only" filter
    const hidePaidCheckbox = document.getElementById('hide-paid-debts');
    const hidePaid = hidePaidCheckbox ? hidePaidCheckbox.checked : true; // Default to true (hide paid)
    
    if (hidePaid) {
        filteredSales = filteredSales.filter(sale => {
            const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
            const remainingAmount = (sale.total || 0) - paidAmount;
            return remainingAmount > 0.01; // Show only if remaining debt > 0
        });
    }

    // Apply column sort state (Excel-style) before computing stats
    try {
        if (window.debtsSortState && window.debtsSortState.column && window.debtsSortState.direction) {
            const { column, direction } = window.debtsSortState;
            const dir = direction === 'desc' ? -1 : 1;
            const getValue = (sale) => {
                if (column === 'customer') return (findCustomer(sale.customerId)?.name || '').toLowerCase();
                if (column === 'rep') return (sale.repName || '').toLowerCase();
                if (column === 'date') return sale.date ? sale.date.split('T')[0] : '';
                if (column === 'invoice') return String(sale.invoiceNumber || '');
                if (column === 'total') return Number(sale.total || 0);
                if (column === 'paid') return Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)));
                if (column === 'remaining') return Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))));
                return '';
            };
            filteredSales.sort((a,b)=>{
                const va = getValue(a);
                const vb = getValue(b);
                // Numeric compare if both numbers
                if (typeof va === 'number' && typeof vb === 'number') {
                    return (va - vb) * dir;
                }
                return String(va).localeCompare(String(vb), 'ar') * dir;
            });
        }
    } catch(e){ console.warn('debts sort failed', e); }

    // Compute stats
    const subtotal = filteredSales.reduce((s, r) => s + (r.total || 0), 0);
    const paidSum = filteredSales.reduce((s, r) => {
        const paid = r.paidAmount ?? ((r.firstPayment || 0) + (r.secondPayment || 0));
        return s + (Number(paid) || 0);
    }, 0);
    const invoicesCount = filteredSales.length;
    const debtsTotal = filteredSales.reduce((s, r) => {
        const paid = r.paidAmount ?? ((r.firstPayment || 0) + (r.secondPayment || 0));
        return s + ((r.total || 0) - (Number(paid) || 0));
    }, 0);

    // Preserve original rendered sales for column filters if any active
    // Support both the old `_columnFilterState` (legacy) and the new `debtsColumnFilters` state.
    const hasActiveColumnFilters = (
        (window.debtsColumnFilters && Object.keys(window.debtsColumnFilters).some(c => window.debtsColumnFilters[c] && window.debtsColumnFilters[c].length > 0)) ||
        (window._columnFilterState && Object.keys(window._columnFilterState).some(c => window._columnFilterState[c] && window._columnFilterState[c].length > 0))
    );
    if (hasActiveColumnFilters) {
        try { window._debtsFiltersOriginalRenderedSales = Array.isArray(filteredSales) ? filteredSales.slice() : filteredSales; } catch (e) { window._debtsFiltersOriginalRenderedSales = filteredSales; }
    } else {
        window._debtsFiltersOriginalRenderedSales = null;
    }
    // Save last rendered for CSV/print
    window._lastRenderedDebtsSales = filteredSales;
    window._lastRenderedDebtsStats = { subtotal, paid: paidSum, count: invoicesCount, debts: debtsTotal };

    // Update summary boxes with formatted numbers (without currency symbol)
    const subtotalEl2 = document.getElementById('debts-subtotal');
    const paidEl2 = document.getElementById('debts-paid');
    const countEl2 = document.getElementById('debts-invoices-count');
    const debtsEl2 = document.getElementById('debts-total-debt');
    
    // Format numbers without currency symbol, just the number with commas
    const formatBoxNumber = (num) => Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    if (subtotalEl2) subtotalEl2.textContent = formatBoxNumber(subtotal);
    if (paidEl2) paidEl2.textContent = formatBoxNumber(paidSum);
    if (countEl2) countEl2.textContent = formatBoxNumber(invoicesCount);
    if (debtsEl2) debtsEl2.textContent = formatBoxNumber(debtsTotal);

    if (invoicesCount === 0) {
        if (emptyMessage) emptyMessage.classList.remove('hidden');
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 p-4">لا توجد فواتير مطابقة للفلاتر.</td></tr>`;
        return;
    } else {
        if (emptyMessage) emptyMessage.classList.add('hidden');
    }

    // Render invoice-level rows; use inline styles to be robust against external CSS
    filteredSales.forEach((sale, idx) => {
        const tr = document.createElement('tr');
        try { tr.style.display = 'table-row'; tr.style.visibility = 'visible'; tr.style.opacity = '1'; } catch (e) {}
        const custName = findCustomer(sale.customerId)?.name || 'عميل محذوف';
        const dateText = sale.date ? formatArabicDate(sale.date) : '';
        const invoiceNum = sale.invoiceNumber || '';
        const total = formatCurrency(sale.total || 0);
        const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
        const paid = formatCurrency(paidAmount);
        const remaining = formatCurrency((sale.total || 0) - paidAmount);
        const rep = sale.repName || '';
        // Format numbers without currency symbol for table cells
        const formatTableNumber = (num) => Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const formattedTotal = formatTableNumber(sale.total || 0);
        const formattedPaid = formatTableNumber(paidAmount);
        const formattedRemaining = formatTableNumber((sale.total || 0) - paidAmount);
        
        const html = `
            <td style="${rightCellStyle}" class="customer-name">${custName}</td>
            <td style="${centerCellStyle}" class="date">${dateText}</td>
            <td style="${centerCellStyle}" class="invoice-number">${invoiceNum}</td>
            <td style="${moneyStyle}" class="total">${formattedTotal}</td>
            <td style="${moneyStyle}" class="paid">${formattedPaid}</td>
            <td style="${moneyStyle}" class="remaining">${formattedRemaining}</td>
            <td style="${centerCellStyle}" class="rep-name">${rep}</td>
        `;
        tr.innerHTML = html;
        // tag row with sale id for robust mapping
        try {
            if (sale && (sale.id !== undefined && sale.id !== null)) tr.dataset.saleId = String(sale.id);
            else if (sale && sale.invoiceNumber) tr.dataset.saleId = String(sale.invoiceNumber);
            // add raw data attributes for robust filtering
            if (sale) {
                try { if (sale.customerId !== undefined && sale.customerId !== null) tr.dataset.customerId = String(sale.customerId); } catch(e){}
                try { tr.dataset.date = sale.date ? sale.date.split('T')[0] : ''; } catch(e){}
                try { tr.dataset.invoice = sale.invoiceNumber ? String(sale.invoiceNumber) : ''; } catch(e){}
                try { tr.dataset.total = String(Number(sale.total || 0)); } catch(e){}
                try { const paidRaw = Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))); tr.dataset.paid = String(paidRaw); } catch(e){}
                try { const rem = Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))); tr.dataset.remaining = String(rem); } catch(e){}
                try { tr.dataset.rep = sale.repName ? String(sale.repName) : ''; } catch(e){}
            }
        } catch(e){}                // add alternating classes for gold styling
        // Add visual indicators for balances - using black color now to match screenshot
        const remainingCell = tr.querySelector('.remaining');
        if (remainingCell) {
            const remainingValue = parseFloat(formattedRemaining.replace(/,/g, ''));
            remainingCell.style.color = 'black'; // All numbers in black to match screenshot
        }
        tbody.appendChild(tr);
    });

        updateIcons();

    // Re-apply column filters if present (keeps filters working after other filter interactions)
    try {
        if (typeof window.applyDebtsColumnFilters === 'function') {
            window.applyDebtsColumnFilters();
        }
    } catch (e) { /* ignore */ }
}

function calculateRepBalances() { 
    const repBalances = new Map(); 
    state.reps.forEach(rep => { 
        repBalances.set(rep.name, { totalSales: 0, totalCollected: 0, balance: 0, repId: rep.id }); 
    }); 
    state.sales.forEach(sale => { 
        const repEntry = repBalances.get(sale.repName); 
        if (repEntry) { 
            repEntry.totalSales += (sale.total || 0);
            const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
            repEntry.totalCollected += (Number(paidAmount) || 0);
        } 
    }); 
    repBalances.forEach(entry => { 
        entry.balance = entry.totalSales - entry.totalCollected; 
    }); 
    return repBalances; 
}

// --- Debts Column Filters (Excel-style) ---
(function(){
    const debtsColumnFilters = {};
    let debtsSortState = { column: null, direction: null }; // 'asc' | 'desc'

    function normalizeRaw(v){ return (v === null || typeof v === 'undefined') ? '' : String(v).trim(); }

    function populateMenuList(menu, col){
        const listEl = menu.querySelector('.filter-list');
        listEl.innerHTML = '';
        const rows = window._lastRenderedDebtsSales || [];
        const map = new Map();
        rows.forEach(sale => {
            let raw = ''; let disp = '';
            if (col === 'customer') { raw = normalizeRaw(sale.customerId); disp = findCustomer(sale.customerId)?.name || raw; }
            else if (col === 'date') { raw = sale.date ? sale.date.split('T')[0] : ''; disp = sale.date ? formatArabicDate(sale.date) : ''; }
            else if (col === 'invoice') { raw = normalizeRaw(sale.invoiceNumber); disp = raw; }
            else if (col === 'total') { const v = Number(sale.total || 0); raw = normalizeRaw(v); disp = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'paid') { const v = Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))); raw = normalizeRaw(v); disp = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'remaining') { const v = Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))); raw = normalizeRaw(v); disp = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'rep') { raw = normalizeRaw(sale.repName); disp = raw; }
            if (!map.has(raw)) map.set(raw, disp);
        });
        const items = Array.from(map.entries()).sort((a,b)=> String(a[1]).localeCompare(String(b[1]), 'ar'));
        items.forEach(([raw, disp]) => {
            const id = 'cf-debts-' + col + '-' + Math.random().toString(36).slice(2,8);
            const label = document.createElement('label');
            label.style.display = 'block'; label.style.padding = '4px 2px';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = raw; cb.id = id;
            if (Array.isArray(debtsColumnFilters[col]) && debtsColumnFilters[col].includes(raw)) cb.checked = true;
            const txt = document.createTextNode(' ' + String(disp));
            label.appendChild(cb); label.appendChild(txt);
            listEl.appendChild(label);
        });
    }

    function syncSelectAll(menu, col){
        const selectAll = menu.querySelector('.select-all-checkbox');
        if (!selectAll) return;
        const boxes = Array.from(menu.querySelectorAll('.filter-list input[type="checkbox"]'));
        const active = debtsColumnFilters[col];
        if (!active || active.length === 0 || active.length === boxes.length) {
            selectAll.checked = true; boxes.forEach(b => b.checked = true);
        } else {
            boxes.forEach(b => b.checked = active.includes(b.value));
            selectAll.checked = active.length === boxes.length;
        }
    }

    function buildMenu(col){
        const btn = document.querySelector(`.column-filter-btn[data-col="${col}"]`);
        if (!btn) return null;
        if (btn._menu) { populateMenuList(btn._menu, col); syncSelectAll(btn._menu, col); return btn._menu; }

        const menu = document.createElement('div');
        menu.className = 'column-filter-menu debts-filter-menu';
        menu.style.display = 'none';
        menu.style.zIndex = '99999';
        menu.style.minWidth = '220px';
        menu.style.paddingTop = '6px';
        menu.innerHTML = `
            <div style="display:flex;gap:6px;justify-content:space-between;padding:0 8px 6px;">
                <button type="button" class="sort-asc" style="flex:1;background:#f8fafc;border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;font-size:11px;cursor:pointer;">ترتيب تصاعدي ↑</button>
                <button type="button" class="sort-desc" style="flex:1;background:#f8fafc;border:1px solid #d1d5db;border-radius:4px;padding:4px 6px;font-size:11px;cursor:pointer;">ترتيب تنازلي ↓</button>
            </div>
            <label class="select-all-label" style="display:block;padding:4px 8px;border-top:1px solid #e2e8f0;margin-top:2px;font-size:12px;font-weight:600;">
                <input type="checkbox" class="select-all-checkbox" checked style="transform:scale(1.1);margin-left:6px;" /> (تحديد الكل)
            </label>
            <input class="filter-search" placeholder="بحث..." style="margin:4px 8px;padding:4px 6px;width:calc(100% - 16px);border:1px solid #cbd5e1;border-radius:4px;font-size:12px;" />
            <div class="filter-list" style="max-height:200px;overflow:auto;padding:4px 8px;"></div>
            <div class="filter-actions" style="display:flex;gap:6px;padding:8px 8px 6px;border-top:1px solid #e2e8f0;margin-top:4px;">
                <button class="ok-btn" style="flex:1;background:#2563eb;color:white;border:none;border-radius:4px;padding:6px 4px;font-size:12px;cursor:pointer;font-weight:600;">موافق</button>
                <button class="cancel-btn" style="flex:1;background:#64748b;color:white;border:none;border-radius:4px;padding:6px 4px;font-size:12px;cursor:pointer;">إلغاء</button>
                <button class="clear-btn" style="flex:1;background:#dc2626;color:white;border:none;border-radius:4px;padding:6px 4px;font-size:12px;cursor:pointer;">مسح</button>
            </div>
        `;
        document.body.appendChild(menu);

        // Search filter
        menu.querySelector('.filter-search').addEventListener('input', (e)=>{
            const q = (e.target.value || '').trim().toLowerCase();
            menu.querySelectorAll('.filter-list label').forEach(lbl=>{
                lbl.style.display = (lbl.textContent||'').toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // Sorting controls
        menu.querySelector('.sort-asc').addEventListener('click', ()=>{
            debtsSortState = { column: col, direction: 'asc' };
            try { window.debtsSortState = debtsSortState; } catch(e){}
            renderDebts();
            try { applyDebtsColumnFilters(); } catch(e){}
            hideAllMenus();
        });
        menu.querySelector('.sort-desc').addEventListener('click', ()=>{
            debtsSortState = { column: col, direction: 'desc' };
            try { window.debtsSortState = debtsSortState; } catch(e){}
            renderDebts();
            try { applyDebtsColumnFilters(); } catch(e){}
            hideAllMenus();
        });

        // Select all checkbox behavior
        menu.querySelector('.select-all-checkbox').addEventListener('change', (e)=>{
            const checked = e.target.checked;
            menu.querySelectorAll('.filter-list input[type="checkbox"]').forEach(cb => cb.checked = checked);
        });

        // OK / Cancel / Clear
        menu.querySelector('.ok-btn').addEventListener('click', ()=>{
            const allBoxes = Array.from(menu.querySelectorAll('.filter-list input[type="checkbox"]'));
            const checked = allBoxes.filter(cb => cb.checked).map(cb => cb.value);
            debtsColumnFilters[col] = (checked.length === 0 || checked.length === allBoxes.length) ? [] : checked;
            applyDebtsColumnFilters();
            hideAllMenus();
        });
        menu.querySelector('.cancel-btn').addEventListener('click', ()=> hideAllMenus());
        menu.querySelector('.clear-btn').addEventListener('click', ()=>{
            debtsColumnFilters[col] = [];
            applyDebtsColumnFilters();
            hideAllMenus();
        });

        btn._menu = menu;
        populateMenuList(menu, col);
        syncSelectAll(menu, col);
        return menu;
    }

    function showMenu(btn){
        const col = btn.dataset.col; if (!col) return;
        const menu = buildMenu(col); if (!menu) return;
        hideAllMenus();
        const rect = btn.getBoundingClientRect();
        menu.style.display = 'block';
        requestAnimationFrame(()=>{
            const left = rect.left + window.scrollX - (menu.offsetWidth - rect.width);
            menu.style.left = (left < 8 ? 8 : left) + 'px';
            menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        });
    }

    function hideAllMenus(){ document.querySelectorAll('.debts-filter-menu').forEach(m=>m.style.display='none'); }

    function updateDebtsFilterIndicators(){
        const cols = ['customer','date','invoice','total','paid','remaining','rep'];
        cols.forEach(col => {
            const btn = document.querySelector(`.column-filter-btn[data-col="${col}"]`);
            if (!btn) return;
            const active = Array.isArray(debtsColumnFilters[col]) && debtsColumnFilters[col].length > 0;
            if (active) btn.classList.add('filtered'); else btn.classList.remove('filtered');
        });
    }

    function applyDebtsColumnFilters(){
        const tbody = document.getElementById('debts-detail-body'); if (!tbody) return;
        const trs = Array.from(tbody.querySelectorAll('tr'));
        const activeCols = Object.keys(debtsColumnFilters).filter(c => Array.isArray(debtsColumnFilters[c]) && debtsColumnFilters[c].length>0);
        trs.forEach(tr=>{
            let show = true;
            for (const col of activeCols) {
                const sel = debtsColumnFilters[col] || [];
                let cellRaw = '';
                try {
                    if (col === 'customer') cellRaw = normalizeRaw(tr.dataset.customerId);
                    else if (col === 'date') cellRaw = normalizeRaw(tr.dataset.date);
                    else if (col === 'invoice') cellRaw = normalizeRaw(tr.dataset.invoice);
                    else if (col === 'total') cellRaw = normalizeRaw(Number(tr.dataset.total||0));
                    else if (col === 'paid') cellRaw = normalizeRaw(Number(tr.dataset.paid||0));
                    else if (col === 'remaining') cellRaw = normalizeRaw(Number(tr.dataset.remaining||0));
                    else if (col === 'rep') cellRaw = normalizeRaw(tr.dataset.rep);
                } catch(e){ cellRaw = ''; }
                if (!sel.includes(String(cellRaw))) { show = false; break; }
            }
            if (show) { tr.classList.remove('hidden-by-filter'); tr.style.display = 'table-row'; }
            else { tr.classList.add('hidden-by-filter'); tr.style.display = 'none'; }
        });

        const source = window._debtsFiltersOriginalRenderedSales || window._lastRenderedDebtsSales || [];
        const visibleSales = source.filter(sale => {
            for (const col of activeCols) {
                const sel = debtsColumnFilters[col] || [];
                let raw = '';
                if (col === 'customer') raw = normalizeRaw(sale.customerId);
                else if (col === 'date') raw = sale.date ? sale.date.split('T')[0] : '';
                else if (col === 'invoice') raw = normalizeRaw(sale.invoiceNumber);
                else if (col === 'total') raw = normalizeRaw(Number(sale.total || 0));
                else if (col === 'paid') raw = normalizeRaw(Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))));
                else if (col === 'remaining') raw = normalizeRaw(Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))));
                else if (col === 'rep') raw = normalizeRaw(sale.repName);
                if (!sel.includes(String(raw))) return false;
            }
            return true;
        });
        window._lastRenderedDebtsSales = visibleSales;
        updateDebtsFilterIndicators();
    }

    // Open/close behavior
    document.addEventListener('click', (e)=>{
        const btn = e.target.closest('.column-filter-btn');
        if (btn) { e.stopPropagation(); showMenu(btn); return; }
        if (!e.target.closest('.debts-filter-menu')) hideAllMenus();
    });

    // Expose
    window.debtsColumnFilters = debtsColumnFilters;
    window.applyDebtsColumnFilters = applyDebtsColumnFilters;
    window.debtsSortState = debtsSortState;
    window.updateDebtsFilterIndicators = updateDebtsFilterIndicators;
    // Initial indicator paint (in case state restored elsewhere)
    try { updateDebtsFilterIndicators(); } catch(e){}
})();

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
// Format numbers using English (en-US) digits with up to 2 decimals
function formatNumberEN(v){
    const n = Number(v ?? 0);
    if (isNaN(n)) return '0';
    const hasFraction = Math.abs(n - Math.round(n)) > 0;
    return n.toLocaleString('en-US', { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 });
}
async function loadReps() {
    const repSelect = document.getElementById('debt-rep-filter');
    // If running from file:// (offline) the browser blocks fetch to absolute/relative endpoints due to CORS.
    // In that case, use the local `state.reps` as a fallback.
    const isFileProtocol = window.location && window.location.protocol === 'file:';
    const fallbackPopulate = (reps) => {
        try {
            if (!repSelect) return;
            repSelect.innerHTML = `\n                        <option value="">جميع المناديب</option>\n                        ${reps.map(rep => `<option value="${rep.id}">${rep.name}</option>`).join('')}\n                    `;
        } catch (e) { console.warn('populate reps fallback failed', e); }
    };

    if (isFileProtocol) {
        // Offline mode: populate from local state immediately
        try {
            const reps = Array.isArray(state.reps) ? state.reps : [];
            fallbackPopulate(reps);
            return reps;
        } catch (e) {
            console.warn('loadReps fallback failed', e);
            return [];
        }
    }

    // Otherwise attempt network fetch but gracefully fall back to local state on any failure
    try {
        const response = await fetch('/api/representatives', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const reps = await response.json();
        fallbackPopulate(Array.isArray(reps) ? reps : []);
        return reps;
    } catch (error) {
        console.warn('Error loading representatives from network, falling back to local state:', error);
        const reps = Array.isArray(state.reps) ? state.reps : [];
        fallbackPopulate(reps);
        return reps;
    }
}

function renderRepDebts() {
    // تحميل قائمة المناديب عند تحميل الصفحة
    loadReps();
     const tbody = document.getElementById('rep-debts-list-body'); if (!tbody) return; tbody.innerHTML = ''; const balances = Array.from(calculateRepBalances().entries()).map(([repName, obj]) => ({ repName, ...obj })).filter(r => r.totalSales > 0).sort((a, b) => b.balance - a.balance); if (balances.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">لا توجد مبيعات مسجلة للمناديب بعد.</td></tr>`; return; } balances.forEach(row => { const balanceClass = row.balance > 0 ? 'text-red-700 font-bold' : (row.balance < 0 ? 'text-green-700 font-bold' : 'text-gray-700'); const balanceText = formatCurrency(row.balance); const tr = document.createElement('tr'); tr.className = 'hover:bg-orange-50'; tr.innerHTML = `<td class="px-4 py-3 text-right font-medium text-gray-800">${row.repName}</td><td class="px-4 py-3 text-center">${formatCurrency(row.totalSales)}</td><td class="px-4 py-3 text-center">${formatCurrency(row.totalCollected)}</td><td class="px-4 py-3 text-center ${balanceClass}">${balanceText}</td><td class="px-4 py-3 text-center"><button data-rep-name="${row.repName}" class="view-rep-summary-btn text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-md hover:bg-orange-200 transition">عرض كشف الحساب</button></td>`; tbody.appendChild(tr); }); tbody.querySelectorAll('.view-rep-summary-btn').forEach(button => { button.addEventListener('click', (e) => { const repName = e.currentTarget.dataset.repName; generateAndShowRepSummary(repName); }); }); updateIcons();
}

function generateAndShowRepSummary(repName) {
    const repSales = state.sales.filter(s => s.repName === repName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    const repSummaryContent = document.getElementById('rep-sales-summary-content'); 
    const repSummaryTitle = document.getElementById('rep-sales-summary-title'); 
    if (!repSales.length) { 
        repSummaryContent.innerHTML = `<p class="text-center text-gray-500 p-4">لا توجد فواتير مسجلة للمندوب ${repName}.</p>`; 
        repSummaryTitle.textContent = `كشف حساب المندوب: ${repName}`; 
        openModal(repSalesSummaryModal); 
        return; 
    } 
    const repBalances = calculateRepBalances().get(repName) || { totalSales: 0, totalCollected: 0, balance: 0 }; 
    const saleRowsHtml = repSales.map(sale => {
        const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
        return `<tr><td class="px-4 py-2 whitespace-nowrap"><bdo dir="rtl">${formatArabicDate(sale.date)}</bdo></td><td class="px-4 py-2 text-center font-bold text-red-600">${sale.invoiceNumber}</td><td class="px-4 py-2 text-right">${findCustomer(sale.customerId)?.name || 'عميل محذوف'}</td><td class="px-4 py-2 text-center font-semibold ${sale.total < 0 ? 'text-red-600' : 'text-blue-600'}">${formatCurrency(sale.total)}</td><td class="px-4 py-2 text-center text-green-600">${formatCurrency(paidAmount)}</td><td class="px-4 py-2 text-center">${getStatusBadge(sale.status)}</td></tr>`;
    }).join('');
    let html = `<div class="space-y-4"><div class="bg-orange-50 p-4 rounded-lg shadow-inner border border-orange-200"><p class="font-bold text-xl text-orange-700">${repName}</p><div class="grid grid-cols-3 gap-4 mt-2 text-sm"><p><strong>إجمالي المبيعات:</strong> <span class="font-semibold text-blue-600">${formatCurrency(repBalances.totalSales)}</span></p><p><strong>الإجمالي المحصل:</strong> <span class="font-semibold text-green-600">${formatCurrency(repBalances.totalCollected)}</span></p><p><strong>المديونية/المستحق:</strong> <span class="font-bold ${repBalances.balance > 0 ? 'text-red-600' : 'text-gray-600'}">${formatCurrency(repBalances.balance)}</span></p></div></div><h3 class="font-bold text-gray-700 border-b pb-2">تفاصيل الفواتير:</h3><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-right">التاريخ</th><th class="px-4 py-2 text-center">رقم الفاتورة</th><th class="px-4 py-2 text-right">العميل</th><th class="px-4 py-2 text-center">الإجمالي</th><th class="px-4 py-2 text-center">المدفوع</th><th class="px-4 py-2 text-center">الحالة</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">${saleRowsHtml}</tbody></table></div></div>`; 
    repSummaryContent.innerHTML = html; 
    repSummaryTitle.textContent = `كشف حساب المندوب: ${repName}`; 
    updateIcons(); 
    openModal(repSalesSummaryModal);
}

function addRowToNewDispatchGrid(item = {}) {
    const container = document.getElementById('new-dispatch-items-container');
    if (!container) return;
    const row = document.createElement('tr');
    row.className = 'dispatch-item-row';
    
    const productOptions = state.products.map(p => 
        `<option value="${p.id}" ${item.productId === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    // Removed goodReturn, damagedReturn, freebie inputs, added actualReturn input
    row.innerHTML = `
        <td class="px-2 py-1"><select class="dispatch-item-product w-full p-1 border rounded-md text-sm" required><option value="">اختر منتج...</option>${productOptions}</select></td>
        <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="quantity" value="${item.quantity || ''}" placeholder="0" min="0"></td>
        <td><input class="w-full p-1 border rounded-md text-center text-sm actual-return-input" type="number" data-field="actualReturn" value="${item.actualReturn || ''}" placeholder="0" min="0"></td>
        <td class="px-2 py-1 text-center"><button type="button" class="delete-dispatch-item-btn text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
    `;
    
    container.appendChild(row);
    updateIcons();

    row.querySelector('.delete-dispatch-item-btn').addEventListener('click', () => {
        row.remove();
    });
}

async function saveNewDispatchNoteFromGrid() {
    const repName = document.getElementById('new-dispatch-rep').value;
    const date = document.getElementById('new-dispatch-date').value;
    const noteNumber = document.getElementById('new-dispatch-note-number').value;

    if (!repName || !date || !noteNumber) {
        await customDialog({ message: 'الرجاء إدخال رقم الإذن والمندوب والتاريخ أولاً.', title: 'بيانات ناقصة' });
        return;
    }

    const items = [];
    const itemRows = document.querySelectorAll('#new-dispatch-items-container .dispatch-item-row');
    for (const row of itemRows) {
        const productId = row.querySelector('.dispatch-item-product').value;
        const quantity = parseInt(row.querySelector('[data-field="quantity"]').value) || 0;
        const actualReturn = parseInt(row.querySelector('[data-field="actualReturn"]').value) || 0; // NEW

        if (productId && (quantity > 0 || actualReturn > 0)) { // Modified condition
            items.push({ productId, quantity, actualReturn }); // Modified item object
        }
    }

    if (items.length === 0) {
        await customDialog({ message: 'الرجاء إضافة صنف واحد على الأقل للإذن.', title: 'بيانات ناقصة' });
        return;
    }

    const noteData = {
        id: undefined, // سيُنشأ من Firestore
        noteNumber: parseInt(noteNumber),
        repName,
        date: new Date(date + 'T12:00:00Z').toISOString(),
        items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: (auth && auth.currentUser) ? auth.currentUser.uid : null,
        createdByEmail: (auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : null
    };

    try {
        await addDispatchNote(noteData);
        await customDialog({ message: 'تم حفظ إذن الخروج في السحابة بنجاح.', title: 'نجاح' });
    } catch(e){
        console.warn('Failed to add dispatch note', e);
        await customDialog({ message:'تعذر حفظ الإذن. تحقق من الاتصال أو الصلاحيات.', title:'خطأ' });
    }

    initializeNewDispatchGrid();
}

function initializeNewDispatchGrid() {
    const repSelect = document.getElementById('new-dispatch-rep');
    const dateInput = document.getElementById('new-dispatch-date');
    const container = document.getElementById('new-dispatch-items-container');

    if (!repSelect || !dateInput || !container) return;

    populateRepDropdown(repSelect);
    dateInput.value = new Date().toISOString().split('T')[0];
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        addRowToNewDispatchGrid();
    }
}

function renderDispatchPage() {
    const listEl = document.getElementById('dispatch-notes-list');
    listEl.innerHTML = '';
    const notesArr = Array.isArray(state.dispatchNotes) ? state.dispatchNotes : [];
    const sortedNotes = notesArr.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedNotes.length === 0) {
        listEl.innerHTML = '<p class="text-gray-500 text-center mt-8 bg-white p-4 rounded-lg">لا توجد أذونات استلام سابقة.</p>';
        return;
    }

    sortedNotes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg border shadow-sm dispatch-note-card';
        el.dataset.noteId = note.id;
        el.innerHTML = `
            <div class="flex justify-between items-start cursor-pointer dispatch-note-header">
                <div>
                    <p class="font-bold text-lg">${note.repName}</p>
                    <p class="text-sm text-gray-500">بتاريخ: ${new Date(note.date).toLocaleDateString('ar-EG')}</p>
                    <p class="text-xs text-gray-500 mt-1">${note.items.length} صنف</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-400">تعديل</span>
                    <i data-lucide="chevron-down" class="w-5 h-5 transition-transform"></i>
                </div>
            </div>
            <div class="dispatch-note-details hidden mt-4 pt-4 border-t">
                <!-- Editable grid will be injected here -->
            </div>
        `;
        listEl.appendChild(el);
    });
    updateIcons();
    // معالجة إظهار/إخفاء أقسام حسب الدور
    try {
        const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        const createSection = document.getElementById('new-dispatch-note-section');
        const summaryBox = document.getElementById('rep-dispatch-summary');
        if (role === 'rep') {
            if (createSection) createSection.style.display = 'none';
            if (summaryBox) { summaryBox.classList.remove('hidden'); renderRepDispatchSummary(); }
        } else {
            if (createSection) createSection.style.display = '';
            if (summaryBox) summaryBox.classList.add('hidden');
        }
    } catch(e){ console.warn('dispatch role toggle failed', e); }
}

// تجميع ملخص أصناف المندوب (قراءة فقط)
function renderRepDispatchSummary(){
    try {
        const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        if (role !== 'rep') return;
        const box = document.getElementById('rep-dispatch-summary-content');
        if (!box) return;
        const user = (typeof AuthSystem !== 'undefined' && AuthSystem.getCurrentUser) ? AuthSystem.getCurrentUser() : null;
        const repName = user ? (user.displayName || user.name || user.email || '').trim() : '';
        const notes = (Array.isArray(state.dispatchNotes) ? state.dispatchNotes : []).filter(n => (n.repName||'').trim() === repName);
        if (notes.length === 0) { box.innerHTML = '<p class="text-gray-500">لا توجد أذونات مرتبطة بحسابك.</p>'; return; }
        const agg = new Map();
        notes.forEach(n => (n.items||[]).forEach(it => {
            const key = String(it.productId || it.name || '').trim();
            if (!agg.has(key)) agg.set(key, { name: it.name || key, received:0, returnOk:0, returnBad:0, freeQty:0 });
            const o = agg.get(key);
            o.received += Number(it.receivedQty || it.quantity || 0);
            o.returnOk += Number(it.returnedOk || it.actualReturn || 0);
            o.returnBad += Number(it.returnedDamaged || 0);
            o.freeQty += Number(it.freeQty || 0);
        }));
        const rows = Array.from(agg.values()).map(o => {
            const remaining = o.received - (o.returnOk + o.returnBad + o.freeQty);
            return `<tr>
                <td class='px-2 py-1 text-right'>${escapeHtml(o.name)}</td>
                <td class='px-2 py-1 text-center'>${o.received}</td>
                <td class='px-2 py-1 text-center'>${o.returnOk}</td>
                <td class='px-2 py-1 text-center'>${o.returnBad}</td>
                <td class='px-2 py-1 text-center'>${o.freeQty}</td>
                <td class='px-2 py-1 text-center font-semibold'>${remaining}</td>
            </tr>`;
        }).join('');
        box.innerHTML = `<div class='overflow-x-auto'><table class='min-w-full border divide-y divide-gray-200 text-xs'>
            <thead class='bg-gray-50'><tr>
                <th class='px-2 py-1 text-right'>الصنف</th>
                <th class='px-2 py-1 text-center'>مستلم</th>
                <th class='px-2 py-1 text-center'>مرتجع سليم</th>
                <th class='px-2 py-1 text-center'>مرتجع تالف</th>
                <th class='px-2 py-1 text-center'>مجاني</th>
                <th class='px-2 py-1 text-center'>المتبقي</th>
            </tr></thead><tbody>${rows}</tbody></table></div>`;
    } catch(e){ console.warn('renderRepDispatchSummary failed', e); }
}

// --- CASH column filter menus (per-column dropdowns) ---
(function(){
    const cashColumnFilters = {};

    function normalizeRaw(v){ return (v === null || typeof v === 'undefined') ? '' : String(v).toString().replace(/\s+/g,' ').trim(); }

    function populateCashMenuList(menu, col){
        const listEl = menu.querySelector('.filter-list');
        listEl.innerHTML = '';
        const rows = window._lastRenderedCashSales || [];
        const map = new Map();
        rows.forEach(sale => {
            let raw = '';
            let disp = '';
            if (col === 'customer') { raw = normalizeRaw(sale.customerId); disp = findCustomer(sale.customerId)?.name || raw; }
            else if (col === 'date') { raw = sale.date ? sale.date.split('T')[0] : ''; disp = sale.date ? formatArabicDate(sale.date) : ''; }
            else if (col === 'invoice') { raw = normalizeRaw(sale.invoiceNumber); disp = raw; }
            else if (col === 'total') { raw = normalizeRaw(Number(sale.total || 0)); disp = Math.abs(sale.total || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'paid') { const p = Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))); raw = normalizeRaw(p); disp = Math.abs(p).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'remaining') { const r = Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))); raw = normalizeRaw(r); disp = Math.abs(r).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
            else if (col === 'rep') { raw = normalizeRaw(sale.repName); disp = raw; }
            else if (col === 'collection') { raw = sale.collectionReportCreated ? 'created' : 'not-created'; disp = raw === 'created' ? 'تم' : 'لم يتم'; }
            if (!map.has(raw)) map.set(raw, disp);
        });

        const items = Array.from(map.entries()).sort((a,b)=> String(a[1]).localeCompare(String(b[1]), 'ar'));
        items.forEach(([raw, disp]) => {
            const id = 'cf-cash-' + col + '-' + Math.random().toString(36).slice(2,8);
            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.padding = '4px 2px';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = raw; cb.id = id;
            if (Array.isArray(cashColumnFilters[col]) && cashColumnFilters[col].includes(raw)) cb.checked = true;
            const txt = document.createTextNode(' ' + String(disp));
            label.appendChild(cb); label.appendChild(txt);
            listEl.appendChild(label);
        });
    }

    function buildCashMenu(col){
        const btn = document.querySelector(`.cash-column-filter-btn[data-col="${col}"]`);
        if (!btn) return null;
        if (btn._menu) { populateCashMenuList(btn._menu, col); return btn._menu; }

        const menu = document.createElement('div');
        menu.className = 'column-filter-menu cash-filter-menu';
        menu.style.display = 'none';
        menu.innerHTML = `
            <input class="filter-search" placeholder="بحث..." />
            <div class="filter-list"></div>
            <div class="filter-actions">
                <button class="apply-btn">تطبيق</button>
                <button class="clear-btn">مسح</button>
            </div>
        `;
        document.body.appendChild(menu);

        // wire search
        menu.querySelector('.filter-search').addEventListener('input', (e)=>{
            const q = (e.target.value || '').trim().toLowerCase();
            menu.querySelectorAll('.filter-list label').forEach(lbl=>{
                lbl.style.display = lbl.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });

        // apply
        menu.querySelector('.apply-btn').addEventListener('click', ()=>{
            const checked = Array.from(menu.querySelectorAll('.filter-list input[type="checkbox"]:checked')).map(i=>i.value);
            cashColumnFilters[col] = checked;
            applyCashColumnFilters();
            hideAllCashMenus();
        });

        // clear
        menu.querySelector('.clear-btn').addEventListener('click', ()=>{
            cashColumnFilters[col] = [];
            populateCashMenuList(menu, col);
            applyCashColumnFilters();
            hideAllCashMenus();
        });

        btn._menu = menu;
        populateCashMenuList(menu, col);
        return menu;
    }

    function showCashMenu(btn){
        const col = btn.dataset.col;
        if (!col) return;
        const menu = buildCashMenu(col);
        if (!menu) return;
        // hide other menus
        hideAllCashMenus();
        const rect = btn.getBoundingClientRect();
        menu.style.display = 'block';
        const left = rect.right - menu.offsetWidth + window.scrollX;
        menu.style.left = (left < 8 ? 8 : left) + 'px';
        menu.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    }

    function hideAllCashMenus(){ document.querySelectorAll('.cash-filter-menu').forEach(m=>m.style.display='none'); }

    function applyCashColumnFilters(){
        const tbody = document.getElementById('cash-table-body'); if (!tbody) return;
        const trs = Array.from(tbody.querySelectorAll('tr'));
        const activeCols = Object.keys(cashColumnFilters).filter(c => Array.isArray(cashColumnFilters[c]) && cashColumnFilters[c].length>0);
        try { console.debug('applyCashColumnFilters start', { filters: cashColumnFilters, activeCols, rowsRendered: (window._lastRenderedCashSales || []).length }); } catch(e){}

        trs.forEach(tr=>{
            let show = true;
            for (const col of activeCols) {
                const sel = cashColumnFilters[col] || [];
                let cellRaw = '';
                try {
                    if (col === 'customer') cellRaw = normalizeRaw(tr.dataset.customer);
                    else if (col === 'date') cellRaw = normalizeRaw(tr.dataset.date);
                    else if (col === 'invoice') cellRaw = normalizeRaw(tr.dataset.invoice);
                    else if (col === 'total') cellRaw = normalizeRaw(Number(tr.dataset.total||0));
                    else if (col === 'paid') cellRaw = normalizeRaw(Number(tr.dataset.paid||0));
                    else if (col === 'remaining') cellRaw = normalizeRaw(Number(tr.dataset.remaining||0));
                    else if (col === 'rep') cellRaw = normalizeRaw(tr.dataset.rep);
                    else if (col === 'collection') cellRaw = tr.querySelector('.cash-action-create') ? (tr.querySelector('.cash-action-create').textContent.includes('إلغاء') ? 'created' : 'not-created') : (tr.dataset.collectionReportCreated ? 'created' : 'not-created');
                } catch(e){ cellRaw = ''; }
                if (!sel.includes(String(cellRaw))) { show = false; break; }
            }
            tr.style.display = show ? 'table-row' : 'none';
        });

        const source = window._cashFiltersOriginalRenderedSales || window._lastRenderedCashSales || [];
        const visibleSales = source.filter(sale => {
            for (const col of activeCols) {
                const sel = cashColumnFilters[col] || [];
                let raw = '';
                if (col === 'customer') raw = normalizeRaw(sale.customerId);
                else if (col === 'date') raw = sale.date ? sale.date.split('T')[0] : '';
                else if (col === 'invoice') raw = normalizeRaw(sale.invoiceNumber);
                else if (col === 'total') raw = normalizeRaw(Number(sale.total || 0));
                else if (col === 'paid') raw = normalizeRaw(Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))));
                else if (col === 'remaining') raw = normalizeRaw(Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))));
                else if (col === 'rep') raw = normalizeRaw(sale.repName);
                else if (col === 'collection') raw = sale.collectionReportCreated ? 'created' : 'not-created';
                if (!sel.includes(String(raw))) return false;
            }
            return true;
        });
        window._lastRenderedCashSales = visibleSales;
    }

    // global click handler to open menus for cash
    document.addEventListener('click', (e)=>{
        const btn = e.target.closest('.cash-column-filter-btn');
        if (btn) { e.stopPropagation(); showCashMenu(btn); return; }
        if (!e.target.closest('.cash-filter-menu')) hideAllCashMenus();
    });

    window.cashColumnFilters = cashColumnFilters;
    window.applyCashColumnFilters = applyCashColumnFilters;
})();

function renderEditableDispatchGrid(noteId, container) {
    const note = state.dispatchNotes.find(n => n.id === noteId);
    if (!note) return;

    // 1. Fetch Sales Data for the specific rep and date
    const salesForRepAndDate = state.sales.filter(sale =>
        sale.repName === note.repName &&
        new Date(sale.date).toISOString().split('T')[0] === new Date(note.date).toISOString().split('T')[0]
    );

    // 2. Aggregate Sold Quantities by product
    const soldQuantities = {};
    salesForRepAndDate.forEach(sale => {
        sale.items.forEach(item => {
            soldQuantities[item.productId] = (soldQuantities[item.productId] || 0) + item.quantity;
        });
    });

    // 3. Compute weighted average prices per product for the sales found.
    //    If there are no sales for a product, fall back to customer's price list -> default price list -> product.base price.
    const avgPriceByProduct = {}; // productId -> averagePrice (number)
    // Build price lookup helper for a sale's customer
    const getPriceForProductForCustomer = (productId, customerId) => {
        // 1. Check the customer's assigned price list
        const customer = state.customers.find(c => c.id === customerId);
        if (customer && customer.priceListId) {
            const pl = findPriceList(customer.priceListId);
            if (pl && pl.productPrices && pl.productPrices[productId] !== undefined) return Number(pl.productPrices[productId]);
        }
        // 2. fallback to default retail price list if exists
        const retail = state.priceLists.find(p => p.id && p.id.includes('retail'));
        if (retail && retail.productPrices && retail.productPrices[productId] !== undefined) return Number(retail.productPrices[productId]);
        // 3. fallback to product base price
        const prod = findProduct(productId);
        return prod ? Number(prod.price || 0) : 0;
    };

    // Sum quantities * price per product using the sale items (if any)
    const priceSums = {}; // productId -> { qty: totalQty, value: totalQty*price }
    salesForRepAndDate.forEach(sale => {
        sale.items.forEach(item => {
            const pid = item.productId;
            const qty = Number(item.quantity || 0);
            // prefer explicit item.price if present
            let price = (item.price !== undefined && item.price !== null) ? Number(item.price) : getPriceForProductForCustomer(pid, sale.customerId);
            if (!price || isNaN(price)) price = getPriceForProductForCustomer(pid, sale.customerId);
            if (!priceSums[pid]) priceSums[pid] = { qty: 0, value: 0 };
            priceSums[pid].qty += qty;
            priceSums[pid].value += qty * price;
        });
    });

    Object.keys(priceSums).forEach(pid => {
        const entry = priceSums[pid];
        avgPriceByProduct[pid] = entry.qty > 0 ? (entry.value / entry.qty) : 0;
    });

    let itemsHtml = note.items.map(item => {
        const productOptions = state.products.map(p =>
            `<option value="${p.id}" ${item.productId === p.id ? 'selected' : ''}>${p.name}</option>`
        ).join('');

        const takenOut = item.quantity || 0;
        const sold = soldQuantities[item.productId] || 0;
        const expectedReturn = takenOut - sold;
        const actualReturn = item.goodReturn + item.damagedReturn + item.freebie; // Assuming these are the actual returns
        const difference = actualReturn - expectedReturn;

        let differenceClass = '';
        if (difference < 0) {
            differenceClass = 'text-red-600 font-bold'; // Deficit
        } else if (difference > 0) {
            differenceClass = 'text-green-600 font-bold'; // Surplus
        }

        return `
            <tr class="dispatch-item-row" data-product-id="${item.productId}">
                <td class="px-2 py-1"><select class="dispatch-item-product w-full p-1 border rounded-md text-sm" required><option value="">اختر منتج...</option>${productOptions}</select></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="takenOut" value="${takenOut}" placeholder="0" min="0" readonly></td>
                <td><span class="w-full p-1 text-center text-sm">${sold}</span></td>
                <td><span class="w-full p-1 text-center text-sm">${expectedReturn}</span></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm actual-return-input" type="number" data-field="actualReturn" value="${actualReturn}" placeholder="0" min="0"></td>
                <td><span class="w-full p-1 text-center text-sm ${differenceClass}">${difference}</span></td>
                <td class="px-2 py-1 text-center"><button type="button" class="delete-dispatch-item-btn text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="overflow-x-auto bg-white rounded-lg">
            <table class="min-w-full divide-y divide-gray-200 editable-dispatch-table">
                <thead class="bg-gray-200">
                    <tr>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase w-2/5">المنتج</th>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase">مستلم</th>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase">مباع</th>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase">مرتجع متوقع</th>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase">مرتجع فعلي</th>
                        <th class="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase">الفرق</th>
                        <th class="px-2 py-2"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">${itemsHtml}</tbody>
            </table>
        </div>
        <div class="mt-3 flex justify-between items-center">
            <button type="button" class="add-editable-dispatch-item-btn text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1" data-note-id="${noteId}">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                إضافة صنف
            </button>
            <div class="flex gap-2">
                <button type="button" class="copy-dispatch-note-btn bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2" data-note-id="${noteId}">
                    <i data-lucide="image" class="w-5 h-5"></i>
                    نسخ
                </button>
                <button type="button" class="print-dispatch-note-btn bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2" data-note-id="${noteId}">
                    <i data-lucide="printer" class="w-5 h-5"></i>
                    طباعة
                </button>
                <button type="button" class="delete-dispatch-note-btn bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2" data-note-id="${noteId}">
                    <i data-lucide="trash" class="w-5 h-5"></i>
                    حذف
                </button>
                <button type="button" class="update-dispatch-note-btn bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2" data-note-id="${noteId}">
                    <i data-lucide="save" class="w-5 h-5"></i>
                    حفظ
                </button>
            </div>
        </div>
        <div class="mt-4 text-right">
            <!-- Compute and display permission total based on average prices and takenOut quantities -->
            ${(()=>{
                try {
                    let total = 0;
                    note.items.forEach(it => {
                        const qty = Number(it.quantity || 0);
                        const avg = Number(avgPriceByProduct[it.productId] !== undefined ? avgPriceByProduct[it.productId] : getPriceForProductForCustomer(it.productId, null));
                        total += qty * avg;
                    });
                    return `<div class="font-bold">∑: ${formatCurrency(total)}</div>`;
                } catch (e) { return ''; }
            })()}
        </div>
    `;
    updateIcons();

    // Add event listeners for actual return input to update difference
    container.querySelectorAll('.actual-return-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const row = e.target.closest('.dispatch-item-row');
            const takenOut = parseInt(row.querySelector('[data-field="takenOut"]').value) || 0;
            const sold = parseInt(row.children[2].textContent) || 0; // Get sold from the span
            const expectedReturn = takenOut - sold;
            const actualReturn = parseInt(e.target.value) || 0;
            const difference = actualReturn - expectedReturn;

            const differenceCell = row.children[5]; // The difference span
            differenceCell.textContent = difference;
            differenceCell.classList.remove('text-red-600', 'text-green-600', 'font-bold');
            if (difference < 0) {
                differenceCell.classList.add('text-red-600', 'font-bold');
            } else if (difference > 0) {
                differenceCell.classList.add('text-green-600', 'font-bold');
            }
        });
    });
}

// Read-only render for dispatch note (for reps)
function renderReadonlyDispatchGrid(noteId, container) {
    const note = state.dispatchNotes.find(n => n.id === noteId);
    if (!note) { container.innerHTML = '<p class="text-sm text-red-600">لم يتم العثور على الإذن.</p>'; return; }
    const rowsHtml = note.items.map(item => {
        const prod = findProduct(item.productId);
        const name = prod ? prod.name : 'منتج محذوف';
        const takenOut = item.quantity || 0;
        const good = item.goodReturn || 0;
        const damaged = item.damagedReturn || 0;
        const freebie = item.freebie || 0;
        return `<tr class="text-xs border-b last:border-b-0">\n<td class="px-2 py-1 text-right font-semibold">${name}</td>\n<td class="px-2 py-1 text-center">${takenOut}</td>\n<td class="px-2 py-1 text-center text-green-700">${good}</td>\n<td class="px-2 py-1 text-center text-red-700">${damaged}</td>\n<td class="px-2 py-1 text-center text-blue-700">${freebie}</td></tr>`;
    }).join('');
    container.innerHTML = `
        <div class="flex gap-2 mb-3 justify-end">
            <button id="tab-stock-${noteId}" class="px-3 py-1 rounded text-xs bg-blue-600 text-white">📦 صلاحيات المخزون</button>
            <button id="tab-collection-${noteId}" class="px-3 py-1 rounded text-xs bg-gray-200">💰 كشف التحصيل</button>
        </div>

        <div id="dispatch-stock-wrapper-${noteId}" class="overflow-x-auto bg-white rounded-lg">
            <table class="min-w-full">
                <thead class="bg-gray-200 text-xs">
                    <tr>
                        <th class="px-2 py-2 text-right">الصنف</th>
                        <th class="px-2 py-2 text-center">مستلم</th>
                        <th class="px-2 py-2 text-center">مرتجع سليم</th>
                        <th class="px-2 py-2 text-center">مرتجع تالف</th>
                        <th class="px-2 py-2 text-center">مجاني</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>
        <div class="mt-3 flex gap-2 justify-end">
            <button type="button" class="copy-dispatch-note-btn bg-teal-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1" data-note-id="${noteId}"><i data-lucide="image" class="w-4 h-4"></i> صورة</button>
            <button type="button" class="print-dispatch-note-btn bg-gray-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1" data-note-id="${noteId}"><i data-lucide="printer" class="w-4 h-4"></i> طباعة</button>
        </div>`;
    updateIcons();

    // Insert Daily Collection Sheet & Expenses section below the dispatch table
    try {
        try { renderDailyCollectionSection(note, container); } catch(e){ console.warn('renderDailyCollectionSection failed', e); }
    } catch(e){ }

    // Wire tab toggle behaviour (Stock active by default)
    try {
        const tabStock = document.getElementById('tab-stock-' + noteId);
        const tabColl = document.getElementById('tab-collection-' + noteId);
        const stockWrapper = document.getElementById('dispatch-stock-wrapper-' + noteId);
        // Ensure collection section exists (render if missing)
        let collSection = container.querySelector('.daily-collection-section');
        if (!collSection) {
            try { renderDailyCollectionSection(note, container); } catch(_){}
            collSection = container.querySelector('.daily-collection-section');
        }

        function setActiveTab(which){
            if(which === 'stock'){
                if(stockWrapper) stockWrapper.style.display = '';
                if(collSection) collSection.style.display = 'none';
                if(tabStock) { tabStock.classList.add('bg-blue-600'); tabStock.classList.remove('bg-gray-200'); }
                if(tabColl) { tabColl.classList.remove('bg-blue-600'); tabColl.classList.add('bg-gray-200'); }
            } else {
                if(stockWrapper) stockWrapper.style.display = 'none';
                if(collSection) collSection.style.display = '';
                if(tabColl) { tabColl.classList.add('bg-blue-600'); tabColl.classList.remove('bg-gray-200'); }
                if(tabStock) { tabStock.classList.remove('bg-blue-600'); tabStock.classList.add('bg-gray-200'); }
            }
        }
        if(tabStock) tabStock.addEventListener('click', ()=> setActiveTab('stock'));
        if(tabColl) tabColl.addEventListener('click', ()=> setActiveTab('collection'));

        // default: show Collection tab when there are sales or saved expenses for this rep/date
        try {
            let showCollection = false;
            try {
                const dateId = (new Date(note.date)).toISOString().split('T')[0];
                const salesForRepAndDate = (state.sales||[]).filter(sale =>
                    (sale.repName === note.repName || sale.rep === note.repName) &&
                    new Date(sale.date).toISOString().split('T')[0] === dateId &&
                    (String(sale.paymentType||'').toLowerCase() === 'cash' || String(sale.paymentType||'').toLowerCase().includes('part'))
                );
                if (salesForRepAndDate && salesForRepAndDate.length>0) showCollection = true;
                // check saved expenses in in-memory state
                const docId = _dailyDocIdFor(note.repName, note.date);
                const dailyDoc = (Array.isArray(state.dailyCollections) ? state.dailyCollections.find(d => String(d.id) === String(docId) || (d.repName === note.repName && d.date && new Date(d.date).toISOString().split('T')[0] === dateId)) : null) || {};
                const expenses = Array.isArray(dailyDoc.expenses) ? dailyDoc.expenses : [];
                if (expenses.length > 0) showCollection = true;
            } catch(_){}
            setActiveTab(showCollection ? 'collection' : 'stock');
        } catch(_) { setActiveTab('stock'); }
    } catch(e){ console.warn('tab wiring failed', e); }
}

    function generateDispatchNotePrintContent(noteId) {
            const note = state.dispatchNotes.find(n => n.id === noteId);
            if (!note) return null;

            // Build average price map (weighted by actual sales prices) for this rep & date
            const salesForRepAndDate = state.sales.filter(sale =>
                sale.repName === note.repName &&
                new Date(sale.date).toISOString().split('T')[0] === new Date(note.date).toISOString().split('T')[0]
            );

            const priceSums = {};
            salesForRepAndDate.forEach(sale => {
                sale.items.forEach(it => {
                    const pid = it.productId;
                    const qty = Number(it.quantity || 0);
                    const price = (it.price !== undefined && it.price !== null) ? Number(it.price) : (findPriceList(findCustomer(sale.customerId)?.priceListId)?.productPrices?.[pid] ?? findProduct(pid)?.price ?? 0);
                    if (!priceSums[pid]) priceSums[pid] = { qty: 0, value: 0 };
                    priceSums[pid].qty += qty;
                    priceSums[pid].value += qty * price;
                });
            });

            const avgPriceByProduct = {};
            Object.keys(priceSums).forEach(pid => { const e = priceSums[pid]; avgPriceByProduct[pid] = e.qty > 0 ? (e.value / e.qty) : 0; });

            let permissionTotal = 0;
            const itemsHtml = note.items.map(item => {
                const product = findProduct(item.productId);
                const avg = Number(avgPriceByProduct[item.productId] !== undefined ? avgPriceByProduct[item.productId] : (findPriceList(findCustomer(null)?.priceListId)?.productPrices?.[item.productId] ?? findProduct(item.productId)?.price ?? 0));
                const lineValue = (Number(item.quantity || 0) * avg);
                permissionTotal += lineValue;
                return `
                    <tr class="border-b">
                        <td class="p-2 text-right">${product ? product.name : 'منتج محذوف'}</td>
                        <td class="p-2 text-center">${item.quantity || 0}</td>
                        <td class="p-2 text-center">${item.actualReturn || 0}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="p-6" style="direction: rtl; position: relative;">
                <div style="position: relative; z-index: 1;">
                        <div class="flex justify-between items-start mb-4 border-b pb-4">
                            <div class="text-right">
                                <div class="flex items-center justify-end gap-4">
                                    <div id="dispatch-note-company" class="text-right">
                                        <h1 class="text-xl font-bold">Delente ERP - نظام إدارة الأعمال</h1>
                                    </div>
                                    <div id="dispatch-note-logo">
                                        ${ (getCompanyLogoUrl && getCompanyLogoUrl()) ? `<img src="${getCompanyLogoUrl()}" style="height:48px;margin-left:8px;border-radius:6px;background:#fff;padding:4px;"/>` : '' }
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold">إذن استلام بضاعة</h1>
                                <p><strong>تاريخ:</strong> ${new Date(note.date).toLocaleDateString('ar-EG')}</p>
                                <p><strong>رقم الإذن:</strong> ${note.noteNumber || note.id}</p>
                            </div>
                        </div>

                        <div class="text-center my-6">
                            <h2 class="text-xl font-bold">المندوب: ${note.repName}</h2>
                        </div>

                        <table class="min-w-full divide-y divide-gray-200 mb-8">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-4 py-2 text-right font-semibold">الصنف</th>
                                    <th class="px-4 py-2 text-center font-semibold">المستلم</th>
                                    <th class="px-4 py-2 text-center font-semibold">المرتجع الفعلي</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-100">
                                ${itemsHtml}
                            </tbody>
                        </table>
                        <div class="mb-6 text-right font-bold">إجمالي الإذن حسب قوائم الأسعار: ${formatCurrency(permissionTotal)}</div>

                        <!-- Daily Collection & Expenses summary -->
                        ${(() => {
                            try {
                                const salesForRepAndDate = (state.sales||[]).filter(sale =>
                                    (sale.repName === note.repName || sale.rep === note.repName) &&
                                    new Date(sale.date).toISOString().split('T')[0] === new Date(note.date).toISOString().split('T')[0] &&
                                    (String(sale.paymentType||'').toLowerCase() === 'cash' || String(sale.paymentType||'').toLowerCase() === 'part change' || String(sale.paymentType||'').toLowerCase() === 'partchange')
                                );
                                let collRows = '';
                                let totalCollected = 0;
                                salesForRepAndDate.forEach(s => {
                                    const customerName = (findCustomer(s.customerId)||{}).name || s.customerName || '';
                                    const invoiceRef = s.invoiceNumber || s.id || '';
                                    const paymentType = s.paymentType || (s.firstPayment||s.secondPayment? 'Part Change' : 'Cash');
                                    const amount = (String((s.paymentType||'').toLowerCase()) === 'part change') ? (Number(s.paidAmount||0) || Number(s.firstPayment||0) + Number(s.secondPayment||0)) : (Number(s.total||0));
                                    totalCollected += Number(amount || 0);
                                    collRows += `<tr><td class="p-2 text-right">${escapeHtml(customerName)}</td><td class="p-2 text-center">${escapeHtml(paymentType + ' / ' + invoiceRef)}</td><td class="p-2 text-left">${formatCurrency(amount)}</td></tr>`;
                                });

                                // Find expenses from in-memory state (listener populates state.dailyCollections)
                                const dateId = (new Date(note.date)).toISOString().split('T')[0];
                                const docId = (String(dateId) + '__' + encodeURIComponent(String(note.repName||'')).replace(/\./g,'%2E'));
                                const dailyDoc = (Array.isArray(state.dailyCollections) ? state.dailyCollections.find(d => String(d.id) === String(docId) || (d.repName === note.repName && d.date && new Date(d.date).toISOString().split('T')[0] === dateId)) : null) || {};
                                const expenses = Array.isArray(dailyDoc.expenses) ? dailyDoc.expenses : [];
                                const expensesHtml = expenses.map(ex => `<tr><td class="p-2 text-right">${escapeHtml(ex.description||'')}</td><td class="p-2 text-left">${formatCurrency(Number(ex.amount||0))}</td></tr>`).join('');
                                const totalExpenses = expenses.reduce((s,e)=> s + (Number(e.amount||0)), 0);
                                const net = totalCollected - totalExpenses;

                                return `
                                    <div class="mb-6 border-t pt-4">
                                        <h3 class="text-lg font-semibold text-right">كشف التحصيل اليومي</h3>
                                        <table style="width:100%;border-collapse:collapse;margin-top:8px;" class="mb-2">
                                            <thead><tr><th class="p-2 text-right">اسم العميل</th><th class="p-2 text-center">نوع/رقم الفاتورة</th><th class="p-2 text-left">المحصل</th></tr></thead>
                                            <tbody>${collRows}</tbody>
                                            <tfoot><tr><td colspan="2" class="p-2 text-right font-bold">الإجمالي المحصل</td><td class="p-2 text-left font-bold">${formatCurrency(totalCollected)}</td></tr></tfoot>
                                        </table>

                                        <h4 class="text-sm font-semibold text-right">مصاريف نثرية</h4>
                                        <table style="width:100%;border-collapse:collapse;margin-top:8px;" class="mb-2">
                                            <thead><tr><th class="p-2 text-right">الوصف</th><th class="p-2 text-left">المبلغ</th></tr></thead>
                                            <tbody>${expensesHtml}</tbody>
                                            <tfoot><tr><td class="p-2 text-right font-bold">إجمالي المصاريف</td><td class="p-2 text-left font-bold">${formatCurrency(totalExpenses)}</td></tr></tfoot>
                                        </table>

                                        <div class="mt-2 text-right font-bold">صافي التوريد: ${formatCurrency(net)}</div>
                                    </div>
                                `;
                            } catch(e){ return ''; }
                        })()}

                        <div style="padding-top: 6rem;">
                            <div class="flex justify-around items-center text-center">
                                <p class="border-t-2 pt-2 px-8">توقيع المندوب</p>
                                <p class="border-t-2 pt-2 px-8">توقيع أمين المخزن</p>
                                <p class="border-t-2 pt-2 px-8">توقيع الأمن</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
async function copyDispatchNoteAsImage(noteId) {
    const content = generateDispatchNotePrintContent(noteId);
    if (!content) return;

    const tempElement = document.createElement('div');
    tempElement.id = 'temp-dispatch-print-area';
    tempElement.style.width = '800px'; // Set a fixed width for consistent image size
    tempElement.style.backgroundColor = 'white';
    tempElement.innerHTML = content;
    
    // Append to body to be rendered, but off-screen
    tempElement.style.position = 'absolute';
    tempElement.style.left = '-9999px';
    document.body.appendChild(tempElement);

    await generateReportImage('temp-dispatch-print-area');

    document.body.removeChild(tempElement);
}

function printDispatchNote(noteId) {
    const content = generateDispatchNotePrintContent(noteId);
    if (!content) {
        customDialog({ title: 'خطأ', message: 'لم يتم العثور على الإذن لطباعته.' });
        return;
    }
    const w = window.open('', '', 'height=800,width=900');
    if (!w) { customDialog({ title: 'تنبيه', message: 'يرجى السماح بالنوافذ المنبثقة للطباعة.' }); return; }
    w.document.open();
    w.document.write('<html><head><title>إذن صرف</title>');
    w.document.write('<link rel="stylesheet" href="https://cdn.tailwindcss.com">');
    w.document.write('<style>body{font-family: Cairo, sans-serif; direction: rtl; padding: 16px;}</style>');
    w.document.write('</head><body>');
    w.document.write(content);
    w.document.write('</body></html>');
    w.document.close();
    const doPrint = () => { try { w.focus(); } catch(_){} try { w.print(); } catch(_){} };
    const closeBack = () => { try { w.close(); } catch(_){} try { window.focus(); } catch(_){} };
    if ('onafterprint' in w) { w.onafterprint = closeBack; } else { setTimeout(closeBack, 1200); }
    if ('onload' in w) { w.onload = () => setTimeout(doPrint, 150); } else { setTimeout(doPrint, 350); }
}

async function updateDispatchNote(noteId, tableContainer) {
    const note = state.dispatchNotes.find(n => n.id === noteId);
    if (!note) return;

    const items = [];
    const itemRows = tableContainer.querySelectorAll('.dispatch-item-row');
    for (const row of itemRows) {
        const productId = row.querySelector('.dispatch-item-product').value;
        const quantity = parseInt(row.querySelector('[data-field="quantity"]').value) || 0;
        const actualReturn = parseInt(row.querySelector('[data-field="actualReturn"]').value) || 0; // NEW

        if (productId && (quantity > 0 || actualReturn > 0)) { // Modified condition
            items.push({ productId, quantity, actualReturn }); // Modified item object
        }
    }

    if (items.length === 0) {
        await customDialog({ message: 'لا يمكن حفظ إذن فارغ. لحذفه، استخدم زر الحذف.', title: 'بيانات ناقصة' });
        return;
    }

    note.items = items;
    note.updatedAt = new Date().toISOString();

    renderAll();
    await customDialog({ message: 'تم حفظ تعديلات الإذن بنجاح.', title: 'نجاح' });
}

// Helpers for Daily Collection Sheet (UI + persistence)
function _dailyDocIdFor(repName, dateIso){
    try {
        const dateId = (new Date(dateIso)).toISOString().split('T')[0];
        return String(dateId) + '__' + encodeURIComponent(String(repName||'')).replace(/\./g,'%2E');
    } catch(e){ return String((new Date()).toISOString().split('T')[0]) + '__' + encodeURIComponent(String(repName||'')).replace(/\./g,'%2E'); }
}

function renderDailyCollectionSection(note, container){
    try{
        const repName = note.repName || '';
        const dateIso = note.date || new Date().toISOString();
        const dateId = (new Date(dateIso)).toISOString().split('T')[0];
        const docId = _dailyDocIdFor(repName, dateIso);
        // build sales table for this rep & date
        const salesForRepAndDate = (state.sales||[]).filter(sale =>
            (sale.repName === repName || sale.rep === repName) &&
            new Date(sale.date).toISOString().split('T')[0] === dateId &&
            (String(sale.paymentType||'').toLowerCase() === 'cash' || String(sale.paymentType||'').toLowerCase() === 'part change' || String(sale.paymentType||'').toLowerCase() === 'partchange')
        );
        let rows = '';
        let totalCollected = 0;
        salesForRepAndDate.forEach(s => {
            const customerName = (findCustomer(s.customerId)||{}).name || s.customerName || '';
            const invoiceRef = s.invoiceNumber || s.id || '';
            const paymentType = s.paymentType || (s.firstPayment||s.secondPayment? 'Part Change' : 'Cash');
            const amount = (String((s.paymentType||'').toLowerCase()) === 'part change') ? (Number(s.paidAmount||0) || Number(s.firstPayment||0) + Number(s.secondPayment||0)) : (Number(s.total||0));
            totalCollected += Number(amount || 0);
            rows += `<tr class="border-b"><td class="px-2 py-1 text-right">${escapeHtml(customerName)}</td><td class="px-2 py-1 text-center">${escapeHtml(paymentType + ' / ' + invoiceRef)}</td><td class="px-2 py-1 text-left">${formatCurrency(amount)}</td></tr>`;
        });

        // load existing expenses from state.dailyCollections if present
        const dailyDoc = (Array.isArray(state.dailyCollections) ? state.dailyCollections.find(d => String(d.id) === String(docId) || (d.repName === repName && d.date && new Date(d.date).toISOString().split('T')[0] === dateId)) : null) || {};
        const expenses = Array.isArray(dailyDoc.expenses) ? dailyDoc.expenses : [];
        const expensesRows = expenses.map(ex => `<tr class="border-b"><td class="px-2 py-1 text-right">${escapeHtml(ex.description||'')}</td><td class="px-2 py-1 text-left">${formatCurrency(Number(ex.amount||0))}</td><td class="px-2 py-1 text-center"><button class="del-expense-btn text-red-500 text-xs" data-exp-id="${escapeHtml(String(ex.id||''))}">حذف</button></td></tr>`).join('');
        const totalExpenses = expenses.reduce((s,e)=> s + (Number(e.amount||0)), 0);
        const net = totalCollected - totalExpenses;

        // Build container area
        const section = document.createElement('div');
        section.className = 'daily-collection-section mt-6 p-4 bg-white rounded-lg shadow';
        section.innerHTML = `
            <h3 class="text-lg font-semibold text-right">كشف التحصيل اليومي</h3>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;" class="mb-3">
                <thead><tr><th class="px-2 text-right">اسم العميل</th><th class="px-2 text-center">نوع/رقم الفاتورة</th><th class="px-2 text-left">المحصل</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td colspan="2" class="px-2 text-right font-bold">الإجمالي المحصل</td><td class="px-2 text-left font-bold">${formatCurrency(totalCollected)}</td></tr></tfoot>
            </table>

            <h4 class="text-sm font-semibold text-right">مصاريف نثرية</h4>
            <table id="daily-expenses-table-${escapeHtml(docId)}" style="width:100%;border-collapse:collapse;margin-top:8px;" class="mb-3">
                <thead><tr><th class="px-2 text-right">الوصف</th><th class="px-2 text-left">المبلغ</th><th class="px-2 text-center">إجراءات</th></tr></thead>
                <tbody>${expensesRows}</tbody>
                <tfoot><tr><td class="px-2 text-right font-bold">إجمالي المصاريف</td><td class="px-2 text-left font-bold">${formatCurrency(totalExpenses)}</td><td></td></tr></tfoot>
            </table>

            <div class="flex gap-2 items-center justify-end mb-2 no-print">
                <input type="number" id="daily-expense-amount-${escapeHtml(docId)}" placeholder="المبلغ" class="p-2 border rounded w-32" />
                <input type="text" id="daily-expense-desc-${escapeHtml(docId)}" placeholder="الوصف" class="p-2 border rounded w-56" />
                <button id="daily-add-expense-btn-${escapeHtml(docId)}" class="bg-blue-600 text-white px-3 py-1 rounded">أضف مصروف</button>
            </div>

            <div class="text-right font-bold">صافي التوريد: ${formatCurrency(net)}</div>
        `;

        // Remove previous existing section if present
        try { const prev = container.querySelector('.daily-collection-section'); if(prev) prev.remove(); } catch(_){ }
        container.appendChild(section);

        // Wire add expense button
        try {
            const addBtn = document.getElementById('daily-add-expense-btn-' + docId);
            if(addBtn) addBtn.addEventListener('click', async function(){
                const amtEl = document.getElementById('daily-expense-amount-' + docId);
                const descEl = document.getElementById('daily-expense-desc-' + docId);
                const amount = Number(amtEl && (amtEl.value||0)) || 0;
                const description = descEl && (descEl.value||'').trim();
                if(!amount || amount <= 0) return alert('أدخل مبلغ صالح');
                const expense = { id: 'ex_' + Date.now().toString(36), amount, description, createdAt: serverTs(), createdBy: (auth && auth.currentUser) ? auth.currentUser.uid : null };
                try {
                    const docRef = db.collection('daily_collections').doc(docId);
                    // Merge append
                    await docRef.set({ repName, date: dateIso, expenses: (Array.isArray(dailyDoc.expenses)? dailyDoc.expenses.concat([expense]) : [expense]), updatedAt: serverTs() }, { merge:true });
                    // local update will be reflected by snapshot listener
                    try { amtEl.value=''; descEl.value=''; } catch(_){}
                } catch(e){ console.warn('save expense failed', e); alert('فشل حفظ المصروف'); }
            });
        } catch(e){ console.warn('wire add expense failed', e); }

        // Wire delete buttons (delegated)
        try {
            section.addEventListener('click', async function(ev){
                const btn = ev.target && ev.target.closest && ev.target.closest('.del-expense-btn');
                if(!btn) return;
                const expId = btn.getAttribute('data-exp-id');
                if(!expId) return;
                if(!confirm('حذف المصروف؟')) return;
                try {
                    // remove by reading current doc and filtering
                    const docRef = db.collection('daily_collections').doc(docId);
                    const snap = await docRef.get();
                    if(!snap.exists) return;
                    const d = snap.data() || {};
                    const newExp = (Array.isArray(d.expenses) ? d.expenses.filter(x=> String(x.id) !== String(expId)) : []);
                    await docRef.set({ expenses: newExp, updatedAt: serverTs() }, { merge:true });
                } catch(e){ console.warn('delete expense failed', e); alert('فشل حذف المصروف'); }
            });
        } catch(e){ console.warn('wire delete expenses failed', e); }

    }catch(e){ console.warn('renderDailyCollectionSection unexpected', e); }
}

async function deleteDispatchNote(noteId) {
    const confirmed = await customDialog({
        title: 'تأكيد الحذف',
        message: 'هل أنت متأكد أنك تريد حذف هذا الإذن بالكامل؟',
        isConfirm: true,
        confirmText: 'نعم، احذف',
        confirmClass: 'bg-red-600 hover:bg-red-700'
    });

    if (confirmed) {
        state.dispatchNotes = state.dispatchNotes.filter(n => n.id !== noteId);
        renderAll();
        await customDialog({ message: 'تم حذف الإذن بنجاح.' });
    }
}

function getProductDetailsByCode(code) { 
    if (!code) return null;
    const scode = String(code);
    // ابحث بالترتيب: id ثم _id ثم sku (بمطابقة نصية)
    const product = state.products.find(p => String(p.id) === scode) || state.products.find(p => String(p._id) === scode) || state.products.find(p => String(p.sku) === scode);
    if (!product) return null;
    const price = Number(product.price || 0);
    const category = product.category === 'multi' ? 'مالتي' : (product.category === 'dairy' ? 'ألبان' : (product.category || ''));
    return { id: product.id || product._id || product.sku, name: product.name || product.title || code, defaultPrice: price, categoryName: category };
}
function updateSpreadsheetPriceAndProductInfo(row, productId, customerId) { 
    const priceInput = row.querySelector('.spreadsheet-price'); const nameInput = row.querySelector('.spreadsheet-product-name'); const categoryCell = row.querySelector('.spreadsheet-category'); const productDetails = getProductDetailsByCode(productId); priceInput.classList.remove('promotion-price-applied'); if (row.querySelector('.spreadsheet-tax-status-input')) { row.querySelector('.spreadsheet-tax-status-input').classList.remove('border-red-500', 'border-2'); } if (!productDetails) { nameInput.value = 'كود غير صحيح'; nameInput.classList.add('text-red-500'); priceInput.value = 0; categoryCell.textContent = ''; row.dataset.productId = ''; return; } nameInput.value = productDetails.name; nameInput.classList.remove('text-red-500'); categoryCell.textContent = productDetails.categoryName; row.dataset.productId = productDetails.id; let finalPrice; let basePrice; basePrice = productDetails.defaultPrice; if(customerId) { const customer = findCustomer(customerId); if(customer && customer.priceListId) { const priceList = findPriceList(customer.priceListId); if(priceList && priceList.productPrices[productDetails.id] !== undefined) { basePrice = priceList.productPrices[productDetails.id]; } } } finalPrice = basePrice; const promotionPrice = getActivePromotionPrice(productId, customerId); if (promotionPrice !== null) { finalPrice = promotionPrice; priceInput.classList.add('promotion-price-applied'); } priceInput.value = parseFloat(finalPrice).toFixed(2); 
    try {
        if (/قريش|قريش/i.test(productDetails.name||'')) {
            const customer = customerId ? findCustomer(customerId) : null;
            const priceList = (customer && customer.priceListId) ? findPriceList(customer.priceListId) : null;
            const listOverride = priceList ? priceList.productPrices[productDetails.id] : undefined;
            console.debug('DEBUG Pricing (spreadsheet row)', {
                productId: productDetails.id,
                productName: productDetails.name,
                basePrice: productDetails.defaultPrice,
                priceListId: customer ? customer.priceListId : '',
                priceListOverride: listOverride,
                promotionPrice,
                finalPrice
            });
        }
    } catch(_){ }
}
function updateSpreadsheetTaxVisibility(customerId) { 
    const customer = findCustomer(customerId); const requiresFiling = customer && customer.requiresTaxFiling; const taxHeader = document.querySelector('.spreadsheet-tax-header'); if (taxHeader) { taxHeader.style.display = requiresFiling ? 'table-cell' : 'none'; } spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => { const taxCell = row.querySelector('.spreadsheet-tax-cell'); if (taxCell) { taxCell.style.display = requiresFiling ? 'table-cell' : 'none'; if (!requiresFiling) { const taxInput = row.querySelector('.spreadsheet-tax-status-input'); if (taxInput) taxInput.value = ''; } } }); 
}
function calculateSpreadsheetRowTotal(row) {
    const quantity = parseInt(row.querySelector('.spreadsheet-quantity').value) || 0;
    const originalPrice = parseFloat(row.querySelector('.spreadsheet-price').value) || 0;
    const modifiedPrice = parseFloat(row.querySelector('.spreadsheet-modified-price').value); // Don't default to 0, check for NaN

    // Use modified price if it's a valid number, otherwise use the original price
    const finalPrice = !isNaN(modifiedPrice) && modifiedPrice > 0 ? modifiedPrice : originalPrice;
    
    const discount = parseFloat(row.querySelector('.spreadsheet-discount').value) || 0;
    const totalCell = row.querySelector('.spreadsheet-total');
    const itemSubtotal = quantity * finalPrice;
    const itemTotal = itemSubtotal * (1 - discount / 100);
    totalCell.textContent = formatCurrency(itemTotal);
}

function initializeSpreadsheetPage() {
    populateRepDropdown(spreadsheetRepSelect);
    // إذا كان هناك خيار واحد فقط (مندوب واحد)، يتم اختياره تلقائياً
    if (spreadsheetRepSelect && spreadsheetRepSelect.options.length === 2) {
        // الخيار الأول هو "-- جميع المناديب --"، الثاني هو اسم المندوب
        spreadsheetRepSelect.selectedIndex = 1;
    }
    populateCustomerDropdown(spreadsheetCustomerSelect);
    spreadsheetDateInput.value = new Date().toISOString().split('T')[0];
    spreadsheetEntryBody.innerHTML = '';
    for(let i = 0; i < 5; i++) { addSpreadsheetRow(); }
    updateSpreadsheetTaxVisibility(null);
    spreadsheetCustomerSelect.removeEventListener('change', handleSpreadsheetCustomerChange);
    spreadsheetCustomerSelect.addEventListener('change', handleSpreadsheetCustomerChange);
    spreadsheetEntryBody.removeEventListener('change', handleSpreadsheetRowChange);
    spreadsheetEntryBody.addEventListener('change', handleSpreadsheetRowChange);
    spreadsheetEntryBody.removeEventListener('input', handleSpreadsheetRowInput);
    spreadsheetEntryBody.addEventListener('input', handleSpreadsheetRowInput);
    spreadsheetEntryBody.removeEventListener('click', handleSpreadsheetRowClick);
    spreadsheetEntryBody.addEventListener('click', handleSpreadsheetRowClick);
    // إضافة مستمع الـ autocomplete للمنتجات والعملاء
    setupSpreadsheetAutocomplete();
    // بعد أول تحميل للمنتجات من Firestore، أعد تمرير الأكواد المدخلة إن وُجدت
    setTimeout(() => {
        if (Array.isArray(state.products) && state.products.length) {
            spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => {
                const codeInput = row.querySelector('.spreadsheet-product-code');
                const customerId = spreadsheetCustomerSelect.value;
                if (codeInput && codeInput.value.trim()) {
                    updateSpreadsheetPriceAndProductInfo(row, codeInput.value.trim(), customerId);
                    calculateSpreadsheetRowTotal(row);
                }
            });
        }
    }, 1200);
     // Clear and reset unified invoice number on page load
     unifiedInvoiceNumberInput.value = '';
}

// دالة لإعداد Autocomplete للمنتجات والعملاء
function setupSpreadsheetAutocomplete() {
    // أضيف اسمع لحقل اسم العميل العلوي
    const customerNameInput = document.querySelector('input[placeholder*="اسم العميل"]') || document.createElement('input');
    
    // تحقق من وجود حقل اسم العميل (قد لا يكون موجود، لذا سنرتكز على select)
    // بدلاً من ذلك سنضيف autocomplete داخل الجدول مباشرة
    
    // إضافة مستمع على كل صفوف الجدول عند التفريغ
    spreadsheetEntryBody.addEventListener('input', function(e) {
        try {
            if (e.target && e.target.classList && e.target.classList.contains('spreadsheet-product-name')) {
                showProductAutocomplete(e.target);
            }
            // Mark invoice-number inputs as manually-entered when user types into them
            if (e.target && e.target.classList && e.target.classList.contains('spreadsheet-invoice-number')) {
                try { e.target.dataset.userEntered = '1'; } catch(_){}
            }
        } catch(err) { console.warn('spreadsheet input handler error', err); }
    }, true);
    
    // أيضاً إضافة مستمع للعميل في الأعلى (حقل اختيار العميل)
    // سنجعل autocomplete عند كتابة جزء من الاسم
    if (spreadsheetCustomerSelect) {
        // بدلاً من تعديل select، سنضيف حقل إدخال نصي بجانبه
        createCustomerSearchField();
    }
}

// دالة لإنشاء حقل بحث للعملاء بـ autocomplete
function createCustomerSearchField() {
    try {
        let existingInput = document.getElementById('spreadsheet-customer-search');
        if (existingInput) return; // بالفعل موجود
        
        const container = spreadsheetCustomerSelect.parentElement;
        const searchDiv = document.createElement('div');
        searchDiv.style.position = 'relative';
        searchDiv.style.marginTop = '4px';
        
        const searchInput = document.createElement('input');
        searchInput.id = 'spreadsheet-customer-search';
        searchInput.type = 'text';
        searchInput.placeholder = 'ابحث باسم العميل (أول حروف الاسم)...';
        searchInput.className = 'w-full p-2 border border-gray-300 rounded-md text-sm';
        searchInput.style.direction = 'rtl';
        
        const suggestionsList = document.createElement('div');
        suggestionsList.id = 'spreadsheet-customer-suggestions';
        suggestionsList.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto';
        suggestionsList.style.display = 'none';
        suggestionsList.style.direction = 'rtl';
        
        searchDiv.appendChild(searchInput);
        searchDiv.appendChild(suggestionsList);
        container.appendChild(searchDiv);
        
        // مستمع على حقل البحث
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim().toLowerCase();
            const suggestions = suggestionsList;
            
            if (searchTerm.length === 0) {
                suggestions.style.display = 'none';
                return;
            }
            
            // البحث عن عملاء مطابقين
            const matches = state.customers.filter(c => 
                c.name && c.name.toLowerCase().includes(searchTerm)
            ).slice(0, 8); // عرض أول 8 نتائج
            
            if (matches.length === 0) {
                suggestions.innerHTML = '<div class="p-2 text-gray-500 text-sm">لا توجد نتائج</div>';
                suggestions.style.display = 'block';
                return;
            }
            
            suggestions.innerHTML = matches.map(customer => `
                <div class="p-2 hover:bg-blue-100 cursor-pointer border-b text-sm" data-customer-id="${customer.id}" data-customer-name="${customer.name}">
                    ${customer.name}
                </div>
            `).join('');
            suggestions.style.display = 'block';
        });
        
        // مستمع على الاقتراحات
        suggestionsList.addEventListener('click', function(e) {
            const item = e.target.closest('[data-customer-id]');
            if (item) {
                const customerId = item.getAttribute('data-customer-id');
                const customerName = item.getAttribute('data-customer-name');
                
                // تعيين العميل في select
                spreadsheetCustomerSelect.value = customerId;
                spreadsheetCustomerSelect.dispatchEvent(new Event('change'));
                
                // تنظيف حقل البحث
                searchInput.value = customerName;
                suggestionsList.style.display = 'none';
            }
        });
        
        // إخفاء الاقتراحات عند النقر خارجه
        document.addEventListener('click', function(e) {
            if (e.target !== searchInput && e.target !== suggestionsList && !suggestionsList.contains(e.target)) {
                suggestionsList.style.display = 'none';
            }
        });
    } catch(err) {
        console.warn('createCustomerSearchField error:', err);
    }
}

// دالة لعرض autocomplete لأسماء المنتجات
function showProductAutocomplete(input) {
    try {
        const searchTerm = input.value.trim().toLowerCase();
        const td = input.parentElement;
        let suggestionsDiv = td.querySelector('.product-suggestions');
        
        // إنشاء div للاقتراحات إن لم يكن موجود
        if (!suggestionsDiv) {
            suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'product-suggestions absolute bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto';
            suggestionsDiv.style.display = 'none';
            suggestionsDiv.style.direction = 'rtl';
            suggestionsDiv.style.top = '100%';
            suggestionsDiv.style.right = '0';
            suggestionsDiv.style.minWidth = '200px';
            td.style.position = 'relative';
            td.appendChild(suggestionsDiv);
        }
        
        // إذا كان الحقل فارغ، أخفِ الاقتراحات
        if (searchTerm.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // البحث عن منتجات مطابقة (من البداية)
        const matches = state.products.filter(p => {
            const productName = p.name ? p.name.toLowerCase() : '';
            const productCode = p.id ? p.id.toLowerCase() : '';
            return productName.startsWith(searchTerm) || productCode.startsWith(searchTerm);
        }).slice(0, 8); // عرض أول 8 نتائج
        
        if (matches.length === 0) {
            suggestionsDiv.innerHTML = '<div class="p-2 text-gray-500 text-sm">لا توجد منتجات مطابقة</div>';
            suggestionsDiv.style.display = 'block';
            return;
        }
        
        suggestionsDiv.innerHTML = matches.map(product => `
            <div class="p-2 hover:bg-blue-100 cursor-pointer border-b text-sm" data-product-id="${product.id}" data-product-name="${product.name}">
                <strong>${product.name}</strong> <span class="text-gray-500">(${product.id})</span>
            </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
        
        // مستمع على الاقتراحات
        suggestionsDiv.removeEventListener('click', handleProductSuggestionClick);
        suggestionsDiv.addEventListener('click', function(e) {
            handleProductSuggestionClick(e, input);
        });
        
    } catch(err) {
        console.warn('showProductAutocomplete error:', err);
    }
}

// دالة معالجة اختيار منتج من الاقتراحات
function handleProductSuggestionClick(e, input) {
    const item = e.target.closest('[data-product-id]');
    if (!item) return;
    
    const productId = item.getAttribute('data-product-id');
    const productName = item.getAttribute('data-product-name');
    const row = input.closest('.spreadsheet-row');
    
    if (!row) return;
    
    // ملء الحقول
    input.value = productName;
    row.dataset.productId = productId;
    
    // تعديل حقل الكود أيضاً
    const codeInput = row.querySelector('.spreadsheet-product-code');
    if (codeInput) {
        codeInput.value = productId;
    }
    
    // تحديث السعر والمعلومات
    const customerId = spreadsheetCustomerSelect.value;
    updateSpreadsheetPriceAndProductInfo(row, productId, customerId);
    calculateSpreadsheetRowTotal(row);
    
    // إغلاق الاقتراحات
    const td = input.parentElement;
    const suggestionsDiv = td.querySelector('.product-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
    
    // نقل التركيز للحقل التالي (الكمية)
    const quantityInput = row.querySelector('.spreadsheet-quantity');
    if (quantityInput) {
        quantityInput.focus();
    }
}

function handleSpreadsheetCustomerChange() { 
    const customerId = spreadsheetCustomerSelect.value; updateSpreadsheetTaxVisibility(customerId); if (!customerId) return; spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => { const productCode = row.querySelector('.spreadsheet-product-code').value.trim(); if (productCode) { updateSpreadsheetPriceAndProductInfo(row, productCode, customerId); } calculateSpreadsheetRowTotal(row); }); 
}
function handleSpreadsheetRowChange(e) { 
     if (e.target.classList.contains('spreadsheet-product-code')) { const row = e.target.closest('.spreadsheet-row'); const productCode = e.target.value.trim(); const customerId = spreadsheetCustomerSelect.value; if (!customerId) { customDialog({ message: 'الرجاء اختيار العميل أولاً.', title: 'تنبيه' }); e.target.value = ''; return; } if (productCode) { updateSpreadsheetPriceAndProductInfo(row, productCode, customerId); } else { row.querySelector('.spreadsheet-product-name').value = ''; row.querySelector('.spreadsheet-price').value = 0; row.querySelector('.spreadsheet-category').textContent = ''; row.dataset.productId = ''; row.querySelector('.spreadsheet-price').classList.remove('promotion-price-applied'); } calculateSpreadsheetRowTotal(row); } 
    // If collection type changed, show/hide partial amount input
    if (e.target.classList.contains('spreadsheet-collection')) {
        const row = e.target.closest('.spreadsheet-row');
        const partialInput = row.querySelector('.spreadsheet-partial-amount');
        if (partialInput) {
            partialInput.style.display = (e.target.value === 'partial') ? 'inline-block' : 'none';
        }
    }
}
function handleSpreadsheetRowInput(e) { 
    if (e.target.classList.contains('spreadsheet-invoice-number') || e.target.classList.contains('spreadsheet-quantity') || e.target.classList.contains('spreadsheet-price') || e.target.classList.contains('spreadsheet-modified-price') || e.target.classList.contains('spreadsheet-discount')) { const row = e.target.closest('.spreadsheet-row'); calculateSpreadsheetRowTotal(row); } if (e.target.classList.contains('spreadsheet-invoice-number')) { const currentRow = e.target.closest('.spreadsheet-row'); const nextRow = currentRow.nextElementSibling; const nextInvoiceInput = nextRow ? nextRow.querySelector('.spreadsheet-invoice-number') : null; if (nextInvoiceInput && !nextInvoiceInput.value && e.target.value) { nextInvoiceInput.value = e.target.value; } } if (e.target.classList.contains('spreadsheet-tax-status-input')) { const value = e.target.value.trim(); if (value.toLowerCase() === 'تم') { e.target.value = 'تم'; } } 
}
function handleSpreadsheetRowClick(e) { 
    if (e.target.closest('.spreadsheet-delete-row-btn')) { const row = e.target.closest('.spreadsheet-row'); if (spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').length > 1) { row.remove(); updateSpreadsheetTaxVisibility(spreadsheetCustomerSelect.value); } else { customDialog({message: "لا يمكن حذف الصف الأخير.", title: "تنبيه"}); } } 
}

        function addSpreadsheetRow() {
    const row = document.createElement('tr'); row.className = 'spreadsheet-row'; const customerId = spreadsheetCustomerSelect.value; const customer = findCustomer(customerId); const requiresFiling = customer && customer.requiresTaxFiling; const unifiedInvoiceNumber = unifiedInvoiceNumberInput.value.trim(); const lastRow = spreadsheetEntryBody.lastElementChild; 
    
    // استخلاص رقم الفاتورة التسلسلي من المندوب
    let initialInvoiceNumber = unifiedInvoiceNumber;
    if (!initialInvoiceNumber) {
        // حاول من الصف الأخير
        initialInvoiceNumber = (lastRow ? lastRow.querySelector('.spreadsheet-invoice-number')?.value || '' : '');
    }
    if (!initialInvoiceNumber) {
        // إذا لم يكن هناك رقم موحد أو من الصف الأخير، استخدم السيريال التالي للمندوب
        const repName = spreadsheetRepSelect.value;
        const rep = findRep(repName);
        if (rep && rep.nextInvoiceNumber != null) {
            initialInvoiceNumber = String(rep.nextInvoiceNumber);
        }
    }
    
    const taxInputHtml = `<td class="spreadsheet-tax-cell" style="display: ${requiresFiling ? 'table-cell' : 'none'};"><input type="text" class="spreadsheet-tax-status-input" placeholder="تم / علامة" value=""></td>`; 
    // NOTE: Removed min="1" from spreadsheet-quantity input
    row.innerHTML = `<td><input type="number" class="spreadsheet-invoice-number" placeholder="رقم..." value="${initialInvoiceNumber}"></td><td><input type="text" class="spreadsheet-product-code" placeholder="الكود" size="5"></td><td><input type="text" class="spreadsheet-product-name" placeholder="اسم الصنف"></td><td><input type="number" class="spreadsheet-quantity" value="" placeholder="0"></td><td><input type="number" class="spreadsheet-price" step="any" placeholder="السعر" readonly></td>
<td><input type="number" class="spreadsheet-modified-price" step="any" placeholder="تعديل..."></td><td><input type="number" class="spreadsheet-discount" step="any" placeholder="%" min="0" max="100"></td><td class="spreadsheet-category text-center text-xs"></td><td><select class="spreadsheet-collection"><option value="paid">كاش</option><option value="due">آجل</option><option value="partial">جزئي</option></select><input type="number" class="spreadsheet-partial-amount" step="any" placeholder="جزئي" style="display:none;width:90px;margin-top:4px;margin-right:6px"></td>${taxInputHtml}<td class="spreadsheet-total text-center font-semibold"></td><td><button type="button" class="spreadsheet-delete-row-btn text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`; 
    spreadsheetEntryBody.appendChild(row); updateIcons();
}

async function saveAllSpreadsheetEntries() {
    const repName = spreadsheetRepSelect.value;
    const customerId = spreadsheetCustomerSelect.value;
    const dateValue = spreadsheetDateInput.value;
    const customer = findCustomer(customerId);
    const requiresTaxFiling = customer?.requiresTaxFiling || false;

    if (!repName || !customerId || !dateValue) {
        await customDialog({ message: 'الرجاء اختيار المندوب والعميل والتاريخ أولاً.', title: 'بيانات ناقصة', confirmClass: 'bg-red-600 hover:bg-red-700' });
        return;
    }

    const invoicesToSave = new Map();
    const existingInvoiceNumbers = new Set((state.sales||[]).map(s => {
        try { return (s && s.invoiceNumber != null) ? String(s.invoiceNumber) : null; } catch(_) { return null; }
    }).filter(x => x !== null));
    let isValid = true;
    let dataFound = false;

    spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => {
        const invoiceNumberInput = row.querySelector('.spreadsheet-invoice-number');
        const productCodeInput = row.querySelector('.spreadsheet-product-code');
        const productNameInput = row.querySelector('.spreadsheet-product-name');
        const taxStatusInput = row.querySelector('.spreadsheet-tax-status-input');
        const rawInvoiceNumber = invoiceNumberInput.value.trim();
        const invoiceNumber = rawInvoiceNumber ? parseInt(rawInvoiceNumber) : null;
        const productId = row.dataset.productId;
        const productNameValue = productNameInput ? productNameInput.value.trim() : '';
        const quantity = parseInt(row.querySelector('.spreadsheet-quantity').value) || 0;
        const originalPrice = parseFloat(row.querySelector('.spreadsheet-price').value);
        const modifiedPrice = parseFloat(row.querySelector('.spreadsheet-modified-price').value);
        const safeOriginalPrice = (!isNaN(originalPrice) ? originalPrice : 0);
        const safeModifiedPrice = (!isNaN(modifiedPrice) ? modifiedPrice : 0);
        const price = (safeModifiedPrice > 0) ? safeModifiedPrice : safeOriginalPrice;
        const discount = parseFloat(row.querySelector('.spreadsheet-discount').value);
        const safeDiscount = (!isNaN(discount) ? discount : 0);
        const collection = row.querySelector('.spreadsheet-collection').value;
        const partialAmount = parseFloat(row.querySelector('.spreadsheet-partial-amount')?.value);
        const safePartialAmount = (!isNaN(partialAmount) ? partialAmount : 0);
        const taxFilingStatus = taxStatusInput ? taxStatusInput.value.trim() : '';

        [invoiceNumberInput, productCodeInput, row.querySelector('.spreadsheet-quantity'), row.querySelector('.spreadsheet-price'), row.querySelector('.spreadsheet-discount')].forEach(el => el.classList.remove('border-red-500', 'border-2'));
        if (productNameInput) productNameInput.classList.remove('border-red-500', 'border-2');
        if (taxStatusInput) taxStatusInput.classList.remove('border-red-500', 'border-2');

        // Special-case: product code '100' is used as a cancelled-invoice placeholder
        const codeValue = (productCodeInput && productCodeInput.value) ? productCodeInput.value.trim() : '';
        const isCanceledCode = (codeValue === '100') || (productId === '100');

        if (isCanceledCode) {
            // allow saving a cancelled invoice row even without price/quantity
            dataFound = true;

            if (!rawInvoiceNumber || isNaN(invoiceNumber) || invoiceNumber <= 0) {
                invoiceNumberInput.classList.add('border-red-500', 'border-2'); isValid = false;
            }

            if (invoicesToSave.has(invoiceNumber) && invoicesToSave.get(invoiceNumber).collectionStatus !== collection) {
                invoiceNumberInput.classList.add('border-red-500', 'border-2'); isValid = false;
            }

            if (!isValid) return;

            if (!invoicesToSave.has(invoiceNumber)) {
                invoicesToSave.set(invoiceNumber, { items: [], collectionStatus: collection, totalSales: 0, taxFilingStatus: taxFilingStatus, partialAmount: collection === 'partial' ? safePartialAmount : 0, isCanceled: true });
            } else {
                invoicesToSave.get(invoiceNumber).isCanceled = true;
            }

            // skip normal item validation for this row
            return;
        }

        if (productId || productNameValue) {
            dataFound = true;
            
            // التحقق من أن المنتج موجود فعلاً
            const product = getProductDetailsByCode(productId);
            if (!product) {
                if (productNameInput) {
                    productNameInput.classList.add('border-red-500', 'border-2');
                }
                if (productCodeInput) {
                    productCodeInput.classList.add('border-red-500', 'border-2');
                }
                isValid = false;
                return;
            }
            
            if (!rawInvoiceNumber || isNaN(invoiceNumber) || invoiceNumber <= 0) {
                invoiceNumberInput.classList.add('border-red-500', 'border-2'); isValid = false;
            }

            if (invoicesToSave.has(invoiceNumber) && invoicesToSave.get(invoiceNumber).collectionStatus !== collection) {
                invoiceNumberInput.classList.add('border-red-500', 'border-2'); isValid = false;
            }

            // If collection is partial, ensure partial amount consistency across rows of same invoice
            if (collection === 'partial' && invoicesToSave.has(invoiceNumber) && typeof invoicesToSave.get(invoiceNumber).partialAmount !== 'undefined' && invoicesToSave.get(invoiceNumber).partialAmount !== safePartialAmount) {
                invoiceNumberInput.classList.add('border-red-500', 'border-2'); isValid = false;
            }

            // Quantity cannot be zero (but can be negative)
            if (!quantity || quantity === 0) { row.querySelector('.spreadsheet-quantity').classList.add('border-red-500', 'border-2'); isValid = false; }

            if (isNaN(price) || price <= 0) { row.querySelector('.spreadsheet-price').classList.add('border-red-500', 'border-2'); isValid = false; }
            // Discount is OPTIONAL: empty = 0, must be between 0-100 if provided
            const discountInput = row.querySelector('.spreadsheet-discount').value.trim();
            if (discountInput !== '' && (isNaN(discount) || discount < 0 || discount > 100)) { row.querySelector('.spreadsheet-discount').classList.add('border-red-500', 'border-2'); isValid = false; }

            if (requiresTaxFiling && invoicesToSave.has(invoiceNumber) && invoicesToSave.get(invoiceNumber).taxFilingStatus !== taxFilingStatus) {
                taxStatusInput.classList.add('border-red-500', 'border-2'); isValid = false; return;
            }

            if (!isValid) return;

            if (!invoicesToSave.has(invoiceNumber)) {
                invoicesToSave.set(invoiceNumber, { items: [], collectionStatus: collection, totalSales: 0, taxFilingStatus: taxFilingStatus, partialAmount: collection === 'partial' ? safePartialAmount : 0 });
            }

            const itemSubtotal = price * quantity;
            const itemFinalPrice = itemSubtotal * (1 - safeDiscount / 100);
            const invoiceData = invoicesToSave.get(invoiceNumber);
            invoiceData.items.push({ productId, quantity, price, discountPercent: safeDiscount, itemFinalPrice });
            invoiceData.totalSales += itemFinalPrice;
            invoiceData.taxFilingStatus = taxFilingStatus;
            if (collection === 'partial') invoiceData.partialAmount = safePartialAmount;
        } else if (productCodeInput.value.trim()) {
            productCodeInput.classList.add('border-red-500', 'border-2'); isValid = false;
        }
        
    });

    if (!dataFound) {
        await customDialog({ message: 'الجدول فارغ. الرجاء إدخال بيانات الفواتير أولاً.', title: 'تنبيه' });
        return;
    }

    // If validation failed, allow save if the user manually entered any invoice number
    if (!isValid) {
        try {
            const anyManual = Array.from(spreadsheetEntryBody.querySelectorAll('.spreadsheet-invoice-number')).some(i => i.dataset && i.dataset.userEntered === '1');
            if (anyManual) {
                console.log('saveAllSpreadsheetEntries: validation failed but manual invoice entry detected — proceeding to save.');
                isValid = true; // force continue (accept manual numbers)
            } else {
                await customDialog({ message: 'توجد أخطاء في بعض الحقول (مميزة بالأحمر). الرجاء تصحيحها والتأكد من عدم تكرار رقم فاتورة مسجلة مسبقًا.', title: 'خطأ في الإدخال', confirmClass: 'bg-red-600 hover:bg-red-700' });
                return;
            }
        } catch(e) {
            await customDialog({ message: 'توجد أخطاء في بعض الحقول (مميزة بالأحمر). الرجاء تصحيحها والتأكد من عدم تكرار رقم فاتورة مسجلة مسبقًا.', title: 'خطأ في الإدخال', confirmClass: 'bg-red-600 hover:bg-red-700' });
            return;
        }
    }

    let savedCount = 0;
    const saveErrors = [];
    const dateISO = new Date(dateValue + 'T12:00:00Z').toISOString();
    const now = new Date().toISOString();
    const rep = findRep(repName);

    // Validate invoice sequence against rep.nextInvoiceNumber when available
    try {
        if (rep && rep.nextInvoiceNumber != null) {
            const invNums = Array.from(invoicesToSave.keys()).map(n => Number(n)).filter(n => !isNaN(n));
            if (invNums.length > 0) {
                const minInv = Math.min(...invNums);
                if (minInv < Number(rep.nextInvoiceNumber)) {
                    await customDialog({ message: `رقم الفاتورة ${minInv} أصغر من رقم الفاتورة التالي المتوقع للمندوب (${rep.nextInvoiceNumber}). الرجاء تحديث الأرقام أو تعديل رقم الفاتورة البدء.`, title: 'خطأ في تسلسل الفاتورة', confirmClass: 'bg-red-600 hover:bg-red-700' });
                    return;
                }
            }
        }
    } catch(e) { console.warn('Invoice sequence validation failed', e); }

    // Debug: log invoices to save
    try { console.debug('saveAllSpreadsheetEntries: invoicesToSave', Array.from(invoicesToSave.entries()).map(([k,v])=>({invoiceNumber:k, invoiceData:v}))); } catch(_){}

    // Persist every built invoice to Firestore so it survives refresh
    for (const [invoiceNumber, invoiceData] of invoicesToSave.entries()) {
        // If this invoice was marked cancelled via special code, force canceled status
        let finalTotal = parseFloat((invoiceData.totalSales || 0).toFixed(2));
        let status;
        if (invoiceData.isCanceled) {
            status = 'canceled';
            finalTotal = 0;
        } else {
            status = finalTotal < 0 ? 'due' : invoiceData.collectionStatus;
        }
        const paidAmount = (status === 'paid') ? finalTotal : (status === 'partial' ? (invoiceData.partialAmount || 0) : 0);

        const newSale = {
            id: Date.now().toString() + savedCount,
            date: dateISO,
            createdAt: now,
            updatedAt: now,
            repName: repName,
            repId: rep ? rep.id : null,
            repEmail: rep ? rep.email : null,
            customerId: customerId,
            invoiceNumber: invoiceNumber,
            items: invoiceData.items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                price: i.price,
                discountPercent: i.discountPercent,
                itemTotal: i.itemFinalPrice,
            })),
            total: finalTotal,
            status,
            isCanceled: !!invoiceData.isCanceled,
            paidAmount: paidAmount,
            // Persist partial payment into firstPayment for immediate visibility in Cash
            firstPayment: status === 'partial' ? (invoiceData.partialAmount || 0) : (paidAmount || 0),
            discount: 0,
            notes: 'تم الإدخال عبر الإدخال السريع',
            taxFilingStatus: invoiceData.taxFilingStatus
        };

        try {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            const current = (typeof AuthSystem !== 'undefined' && AuthSystem.getCurrentUser) ? AuthSystem.getCurrentUser() : null;
            console.log('🔍 Admin metadata check:', { role, currentId: current?.id, repId: rep?.id, isAdmin: role === 'admin', isDifferentUser: current && rep && String(current.id) !== String(rep.id) });
            if (role === 'admin' && current && rep && String(current.id) !== String(rep.id)) {
                // تمييز الفواتير التي تدخلها الإدارة نيابة عن المندوب
                newSale.isAdminEntry = true;
                newSale.originalCreatorId = current.id;
                newSale.recordedByName = current.name || 'إدارة';
                newSale.adminEntry = true;
                newSale.adminEnteredBy = current.id;
                newSale.created_by_admin = true;
                newSale.entry_source = 'admin';
                // إضافة ملاحظة توضيحية
                newSale.notes += ' - (تم التسجيل بمعرفة الإدارة)';
                console.log('✅ Admin metadata added to invoice:', invoiceNumber, { isAdminEntry: true, recordedByName: newSale.recordedByName });
            } else {
                console.log('❌ Admin metadata NOT added - condition not met');
            }
        } catch(e) { console.error('Admin metadata error:', e); }

        try {
            // Just save normally - addSale handles everything
            await addSale(newSale);
            savedCount++;
        } catch (e) {
            console.warn('Bulk save failed for invoice', invoiceNumber, e);
            const errMsg = (e && e.message) ? e.message : String(e);
            saveErrors.push({ invoiceNumber, error: errMsg });
            const msg = (errMsg || '').toLowerCase();
            const code = e && e.code ? e.code : null;
            const isPerm = (code === 'permission-denied' || (typeof code === 'string' && code.toLowerCase().includes('permission'))) || msg.includes('permission') || msg.includes('insufficient');
            if (isPerm) {
                try {
                    await customDialog({ message: 'فشل الحفظ: يبدو أن حسابك لا يملك أذونات الكتابة في موقع الفواتير. تأكد من نشر قواعد Firestore المحدثة أو تحقق من إعدادات الصلاحيات. (تفاصيل في وحدة التحكم)', title: 'خطأ أذونات', confirmClass: 'bg-red-600 hover:bg-red-700' });
                } catch(_){}
                return; // stop further saves
            }
            // otherwise continue to next invoice
        }
    }

    if (savedCount > 0) {
        const maxInvoiceNumber = Math.max(...Array.from(invoicesToSave.keys()).map(Number));
        if (rep && rep.nextInvoiceNumber <= maxInvoiceNumber) { rep.nextInvoiceNumber = maxInvoiceNumber + 1; }
        
        // حفظ السيريال المحدّث في السحابة
        try {
            if (rep && rep.id) {
                await db.collection('reps').doc(rep.id).set({ nextInvoiceNumber: rep.nextInvoiceNumber }, { merge: true });
                console.log('✅ Updated rep nextInvoiceNumber to', rep.nextInvoiceNumber, 'for rep', repName);
            }
        } catch(e) { console.warn('Failed to update rep nextInvoiceNumber:', e); }
        
        renderAll();
        await customDialog({ message: `تم حفظ ${savedCount} فاتورة بنجاح. ${rep ? `رقم الفاتورة القادمة للمندوب ${repName} هو ${rep.nextInvoiceNumber}.` : ''}`, title: 'حفظ ناجح', confirmClass: 'bg-green-600 hover:bg-green-700' });
        initializeSpreadsheetPage();
    } else {
        // Provide more info to the user if available
        try {
            if (saveErrors.length > 0) {
                const preview = saveErrors.slice(0,3).map(e => `رقم ${e.invoiceNumber}: ${e.error}`).join('\n');
                await customDialog({ message: `لم يتم حفظ أي فواتير. بعض الأخطاء عند الحفظ:\n${preview}\nتفاصيل أكثر في وحدة التحكم (Console).`, title: 'خطأ في الحفظ', confirmClass: 'bg-red-600 hover:bg-red-700' });
            } else {
                const hasInline = (typeof spreadsheetEntryBody !== 'undefined' && spreadsheetEntryBody && spreadsheetEntryBody.querySelectorAll('.border-red-500').length > 0)
                    || document.querySelectorAll('.border-red-500').length > 0;
                if (hasInline) {
                    const firstInvalid = (typeof spreadsheetEntryBody !== 'undefined' && spreadsheetEntryBody)
                        ? spreadsheetEntryBody.querySelector('.border-red-500')
                        : document.querySelector('.border-red-500');
                    try { if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus(); } catch(_){ }
                } else {
                    await customDialog({ message: 'لم يتم حفظ أي فواتير. قد تكون البيانات غير كاملة.', title: 'تنبيه' });
                }
            }
        } catch(_) {
            try {
                const firstInvalid = (typeof spreadsheetEntryBody !== 'undefined' && spreadsheetEntryBody)
                    ? spreadsheetEntryBody.querySelector('.border-red-500')
                    : document.querySelector('.border-red-500');
                if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
            } catch(_){ }
        }
    }
}

function renderAll() {
    state.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); saveState(); const repFilterSelect = document.getElementById('dashboard-rep-filter'); const currentFilter = repFilterSelect.value; populateRepDropdown(repFilterSelect, currentFilter);
    const textFilter = document.getElementById('search-sales-text').value; const dateFilter = document.getElementById('search-sales-date').value; const custFilter = document.getElementById('search-customers').value; const prodFilter = document.getElementById('search-products').value;
    scheduleRender('dashboard-main', ()=>{ try { renderDashboard(); } catch(e){} try { renderDispatchPage(); } catch(e){} });
    scheduleRender('sales-list', ()=>{ try { renderAllSales(textFilter, dateFilter); } catch(e){} });
    scheduleRender('customers-list', ()=>{ try { renderCustomers(custFilter); } catch(e){} });
    scheduleRender('reps-list', ()=>{ try { renderReps(); } catch(e){} });
    scheduleRender('settings-products', ()=>{ try { renderSettings(prodFilter); } catch(e){} });
    scheduleRender('promotions', ()=>{ try { renderPromotions(); } catch(e){} });
    scheduleRender('debts', ()=>{ try { renderDebts(); } catch(e){} });
    scheduleRender('rep-debts', ()=>{ try { renderRepDebts(); } catch(e){} });
    scheduleRender('costs', ()=>{ try { renderUnifiedPriceGrid(); } catch(e){} });
    // RENDER CHARTS ONCE ON DASHBOARD LOAD, not on every renderAll()
    // if (document.getElementById('page-dashboard').classList.contains('active')) { renderSales7DaysChart(); renderTopRepsChart(); renderTopProductsChart(); renderTopCustomersChart(); }
    const statementCustomerList = document.getElementById('statement-customer-list'); const statementCustomerSearch = document.getElementById('statement-customer-search'); if (statementCustomerList && statementCustomerSearch) { statementCustomerSearch.value = ''; updateCustomerList(''); } updateIcons(); 
    // Ensure Cash view stays in sync whenever main UI re-renders (e.g., after background sync / saves)
    try { if (typeof renderCash === 'function') renderCash(); } catch (e) { console.warn('renderAll: renderCash failed', e); }
    // لا تعرض أي لوحة تشخيص/استرجاع محلية عند البداية
    // نعتمد الآن على Firestore فقط للمزامنة.
}

// --- NEW REPORTING FUNCTIONS ---
function initializeReportsPage() {
    populateRepDropdownReports(dailyReportRepSelect);
    populateRepDropdownReports(rangeReportRepSelect);
    populateRepDropdownReports(monthlyReportRepSelect);
    populateRepDropdownReports(document.getElementById('recon-report-rep'));
    
    // Set default date/month
    const today = new Date().toISOString().split('T')[0];
    dailyReportDateInput.value = today;
    rangeStartDateInput.value = today;
    rangeEndDateInput.value = today;
    
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    monthlyReportMonthInput.value = currentMonth;
    const targetsMonthInput = document.getElementById('targets-month');
    if (targetsMonthInput) targetsMonthInput.value = currentMonth;
    const customerTargetsMonthInput = document.getElementById('customer-targets-month');
    if (customerTargetsMonthInput) customerTargetsMonthInput.value = currentMonth;
    
    // Set initial content area based on active subnav item
    const activeReportSection = reportsSubnav.querySelector('.reports-subnav-item.active')?.dataset.reportSection || 'daily';
    showReportContent(activeReportSection);
}

function showReportContent(section) {
    reportContentAreas.forEach(area => {
        area.classList.add('hidden');
        area.classList.remove('active');
    });
    const activeArea = document.querySelector(`#page-reports [data-report-content="${section}"]`);
    if (activeArea) {
        activeArea.classList.remove('hidden');
        activeArea.classList.add('active');
    }
    // عرض تلقائي لتقرير التارجت عند فتح التبويب
    if (section === 'targets') {
        try { generateTargetsReport(); return; } catch(e){}
    }
    if (section === 'customer-targets') {
        try { generateCustomerTargetsReport(); return; } catch(e){}
    }
    reportOutputArea.innerHTML = '<p class="text-center text-gray-500 mt-8">اضغط على زر "عرض التقرير" لإنشاء التقرير.</p>';
}

function printSection(elementId) {
    const printElement = document.getElementById(elementId);
    if (!printElement) return;

    printElement.classList.add('printable-content');
    
    // Use a timeout to ensure styles are applied before the print dialog blocks the main thread
    setTimeout(() => {
        window.print();
        // Another timeout to remove the class after the print dialog has opened
        setTimeout(() => {
            printElement.classList.remove('printable-content');
        }, 500);
    }, 50);
}

// Internal helper: capture element to canvas with high-quality defaults
async function captureElementCanvas(element, scale = 2) {
    // احتفظ بالتنسيق الأصلي قدر الإمكان (كان التعديل السابق يسبب إنحراف المحاذاة)
    const prev = {
        boxShadow: element.style.boxShadow,
        filter: element.style.filter,
        transform: element.style.transform
    };
    element.style.boxShadow = 'none';
    element.style.filter = 'none';
    element.style.transform = 'none';
    try {
        await new Promise(r => requestAnimationFrame(r));
        const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            backgroundColor: '#ffffff',
            ignoreElements: el => el.classList.contains('no-print')
        });
        return canvas;
    } finally {
        element.style.boxShadow = prev.boxShadow;
        element.style.filter = prev.filter;
        element.style.transform = prev.transform;
    }
}

// Upload a Blob to Firebase Storage and return a public URL
async function uploadImageBlobToStorage(blob, pathPrefix = 'shares/exports') {
    // Fallback سريع إذا كان الملف يُفتح من file:// حيث يمنع Firebase طلبات التخزين (CORS origin null)
    if (location.protocol === 'file:') {
        console.warn('uploadImageBlobToStorage: تشغيل من file:// => التخطي وإرجاع null');
        return null; // يسمح للدالة المستدعية ببناء مشاركة بديلة
    }
    if (!window.storage) throw new Error('Firebase Storage غير مهيأ');
    try {
        const uid = (window.auth && auth.currentUser && auth.currentUser.uid) ? auth.currentUser.uid : 'anon';
        const path = `${pathPrefix}/${uid}/${Date.now()}.png`;
        const ref = storage.ref().child(path);
        const metadata = { contentType: 'image/png', cacheControl: 'public, max-age=31536000' };
        const snap = await ref.put(blob, metadata);
        const url = await snap.ref.getDownloadURL();
        return url;
    } catch(e){
        console.warn('uploadImageBlobToStorage: فشل الرفع، سيتم استخدام مشاركة بديلة', e);
        return null;
    }
}

async function generateReportImage(elementId) {
    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        await customDialog({ title: 'خطأ', message: 'لم يتم العثور على محتوى التقرير لنسخه.' });
        return;
    }

    try {
        showLoading('جارٍ تحويل التقرير إلى صورة...');
        const isRecon = elementId === 'recon-report-output';
        let canvas;
        if (isRecon){
            reportElement.classList.add('recon-export-scale');
            canvas = await captureElementCanvas(reportElement, 4);
            reportElement.classList.remove('recon-export-scale');
        } else {
            canvas = await captureElementCanvas(reportElement, 2);
        }
        hideLoading();

        const imageUrl = canvas.toDataURL('image/png');
        const previewContainer = document.getElementById('image-preview-container');
        const downloadBtn = document.getElementById('download-image-btn');
        const imagePreviewModal = document.getElementById('image-preview-modal');

        if (!previewContainer || !downloadBtn || !imagePreviewModal) {
            await customDialog({title: 'خطأ', message: 'عناصر واجهة معاينة الصورة غير موجودة.'});
            return;
        }

        previewContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = imageUrl;
        // عرض العرض الحقيقي للبكسلات عند التسوية النهائية (قد يكون كبيراً)
        if (isRecon) {
            img.style.width = canvas.width + 'px';
            img.style.maxWidth = '100%';
            previewContainer.style.maxWidth = canvas.width + 'px';
            previewContainer.style.overflow = 'auto';
        } else {
            img.className = 'w-full h-auto';
        }
        previewContainer.appendChild(img);

        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = imageUrl;
            a.download = `report-${elementId}.png`;
            a.click();
        };

        openModal(imagePreviewModal);

    } catch (err) {
        console.error('html2canvas failed:', err);
        hideLoading();
        await customDialog({ title: 'خطأ', message: 'حدث خطأ أثناء إنشاء صورة التقرير.' });
    }
}

// Share settlement report to WhatsApp by uploading to Storage and opening wa.me link
async function shareSettlementWhatsApp(elementId) {
    const el = document.getElementById(elementId);
    if (!el) { await customDialog({title:'خطأ', message:'لم يتم العثور على تقرير التسوية.'}); return; }
    try {
        showLoading('جارٍ تجهيز مشاركة واتساب...');
        const canvas = await captureElementCanvas(el, 2);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('فشل إنشاء الصورة');
        const url = await uploadImageBlobToStorage(blob, 'shares/settlements');
        hideLoading();

        const date = (window.dailyReportDateInput && dailyReportDateInput.value) ? dailyReportDateInput.value : '';
        const rep = (window.dailyReportRepSelect && dailyReportRepSelect.value && dailyReportRepSelect.value !== 'all') ? dailyReportRepSelect.value : '';
        const msg = `تسوية ${rep ? rep + ' - ' : ''}${date ? date : ''}\n${url}`;

        const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(wa, '_blank');
    } catch (e) {
        console.error('WhatsApp share failed', e);
        hideLoading();
        await customDialog({title:'خطأ', message:'تعذر مشاركة تقرير التسوية على واتساب.'});
    }
}

async function exportSelectedRows(exportType) {
    const checkedBoxes = document.querySelectorAll('#total-bills-table-body input.total-bill-row-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        await customDialog({ title: 'لم يتم التحديد', message: 'الرجاء تحديد صف واحد على الأقل لتصديره.' });
        return;
    }

    const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
    const selectedSales = state.sales.filter(s => selectedIds.includes(s.id));

    // Check if total should be included
    const includeTotalCheckbox = document.getElementById('include-total-in-export');
    let totalHtml = '';
    if (includeTotalCheckbox && includeTotalCheckbox.checked) {
        const totalContainer = document.getElementById('total-bills-summary-container');
        if (totalContainer) {
            const clonedTotal = totalContainer.cloneNode(true);
            const checkboxDiv = clonedTotal.querySelector('div:last-child');
            if (checkboxDiv) checkboxDiv.remove(); // Remove the checkbox from the cloned element
            clonedTotal.classList.add('mb-4');
            totalHtml = clonedTotal.outerHTML;
        }
    }

    // Re-create the table header, but without the checkbox column
    const originalThead = document.querySelector('#total-bills-table thead');
    const clonedThead = originalThead.cloneNode(true);
    clonedThead.querySelector('th').remove(); // Remove the first th (checkbox)
    
    // Build the new table rows
    const rowsHtml = selectedSales.map(sale => {
        const customer = findCustomer(sale.customerId);
        const category = sale.items.length > 0 ? (findProduct(sale.items[0].productId)?.category || 'N/A') : 'N/A';
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-center">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center font-bold">${sale.invoiceNumber}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${customer ? customer.name : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${sale.repName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center font-semibold">${formatCurrency(sale.total)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">${getStatusBadge(sale.status)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${category}</td>
            </tr>
        `;
    }).join('');

    // Create a temporary printable element
    const tempExportElement = document.createElement('div');
    tempExportElement.id = 'temp-export-area';
    tempExportElement.innerHTML = `
        <h2 class="text-xl font-bold mb-4 text-center">تقرير الصفوف المحددة</h2>
        ${totalHtml}
        <table class="min-w-full divide-y divide-gray-200" style="direction: rtl;">
            ${clonedThead.outerHTML}
            <tbody class="bg-white divide-y divide-gray-200">${rowsHtml}</tbody>
        </table>
    `;
    tempExportElement.style.position = 'absolute';
    tempExportElement.style.left = '-9999px';
    document.body.appendChild(tempExportElement);

    // Call the appropriate export function
    if (exportType === 'print') {
        await printSection('temp-export-area');
    } else if (exportType === 'image') {
        await generateReportImage('temp-export-area');
    }

    // Clean up
    document.body.removeChild(tempExportElement);
}

function generateDailyReport() {
    const date = dailyReportDateInput.value;
    const repName = dailyReportRepSelect.value;
    const chainId = document.getElementById('daily-report-chain').value;
    
    if (!date) {
        customDialog({ message: 'الرجاء تحديد تاريخ التقرير اليومي.', title: 'بيانات ناقصة' });
        return;
    }
    
    // Get chain customer IDs if a chain is selected
    let allowedCustomerIds = null;
    if (chainId) {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (chain) allowedCustomerIds = chain.customerIds || [];
    }
    
    const salesForDay = state.sales.filter(s => {
        const saleDate = new Date(s.date);
        if (isNaN(saleDate.getTime())) return false; // skip invalid dates
        const matchesDate = saleDate.toISOString().split('T')[0] === date;
        const matchesRep = (repName === 'all' || s.repName === repName);
        const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
        return matchesDate && matchesRep && matchesChain;
    }).sort((a, b) => a.invoiceNumber - b.invoiceNumber);

    let totalSales = 0;
    let totalReturns = 0;
    
    const reportRows = salesForDay.map(sale => {
        const customer = findCustomer(sale.customerId);
        const isReturn = sale.total < 0;
        
        if (isReturn) {
            totalReturns += sale.total;
        } else {
            totalSales += sale.total;
        }

        const totalClass = isReturn ? 'text-red-600 font-bold' : 'text-green-600 font-bold';

        return `<tr class="border-b ${isReturn ? 'bg-red-100/50' : ''}">
            <td class="px-4 py-2">${sale.invoiceNumber}</td>
            <td class="px-4 py-2">${customer?.name || 'عميل محذوف'}</td>
            <td class="px-4 py-2">${sale.repName || 'غير محدد'}</td>
            <td class="px-4 py-2 text-center ${totalClass}">${formatCurrency(sale.total)}</td>
            <td class="px-4 py-2 text-center">${getStatusBadge(sale.status)}</td>
        </tr>`;
    }).join('');
    
    const netSales = totalSales + totalReturns; // Returns are already negative
    const chainName = chainId ? document.querySelector('#daily-report-chain option[value="' + chainId + '"]').textContent : '';

    let outputHTML = `
        <div id="daily-report-output" class="bg-white p-4 rounded-lg shadow-lg">
            <h3 class="text-xl font-bold mb-4">تقرير المبيعات اليومي لـ: ${date} (${repName === 'all' ? 'جميع المناديب' : repName}${chainId ? ' - السلسلة: ' + chainName : ''})</h3>
            <div class="grid grid-cols-3 gap-4 mb-4 text-center">
                <div class="p-3 bg-green-50 rounded-lg">
                    <p class="text-sm text-green-700">إجمالي المبيعات:</p>
                    <p class="text-xl font-bold text-green-800">${formatCurrency(totalSales)}</p>
                </div>
                <div class="p-3 bg-red-50 rounded-lg">
                    <p class="text-sm text-red-700">إجمالي المرتجعات:</p>
                    <p class="text-xl font-bold text-red-800">${formatCurrency(totalReturns)}</p>
                </div>
                <div class="p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-700">صافي المبيعات:</p>
                    <p class="text-xl font-bold text-blue-800">${formatCurrency(netSales)}</p>
                </div>
            </div>
            
            ${salesForDay.length > 0 ? `
                <div class="overflow-x-auto border rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المندوب</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">
                            ${reportRows}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="text-center text-gray-500 p-4">لا توجد فواتير أو مرتجعات مسجلة في هذا التاريخ.</p>'}
        </div>
        <div class="mt-4 flex gap-2 no-print">
            <button onclick="printSection('daily-report-output')" class="w-1/2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"><i data-lucide='printer'></i> طباعة</button>
            <button onclick="generateReportImage('daily-report-output')" class="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><i data-lucide='image'></i> نسخ كصورة</button>
        </div>
    `;
    
    reportOutputArea.innerHTML = outputHTML;
    updateIcons();
}

// Placeholder for other reports (to be implemented later if requested)
function generateRangeReport() {
    const start = rangeStartDateInput.value;
    const end = rangeEndDateInput.value;
    const repName = rangeReportRepSelect.value;
    const chainId = document.getElementById('range-report-chain').value;
    
    if (!start || !end) {
        customDialog({ message: 'الرجاء تحديد تاريخ البداية والنهاية.', title: 'بيانات ناقصة' });
        return;
    }
    
    // Get chain customer IDs if a chain is selected
    let allowedCustomerIds = null;
    if (chainId) {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (chain) allowedCustomerIds = chain.customerIds || [];
    }
    
    const startDate = new Date(start + 'T00:00:00Z');
    const endDate = new Date(end + 'T23:59:59Z');
    const salesInRange = state.sales.filter(s => {
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return false; // skip invalid dates
        const matchesDate = d >= startDate && d <= endDate;
        const matchesRep = repName === 'all' || s.repName === repName;
        const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
        return matchesDate && matchesRep && matchesChain;
    }).sort((a,b)=> new Date(a.date) - new Date(b.date));

    let totalSales = 0; let totalReturns = 0;
    const rowsHtml = salesInRange.map(sale => {
        const customer = findCustomer(sale.customerId);
        const isReturn = sale.total < 0;
        if (isReturn) totalReturns += sale.total; else totalSales += sale.total;
        const totalClass = isReturn ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
        return `<tr class="border-b ${isReturn ? 'bg-red-50' : ''}">\n                    <td class="px-3 py-1 text-center">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>\n                    <td class="px-3 py-1">${sale.invoiceNumber || ''}</td>\n                    <td class="px-3 py-1">${customer?.name || 'عميل محذوف'}</td>\n                    <td class="px-3 py-1">${sale.repName || ''}</td>\n                    <td class="px-3 py-1 text-center ${totalClass}">${formatCurrency(sale.total)}</td>\n                    <td class="px-3 py-1 text-center">${getStatusBadge(sale.status)}</td>\n                </tr>`;
    }).join('');
    const netSales = totalSales + totalReturns;
    const chainName = chainId ? document.querySelector('#range-report-chain option[value="' + chainId + '"]').textContent : '';

    // تجميع يومي مختصر
    const dailyMap = new Map();
    salesInRange.forEach(s => {
        const dayKey = new Date(s.date).toISOString().split('T')[0];
        const prev = dailyMap.get(dayKey) || { sales:0, returns:0 };
        if (s.total < 0) prev.returns += s.total; else prev.sales += s.total;
        dailyMap.set(dayKey, prev);
    });
    const dailyRows = Array.from(dailyMap.entries()).sort((a,b)=> new Date(a[0]) - new Date(b[0]))
        .map(([day, agg]) => {
            const net = agg.sales + agg.returns;
            return `<tr class="border-b">\n                        <td class="px-2 py-1">${day}</td>\n                        <td class="px-2 py-1 text-green-700 font-semibold">${formatCurrency(agg.sales)}</td>\n                        <td class="px-2 py-1 text-red-700 font-semibold">${formatCurrency(agg.returns)}</td>\n                        <td class="px-2 py-1 text-blue-700 font-semibold">${formatCurrency(net)}</td>\n                    </tr>`; }).join('');

    reportOutputArea.innerHTML = `
        <div id="range-report-output" class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">تقرير الفترة من ${start} إلى ${end} (${repName === 'all' ? 'جميع المناديب' : repName})</h3>
            <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                <div class="p-2 bg-green-50 rounded"><p class="text-xs text-green-700">إجمالي المبيعات</p><p class="text-lg font-bold text-green-800">${formatCurrency(totalSales)}</p></div>
                <div class="p-2 bg-red-50 rounded"><p class="text-xs text-red-700">إجمالي المرتجعات</p><p class="text-lg font-bold text-red-800">${formatCurrency(totalReturns)}</p></div>
                <div class="p-2 bg-blue-50 rounded"><p class="text-xs text-blue-700">صافي المبيعات</p><p class="text-lg font-bold text-blue-800">${formatCurrency(netSales)}</p></div>
            </div>
            <h4 class="font-semibold mb-2">ملخص يومي</h4>
            ${dailyRows ? `<table class="min-w-full mb-4 text-sm"><thead class="bg-gray-50"><tr><th class="px-2 py-1 text-right">اليوم</th><th class="px-2 py-1 text-center">مبيعات</th><th class="px-2 py-1 text-center">مرتجعات</th><th class="px-2 py-1 text-center">صافي</th></tr></thead><tbody>${dailyRows}</tbody></table>` : '<p class="text-gray-500">لا بيانات في هذه الفترة.</p>'}
            <h4 class="font-semibold mb-2">الفواتير التفصيلية</h4>
            ${rowsHtml ? `<div class="overflow-x-auto border rounded"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-3 py-1">التاريخ</th><th class="px-3 py-1">رقم</th><th class="px-3 py-1">العميل</th><th class="px-3 py-1">المندوب</th><th class="px-3 py-1">الإجمالي</th><th class="px-3 py-1">الحالة</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>` : '<p class="text-gray-500">لا فواتير ضمن النطاق.</p>'}
        </div>
        <div class="mt-4 flex gap-2 no-print">
            <button onclick="printSection('range-report-output')" class="w-1/2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"><i data-lucide='printer'></i> طباعة</button>
            <button onclick="generateReportImage('range-report-output')" class="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><i data-lucide='image'></i> نسخ كصورة</button>
        </div>
    `;
    updateIcons();
}

function generateMonthlyReport() {
    const month = monthlyReportMonthInput.value; // YYYY-MM
    const repName = monthlyReportRepSelect.value;
    const chainId = document.getElementById('monthly-report-chain').value;
    
    if (!month) { customDialog({ message: 'الرجاء اختيار شهر.', title: 'بيانات ناقصة' }); return; }
    
    // Get chain customer IDs if a chain is selected
    let allowedCustomerIds = null;
    if (chainId) {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (chain) allowedCustomerIds = chain.customerIds || [];
    }
    
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr,10); const m = parseInt(monthStr,10) - 1;
    const startDate = new Date(Date.UTC(year, m, 1));
    const endDate = new Date(Date.UTC(year, m+1, 0, 23,59,59));
    const monthSales = state.sales.filter(s => {
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return false; // skip invalid dates
        const matchesDate = d >= startDate && d <= endDate;
        const matchesRep = repName === 'all' || s.repName === repName;
        const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
        return matchesDate && matchesRep && matchesChain;
    });
    let totalSales = 0; let totalReturns = 0;
    const byRep = new Map();
    monthSales.forEach(s => {
        const key = s.repName || 'غير محدد';
        const agg = byRep.get(key) || { sales:0, returns:0 };
        if (s.total < 0) { agg.returns += s.total; totalReturns += s.total; } else { agg.sales += s.total; totalSales += s.total; }
        byRep.set(key, agg);
    });
    const netSales = totalSales + totalReturns;
    const repRows = Array.from(byRep.entries()).map(([rep, agg]) => {
        const net = agg.sales + agg.returns;
        return `<tr class="border-b">\n                    <td class="px-3 py-1">${rep}</td>\n                    <td class="px-3 py-1 text-center text-green-700 font-semibold">${formatCurrency(agg.sales)}</td>\n                    <td class="px-3 py-1 text-center text-red-700 font-semibold">${formatCurrency(agg.returns)}</td>\n                    <td class="px-3 py-1 text-center text-blue-700 font-semibold">${formatCurrency(net)}</td>\n                </tr>`; }).join('');
    // أفضل 5 عملاء حسب صافي الإجمالي
    const customerAgg = new Map();
    monthSales.forEach(s => {
        const cid = s.customerId || 'unknown';
        const ag = customerAgg.get(cid) || { net:0 };
        ag.net += s.total; customerAgg.set(cid, ag);
    });
    const chainName = chainId ? document.querySelector('#monthly-report-chain option[value="' + chainId + '"]').textContent : '';
    const topCustomers = Array.from(customerAgg.entries()).sort((a,b)=> b[1].net - a[1].net).slice(0,5)
        .map(([cid, ag]) => `<tr class="border-b"><td class="px-2 py-1">${findCustomer(cid)?.name || 'غير معروف'}</td><td class="px-2 py-1 text-center font-semibold">${formatCurrency(ag.net)}</td></tr>`).join('');

    reportOutputArea.innerHTML = `
        <div id="monthly-report-output" class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">التقرير الشهري ${month} (${repName === 'all' ? 'جميع المناديب' : repName})</h3>
            <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                <div class="p-2 bg-green-50 rounded"><p class="text-xs text-green-700">إجمالي المبيعات</p><p class="text-lg font-bold text-green-800">${formatCurrency(totalSales)}</p></div>
                <div class="p-2 bg-red-50 rounded"><p class="text-xs text-red-700">إجمالي المرتجعات</p><p class="text-lg font-bold text-red-800">${formatCurrency(totalReturns)}</p></div>
                <div class="p-2 bg-blue-50 rounded"><p class="text-xs text-blue-700">صافي المبيعات</p><p class="text-lg font-bold text-blue-800">${formatCurrency(netSales)}</p></div>
            </div>
            <h4 class="font-semibold mb-2">ملخص حسب المندوب</h4>
            ${repRows ? `<table class="min-w-full text-sm mb-4"><thead class="bg-gray-50"><tr><th class="px-3 py-1 text-right">المندوب</th><th class="px-3 py-1 text-center">مبيعات</th><th class="px-3 py-1 text-center">مرتجعات</th><th class="px-3 py-1 text-center">صافي</th></tr></thead><tbody>${repRows}</tbody></table>` : '<p class="text-gray-500">لا بيانات.</p>'}
            <h4 class="font-semibold mb-2">أفضل العملاء (صافي)</h4>
            ${topCustomers ? `<table class="text-sm mb-4"><thead class="bg-gray-50"><tr><th class="px-2 py-1 text-right">العميل</th><th class="px-2 py-1 text-center">الصافي</th></tr></thead><tbody>${topCustomers}</tbody></table>` : '<p class="text-gray-500">لا عملاء.</p>'}
        </div>
        <div class="mt-4 flex gap-2 no-print">
            <button onclick="printSection('monthly-report-output')" class="w-1/2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"><i data-lucide='printer'></i> طباعة</button>
            <button onclick="generateReportImage('monthly-report-output')" class="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><i data-lucide='image'></i> نسخ كصورة</button>
        </div>
    `;
    updateIcons();
}

// ===== Targets Report =====
function generateTargetsReport(){
    const monthVal = (document.getElementById('targets-month')?.value)||'';
    const chainId = (document.getElementById('targets-chain-filter')?.value)||'';
    
    if (!monthVal){ customDialog({title:'بيانات ناقصة', message:'اختر شهر التارجت.'}); return; }
    
    // Get chain customer IDs if a chain is selected
    let allowedCustomerIds = null;
    if (chainId) {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (chain) allowedCustomerIds = chain.customerIds || [];
    }
    
    const [yearStr, monthStr] = monthVal.split('-');
    const year = parseInt(yearStr,10); const m = parseInt(monthStr,10)-1;
    const monthStart = new Date(Date.UTC(year,m,1));
    // Last moment of the month: first day of next month minus 1ms
    const monthEnd = new Date(Date.UTC(year,m+1,1) - 1);
    const today = new Date();
    const daysInMonth = new Date(year,m+1,0).getDate();
    const todayDay = (today.getMonth()===m && today.getFullYear()===year) ? today.getDate() : daysInMonth; // إذا شهر سابق اعتبره مكتمل

    // Build reps list and populate filter options
    const repsAll = (state.reps||[]).map(r => ({ id:r.id, name:r.name||r.id, target:Number(r.target||0) }));
    const repFilterEl = document.getElementById('targets-rep-filter');
    if (repFilterEl){
        const selVal = repFilterEl.value || 'all';
        // Rebuild options if counts differ or first time
        if (repFilterEl.dataset.filled !== '1' || repFilterEl.options.length-1 !== repsAll.length){
            const current = selVal;
            repFilterEl.innerHTML = '<option value="all">عرض كل المناديب</option>' + repsAll.map(r=>`<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join('');
            repFilterEl.dataset.filled = '1';
            // try keep previous selection
            if ([...repFilterEl.options].some(o=>o.value===current)) repFilterEl.value = current;
        }
    }
    const selectedRepName = (repFilterEl && repFilterEl.value && repFilterEl.value!=='all') ? repFilterEl.value : null;
    const reps = selectedRepName ? repsAll.filter(r=>r.name===selectedRepName) : repsAll;
    if (reps.length === 0){ reportOutputArea.innerHTML = '<p class="text-center text-gray-500">لا توجد مناديب مسجلة.</p>'; return; }

    const dayAgg = new Map();
    (state.sales||[]).forEach(s => {
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return; // skip invalid dates
        if (d < monthStart || d > monthEnd) return;
        const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
        if (!matchesChain) return;
        const dayKey = d.toISOString().split('T')[0];
        const repName = s.repName || 'غير محدد';
        const net = s.total;
        const mapForDay = dayAgg.get(dayKey) || new Map();
        mapForDay.set(repName, (mapForDay.get(repName)||0) + net);
        dayAgg.set(dayKey, mapForDay);
    });
    // Soft column colors per rep
    const colBgs = ['#f0f9ff','#eef2ff','#f5f3ff','#fdf2f8','#fff7ed','#fefce8','#ecfccb','#f0fdf4','#fafaf9','#e0f2fe'];
    const colBgsStrong = ['#e0f2fe','#e0e7ff','#ede9fe','#fde2f3','#ffedd5','#fef3c7','#d9f99d','#dcfce7','#e7e5e4','#bae6fd'];
    const rows = [];
    const cumulativeByRep = {}; reps.forEach(r => cumulativeByRep[r.name]=0);
    for (let day=1; day<=daysInMonth; day++){
        const isoDay = `${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const mapForDay = dayAgg.get(isoDay) || new Map();
        let totalDay = 0;
        const cells = reps.map((r, idx) => {
            const val = mapForDay.get(r.name)||0;
            cumulativeByRep[r.name] += val;
            totalDay += val;
            const base = colBgs[idx % colBgs.length];
            const strong = colBgsStrong[idx % colBgsStrong.length];
            const bg = val ? strong : base;
            return `<td style='background:${bg};color:#0b1b34;font-size:12px;font-weight:${val? '600':'400'}'>${val? formatCurrency(val):'0.00'}</td>`;
        }).join('');
        // اليوم أول عمود، والإجمالي آخر عمود
        rows.push(`<tr>
            <td class='targets-col-day'>${String(day).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${year}</td>${cells}<td class='targets-col-total'>${totalDay? formatCurrency(totalDay):'0.00'}</td>
        </tr>`);
    }
    const achievedRowCells = reps.map((r,idx) => `<td style='background:${colBgsStrong[idx%colBgsStrong.length]};color:#065f46;font-weight:700'>${formatCurrency(cumulativeByRep[r.name])}</td>`).join('');
    const targetRowCells = reps.map((r,idx) => `<td style='background:${colBgs[idx%colBgs.length]};color:#111827;font-weight:700'>${formatCurrency(r.target)}</td>`).join('');
    const remainingRowCells = reps.map(r => {
        const rem = r.target - cumulativeByRep[r.name];
        return `<td style='background:${rem>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(rem)}</td>`;
    }).join('');
    const expectedPct = todayDay / daysInMonth;
    const expectedRowCells = reps.map((r,idx) => `<td style='background:${idx%2===0?'#e0e7ff':'#e0f2fe'};color:#0b1b34;font-weight:700'>${(expectedPct*100).toFixed(1)}%</td>`).join('');
    const achievedPctCells = reps.map(r => {
        const pct = r.target? (cumulativeByRep[r.name]/r.target):0;
        const good = pct >= expectedPct;
        return `<td style='background:${good?'#bbf7d0':'#fecaca'};color:#065f46;font-weight:700'>${(pct*100).toFixed(1)}%</td>`;
    }).join('');

    const totalAchieved = Object.values(cumulativeByRep).reduce((a,b)=>a+b,0);
    const totalTargets = reps.reduce((a,r)=>a+r.target,0);
    const totalRemaining = totalTargets - totalAchieved;

    const tableHtml = `
    <div id='targets-report-output' style='direction:rtl;font-family:Cairo;'>
        <table class='targets-table'>
            <thead>
                <tr style='color:#fff;'>
                    <th style='background:#3b82f6;font-weight:bold'>اليوم</th>
                    ${reps.map((r,idx)=>`<th style='background:#2563eb;font-weight:bold'>${r.name}</th>`).join('')}
                    <th style='background:#ef4444;font-weight:bold'>إجمالي اليوم</th>
                </tr>
            </thead>
            <tbody>${rows.join('')}</tbody>
            <tfoot>
                <tr><td style='background:#e0f2fe;color:#065f46;font-weight:700'>${(expectedPct*100).toFixed(1)}%</td>${expectedRowCells}<td style='background:#e0f2fe;color:#065f46;font-weight:700'>نسبة مستهدفة حتى اليوم</td></tr>
                <tr><td style='background:#bbf7d0;color:#065f46;font-weight:700'>${totalTargets? ((totalAchieved/totalTargets)*100).toFixed(1):'0.0'}%</td>${achievedPctCells}<td style='background:#bbf7d0;color:#065f46;font-weight:700'>نسبة المحقق</td></tr>
                <tr><td style='background:#fef3c7;color:#111827;font-weight:700'>${formatCurrency(totalTargets)}</td>${targetRowCells}<td style='background:#fef3c7;color:#111827;font-weight:700'>التارجت</td></tr>
                <tr><td style='background:${totalRemaining>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(totalRemaining)}</td>${remainingRowCells}<td style='background:${totalRemaining>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>المتبقي</td></tr>
                <tr><td style='background:#bfdbfe;color:#0b1b34;font-weight:700'>${formatCurrency(totalAchieved)}</td>${achievedRowCells}<td style='background:#bfdbfe;color:#0b1b34;font-weight:700'>الإجمالي المحقق</td></tr>
            </tfoot>
        </table>
        <div style='display:flex;gap:12px;margin-top:12px;' class='no-print'>
            <button onclick="printSection('targets-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
            <button onclick="generateReportImage('targets-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> صورة</button>
        </div>
    </div>`;
    reportOutputArea.innerHTML = tableHtml;
    updateIcons();
}

// ===== Customer Targets Report (اكسبشن / سفير / الضحى) =====
function getCustomerTargetsStore(){
    state.customerTargets = state.customerTargets || {}; // month -> { customerId: { multi: number, dairy: number } }
    return state.customerTargets;
}
function getCustomerTargetsForMonth(month){
    const store = getCustomerTargetsStore();
    if (!store[month]) store[month] = {};
    return store[month];
}
function saveCustomerTargetsFromInputs(){
    const monthVal = document.getElementById('customer-targets-month')?.value;
    if (!monthVal){ customDialog({title:'تنبيه', message:'اختر الشهر أولاً.'}); return; }
    const monthKey = monthVal;
    const targetObj = getCustomerTargetsForMonth(monthKey);
    const inputs = document.querySelectorAll('#customer-targets-report-output .cust-target-input');
    inputs.forEach(inp => {
        const cid = inp.dataset.customerId; const cat = inp.dataset.category; const val = parseFloat(inp.value)||0;
        targetObj[cid] = targetObj[cid] || { multi:0, dairy:0 };
        targetObj[cid][cat] = val;
    });
    saveState();
    customDialog({title:'حفظ', message:'تم حفظ قيم التارجت.'});
    generateCustomerTargetsReport();
}
function generateCustomerTargetsReport(){
    const monthVal = document.getElementById('customer-targets-month')?.value || '';
    const catVal = document.getElementById('customer-targets-category')?.value || 'both';
    const out = document.getElementById('customer-targets-report-output');
    if (!out) return;
    if (!monthVal){ out.innerHTML = '<p class="text-center text-gray-500">اختر شهر.</p>'; return; }
    const [yStr, mStr] = monthVal.split('-'); const year = parseInt(yStr,10); const m = parseInt(mStr,10)-1;
    const monthStart = new Date(Date.UTC(year,m,1)); const monthEnd = new Date(Date.UTC(year,m+1,1) - 1);
    // العملاء المطلوبون بالأسماء المطلوبة
    const nameKeys = ['اكسبشن','سفير','الضحى'];
    // استبعاد أي اسم يحتوي "اكسبشن" و"حلواني/حلوانى" معاً من القائمة (اكسبشن حلواني)
    const customers = (state.customers||[]).filter(c => {
        const nm = (c.name||'');
        const include = nameKeys.some(k => nm.includes(k));
        const isExcluded = /اكسبشن/.test(nm) && /(حلواني|حلوانى)/.test(nm);
        return include && !isExcluded;
    });
    if (customers.length === 0){ out.innerHTML = '<p class="text-center text-gray-500">لا توجد عملاء مستهدفة.</p>'; return; }
    const targetsMonthObj = getCustomerTargetsForMonth(monthVal);
    // تجميع المبيعات مع استبعاد منتجات "شيلي" من اكسبشن
    const agg = {}; // cid -> { multiAch: number, dairyAch: number }
    (state.sales||[]).forEach(sale => {
        const d = new Date(sale.date);
        if (isNaN(d.getTime())) return; // skip invalid dates
        if (d < monthStart || d > monthEnd) return;
        const cid = sale.customerId;
        const cust = customers.find(c => c.id === cid || c._id === cid);
        if (!cust) return;
        sale.items.forEach(item => {
            const p = findProduct(item.productId); if (!p) return;
            // استبعاد شيلي لعملاء اكسبشن
            const nameLower = (cust.name||'').toLowerCase();
            const prodLower = (p.name||'').toLowerCase();
            if (nameLower.includes('اكسبشن') && prodLower.includes('شيلي')) return;
            const qty = Number(item.quantity||item.qty||0);
            const price = Number(p.price||0);
            const value = qty * price;
            const cat = String(p.category||'').toLowerCase();
            const isMulti = cat.includes('مالت') || cat.includes('multi');
            const isDairy = cat.includes('بان') || cat.includes('جبن') || cat.includes('cheese') || cat.includes('dairy');
            agg[cid] = agg[cid] || { multiAch:0, dairyAch:0 };
            if (isMulti) agg[cid].multiAch += value; else if (isDairy) agg[cid].dairyAch += value;
        });
    });
    function fmt(v){ return formatCurrency(v||0); }
    const rows = customers.map(c => {
        const cid = c.id || c._id; const a = agg[cid] || { multiAch:0, dairyAch:0 };
        const targetData = targetsMonthObj[cid] || {}; // قد تكون فارغة (أشباح أصفار)
        const hasMultiSaved = Object.prototype.hasOwnProperty.call(targetData,'multi');
        const hasDairySaved = Object.prototype.hasOwnProperty.call(targetData,'dairy');
        const multiTarget = hasMultiSaved ? Number(targetData.multi||0) : 0;
        const dairyTarget = hasDairySaved ? Number(targetData.dairy||0) : 0;
        const multiRem = multiTarget - a.multiAch; const dairyRem = dairyTarget - a.dairyAch;
        const multiPct = multiTarget? (a.multiAch/multiTarget)*100:0; const dairyPct = dairyTarget? (a.dairyAch/dairyTarget)*100:0;
        // إدخال بقيمة فارغة مع placeholder صفر إذا لم يُحفظ بعد (شبح صفر)
        const multiInputVal = hasMultiSaved ? multiTarget : '';
        const dairyInputVal = hasDairySaved ? dairyTarget : '';
        const multiInput = `<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='multi' data-customer-id='${cid}' value='${multiInputVal}' placeholder='0'/>`;
        const dairyInput = `<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='dairy' data-customer-id='${cid}' value='${dairyInputVal}' placeholder='0'/>`;
        if (catVal === 'multi'){
            return `<tr>
                <td class='name'>${escapeHtml(c.name)}</td>
                <td>${multiInput}</td>
                <td class='ach-cell'>${fmt(a.multiAch)}</td>
                <td class='${multiRem>0?'rem-pos':'rem-zero'}'>${fmt(multiRem)}</td>
                <td class='${multiPct>=50?'pct-ok':'pct-low'}'>${multiPct.toFixed(1)}%</td>
            </tr>`;
        } else if (catVal === 'dairy'){
            return `<tr>
                <td class='name'>${escapeHtml(c.name)}</td>
                <td>${dairyInput}</td>
                <td class='ach-cell'>${fmt(a.dairyAch)}</td>
                <td class='${dairyRem>0?'rem-pos':'rem-zero'}'>${fmt(dairyRem)}</td>
                <td class='${dairyPct>=50?'pct-ok':'pct-low'}'>${dairyPct.toFixed(1)}%</td>
            </tr>`;
        } else { // both
            const totalTarget = multiTarget + dairyTarget;
            const totalAch = a.multiAch + a.dairyAch;
            const totalRem = totalTarget - totalAch;
            const totalPct = totalTarget? (totalAch/totalTarget)*100:0;
            return `<tr>
                <td class='name'>${escapeHtml(c.name)}</td>
                <td>${multiInput}</td>
                <td class='ach-cell'>${fmt(a.multiAch)}</td>
                <td>${dairyInput}</td>
                <td class='ach-cell'>${fmt(a.dairyAch)}</td>
                <td class='ach-cell'>${fmt(totalTarget)}</td>
                <td class='ach-cell'>${fmt(totalAch)}</td>
                <td class='${totalRem>0?'rem-pos':'rem-zero'}'>${fmt(totalRem)}</td>
                <td class='${totalPct>=50?'pct-ok':'pct-low'}'>${totalPct.toFixed(1)}%</td>
            </tr>`;
        }
    }).join('');
    let thead;
    if (catVal === 'multi'){
        thead = `<tr>
            <th class='cth-name'>العميل</th>
            <th class='cth-multi-target'>تارجت مالتي</th>
            <th class='cth-multi-ach'>محقق مالتي</th>
            <th class='cth-rem'>متبقي</th>
            <th class='cth-pct'>% محقق</th>
        </tr>`;
    } else if (catVal === 'dairy'){
        thead = `<tr>
            <th class='cth-name'>العميل</th>
            <th class='cth-dairy-target'>تارجت البان</th>
            <th class='cth-dairy-ach'>محقق البان</th>
            <th class='cth-rem'>متبقي</th>
            <th class='cth-pct'>% محقق</th>
        </tr>`;
    } else {
        thead = `<tr>
            <th class='cth-name'>العميل</th>
            <th class='cth-multi-target'>تارجت مالتي</th>
            <th class='cth-multi-ach'>محقق مالتي</th>
            <th class='cth-dairy-target'>تارجت البان</th>
            <th class='cth-dairy-ach'>محقق البان</th>
            <th class='cth-total-target'>إجمالي التارجت</th>
            <th class='cth-total-ach'>إجمالي المحقق</th>
            <th class='cth-rem-total'>المتبقي الإجمالي</th>
            <th class='cth-pct-total'>% إجمالي</th>
        </tr>`;
    }
    out.innerHTML = `<div id='customer-targets-report-wrapper' class='bg-white p-3 rounded-lg shadow'>
        <table class='customer-targets-table'>
            <thead>${thead}</thead>
            <tbody>${rows}</tbody>
        </table>
        <div class='flex gap-2 mt-3 no-print'>
            <button onclick="printSection('customer-targets-report-wrapper')" class='bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-sm flex items-center gap-1'><i data-lucide='printer'></i> طباعة</button>
            <button onclick="generateReportImage('customer-targets-report-wrapper')" class='bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm flex items-center gap-1'><i data-lucide='image'></i> صورة</button>
        </div>
    </div>`;
    updateIcons();
}

        // Settlement (تسوية) report: aggregates dispatch note vs actual sales & returns per product for a rep/date
        function generateSettlementReport(){
            // استخدم حقول التسوية إن وُجدت، وإلا fallback إلى اليومية
            const dateInput = document.getElementById('settlement-report-date');
            const repSelect = document.getElementById('settlement-report-rep');
            const date = (dateInput && dateInput.value) ? dateInput.value : (dailyReportDateInput ? dailyReportDateInput.value : '');
            const repName = (repSelect && repSelect.value) ? repSelect.value : (dailyReportRepSelect ? dailyReportRepSelect.value : '');
            if (!date) { customDialog({ message:'اختر تاريخاً للتسوية.', title:'بيانات ناقصة' }); return; }
            if (!repName || repName === 'all') { customDialog({ message:'اختر مندوب واحد للتسوية.', title:'تنبيه' }); return; }

                // Find dispatch note for that rep/day
                const dispatchNote = state.dispatchNotes.find(n => n.repName === repName && new Date(n.date).toISOString().split('T')[0] === date);
                // Build product baseline from products list to keep ordering stable
                const productIds = state.products.map(p => p.id);
                const salesForDay = state.sales.filter(s => s.repName === repName && new Date(s.date).toISOString().split('T')[0] === date);

                // Aggregations
                const agg = {}; // productId -> metrics
                function ensure(id){ if(!agg[id]) agg[id] = { productId:id, name: (findProduct(id)?.name)||id, dispatched:0, goodReturn:0, damagedReturn:0, freebie:0, sold:0, invoiceReturn:0 }; }
                // From dispatch note items
                if (dispatchNote && Array.isArray(dispatchNote.items)) {
                    dispatchNote.items.forEach(it=>{
                        ensure(it.productId);
                        agg[it.productId].dispatched += Number(it.quantity||0);
                        // دعم النموذج الجديد: actualReturn يعامل كمرتجع سليم
                        agg[it.productId].goodReturn += Number(it.actualReturn||it.goodReturn||0);
                        agg[it.productId].damagedReturn += Number(it.damagedReturn||0);
                        agg[it.productId].freebie += Number(it.freebie||0);
                    });
                }
                // From sales (positive quantities)
                salesForDay.forEach(sale => {
                        sale.items.forEach(item => {
                                ensure(item.productId);
                                const q = Number(item.quantity||item.qty||0);
                                if (sale.total < 0 || q < 0) { agg[item.productId].invoiceReturn += Math.abs(q); }
                                else { agg[item.productId].sold += q; }
                        });
                });
                // Include any product ids missing but present in sales/dispatch
                Object.keys(agg).forEach(id=>{ if(!productIds.includes(id)) productIds.push(id); });
                // Rows
                const rowsHtml = productIds.map(pid => {
                        ensure(pid);
                        const m = agg[pid];
                        // Diff = dispatched - (sold + freebie + returns good + returns damaged)
                        const used = m.sold + m.freebie + m.goodReturn + m.damagedReturn + m.invoiceReturn;
                        const diff = m.dispatched - used;
                        return `<tr style="background:#0b2d5e;color:#fff;font-size:12px;">
                                <td style='text-align:center;background:#1f3f79'>${formatCurrency(0)}</td>
                                <td style='text-align:center;background:#111'>${diff}</td>
                                <td style='text-align:center;background:#062c5c'>${m.dispatched}</td>
                                <td style='text-align:center;background:#094b2e'>${m.goodReturn}</td>
                                <td style='text-align:center;background:#062c5c'>${m.invoiceReturn}</td>
                                <td style='text-align:center;background:#051c44'>${m.sold}</td>
                                <td style='text-align:center;background:#062c5c'>${m.damagedReturn}</td>
                                <td style='text-align:center;background:#094b2e'>${m.freebie}</td>
                                <td style='text-align:center;background:#051c44'>${m.dispatched - m.goodReturn - m.damagedReturn}</td>
                                <td style='text-align:center;background:#041635'>${m.name}</td>
                        </tr>`;
                }).join('');

                const billNumber = salesForDay.length ? (salesForDay[0].invoiceNumber||'') : (dispatchNote?.serial||'');
                const dayNum = date.split('-')[2];
                const yearNum = date.split('-')[0];
                const monthNum = date.split('-')[1];

                reportOutputArea.innerHTML = `
                        <div id='settlement-report-output' style='direction:rtl;font-family:Cairo;'>
                            <table style='width:100%;border:4px solid #001a3d;font-size:12px;border-collapse:separate;'>
                                <thead>
                                    <tr style='background:#0b2d5e;color:#fff;'>
                                        <th style='width:60px;background:#331b6d'>قيمة</th>
                                        <th style='background:#0b0b0b'>العجز / الفائض</th>
                                        <th style='background:#041a3f'>الفرق بين اذن السيارة وبيع الفواتير</th>
                                        <th style='background:#094b2e'>هالك واكراميات</th>
                                        <th style='background:#041a3f'>صافي فواتير للمندوب</th>
                                        <th style='background:#051c44'>مرتجع فواتير للمندوب</th>
                                        <th style='background:#041a3f'>صافي بيع الفواتير</th>
                                        <th style='background:#051c44'>مرتجع اذن السيارة</th>
                                        <th style='background:#094b2e'>اذن خروج السيارة</th>
                                        <th style='background:#0b0b0b'>اسم الصنف</th>
                                    </tr>
                                    <tr style='background:#062c5c;color:#fff;'>
                                        <th style='background:#331b6d'>0.00</th>
                                        <th style='background:#111'>${yearNum}</th>
                                        <th style='background:#062c5c'>${monthNum}</th>
                                        <th style='background:#fff;color:#000;font-weight:bold'><img src='' alt='' style='height:20px'></th>
                                        <th style='background:#d49c3b;color:#000;font-weight:bold'>${date.split('-').reverse().join('/')}</th>
                                        <th style='background:#1f3f79'>${repName}</th>
                                        <th style='background:#8d0000;color:#fff'>${billNumber||''}</th>
                                        <th style='background:#b46900;color:#fff'>${dayNum}</th>
                                        <th style='background:#041a3f'>${repName}</th>
                                        <th style='background:#041635'>اسم الصنف</th>
                                    </tr>
                                </thead>
                                <tbody>${rowsHtml}</tbody>
                            </table>
                            <div style='display:flex;gap:16px;margin-top:12px;'>
                                <div style='background:#331b6d;color:#fff;padding:8px 24px;font-weight:bold;'>Total</div>
                                <div style='background:#271056;color:#fff;padding:8px 24px;font-weight:bold;'>0.0</div>
                                <div style='flex:1;background:linear-gradient(90deg,#008a00,#006400);color:#fff;text-align:center;font-weight:bold;padding:12px 8px;border:2px solid #004c00;'>لا توجد عجوزات وزيادات</div>
                            </div>
                            <div class='mt-4 grid grid-cols-3 gap-2 no-print'>
                                <button onclick="printSection('settlement-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
                                <button onclick="generateReportImage('settlement-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> نسخ كصورة</button>
                                <button onclick="shareSettlementWhatsApp('settlement-report-output')" class='bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2'><i data-lucide='send'></i> مشاركة واتساب</button>
                            </div>
                        </div>`;
                updateIcons();
        }

async function generateReconciliationReport() {
    const date = document.getElementById('recon-report-date').value;
    const repName = document.getElementById('recon-report-rep').value;
    const chainId = document.getElementById('recon-report-chain').value;
    const reportOutputArea = document.getElementById('report-output-area');

    if (!date || !repName) {
        await customDialog({ message: 'الرجاء تحديد التاريخ والمندوب.', title: 'بيانات ناقصة' });
        return;
    }
    
    // Get chain customer IDs if a chain is selected
    let allowedCustomerIds = null;
    if (chainId) {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (chain) allowedCustomerIds = chain.customerIds || [];
    }

    // 1. Find the dispatch note
    const dispatchNote = state.dispatchNotes.find(n => {
        const d = new Date(n.date);
        if (isNaN(d.getTime())) return false;
        return n.repName === repName && d.toISOString().split('T')[0] === date;
    });

    if (!dispatchNote) {
        reportOutputArea.innerHTML = '<p class="text-center text-red-500 p-4">لم يتم العثور على إذن استلام لهذا المندوب في التاريخ المحدد.</p>';
        return;
    }

    // 2. Find all sales for the rep on that day (apply chain filter)
    const sales = state.sales.filter(s => {
        const d = new Date(s.date);
        if (isNaN(d.getTime())) return false; // skip invalid dates
        return s.repName === repName && d.toISOString().split('T')[0] === date && 
            (!allowedCustomerIds || allowedCustomerIds.includes(s.customerId));
    });

    // 3. Aggregate sales by product ID
    const salesByProduct = {};
    sales.forEach(sale => {
        sale.items.forEach(item => {
            salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity;
        });
    });

    // 4. Create a master list of all products involved
    const allProductIds = new Set([
        ...dispatchNote.items.map(i => i.productId),
        ...Object.keys(salesByProduct)
    ]);

    // 5. Generate report rows
    let reportRowsHtml = '';
    let totalDeficitValue = 0;
    let totalSurplusValue = 0;

    allProductIds.forEach(productId => {
        const product = findProduct(productId);
        if (!product) return;

        const dispatchItem = dispatchNote.items.find(i => i.productId === productId) || {};
        const takenOut = dispatchItem.quantity || 0;
        const goodReturn = dispatchItem.goodReturn || 0;
        const damagedReturn = dispatchItem.damagedReturn || 0;
        const freebie = dispatchItem.freebie || 0;
        
        const sold = salesByProduct[productId] || 0;

        const expectedReturn = takenOut - sold - freebie;
        const actualReturn = goodReturn + damagedReturn;
        const difference = actualReturn - expectedReturn;

        const differenceValue = difference * (product.price || 0);
        let diffClass = 'text-gray-700';
        if (difference < 0) {
            diffClass = 'text-red-600 font-bold';
            totalDeficitValue += differenceValue; // differenceValue will be negative
        } else if (difference > 0) {
            diffClass = 'text-green-600 font-bold';
            totalSurplusValue += differenceValue;
        }

        // إعادة ترتيب الأعمدة: الصنف أولاً ثم المستلم (المخرج) .. إلخ + تلوين الخلايا
        reportRowsHtml += `
            <tr style="border-bottom:1px solid #112b57;">
                <td style="background:#041635;color:#fff;padding:6px 4px;text-align:right;font-weight:600">${escapeHtml(product.name)}</td>
                <td style="background:#d49c3b;color:#000;padding:6px 4px;text-align:center;font-weight:600">${takenOut}</td>
                <td style="background:#0b0b0b;color:#fff;padding:6px 4px;text-align:center">${sold}</td>
                <td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center">${freebie}</td>
                <td style="background:#041a3f;color:#fff;padding:6px 4px;text-align:center;font-weight:600">${expectedReturn}</td>
                <td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center">${goodReturn}</td>
                <td style="background:#041a3f;color:#fff;padding:6px 4px;text-align:center">${damagedReturn}</td>
                <td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center;font-weight:600">${actualReturn}</td>
                <td style="background:#041a3f;color:${difference<0?'#ff2e2e':(difference>0?'#25d366':'#fff')};padding:6px 4px;text-align:center;font-weight:${difference!==0?'700':'400'}">${difference}</td>
                <td style="background:#062c5c;color:${differenceValue<0?'#ff2e2e':(differenceValue>0?'#25d366':'#fff')};padding:6px 4px;text-align:center;font-weight:${differenceValue!==0?'700':'400'}">${formatCurrency(differenceValue)}</td>
            </tr>`;
    });

    // 6. Build final report HTML
    const finalHtml = `
        <div id='recon-report-output' style='direction:rtl;font-family:Cairo;'>
            <div style='display:grid;grid-template-columns:120px 1fr 120px;align-items:center;margin-bottom:4px;'>
                <div style='background:#3b0d00;color:#fff;padding:12px 8px;text-align:center;font-weight:bold;font-size:20px;border:2px solid #210600;'>${date.split('-')[2]}</div>
                <div style='background:linear-gradient(90deg,#002aa8,#004dff);color:#fff;text-align:center;padding:12px 8px;font-size:24px;font-weight:bold;border:2px solid #001a3d;'>بيان بعجوزات وزيادات الموزعين</div>
                <div style='background:#041a3f;color:#fff;padding:12px 8px;text-align:center;font-weight:bold;font-size:20px;border:2px solid #001a3d;'>${repName}</div>
            </div>
            <table style='width:100%;border:4px solid #001a3d;font-size:13px;border-collapse:separate;'>
                <thead>
                    <tr style='color:#fff;'>
                        <th style='background:#041635;text-align:center;font-weight:bold'>الصنف</th>
                        <th style='background:#d49c3b;color:#000;font-weight:bold;width:70px;text-align:center'>المستلم</th>
                        <th style='background:#0b0b0b;text-align:center;font-weight:bold'>المباع</th>
                        <th style='background:#062c5c;text-align:center;font-weight:bold'>المجاني</th>
                        <th style='background:#041a3f;text-align:center;font-weight:bold'>المرتجع المتوقع</th>
                        <th style='background:#062c5c;text-align:center;font-weight:bold'>مرتجع سليم</th>
                        <th style='background:#041a3f;text-align:center;font-weight:bold'>مرتجع تالف</th>
                        <th style='background:#062c5c;text-align:center;font-weight:bold'>المرتجع الفعلي</th>
                        <th style='background:#041a3f;text-align:center;font-weight:bold'>الفرق كمية</th>
                        <th style='background:#062c5c;text-align:center;font-weight:bold'>الفرق قيمة</th>
                    </tr>
                </thead>
                <tbody>${reportRowsHtml}</tbody>
            </table>
            <div style='display:flex;gap:16px;margin-top:12px;'>
                <div style='background:#3b0d00;color:#fff;padding:8px 24px;font-weight:bold;'>إجمالي عجز</div>
                <div style='background:#5c1a00;color:#fff;padding:8px 24px;font-weight:bold;'>${formatCurrency(totalDeficitValue)}</div>
                <div style='background:#d49c3b;color:#000;padding:8px 24px;font-weight:bold;'>إجمالي زيادة</div>
                <div style='background:#094b2e;color:#fff;padding:8px 24px;font-weight:bold;'>${formatCurrency(totalSurplusValue)}</div>
                <div style='flex:1;background:linear-gradient(90deg,#007a00,#00b300);color:#fff;text-align:center;font-weight:bold;padding:12px 8px;border:2px solid #004c00;'>${(totalDeficitValue===0 && totalSurplusValue===0)?'لا توجد عجوزات وزيادات':'مراجعة القيم أعلاه'}</div>
            </div>
            <div class='mt-4 grid grid-cols-3 gap-2 no-print'>
                <button onclick="printSection('recon-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
                <button onclick="generateReportImage('recon-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> صورة HD</button>
                <button onclick="shareReconciliationWhatsApp('recon-report-output')" class='bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2'><i data-lucide='send'></i> مشاركة واتساب</button>
            </div>
        </div>`;

    reportOutputArea.innerHTML = finalHtml;
}

// مشاركة تقرير التسوية النهائية عبر واتساب
async function shareReconciliationWhatsApp(elementId){
    const el = document.getElementById(elementId);
    const date = document.getElementById('recon-report-date')?.value || '';
    const rep = document.getElementById('recon-report-rep')?.value || '';
    if (!el){ await customDialog({title:'خطأ', message:'تعذر العثور على التقرير.'}); return; }
    try {
        showLoading('جارٍ تجهيز مشاركة واتساب...');
        // تكبير الصورة لسهولة القراءة داخل واتساب ويب
        el.classList.add('recon-export-scale');
        const canvas = await captureElementCanvas(el, 4);
        el.classList.remove('recon-export-scale');
        const blob = await new Promise(r => canvas.toBlob(r,'image/png'));
        if (!blob) throw new Error('فشل إنشاء الصورة');
        const url = await uploadImageBlobToStorage(blob, 'shares/final_settlements');
        hideLoading(); // أخفِ التحميل قبل فتح النافذة لتجنب المنع
        const msg = `التسوية النهائية للمندوب ${rep} - ${date}\n${url}`;
        const desktopUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        let popup = window.open(desktopUrl, '_blank');
        // fallback للهواتف أو منع النوافذ المنبثقة
        setTimeout(() => {
            try {
                if (!popup || popup.closed) {
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }
            } catch(_) {
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }, 1800);
    } catch(e){
        console.warn('shareReconciliationWhatsApp failed', e);
        hideLoading();
        // بناء مشاركة بديلة في حال فشل الرفع (غالباً origin null أو قواعد التخزين)
        try {
            const el2 = document.getElementById(elementId);
            if (el2){
                el2.classList.add('recon-export-scale');
                const cnv = await captureElementCanvas(el2, 2);
                el2.classList.remove('recon-export-scale');
                const dataUrl = cnv.toDataURL('image/png');
                // فتح الصورة في نافذة جديدة للحفظ اليدوي
                const w = window.open('about:blank','_blank');
                if (w) {
                    w.document.write('<title>صورة التسوية النهائية</title><p style="font-family:sans-serif">احفظ الصورة ثم أرفقها في واتساب.</p><img style="max-width:100%;" src="'+dataUrl+'" />');
                }
                // نسخ رسالة نصية بدون رابط (رفع فشل)
                const altMsg = `التسوية النهائية للمندوب ${rep} - ${date} (مرفق صورة يدوياً)`;
                try { navigator.clipboard.writeText(altMsg); } catch(_){}
                await customDialog({title:'مشاركة بديلة', message:'تم تجهيز الصورة. تم فتح نافذة للحفظ، والرسالة نُسخت (إن سمح المتصفح). لتعمل المشاركة التلقائية: شغل الصفحة عبر http:// (خادم محلي) وراجع قواعد Storage.'});
                return; // خروج بعد مشاركة بديلة
            }
        } catch(_) { /* ignore secondary failure */ }
        await customDialog({title:'خطأ', message:'تعذر مشاركة أو تجهيز مشاركة بديلة للصورة.'});
    }
}

// --- END NEW REPORTING FUNCTIONS ---


function openCustomerModal(id = null) {
    customerForm.reset();
    document.getElementById('customer-id').value = '';
    populatePriceListDropdown(document.getElementById('customer-price-list'));
    populateRepDropdown(document.getElementById('customer-rep'));

    if (id) {
        // Edit mode
        const sid = String(id);
        const customer = state.customers.find(c => String(c.id) === sid || String(c._id) === sid);
        if (customer) {
            document.getElementById('customer-modal-title').textContent = 'تعديل بيانات العميل';
            document.getElementById('customer-id').value = customer.id || customer._id || '';
            document.getElementById('customer-name').value = customer.name;
            document.getElementById('customer-tax-number').value = customer.taxNumber || '';
            document.getElementById('customer-phone').value = customer.phone || '';
            document.getElementById('customer-address').value = customer.address || '';
            document.getElementById('customer-requires-tax').checked = customer.requiresTaxFiling || false;
            document.getElementById('customer-price-list').value = customer.priceListId || '';
            document.getElementById('customer-rep').value = customer.repName || '';
        }
    } else {
        // Add mode
        document.getElementById('customer-modal-title').textContent = 'إضافة عميل جديد';
        // في وضع الإضافة: إن كان المستخدم الحالي مندوباً، عيّن حقل المندوب تلقائياً
        try {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'rep') {
                const current = AuthSystem.getCurrentUser();
                if (current) {
                    const myRep = (state.reps||[]).find(r => r.id === current.id);
                    if (myRep && myRep.name) {
                        const repSel = document.getElementById('customer-rep');
                        if (repSel) repSel.value = myRep.name;
                    }
                }
            }
        } catch(e) { /* ignore */ }
    }
    openModal(customerModal);
}

function openRepModal(id = null) {
    repForm.reset();
    document.getElementById('rep-id').value = '';

    if (id) {
        // Edit mode
        const rep = state.reps.find(r => r.id === id);
        if (rep) {
            document.getElementById('rep-modal-title').textContent = 'تعديل بيانات المندوب';
            document.getElementById('rep-id').value = rep.id;
            document.getElementById('rep-name').value = rep.name;
            document.getElementById('rep-serial').value = rep.serial || '';
            document.getElementById('rep-target').value = rep.target || 0;
            document.getElementById('rep-next-invoice').value = rep.nextInvoiceNumber || '';
        }
    } else {
        // Add mode
        document.getElementById('rep-modal-title').textContent = 'إضافة مندوب جديد';
    }
    openModal(repModal);
}

// --- PRODUCT & PRICE-LIST MODALS & SAVERS ---
function openProductModal(id = null) {
    productForm.reset();
    document.getElementById('product-id').value = '';
    if (id) {
        const product = state.products.find(p => p.id === id);
        if (product) {
            document.getElementById('product-modal-title').textContent = 'تعديل المنتج';
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-code').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price || 0;
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-vat-rate').value = (product.vat_rate !== undefined && product.vat_rate !== null) ? Number(product.vat_rate) : 0;
        }
    } else {
        document.getElementById('product-modal-title').textContent = 'إضافة منتج جديد';
    }
    openModal(productModal);
}

function openPriceListModal(id = null) {
    priceListForm.reset();
    document.getElementById('price-list-id').value = '';
    document.getElementById('price-list-name').value = '';
    const container = document.getElementById('price-list-products');
    const tbody = document.getElementById('price-list-products-body');
    const discountInput = document.getElementById('price-list-discount');
    // ensure tbody exists
    if (!tbody) {
        container.innerHTML = '<div class="p-4 text-center text-gray-500">خطأ في عرض الجدول</div>';
    } else {
        tbody.innerHTML = '';

        function parseDiscount(str){
            if (!str) return 0;
            const n = parseFloat(String(str).replace('%','').trim());
            return isNaN(n) ? 0 : n;
        }
        function updateAllPricesAfterDiscount(){
            const d = parseDiscount(discountInput.value);
            Array.from(tbody.querySelectorAll('tr')).forEach(tr=>{
                const priceInp = tr.querySelector('.price-list-product-input');
                const afterInp = tr.querySelector('.price-after-discount');
                if (!priceInp || !afterInp) return;
                const v = parseFloat(priceInp.value);
                if (!isNaN(v)) {
                    const newVal = v * (1 - d/100);
                    afterInp.value = formatNumberEN(newVal);
                } else {
                    afterInp.value = '';
                }
            });
        }

        // build rows
        state.products.forEach((p, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.pid = p.id;
            tr.innerHTML = `
                <td class="px-3 py-2 text-right">${idx+1}</td>
                <td class="px-3 py-2 text-center">${escapeHtml(String(p.id||''))}</td>
                <td class="px-3 py-2 text-right">${escapeHtml(String(p.name||''))}</td>
                <td class="px-3 py-2 text-center">${escapeHtml(String(p.unit||'قطعة'))}</td>
                <td class="px-3 py-2 text-center">${escapeHtml(String(p.barcode||''))}</td>
                <td class="px-3 py-2 text-center"><input type="number" step="any" class="price-list-product-input p-1 border rounded w-28 text-center" data-product-id="${p.id}" placeholder="" /></td>
                <td class="px-3 py-2 text-center"><input type="text" readonly class="price-after-discount p-1 border rounded w-28 text-center bg-gray-50" data-product-id="${p.id}" placeholder="" /></td>
            `;
            tbody.appendChild(tr);
        });

        // wire events: update single row on price input change
        tbody.addEventListener('input', (ev) => {
            const target = ev.target;
            if (target && target.classList && target.classList.contains('price-list-product-input')) {
                const d = parseDiscount(discountInput.value);
                const v = parseFloat(target.value);
                const row = target.closest('tr');
                const afterInp = row ? row.querySelector('.price-after-discount') : null;
                if (afterInp) {
                    if (!isNaN(v)) {
                        afterInp.value = formatNumberEN(v * (1 - d/100));
                    } else {
                        afterInp.value = '';
                    }
                }
            }
        });

        // wire discount input
        discountInput.addEventListener('input', () => updateAllPricesAfterDiscount());
    }

    if (id) {
        const pl = state.priceLists.find(x => x.id === id);
        if (pl) {
            document.getElementById('price-list-modal-title').textContent = 'تعديل قائمة أسعار';
            document.getElementById('price-list-id').value = pl.id;
            document.getElementById('price-list-name').value = pl.name;
            // fill product prices
            Object.keys(pl.productPrices || {}).forEach(pid => {
                const inp = container.querySelector(`.price-list-product-input[data-product-id="${pid}"]`);
                if (inp) inp.value = pl.productPrices[pid];
            });
        }
    } else {
        document.getElementById('price-list-modal-title').textContent = 'إضافة قائمة أسعار';
    }

    openModal(priceListModal);
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('product-id').value || document.getElementById('product-code').value.trim();
    const code = document.getElementById('product-code').value.trim();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const vat_rate = parseFloat(document.getElementById('product-vat-rate')?.value) || 0;
    const category = document.getElementById('product-category').value.trim();
    if (!code || !name) {
        await customDialog({ title: 'خطأ', message: 'الرجاء إدخال كود واسم المنتج.' });
        return;
    }

    try {
        await updateProduct(code, { name, price, category, vat_rate: vat_rate, active: true });
        closeModal(productModal);
        await customDialog({ title: 'نجاح', message: 'تم حفظ المنتج في السحابة.' });
    } catch (err) {
        console.warn('saveProduct cloud failed', err);
        await customDialog({ title: 'خطأ', message: 'تعذر حفظ المنتج في السحابة. تحقق من الاتصال والصلاحيات.' });
    }
}

async function savePriceList(e) {
    e.preventDefault();
    const id = document.getElementById('price-list-id').value || Date.now().toString();
    const name = document.getElementById('price-list-name').value.trim();
    if (!name) { await customDialog({ title: 'خطأ', message: 'الرجاء إدخال اسم قائمة الأسعار.' }); return; }
    const container = document.getElementById('price-list-products');
    const inputs = Array.from(container.querySelectorAll('.price-list-product-input'));
    const productPrices = {};
    inputs.forEach(inp => {
        const pid = inp.dataset.productId;
        const val = parseFloat(inp.value);
        if (!isNaN(val)) productPrices[pid] = val;
    });
    try {
        // Persist to Firestore
        const exists = (state.priceLists||[]).some(pl => pl.id === id);
        if (exists) {
            await updatePriceListDoc(id, { name, productPrices });
        } else {
            await addPriceListDoc(id, { name, productPrices });
        }
        closeModal(priceListModal);
        await customDialog({ title: 'نجاح', message: 'تم حفظ قائمة الأسعار في السحابة.' });
    } catch (err) {
        console.warn('savePriceList cloud failed', err);
        await customDialog({ title: 'خطأ', message: 'تعذر حفظ قائمة الأسعار في السحابة. تحقق من الاتصال والصلاحيات.' });
    }
}

// ===== Unified Price Grid (Costs Page) =====
// Renders the unified price grid and persists per-product price edits to Firestore using updateProduct()
function renderUnifiedPriceGrid() {
    try {
        const tbody = document.querySelector('#unified-price-grid tbody');
        if (!tbody) return;
        // ensure controls exist (category filter)
        const tableEl = document.getElementById('unified-price-grid');
        if (tableEl) {
            let controls = document.getElementById('unified-grid-controls');
            if (!controls) {
                controls = document.createElement('div');
                controls.id = 'unified-grid-controls';
                controls.className = 'mb-3 flex gap-2 items-center';
                tableEl.parentNode.insertBefore(controls, tableEl);
                controls.innerHTML = `
                    <label class="text-sm">الفئة:</label>
                    <select id="unified-category-filter" class="p-1 border rounded text-sm">
                        <option value="all">الكل</option>
                        <option value="raw">الخامات</option>
                        <option value="packaging">التغليف</option>
                        <option value="finished">المنتجات</option>
                        <option value="operation">التشغيل</option>
                    </select>
                    <button id="unified-filter-apply" class="p-1 bg-gray-100 border rounded text-sm">تطبيق</button>
                `;
                // bind apply
                controls.querySelector('#unified-filter-apply').addEventListener('click', () => renderUnifiedPriceGrid());
                // re-render when select changes
                controls.querySelector('#unified-category-filter').addEventListener('change', () => renderUnifiedPriceGrid());
            }
        }

        tbody.innerHTML = '';
        const selectedCategory = (document.getElementById('unified-category-filter')?.value) || 'all';

        const products = Array.isArray(state.products) ? state.products.slice().sort((a,b)=> String(a.name||'').localeCompare(String(b.name||''), 'ar')) : [];
        const filtered = products.filter(p => {
            if (selectedCategory === 'all') return true;
            if (selectedCategory === 'raw') return String(p.category||'').toLowerCase() === 'raw' || String(p.category||'').toLowerCase().includes('raw') || (p.category === 'raw' );
            if (selectedCategory === 'packaging') return String(p.category||'').toLowerCase().includes('packag') || String(p.category||'').toLowerCase() === 'packaging';
            if (selectedCategory === 'finished') return !(String(p.category||'').toLowerCase() === 'raw' || String(p.category||'').toLowerCase().includes('packag'));
            if (selectedCategory === 'operation') return (p.operationCost !== undefined || p.operationCost !== null);
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">لا توجد أصناف في هذه الفئة.</td></tr>';
            return;
        }

        filtered.forEach((p) => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-orange-50';

            // determine editable field per item
            let fieldKey = 'price';
            let fieldLabel = 'السعر';
            if (String(p.category||'').toLowerCase().includes('raw') || String(p.category||'').toLowerCase() === 'raw') { fieldKey = 'cost'; fieldLabel = 'تكلفة'; }
            else if (String(p.category||'').toLowerCase().includes('packag') || String(p.category||'').toLowerCase() === 'packaging') { fieldKey = 'cost'; fieldLabel = 'تكلفة'; }
            else if (selectedCategory === 'operation' || p.operationCost !== undefined) { fieldKey = 'operationCost'; fieldLabel = 'تكلفة تشغيل'; }

            const currentVal = (p[fieldKey] !== undefined && p[fieldKey] !== null) ? Number(p[fieldKey]) : '';

            tr.innerHTML = `
                <td class="px-3 py-2 text-right font-medium">${escapeHtml(p.name || '')}</td>
                <td class="px-3 py-2 text-center text-sm">${escapeHtml(String(p.id || ''))}</td>
                <td class="px-3 py-2 text-center text-sm">${escapeHtml(String(p.category || ''))}</td>
                <td class="px-3 py-2 text-center text-sm">${formatNumberEN(currentVal)}</td>
                <td class="px-3 py-2 text-center"><input type="number" step="any" inputmode="decimal" class="unified-price-input p-1 border rounded w-28 text-center" data-product-id="${escapeHtml(p.id||'')}" data-field-key="${escapeHtml(fieldKey)}" value="${currentVal === '' ? '' : currentVal}" placeholder="${escapeHtml(fieldLabel)}" /></td>
                <td class="px-3 py-2 text-center flex items-center gap-2"><span class="unified-save-indicator text-xs text-gray-500">&nbsp;</span><button class="unified-history-btn p-1 text-xs bg-white border rounded" data-product-id="${escapeHtml(p.id||'')}">تاريخ</button></td>
            `;

            tbody.appendChild(tr);
        });

        // Attach input handlers with debounce, and bind history buttons
        const inputs = tbody.querySelectorAll('.unified-price-input');
        inputs.forEach(inp => {
            const pid = inp.dataset.productId;
            const fkey = inp.dataset.fieldKey || 'price';
            const newInp = inp.cloneNode(true);
            inp.parentNode.replaceChild(newInp, inp);
            const indicator = newInp.closest('tr').querySelector('.unified-save-indicator');
            let timer = null;
            newInp.addEventListener('input', (e) => {
                if (indicator) indicator.textContent = 'تحرير...';
                if (timer) clearTimeout(timer);
                timer = setTimeout(async () => {
                    const raw = newInp.value.trim();
                    if (raw === '') { if (indicator) indicator.textContent = ''; return; }
                    const num = Number(raw);
                    if (isNaN(num)) { if (indicator) indicator.textContent = 'قيمة غير صالحة'; return; }
                    newInp.disabled = true;
                    if (indicator) indicator.textContent = 'حفظ...';
                    try {
                        const payload = {};
                        payload[fkey] = num;
                        payload.updatedAt = serverTs();
                        await updateProduct(pid, payload);
                        // sync local state
                        const prod = state.products.find(x => String(x.id) === String(pid));
                        if (prod) { prod[fkey] = num; prod.updatedAt = new Date().toISOString(); }
                        saveState();
                        if (indicator) indicator.textContent = 'تم الحفظ';
                        setTimeout(()=>{ if (indicator) indicator.textContent = ''; }, 1200);
                    } catch (err) {
                        console.warn('Failed to save unified field for', pid, err);
                        if (indicator) indicator.textContent = 'خطأ في الحفظ';
                        if (err && err.code === 'permission-denied') customDialog({ title: 'صلاحيات', message: 'ليس لديك صلاحية لحفظ هذه القيم.' });
                    } finally { newInp.disabled = false; }
                }, 650);
            });
        });

        tbody.querySelectorAll('.unified-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pid = e.currentTarget.dataset.productId;
                openPriceHistory(pid);
            });
        });

        updateIcons();
    } catch (e) {
        console.warn('renderUnifiedPriceGrid failed', e);
    }
}

// Open price history modal for a product and allow adding a snapshot
function openPriceHistory(productId) {
    try {
        const modal = document.getElementById('price-history-modal');
        const body = document.getElementById('ph-body');
        const addBtn = document.getElementById('ph-add-btn');
        if (!modal || !body || !addBtn) return;
        const prod = state.products.find(p => String(p.id) === String(productId));
        const hist = Array.isArray(prod && prod.priceHistory) ? prod.priceHistory.slice().sort((a,b)=> new Date(b.at) - new Date(a.at)) : [];
        let html = `<div class="space-y-2">`;
        if (!hist.length) html += `<p class="text-sm text-gray-500">لا توجد مدخلات تاريخية.</p>`;
        hist.forEach(h => {
            const v = h.value !== undefined ? formatNumberEN(h.value) : '';
            const who = h.by || (h.uid || 'نظام');
            const when = h.at ? new Date(h.at).toLocaleString('ar-EG') : '';
            html += `<div class="p-2 border rounded bg-white"><div class="text-sm font-medium">${v}</div><div class="text-xs text-gray-500">${who} — ${when}</div></div>`;
        });
        html += `</div>`;
        body.innerHTML = html;
        // bind add button
        addBtn.onclick = async () => {
            try {
                const prod = state.products.find(p => String(p.id) === String(productId));
                if (!prod) return;
                const current = prod.price !== undefined ? prod.price : (prod.cost !== undefined ? prod.cost : null);
                if (current === null) { await customDialog({ title: 'خطأ', message: 'لا توجد قيمة حالية ليتم إضافتها.' }); return; }
                const entry = { value: current, at: new Date().toISOString(), by: (auth && auth.currentUser && (auth.currentUser.email || auth.currentUser.uid)) ? (auth.currentUser.email || auth.currentUser.uid) : 'unknown' };
                prod.priceHistory = prod.priceHistory || [];
                prod.priceHistory.push(entry);
                // persist
                await updateProduct(productId, { priceHistory: prod.priceHistory, updatedAt: serverTs() });
                saveState();
                await customDialog({ title: 'نجاح', message: 'تم إضافة السجل إلى تاريخ السعر.' });
                // re-open to refresh
                openPriceHistory(productId);
            } catch (err) {
                console.warn('add price history failed', err);
                await customDialog({ title: 'خطأ', message: 'تعذر إضافة سجل التاريخ.' });
            }
        };
        openModal(modal);
    } catch (e) { console.warn('openPriceHistory failed', e); }
}


// ===== Stock Control: Add Products Locally =====
async function saveFinishedProductFromStock(e) {
    e.preventDefault();
    const code = document.getElementById('finished-product-code').value.trim();
    const name = document.getElementById('finished-product-name').value.trim();
    const unit = document.getElementById('finished-product-unit').value.trim() || 'قطعة';
    const price = parseFloat(document.getElementById('finished-product-price').value) || 0;
    
    if (!code || !name) {
        await customDialog({ title: 'خطأ', message: 'الرجاء إدخال كود واسم المنتج.' });
        return;
    }

    // Check if already exists
    if (state.products && state.products.some(p => p.id === code)) {
        await customDialog({ title: 'خطأ', message: 'هذا الكود موجود بالفعل. استخدم كود مختلف.' });
        return;
    }

    try {
        // Add to state.products
        if (!state.products) state.products = [];
        const chocoRe = /chocolate|شوكولاتة|شيكولاتة/i;
        const vatRate = chocoRe.test(name) ? 14 : 0;
        state.products.push({
            id: code,
            name: name,
            unit: unit,
            price: price,
            vat_rate: vatRate,
            category: 'finished',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        // Save to localStorage
        saveState();
        
        // Add to costFinished for use in recipes
        if (!window.costFinished) window.costFinished = [];
        if (!window.costFinished.some(p => p.id === code)) {
            window.costFinished.push({ id: code, code: code, name: name, unit: unit, price: price });
        }
        
        // Try to save to Firestore
        try {
            await updateProduct(code, { name, unit, price, vat_rate: vatRate, category: 'finished', active: true });
        } catch(err) {
            console.warn('Failed to sync to Firestore:', err);
        }
        
        // Close modal and refresh
        document.getElementById('modal-add-finished-product').classList.add('hidden');
        document.getElementById('form-add-finished-product').reset();
        
        await customDialog({ title: 'نجاح', message: `تم إضافة المنتج "${name}" بنجاح.` });
        
        // Refresh stock table
        const dateEl = document.getElementById('finished-products-date');
        if (dateEl) dateEl.dispatchEvent(new Event('change'));
    } catch (err) {
        console.warn('saveFinishedProductFromStock error:', err);
        await customDialog({ title: 'خطأ', message: 'حدث خطأ أثناء حفظ المنتج.' });
    }
}

async function saveRawMaterialFromStock(e) {
    e.preventDefault();
    const code = document.getElementById('raw-material-code').value.trim();
    const name = document.getElementById('raw-material-name').value.trim();
    const unit = document.getElementById('raw-material-unit').value.trim() || 'كجم';
    const unitPrice = parseFloat(document.getElementById('raw-material-unit_price').value) || 0;
    const qty = parseFloat(document.getElementById('raw-material-qty').value) || 1;
    const totalCost = Math.round((unitPrice * qty) * 100) / 100;
    
    if (!code || !name) {
        await customDialog({ title: 'خطأ', message: 'الرجاء إدخال كود واسم الخامة.' });
        return;
    }

    // Check if already exists
    if (state.products && state.products.some(p => p.id === code)) {
        await customDialog({ title: 'خطأ', message: 'هذا الكود موجود بالفعل. استخدم كود مختلف.' });
        return;
    }

    try {
        // Add to state.products
        if (!state.products) state.products = [];
        const chocoReRaw = /chocolate|شوكولاتة|شيكولاتة/i;
        const vatRateRaw = chocoReRaw.test(name) ? 14 : 0;
        // check tax invoice checkbox
        const taxInvoiceEl = document.getElementById('raw-material-is_tax_invoice');
        const hasTaxInvoice = !!(taxInvoiceEl && taxInvoiceEl.checked);
        // Allow explicit VAT value input; fallback to computed 14% of totalCost when tax invoice checked
        const explicitVat = parseFloat(document.getElementById('raw-material-vat_value')?.value) || 0;
        let input_vat = 0;
        if (explicitVat && explicitVat > 0) input_vat = round2(explicitVat);
        else if (hasTaxInvoice && totalCost > 0) input_vat = round2(totalCost * 0.14);

        // capture invoice metadata and optional file
        const vendorTaxId = document.getElementById('raw-material-vendor_tax_id')?.value.trim() || null;
        const invoiceNumber = document.getElementById('raw-material-invoice_number')?.value.trim() || null;
        const invoiceDate = document.getElementById('raw-material-invoice_date')?.value || null;
        const invoiceFileEl = document.getElementById('raw-material-invoice_image');
        const invoiceFile = (invoiceFileEl && invoiceFileEl.files && invoiceFileEl.files[0]) ? invoiceFileEl.files[0] : null;
        let invoiceImageUrl = null;
        if (invoiceFile && window.storage) {
            try {
                const path = `invoices/raw/${code}/${Date.now()}_${invoiceFile.name}`;
                const snap = await window.storage.ref().child(path).put(invoiceFile);
                invoiceImageUrl = await snap.ref.getDownloadURL();
            } catch(uerr) { console.warn('upload invoice image failed', uerr); }
        }

        state.products.push({
            id: code,
            name: name,
            unit: unit,
            cost: unitPrice,
            vat_rate: vatRateRaw,
            category: 'raw',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Save to localStorage
        saveState();

        // Add to costRaw for use in recipes
        if (!window.costRaw) window.costRaw = [];
        if (!window.costRaw.some(p => p.id === code)) {
            window.costRaw.push({ id: code, code: code, name: name, unit: unit, cost: unitPrice, lastPrice: unitPrice, lastPriceDate: new Date().toISOString(), priceHistory: [], lastPaidVat: input_vat, lastInvoiceNumber: invoiceNumber, lastInvoiceDate: invoiceDate, lastVendorTaxId: vendorTaxId, lastInvoiceImageUrl: invoiceImageUrl });
        }

        // Try to save to Firestore
        try {
            // Step A: update product cost in Firestore (unit price)
            await updateProduct(code, { name, unit, cost: unitPrice, vat_rate: vatRateRaw, lastPaidVat: input_vat, lastInvoiceNumber: invoiceNumber, lastInvoiceDate: invoiceDate, lastVendorTaxId: vendorTaxId, lastInvoiceImageUrl: invoiceImageUrl, category: 'raw', active: true });
        } catch(err) {
            console.warn('Failed to sync to Firestore:', err);
        }
        // Step C: write transaction record to `transactions` to capture input_vat for tax report
        try {
            if (window.db) {
                await db.collection('transactions').add({
                    type: 'supply',
                    productId: code,
                    productCode: code,
                    name: name,
                    date: new Date().toISOString(),
                    qty: Number(qty || 0),
                    unitPrice: Number(unitPrice || 0),
                    total_cost: Number(totalCost || 0),
                    input_vat: Number(input_vat || 0),
                    vendor_tax_id: vendorTaxId,
                    invoice_number: invoiceNumber,
                    invoice_date: invoiceDate,
                    vat_value_reported: explicitVat || null,
                    invoice_image_url: invoiceImageUrl,
                    createdAt: serverTs()
                });
            }
        } catch(e) {
            console.warn('Failed to write transaction record:', e);
        }
        
        // Close modal and refresh
        document.getElementById('modal-add-raw-material').classList.add('hidden');
        document.getElementById('form-add-raw-material').reset();
        
        await customDialog({ title: 'نجاح', message: `تم إضافة الخامة "${name}" بنجاح.` });
        
        // Refresh stock table
        const dateEl = document.getElementById('raw-materials-date');
        if (dateEl) dateEl.dispatchEvent(new Event('change'));
    } catch (err) {
        console.warn('saveRawMaterialFromStock error:', err);
        await customDialog({ title: 'خطأ', message: 'حدث خطأ أثناء حفظ الخامة.' });
    }
}

async function savePackagingFromStock(e) {
    e.preventDefault();
    const code = document.getElementById('packaging-code').value.trim();
    const name = document.getElementById('packaging-name').value.trim();
    const unit = document.getElementById('packaging-unit').value.trim() || 'قطعة';
    const cost = parseFloat(document.getElementById('packaging-cost').value) || 0;
    
    if (!code || !name) {
        await customDialog({ title: 'خطأ', message: 'الرجاء إدخال كود واسم مادة التعبئة.' });
        return;
    }

    // Check if already exists
    if (state.products && state.products.some(p => p.id === code)) {
        await customDialog({ title: 'خطأ', message: 'هذا الكود موجود بالفعل. استخدم كود مختلف.' });
        return;
    }

    try {
        // Add to state.products
        if (!state.products) state.products = [];
        const chocoRePack = /chocolate|شوكولاتة|شيكولاتة/i;
        const vatRatePack = chocoRePack.test(name) ? 14 : 0;
        state.products.push({
            id: code,
            name: name,
            unit: unit,
            cost: cost,
            vat_rate: vatRatePack,
            category: 'packaging',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Save to localStorage
        saveState();

        // Add to costPack for use in recipes
        if (!window.costPack) window.costPack = [];
        if (!window.costPack.some(p => p.id === code)) {
            window.costPack.push({ id: code, code: code, name: name, unit: unit, cost: cost, lastPrice: 0, lastPriceDate: null, priceHistory: [], vat_rate: vatRatePack });
        }

        // capture invoice metadata from form
        const vendorTaxId = document.getElementById('packaging-vendor_tax_id')?.value.trim() || null;
        const invoiceNumber = document.getElementById('packaging-invoice_number')?.value.trim() || null;
        const invoiceDate = document.getElementById('packaging-invoice_date')?.value || null;
        const explicitVat = parseFloat(document.getElementById('packaging-vat_value')?.value) || 0;
        let input_vat = explicitVat && explicitVat > 0 ? round2(explicitVat) : 0;
        const invoiceFileEl = document.getElementById('packaging-invoice_image');
        const invoiceFile = (invoiceFileEl && invoiceFileEl.files && invoiceFileEl.files[0]) ? invoiceFileEl.files[0] : null;
        let invoiceImageUrl = null;
        if (invoiceFile && window.storage) {
            try {
                const path = `invoices/packaging/${code}/${Date.now()}_${invoiceFile.name}`;
                const snap = await window.storage.ref().child(path).put(invoiceFile);
                invoiceImageUrl = await snap.ref.getDownloadURL();
            } catch(uerr) { console.warn('upload packaging invoice image failed', uerr); }
        }
        // Try to save to Firestore (including invoice metadata)
        try {
            await updateProduct(code, { name, unit, cost, vat_rate: vatRatePack, category: 'packaging', active: true, lastPaidVat: input_vat, lastInvoiceNumber: invoiceNumber, lastInvoiceDate: invoiceDate, lastVendorTaxId: vendorTaxId, lastInvoiceImageUrl: invoiceImageUrl });
        } catch(err) {
            console.warn('Failed to sync to Firestore:', err);
        }
        // write transaction record for packaging if provided
        try {
            if (window.db) {
                await db.collection('transactions').add({
                    type: 'supply',
                    productId: code,
                    productCode: code,
                    name: name,
                    date: new Date().toISOString(),
                    qty: 1,
                    unitPrice: Number(cost || 0),
                    total_cost: Number(cost || 0),
                    input_vat: Number(input_vat || 0),
                    vendor_tax_id: vendorTaxId,
                    invoice_number: invoiceNumber,
                    invoice_date: invoiceDate,
                    vat_value_reported: explicitVat || null,
                    invoice_image_url: invoiceImageUrl,
                    createdAt: serverTs()
                });
            }
        } catch(e) { console.warn('Failed to write packaging transaction record:', e); }
        
        // Close modal and refresh
        document.getElementById('modal-add-packaging').classList.add('hidden');
        document.getElementById('form-add-packaging').reset();
        
        await customDialog({ title: 'نجاح', message: `تم إضافة مادة التعبئة "${name}" بنجاح.` });
        
        // Refresh stock table
        const dateEl = document.getElementById('packaging-date');
        if (dateEl) dateEl.dispatchEvent(new Event('change'));
    } catch (err) {
        console.warn('savePackagingFromStock error:', err);
        await customDialog({ title: 'خطأ', message: 'حدث خطأ أثناء حفظ مادة التعبئة.' });
    }
}

// Save global monthly sales target from Settings and refresh dashboard
async function saveSalesTarget(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('sales-target-input');
    if (!input) return;
    // tolerate commas and whitespace
    const raw = String(input.value || '').replace(/,/g, '').trim();
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) {
        await customDialog({ title: 'خطأ', message: 'الرجاء إدخال قيمة صحيحة للهدف الشهري (رقم موجب).' });
        return;
    }

    state.settings = state.settings || {};
    state.settings.salesTarget = Number(val);
    saveState();
    
    // حفظ في Firebase Firestore
    try {
        if (window.db) {
            await db.collection('settings').doc('global-settings').set({
                salesTarget: Number(val),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('تم حفظ الهدف الشهري في السحابة:', val);
        }
    } catch(err) {
        console.warn('فشل حفظ الهدف الشهري في السحابة:', err);
    }
    
    renderDashboard();
    await customDialog({ title: 'نجاح', message: 'تم حفظ الهدف الشهري بنجاح في السحابة وعرضه في الصفحة الرئيسية.' });
}

// دالة تحديث الساعة الرقمية
function updateDigitalClock() {
    const clockEl = document.getElementById('digital-clock');
    if (!clockEl) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
}

// تحديث الساعة عند التحميل وكل ثانية
updateDigitalClock();
setInterval(updateDigitalClock, 1000);

function setupNavigationHandlers() {
    const mainNavBar = document.getElementById('main-nav-bar');
    if (mainNavBar) {
        mainNavBar.addEventListener('click', (e) => {
            const button = e.target.closest('.bottom-nav-item');
            if (button && button.dataset.page) {
                const pageId = button.dataset.page;
                navigateTo(pageId);
            }
        });
    }

    // Handle Reports Subnav Clicks - query fresh so handlers work even if elements were not present at script parse time
    const _reportsSubnavItems = document.querySelectorAll('.reports-subnav-item');
    _reportsSubnavItems.forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.reports-subnav-item').forEach(btn => btn.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const section = e.currentTarget.dataset.reportSection;
            showReportContent(section);
            if (section === 'targets') { try { generateTargetsReport(); } catch(e){} }
        });
    });
    updateIcons(); 
}

// --- DISPATCH NOTE FUNCTIONS ---

    function generateAndShowDispatchNoteView(noteId) { /* ... */ } 
    function openSettlementModal(noteId) { /* ... */ } 

// --- MANUAL STATEMENT FUNCTION ---
function generateAndShowStatement(startDate, endDate, customerIds, title, customerNames, category = 'all') {
    const statementModal = document.getElementById('statement-modal');
    endDate.setHours(23, 59, 59, 999); // Include all of the end day

    const salesInRange = state.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate && customerIds.includes(sale.customerId);
    });

    let filteredSales = salesInRange;
    if (category !== 'all') {
        filteredSales = salesInRange.filter(sale => {
            return sale.items.some(item => {
                const product = findProduct(item.productId);
                // Ensure product exists and has a category property before checking
                return product && product.category === category;
            });
        });
    }
    
    // Sort by date
    filteredSales.sort((a, b) => new Date(a.date) - new Date(b.date));

    // ===== حساب الرصيد الافتتاحي (Opening Balance) =====
    // جميع المبيعات للعملاء قبل تاريخ البداية
    const salesBeforeStart = state.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate < startDate && customerIds.includes(sale.customerId);
    });
    
    let openingBalance = 0;
    salesBeforeStart.forEach(sale => {
        openingBalance += (sale.total - sale.paidAmount);
    });

    let html = `<div class="bg-white rounded-lg shadow-xl w-full max-w-6xl p-6 modal-body">
        <div class="printable-statement-content">
            <h2 class="text-2xl font-bold mb-2">${title}</h2>
            <p class="text-sm text-gray-600 mb-2">الفترة من: ${startDate.toLocaleDateString('ar-EG')} إلى: ${endDate.toLocaleDateString('ar-EG')}</p>
            <p class="text-sm text-gray-600 mb-4">العملاء: ${customerNames}</p>`;

    if (filteredSales.length === 0) {
        html += '<p class="text-center text-gray-500 p-4">لا توجد فواتير في هذه الفترة.</p>';
    } else {
        html += '<div class="overflow-x-auto border rounded-lg"><table class="min-w-full divide-y divide-gray-200 text-sm">';
        html += `<thead class="bg-gray-100"><tr>
            <th class="px-4 py-2 text-right font-semibold">التاريخ</th>
            <th class="px-4 py-2 text-center font-semibold">رقم الفاتورة</th>
            <th class="px-4 py-2 text-right font-semibold">العميل</th>
            <th class="px-4 py-2 text-center font-semibold">مدين (Sales)</th>
            <th class="px-4 py-2 text-center font-semibold">دائن (Payments)</th>
            <th class="px-4 py-2 text-center font-semibold">الرصيد</th>
            <th class="px-4 py-2 text-center font-semibold">الحالة</th>
        </tr></thead>`;
        html += '<tbody class="bg-white divide-y divide-gray-100">';
        
        // ===== إضافة صف الرصيد الافتتاحي =====
        html += `<tr class="bg-yellow-50 font-bold">
            <td class="px-4 py-2 text-right">---</td>
            <td class="px-4 py-2 text-center">---</td>
            <td class="px-4 py-2 text-right">رصيد ما قبل الفترة</td>
            <td class="px-4 py-2 text-center">---</td>
            <td class="px-4 py-2 text-center">---</td>
            <td class="px-4 py-2 text-center font-bold text-blue-700">${formatCurrency(openingBalance)}</td>
            <td class="px-4 py-2 text-center">---</td>
        </tr>`;
        
        // ===== إضافة صفوف الفواتير مع الرصيد الجاري =====
        let runningBalance = openingBalance;
        filteredSales.forEach(sale => {
            const customer = findCustomer(sale.customerId);
            const debit = sale.total; // المبيعات (مدين)
            const credit = sale.paidAmount; // المدفوعات (دائن)
            runningBalance += (debit - credit);
            
            html += `<tr class="${sale.total < 0 ? 'bg-red-50' : ''}">
                <td class="px-4 py-2 whitespace-nowrap">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
                <td class="px-4 py-2 text-center">${sale.invoiceNumber}</td>
                <td class="px-4 py-2 text-right">${customer ? customer.name : 'عميل محذوف'}</td>
                <td class="px-4 py-2 text-center font-semibold text-green-700">${formatCurrency(debit)}</td>
                <td class="px-4 py-2 text-center font-semibold text-red-600">${formatCurrency(credit)}</td>
                <td class="px-4 py-2 text-center font-bold ${runningBalance < 0 ? 'text-red-600' : 'text-blue-700'}">${formatCurrency(runningBalance)}</td>
                <td class="px-4 py-2 text-center">${getStatusBadge(sale.status)}</td>
            </tr>`;
        });
        
        // ===== صف الإجمالي النهائي =====
        let totalDebit = 0;
        let totalCredit = 0;
        filteredSales.forEach(sale => {
            totalDebit += sale.total;
            totalCredit += sale.paidAmount;
        });
        
        html += `<tr class="bg-gray-200 font-bold border-t-2 border-gray-400">
            <td class="px-4 py-2 text-right">---</td>
            <td class="px-4 py-2 text-center">---</td>
            <td class="px-4 py-2 text-right">الإجمالي</td>
            <td class="px-4 py-2 text-center text-green-700">${formatCurrency(totalDebit)}</td>
            <td class="px-4 py-2 text-center text-red-700">${formatCurrency(totalCredit)}</td>
            <td class="px-4 py-2 text-center text-blue-900 text-lg">${formatCurrency(runningBalance)}</td>
            <td class="px-4 py-2 text-center">---</td>
        </tr>`;
        
        html += '</tbody></table></div>';
        
        // ===== ملخص الحسابات =====
        html += `<div class="mt-6 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="text-center">
                <p class="text-gray-600 text-sm">إجمالي المبيعات (مدين)</p>
                <p class="text-2xl font-bold text-green-700">${formatCurrency(totalDebit)}</p>
            </div>
            <div class="text-center">
                <p class="text-gray-600 text-sm">إجمالي المدفوعات (دائن)</p>
                <p class="text-2xl font-bold text-red-700">${formatCurrency(totalCredit)}</p>
            </div>
            <div class="text-center">
                <p class="text-gray-600 text-sm">الرصيد النهائي</p>
                <p class="text-2xl font-bold ${runningBalance < 0 ? 'text-red-600' : 'text-blue-700'}">${formatCurrency(runningBalance)}</p>
            </div>
        </div>`;
    }
    html += `</div>`; // Closing printable-statement-content
    html += `<div class="flex justify-between items-center pt-4 border-t mt-4 no-print">
                <button onclick="closeModal(document.getElementById('statement-modal'))" class="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400">إغلاق</button>
                <button id="print-statement-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                   <i data-lucide="printer" class="w-5 h-5"></i>
                   <span>طباعة</span>
                </button>
            </div>`;
    html += '</div>';

    statementModal.innerHTML = html;
    
    // Add print functionality
    const printBtn = statementModal.querySelector('#print-statement-btn');
    if(printBtn) {
        printBtn.addEventListener('click', () => {
            const contentToPrint = statementModal.querySelector('.printable-statement-content').innerHTML;
            const w = window.open('', '', 'height=600,width=1000');
            if (!w) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
            w.document.open();
            w.document.write('<html><head><title>كشف حساب</title>');
            w.document.write('<link rel="stylesheet" href="https://cdn.tailwindcss.com">');
            w.document.write('<style>body { font-family: \'Cairo\', sans-serif; direction: rtl; } @media print { .no-print { display: none; } }</style>');
            w.document.write('</head><body>');
            w.document.write(contentToPrint);
            w.document.write('</body></html>');
            w.document.close();
            const doPrint = () => { try { w.focus(); } catch(_){} try { w.print(); } catch(_){} };
            const closeBack = () => { try { w.close(); } catch(_){} try { window.focus(); } catch(_){} };
            if ('onafterprint' in w) { w.onafterprint = closeBack; } else { setTimeout(closeBack, 1200); }
            if ('onload' in w) { w.onload = () => setTimeout(doPrint, 100); } else { setTimeout(doPrint, 300); }
        });
    }

    openModal(statementModal);
    updateIcons();
}

// ===== INVOICE RECEIPT PRINTING (Unified 80mm thermal layout) =====
function buildReceiptHtml58mm(sale){
    try {
    const customer = findCustomer(sale.customerId);
    const company = (state.settings && state.settings.companyName) ? state.settings.companyName : 'اسم الشركة';
    const logo = (state.settings && state.settings.companyLogo) ? state.settings.companyLogo : 'https://i.ibb.co/YT4114YW/image.jpg';
    const registry = (state.settings && (state.settings.companyRegistry||state.settings.commercialRegistry)) || '134175';
    const taxId   = (state.settings && (state.settings.companyTaxId||state.settings.taxCard)) || '762878835';
    const phone   = (state.settings && state.settings.companyPhone) || '01011121457';
    const email   = (state.settings && state.settings.companyEmail) || 'delentemilks@gmail.com';
    const repName = sale.repName || '';
        const dateStr = formatArabicDate(sale.date);
        const inv = sale.invoiceNumber || sale.id || '';
        const rows = (sale.items||[]).map(it => {
            const p = findProduct(it.productId);
            const name = p ? p.name : (it.name || 'منتج');
            const qty = it.quantity || it.qty || 0;
            const price = Number(it.price||0);
            const total = qty * price * (1 - (it.discountPercent||0)/100);
            return `<tr><td class="n">${escapeHtml(name)}</td><td class="q">${qty}</td><td class="t">${formatCurrency(total)}</td></tr>`;
        }).join('');
        const total = formatCurrency(sale.total||0);
        const paid = formatCurrency(sale.paidAmount||0);
        const remain = formatCurrency((sale.total||0) - (sale.paidAmount||0));
        const custName = customer ? customer.name : 'عميل';
        const custPhone = customer ? (customer.phone||'') : '';
        const custTax = customer ? (customer.taxNumber||'') : '';

        const nowStr = new Date().toLocaleString('ar-EG', { hour12: true });
        return `<!doctype html><html lang="ar" dir="rtl"><head>
            <meta charset="utf-8" />
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
            <title>طباعة فاتورة</title>
            <style>
                @page { size: 80mm auto; margin: 2mm; }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    direction: rtl; 
                    margin:0; 
                    padding:0; 
                    background:#fff;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                .r { 
                    width: 80mm; 
                    max-width: 80mm; 
                    position: relative; 
                    padding: 3mm; 
                    border: 2px solid #222; 
                    box-sizing: border-box;
                    font-family: 'Cairo', sans-serif;
                }
                .center { text-align:center }
                .h1 { font-weight:800; font-size:16px; }
                .h2 { font-weight:700; font-size:14px; }
                .row { display:flex; justify-content:space-between; font-size:12px }
                table { width:100%; border-collapse:collapse; font-size:12px }
                th { background:#f3f4f6; border:1px solid #e5e7eb; padding:3px; font-weight:700; font-size:12px }
                td { padding:3px; border:1px solid #f1f5f9; font-size:12px; text-align:center }
                td.n{ text-align:right; font-weight:600 }
                td.q{ width:20%; }
                td.t{ width:28%; text-align:left }
                hr { border:none; border-top:1px dashed #000; margin:8px 0 }
                .sep { border-top:1px dashed #000; height:0; margin:8px 0 }
                .bold { font-weight:700 }
                .small { font-size:12px }
                .hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px }
                .hdr .brand { display:flex; align-items:center; gap:8px; }
                .hdr img { width: 12mm; height:auto }
                .tag { font-size:11px; font-weight:600; line-height:1; opacity:.9; margin-top:-2px; }
                .wm { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none }
                .wm img { width:60mm; opacity:.06; }
                .footer { font-size:11px; line-height:1.5; text-align:right }
                .kv { display:flex; gap:10px; justify-content:space-between; font-size:12px; }
                .kv .label{ color:#111; font-weight:600 }
                .kv .value{ color:#111; }
                .money-row{ display:flex; justify-content:space-between; align-items:center; font-size:13px }
                .money-row .amt{ text-align:left; min-width:38mm }
                .cur{ font-size:11px; margin-right:2px }
            </style>
                        </head><body>
          <div class="r">
            <div class="wm">${logo ? `<img src="${logo}" />` : ''}</div>
            <div class="hdr">
                <div class="brand"><div><div class="h1">Delente</div><div class="tag">it is just milk</div></div></div>
                ${logo ? `<img src="${logo}" alt="logo"/>` : ''}
            </div>
            <div class="center h2">فاتورة مبيعات</div>
            <div class="center small">${nowStr}</div>
            <hr />
            <div class="kv"><div class="value">${inv}</div><div class="label">: رقم الفاتورة</div></div>
            <div class="kv"><div class="value"><bdo dir="rtl">${dateStr}</bdo></div><div class="label">: التاريخ</div></div>
            <div class="kv"><div class="value">${escapeHtml(custName)}</div><div class="label">: العميل</div></div>
            ${repName?`<div class="kv"><div class="value">${escapeHtml(repName)}</div><div class="label">: المندوب</div></div>`:''}
            ${custPhone?`<div class="kv"><div class="value">${escapeHtml(custPhone)}</div><div class="label">: هاتف</div></div>`:''}
            ${custTax?`<div class="kv"><div class="value">${escapeHtml(custTax)}</div><div class="label">: رقم ضريبي</div></div>`:''}
            <hr />
            <table><thead><tr><th>الصنف</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>${rows}</tbody></table>
            <hr />
            <div class="money-row bold"><span>الإجمالي</span><span class="amt">${total} <span class="cur">ج.م</span></span></div>
            <div class="money-row"><span>المدفوع</span><span class="amt">${paid} <span class="cur">ج.م</span></span></div>
            <div class="money-row"><span>المتبقي</span><span class="amt">${remain} <span class="cur">ج.م</span></span></div>
            <hr />
            <div class="footer">
                <div>سجل تجاري: ${escapeHtml(String(registry))}</div>
                <div>بطاقة ضريبية: ${escapeHtml(String(taxId))}</div>
                <div>هاتف: ${escapeHtml(String(phone))}</div>
                <div>E: ${escapeHtml(String(email))}</div>
            </div>
            <div class="center small" style="margin-top:4px">شكراً لتعاملكم معنا</div>
                            </div>
                        </body></html>`;
    } catch(e){ return '<html><body>خطأ في تجهيز الفاتورة</body></html>'; }
}

// Function for Green Button (Standard System Print with Thermal Paper Formatting)
function printInvoice(invoice) {
    try {
        // 1. Open a popup for the receipt
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) { alert('Please allow popups for printing'); return; }
        
        // 2. Build HTML with Thermal CSS (80mm / 78mm paper width)
        const doc = printWindow.document;
        doc.open();
        
        // Write DOCTYPE and basic structure
        doc.write('<!DOCTYPE html>');
        doc.write('<html lang="ar" dir="rtl">');
        doc.write('<head>');
        doc.write('<meta charset="utf-8" />');
        doc.write('<title>Invoice #' + (invoice.id || 'N/A') + '</title>');
        
        // Write CSS styles
        doc.write('<style>');
        doc.write('body { font-family: Tahoma, sans-serif; margin: 0; padding: 5px; width: 100%; max-width: 80mm; color: #000; direction: rtl; }');
        doc.write('.header { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px; }');
        doc.write('.meta { text-align: center; font-size: 12px; margin-bottom: 10px; }');
        doc.write('.divider { border-top: 1px dashed #000; margin: 5px 0; }');
        doc.write('table { width: 100%; font-size: 12px; border-collapse: collapse; }');
        doc.write('th { text-align: right; border-bottom: 1px solid #000; padding: 3px 0; font-weight: bold; }');
        doc.write('td { text-align: right; padding: 2px 0; }');
        doc.write('td.qty { text-align: center; }');
        doc.write('td.total { text-align: left; }');
        doc.write('.total-box { border: 2px solid #000; padding: 8px; text-align: center; font-weight: bold; font-size: 18px; margin-top: 10px; }');
        doc.write('.footer { text-align: center; margin-top: 15px; font-size: 10px; line-height: 1.6; }');
        doc.write('.small-text { font-size: 10px; }');
        doc.write('@media print { @page { margin: 0; size: auto; width: 80mm; } body { margin: 0; padding: 2px; } }');
        doc.write('</style>');
        
        doc.write('</head><body>');
        
        // Header
        doc.write('<div class="header">Invoice #' + (invoice.id || 'N/A') + '</div>');
        doc.write('<div class="meta">');
        doc.write('<div class="small-text">Date: ' + (invoice.date || 'Today') + '</div>');
        doc.write('<div class="small-text">Customer: <strong>' + (invoice.customerName || 'Cash') + '</strong></div>');
        doc.write('</div>');
        
        doc.write('<div class="divider"></div>');
        
        // Items table
        doc.write('<table>');
        doc.write('<thead><tr><th style="width: 50%;">Item</th><th style="width: 20%;" class="qty">Qty</th><th style="width: 30%;" class="total">Total</th></tr></thead>');
        doc.write('<tbody>');
        if (Array.isArray(invoice.items)) {
            invoice.items.forEach(function(item) {
                const total = formatCurrency ? formatCurrency(item.total || 0) : (item.total || 0);
                doc.write('<tr>');
                doc.write('<td>' + (item.name || 'Product') + '</td>');
                doc.write('<td class="qty">' + (item.quantity || item.qty || 0) + '</td>');
                doc.write('<td class="total">' + total + '</td>');
                doc.write('</tr>');
            });
        }
        doc.write('</tbody></table>');
        
        doc.write('<div class="divider"></div>');
        
        // Total box
        const totalAmount = formatCurrency ? formatCurrency(invoice.total || 0) : (invoice.total || 0);
        doc.write('<div class="total-box">TOTAL: ' + totalAmount + '</div>');
        
        doc.write('<div class="footer">');
        doc.write('<div>Thank you for your business</div>');
        doc.write('<div class="small-text">Generated by Smart System</div>');
        doc.write('</div>');
        
        doc.write('</body></html>');
        doc.close();
        
        // Trigger print after a brief delay
        setTimeout(function() {
            try { printWindow.focus(); } catch(_){}
            try { printWindow.print(); } catch(_){}
        }, 300);
        
    } catch(e) {
        console.warn('printInvoice error', e);
        alert('Error opening print preview: ' + (e && e.message || 'Unknown error'));
    }
}
window.printInvoice = printInvoice;

window.printSaleById = async function(saleId){
    try {
        const sale = (state.sales||[]).find(s => String(s.id) === String(saleId));
        if (!sale) { alert('تعذر العثور على الفاتورة'); return; }
        
        // Show preview modal first
        await new Promise(resolve => {
            showPrintPreviewModal(sale, () => resolve());
        });
        
        const html = buildReceiptHtml58mm(sale);
        const w = window.open('', '', 'width=420,height=640');
        if (!w) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }

        // Write content and wait for load to avoid blocking/hangs
        w.document.open();
        w.document.write(html);
        w.document.close();

        const doPrint = () => {
            try { w.focus(); } catch(_){}
            try { w.print(); } catch(_){}
        };
        const closeAndReturn = () => {
            // Close popup and restore focus to the app; also ensure pointer events are enabled
            try { w.close(); } catch(_){}
            try { window.focus(); } catch(_){}
            try { document.body.style.pointerEvents = 'auto'; document.body.style.opacity = '1'; } catch(_){}
        };

        if ('onafterprint' in w) {
            w.onafterprint = closeAndReturn;
        } else {
            // Fallback: close after a short delay
            setTimeout(closeAndReturn, 1200);
        }

        if ('onload' in w) {
            w.onload = () => setTimeout(doPrint, 100);
        } else {
            // Fallback if onload not firing
            setTimeout(doPrint, 300);
        }
    } catch(e){ console.warn('printSaleById error', e); try { alert('تعذر بدء الطباعة'); } catch(_){} }
}

// Print preview modal for both WiFi and Bluetooth printing
function showPrintPreviewModal(sale, callback) {
    if (!document.getElementById('print-preview-modal')) {
        const modal = document.createElement('div');
        modal.id = 'print-preview-modal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.zIndex = '50000';
        modal.style.display = 'none';
        modal.style.background = 'rgba(0,0,0,0.5)';
        
        const content = document.createElement('div');
        content.style.position = 'absolute';
        content.style.top = '50%';
        content.style.left = '50%';
        content.style.transform = 'translate(-50%, -50%)';
        content.style.background = '#fff';
        content.style.borderRadius = '10px';
        content.style.padding = '20px';
        content.style.maxHeight = '90vh';
        content.style.overflow = 'auto';
        content.style.maxWidth = '600px';
        content.style.width = '90%';
        content.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        
        content.innerHTML = `
            <h2 style="text-align:center;margin-bottom:20px;font-size:20px;font-weight:bold;">معاينة قبل الطباعة</h2>
            
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:bold;">حجم الورقة:</label>
                <select id="paper-size-select" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;">
                    <option value="80mm" selected>80mm (حراري - افتراضي)</option>
                    <option value="58mm">58mm</option>
                    <option value="A4">A4 (21 سم)</option>
                </select>
            </div>
            
            <div style="margin-bottom:20px;">
                <label style="display:block;margin-bottom:8px;font-weight:bold;">اتجاه الورقة:</label>
                <select id="paper-orientation-select" style="width:100%;padding:8px;border:1px solid #ccc;border-radius:6px;">
                    <option value="portrait">عمودي</option>
                    <option value="landscape">أفقي</option>
                </select>
            </div>
            
            <div id="print-preview-container" style="border:2px solid #3b82f6;padding:15px;margin-bottom:20px;background:#f9f9f9;max-height:420px;overflow:auto;border-radius:6px;">
                <!-- سيتم إدراج معاينة الفاتورة هنا -->
            </div>
            
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                <button id="print-confirm-btn" style="background:#3b82f6;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:15px;">طباعة الآن</button>
                <button id="print-cancel-btn" style="background:#e5e7eb;color:#000;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:15px;">إلغاء</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    }
    
    const modal = document.getElementById('print-preview-modal');
    const previewContainer = document.getElementById('print-preview-container');
    
    // Generate receipt preview using the exact 80mm template
    try {
        const htmlDoc = (typeof buildReceiptHtml58mm === 'function') ? buildReceiptHtml58mm(sale) : '';
        const temp = document.createElement('div');
        temp.innerHTML = htmlDoc;
        const styleFromDoc = temp.querySelector('style');
        if (styleFromDoc) {
            const s = document.createElement('style');
            s.textContent = styleFromDoc.textContent;
            previewContainer.appendChild(s);
        }
        const r = temp.querySelector('.r');
        if (r) {
            // Scale preview to fit modal area
            r.style.margin = '0 auto';
            r.style.transformOrigin = 'top center';
            r.style.transform = 'scale(0.75)';
            previewContainer.appendChild(r);
        } else {
            previewContainer.innerHTML = '<div style="text-align:center;color:#dc2626">تعذر إنشاء المعاينة</div>';
        }
    } catch(e){
        previewContainer.innerHTML = '<div style="text-align:center;color:#dc2626">خطأ في المعاينة</div>';
    }
    
    // Setup buttons
    document.getElementById('print-confirm-btn').onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
    
    document.getElementById('print-cancel-btn').onclick = () => {
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
}

// (تمت إزالة الفاتورة المختصرة حسب طلبك؛ تمت إضافة بيانات الشركة داخل الطباعة الأساسية)

// Optional: Share as image via Web Share on أندرويد
window.shareSaleReceiptImage = async function(saleId){
    try {
        const sale = (state.sales||[]).find(s => String(s.id) === String(saleId));
        if (!sale) return alert('لم يتم العثور على الفاتورة');
        // Build a temporary DOM node for rendering
        const temp = document.createElement('div');
        temp.style.position = 'fixed';
        temp.style.left = '-10000px';
        temp.style.top = '0';
        temp.style.width = '384px'; /* عرض ثابت لالتقاط أنظف */
        temp.style.background = '#ffffff';
        temp.style.padding = '0';
        temp.style.margin = '0';
        temp.innerHTML = buildReceiptHtml58mm(sale);
        // ضبط العنصر الداخلي للفاتورة ليطابق العرض المطلوب
        const root = temp.querySelector('.r');
        if (root) {
            root.style.width = '384px';
            root.style.maxWidth = '384px';
        }
        document.body.appendChild(temp);
        const target = root || temp;
        // رفع الدقة لتقليل التموج والتشوه
        const canvas = await html2canvas(target, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], `invoice-${sale.invoiceNumber||sale.id}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            // اطلب تأكيد بسرعة لضمان user gesture قبل استدعاء share
            const confirmed = await (typeof customDialog === 'function'
                ? customDialog({ title: 'الصورة جاهزة', message: 'اضغط "مشاركة الآن" لفتح قائمة المشاركة.', isConfirm: true, confirmText: 'مشاركة الآن', confirmClass: 'bg-indigo-600 hover:bg-indigo-700' })
                : Promise.resolve(true));
            if (confirmed) {
                try {
                    await navigator.share({ files:[file] });
                } catch(shareErr) {
                    console.warn('navigator.share failed, falling back', shareErr);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
                    alert('تم حفظ صورة الفاتورة على جهازك.');
                }
            }
        } else {
            // Fallback: download so it can be opened ببرنامج الطباعة (RawBT/Xprinter)
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = file.name; a.click(); URL.revokeObjectURL(url);
            alert('تم حفظ صورة الفاتورة. افتحها في تطبيق الطابعة للطباعة.');
        }
        try { temp.remove(); } catch(_){}
    } catch(e){ console.warn('shareSaleReceiptImage failed', e); alert('تعذر مشاركة الفاتورة'); }
}

// Upload single sale to ETA via Netlify function
window.uploadSaleToEta = async function(saleId){
    try {
        const sale = (state.sales||[]).find(s => String(s.id) === String(saleId));
        if (!sale) return alert('لم يتم العثور على الفاتورة');
        if (sale.taxUploadStatus === 'uploaded') {
            if (!confirm('هذه الفاتورة مرفوعة بالفعل. إعادة الرفع؟')) return;
        }
        const invoice = transformSaleToEtaInvoice(sale);
        const resp = await fetch('/.netlify/functions/eta-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invoice })
        });
        let data = null;
        try { data = await resp.json(); } catch(_) { /* text fallback */ }
        if (resp.ok && data && data.accepted) {
            sale.taxUploadStatus = 'uploaded';
            sale.taxSubmissionUUID = data.submissionUUID || null;
            sale.etaStatus = 'submitted';
            sale.etaLastCheckAt = new Date().toISOString();
            sale.etaErrors = [];
            try { saveState(); } catch(_){ }
            renderAllSales();
            // Log successful submission to `einvoice_logs` for reporting
            try {
                if (window.db) {
                    await db.collection('einvoice_logs').add({
                        invoice_number: sale.invoiceNumber || sale.invoice_number || null,
                        uuid: data.submissionUUID || data.submissionUUID || null,
                        status: 'Valid',
                        submission_date: new Date().toISOString(),
                        total: Number(sale.total || 0),
                        createdAt: serverTs()
                    });
                }
            } catch(logErr) { console.warn('Failed to write einvoice_logs:', logErr); }

            alert('تم إرسال الفاتورة وقبولها أولياً (202). تم تسجيلها في سجل الفواتير الإلكترونية.');
        } else {
            const txt = (data && data.raw) ? JSON.stringify(data.raw) : await resp.text();
            sale.taxUploadStatus = 'error';
            sale.etaStatus = 'error';
            sale.etaErrors = [txt.slice(0,300)];
            sale.etaLastCheckAt = new Date().toISOString();
            try { saveState(); } catch(_){ }
            renderAllSales();
            alert('فشل رفع الفاتورة: ' + txt);
        }
    } catch(e){ console.warn('uploadSaleToEta error', e); alert('تعذر رفع الفاتورة للمنظومة.'); }
}

// Load E-Invoice logs and tab wiring
function escapeHtml(str){
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

async function loadEinvoiceLogs(){
    try {
        if (!window.db) return;
        const body = document.getElementById('einvoice-log-table-body');
        if (!body) return;
        body.innerHTML = '';
        const snap = await db.collection('einvoice_logs').orderBy('submission_date','desc').limit(200).get();
        snap.forEach(doc => {
            const d = doc.data() || {};
            const invoiceNo = escapeHtml(d.invoice_number || '');
            const date = d.submission_date ? (new Date(d.submission_date)).toLocaleString() : '';
            const customer = escapeHtml(d.customerName || '');
            const total = Number(d.total || 0).toFixed(2);
            const uuid = escapeHtml(d.uuid || '');
            const status = escapeHtml(d.status || '');
            const row = `<tr class="text-sm text-gray-700"><td class="p-2">${invoiceNo}</td><td class="p-2">${date}</td><td class="p-2">${customer}</td><td class="p-2 text-right">${total}</td><td class="p-2">${uuid}</td><td class="p-2">${status}</td></tr>`;
            body.insertAdjacentHTML('beforeend', row);
        });
    } catch(e) { console.warn('loadEinvoiceLogs failed', e); }
}

document.addEventListener('DOMContentLoaded', function(){
    try {
        const rptBtn = document.getElementById('tax-tab-report');
        const einBtn = document.getElementById('tax-tab-einvoices');
        if (rptBtn && einBtn) {
            rptBtn.addEventListener('click', function(){
                document.getElementById('tax-report-tab').style.display = '';
                document.getElementById('tax-einvoices-tab').style.display = 'none';
                rptBtn.classList.add('bg-gray-100'); einBtn.classList.remove('bg-gray-100');
            });
            einBtn.addEventListener('click', async function(){
                document.getElementById('tax-report-tab').style.display = 'none';
                document.getElementById('tax-einvoices-tab').style.display = '';
                rptBtn.classList.remove('bg-gray-100'); einBtn.classList.add('bg-gray-100');
                await loadEinvoiceLogs();
            });
        }
    } catch(e){ console.warn('tax tabs wiring failed', e); }
});

// --- PROMOTION MODAL FUNCTION ---
function openPromotionModal(id = null) {
    promotionForm.reset();
    document.getElementById('promotion-id').value = '';
    populateProductDropdown(document.getElementById('promotion-product'));
    // Use a specific version for the customer dropdown in promotions to include "All Customers"
    const customerSelect = document.getElementById('promotion-customer-id');
    customerSelect.innerHTML = '<option value="">-- جميع العملاء --</option>' + state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    document.getElementById('original-price-display').classList.add('hidden');

    if (id) {
        // Edit mode
        const promotion = state.promotions.find(p => p.id === id);
        if (promotion) {
            document.getElementById('promotion-modal-title').textContent = 'تعديل العرض';
            document.getElementById('promotion-id').value = promotion.id;
            document.getElementById('promotion-name').value = promotion.name;
            document.getElementById('promotion-product').value = promotion.productId;
            document.getElementById('promotion-price').value = promotion.price;
            customerSelect.value = promotion.customerId || '';
            document.getElementById('promotion-start-date').value = promotion.startDate;
            document.getElementById('promotion-end-date').value = promotion.endDate;
            updatePromotionOriginalPriceDisplay(promotion.productId);
        }
    } else {
        // Add mode
        document.getElementById('promotion-modal-title').textContent = 'إضافة عرض جديد';
        // Set default dates
        document.getElementById('promotion-start-date').value = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        document.getElementById('promotion-end-date').value = nextMonth.toISOString().split('T')[0];
    }

    openModal(promotionModal);
}

// --- BACKUP & RESTORE FUNCTIONS ---
function copyTextToClipboard(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            customDialog({ title: 'نسخ', message: 'تم نسخ الكود إلى الحافظة.' });
        }).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); customDialog({ title: 'نسخ', message: 'تم نسخ الكود إلى الحافظة.' }); } catch (e) { customDialog({ title: 'خطأ', message: 'فشل نسخ الكود.' }); }
            ta.remove();
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); customDialog({ title: 'نسخ', message: 'تم نسخ الكود إلى الحافظة.' }); } catch (e) { customDialog({ title: 'خطأ', message: 'فشل نسخ الكود.' }); }
        ta.remove();
    }
}

function createBackup() {
    try {
        const backupTextarea = document.getElementById('backup-data-textarea');
        const copyBtn = document.getElementById('copy-backup-btn');
        const payload = JSON.stringify(state);
        if (backupTextarea) backupTextarea.value = payload;


        if (copyBtn) copyBtn.classList.remove('hidden');

        // Also store a timestamped backup in localStorage_backups
        try {
            const backupsRaw = localStorage.getItem('mandoobiAppState_backups');
            const backups = backupsRaw ? JSON.parse(backupsRaw) : [];
            backups.unshift({ ts: new Date().toISOString(), data: state });
            // Keep only recent 12 backups
            while (backups.length > 12) backups.pop();
            localStorage.setItem('mandoobiAppState_backups', JSON.stringify(backups));
        } catch (e) {
            console.warn('Failed to save local backup list', e);
        }

        customDialog({ title: 'نسخة احتياطية', message: 'تم إنشاء النسخة الاحتياطية محلياً ويمكنك نسخ الكود أو تحميله يدوياً.' });
    } catch (e) {
        console.error('createBackup failed', e);
        customDialog({ title: 'خطأ', message: 'فشل إنشاء النسخة الاحتياطية.' });
    }
}

// --- LOCAL-STATE DEBUG & RESTORE PANEL (shows when state is empty) ---
function showLocalStateDebug() {
    if (document.getElementById('app-local-debug')) return; // already present

    try {
        const panel = document.createElement('div');
        panel.id = 'app-local-debug';
        panel.style.position = 'fixed';
        panel.style.right = '18px';
        panel.style.bottom = '18px';
        panel.style.width = '360px';
        panel.style.maxHeight = '60vh';
        panel.style.overflow = 'auto';
        panel.style.zIndex = '99999';
        panel.style.background = 'linear-gradient(180deg,#fff, #fbfaf8)';
        panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        panel.style.borderRadius = '8px';
        panel.style.padding = '12px';
        panel.style.fontSize = '13px';
        panel.style.direction = 'rtl';
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <strong style="font-size:14px">تشخيص واسترداد الحالة المحلية</strong>
                <button id="close-local-debug" style="background:#eee;border:none;padding:6px 8px;border-radius:6px;cursor:pointer">إغلاق</button>
            </div>
            <div style="font-size:12px;color:#444;margin-bottom:8px">ملاحظة: عند فتح الملف عبر <code>file://</code>، فإن الـlocalStorage مرتبط بمسار الملف؛ نقل الملف قد يجعل البيانات غير مرئية. إذا كانت لديك نسخة احتياطية، الصقها في الحقل أدناه ثم اضغط استرجاع.</div>
            <div style="margin-bottom:8px">
                <div id="local-state-keys" style="background:#fff;padding:8px;border:1px solid #eee;border-radius:6px;max-height:120px;overflow:auto"></div>
            </div>
            <div style="margin-bottom:8px">
                <textarea id="local-state-restore" placeholder="الصق هنا JSON كامل للحالة (مثال: محتوى mandoobiAppState)" style="width:100%;height:120px;border:1px solid #ddd;padding:8px;border-radius:6px;font-size:12px"></textarea>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-start">
                <button id="restore-state-btn" style="background:#1f7bd7;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer">استرجاع الحالة</button>
                <button id="download-backups-btn" style="background:#6b7280;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer">تنزيل النسخ الاحتياطية</button>
                <button id="open-storage-btn" style="background:#10b981;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer">عرض في Console</button>
            </div>
            <div id="local-state-msg" style="margin-top:8px;font-size:12px;color:#444"></div>
        `;

        document.body.appendChild(panel);

        // Populate keys/preview
        const keysEl = document.getElementById('local-state-keys');
        try {
            const keys = Object.keys(localStorage).filter(k => k.includes('mandoobiAppState') || k.includes('mandoobi'));
            if (keys.length === 0) {
                keysEl.textContent = 'لا توجد مفاتيح محلية متعلقة بالتطبيق في localStorage لهذه الصفحة.';
            } else {
                keys.forEach(k => {
                    const raw = localStorage.getItem(k);
                    let preview = '';
                    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed.sales)) { preview = `sales:${parsed.sales.length}`; } else if (parsed && parsed.sales) { preview = `sales:${(parsed.sales && parsed.sales.length) || '؟'}`; } else preview = raw ? raw.toString().slice(0,200) : 'empty'; } catch (e) { preview = raw ? raw.toString().slice(0,200) : 'empty'; }
                    const row = document.createElement('div');
                    row.style.padding = '6px 0';
                    row.style.borderBottom = '1px dashed #f0f0f0';
                    row.innerHTML = `<div style="font-weight:600;margin-bottom:4px">${k}</div><div style='font-size:12px;color:#666'>${preview}</div>`;
                    keysEl.appendChild(row);
                });
            }
        } catch (e) { keysEl.textContent = 'فشل قراءة localStorage: ' + (e.message || e); }

        document.getElementById('close-local-debug').addEventListener('click', () => panel.remove());

        document.getElementById('open-storage-btn').addEventListener('click', () => {
            console.log('LocalStorage keys for this origin:');
            Object.keys(localStorage).forEach(k => console.log(k, localStorage.getItem(k)));
            const msg = document.getElementById('local-state-msg'); if (msg) msg.textContent = 'تم طباعة المحتوى في Console. افتح DevTools -> Console.';
        });

        document.getElementById('download-backups-btn').addEventListener('click', () => {
            try {
                const raw = localStorage.getItem('mandoobiAppState_backups');
                if (!raw) { document.getElementById('local-state-msg').textContent = 'لا توجد نسخ احتياطية محفوظة.'; return; }
                const a = document.createElement('a');
                const blob = new Blob([raw], { type: 'application/json' });
                a.href = URL.createObjectURL(blob);
                a.download = 'mandoobiAppState_backups.json';
                a.click();
                document.getElementById('local-state-msg').textContent = 'تم تنزيل النسخ الاحتياطية.';
            } catch (e) { document.getElementById('local-state-msg').textContent = 'فشل تنزيل النسخ الاحتياطية: ' + (e.message || e); }
        });

        document.getElementById('restore-state-btn').addEventListener('click', () => {
            const ta = document.getElementById('local-state-restore');
            const msg = document.getElementById('local-state-msg');
            if (!ta || !ta.value.trim()) { if (msg) msg.textContent = 'الرجاء لصق JSON صالح في الحقل أعلاه.'; return; }
            try {
                const parsed = JSON.parse(ta.value);
                localStorage.setItem('mandoobiAppState', JSON.stringify(parsed));
                if (msg) msg.textContent = 'تم حفظ الحالة المحلية. سيتم إعادة تحميل الصفحة.';
                setTimeout(() => location.reload(), 800);
            } catch (e) {
                if (msg) msg.textContent = 'خطأ في قراءة JSON: ' + (e.message || e);
            }
        });

    } catch (e) {
        console.warn('showLocalStateDebug failed', e);
    }
}

async function restoreBackup() {
    try {
        const raw = document.getElementById('restore-data-textarea')?.value || '';
        if (!raw) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء لصق كود النسخة الاحتياطية في الحقل المخصص.' });
            return;
        }

        let parsed;
        try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
        if (!parsed) {
            await customDialog({ title: 'خطأ', message: 'كود النسخة غير صالح. تأكد أنك قمت بلصق الكود كاملاً.' });
            return;
        }

        const confirmed = await customDialog({ title: 'تأكيد الاستعادة', message: 'ستُستبدل جميع البيانات الحالية بالنسخة التي ألصقتها. هل تريد المتابعة؟', isConfirm: true, confirmText: 'نعم، استعد الآن', confirmClass: 'bg-red-600 hover:bg-red-700' });
        if (!confirmed) return;

        state = parsed;
        saveState();
        renderAll();
        await customDialog({ title: 'استعادة', message: 'تم استعادة البيانات من النسخة الملصوقة.' });
    } catch (e) {
        console.error('restoreBackup failed', e);
        await customDialog({ title: 'خطأ', message: 'فشل استعادة النسخة. تأكد من صحة الكود وحاول مرة أخرى.' });
    }
}


// --- All Function Definitions END ---

// ================================================================
// ===== INITIALIZATION AND AUTHENTICATION ======================
// ================================================================

// --- Firebase Initialization (Compat) ---
// No firebaseConfig is embedded here. Provide `window.firebaseConfig` before loading this file.
// When you create the project, add a small inline script before this file that sets `window.firebaseConfig = {...}`
// تمت إزالة التهيئة المكررة هنا. التهيئة الأصلية تحدث في أعلى الملف عبر initFirebase().
// إبقاء هذا التعليق للتوضيح فقط.

// Ensure UI is not accidentally blocked by visible modals/overlays and attach listeners on DOM ready.
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Hide any modals that may be visible due to previous state
        document.querySelectorAll('.modal').forEach(m => {
            try {
                m.classList.remove('modal-visible');
                m.classList.add('modal-hidden');
            } catch (e) {}
        });

        // Ensure loading modal is hidden
        const lm = document.getElementById('loading-modal');
        if (lm) { lm.classList.remove('modal-visible'); lm.classList.add('modal-hidden'); }

        // Make sure the app container accepts pointer events
        const app = document.getElementById('app-container');
        if (app) app.style.pointerEvents = 'auto';

        // Attach event listeners even when auth is not present (file:// offline case)
        try { setupAllEventListeners(); } catch (e) { console.warn('setupAllEventListeners failed on DOMContentLoaded', e); }

        // Small wiring for Costs unified grid controls (refresh, export buttons etc.)
        try {
            const refreshBtn = document.getElementById('unified-refresh-btn');
            if (refreshBtn) refreshBtn.addEventListener('click', () => { try { renderUnifiedPriceGrid(); } catch(e){} });
            const exportJsonBtn = document.getElementById('unified-export-json-btn');
            if (exportJsonBtn) exportJsonBtn.addEventListener('click', async () => {
                try {
                    const payload = JSON.stringify(state.products || [], null, 2);
                    const blob = new Blob([payload], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'products-prices.json'; a.click(); URL.revokeObjectURL(url);
                } catch (e) { console.warn('export unified json failed', e); }
            });

            const exportCsvBtn = document.getElementById('unified-export-csv-btn');
            if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => {
                try {
                    const category = document.getElementById('unified-category-filter')?.value || 'all';
                    const products = Array.isArray(state.products) ? state.products.slice() : [];
                    const rows = products.filter(p => {
                        if (category === 'all') return true;
                        if (category === 'raw') return String(p.category||'').toLowerCase().includes('raw');
                        if (category === 'packaging') return String(p.category||'').toLowerCase().includes('packag');
                        if (category === 'finished') return !(String(p.category||'').toLowerCase().includes('raw') || String(p.category||'').toLowerCase().includes('packag'));
                        if (category === 'operation') return (p.operationCost !== undefined);
                        return true;
                    }).map(p => ({ id: p.id||'', name: p.name||'', category: p.category||'', price: p.price||'', cost: p.cost||'', operationCost: p.operationCost||'' }));
                    const headers = ['id','name','category','price','cost','operationCost'];
                    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => '"' + String(r[h]||'').replace(/"/g,'""') + '"').join(','))).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'products-prices.csv'; a.click(); URL.revokeObjectURL(url);
                } catch (e) { console.warn('export unified csv failed', e); }
            });
        } catch (e) { console.warn('unified grid controls bind failed', e); }

        // Small safety: if page-debts is active, trigger a render to populate rows
        setTimeout(() => {
            try { if (document.getElementById('page-debts')?.classList.contains('active')) renderDebts(); } catch (e) {}
        }, 80);
    } catch (e) { console.warn('Startup cleanup failed', e); }
});

// --- Loading Functions ---
function showLoading(message = "جارٍ التحميل...") {
    try {
        const el = document.getElementById('loading-message');
        if (el) el.textContent = message;
        if (typeof openModal === 'function' && typeof loadingModal !== 'undefined' && loadingModal) {
            openModal(loadingModal);
        }
    } catch (e) {
        console.warn('showLoading failed:', e);
    }
}
function hideLoading() {
    try {
        if (typeof closeModal === 'function' && typeof loadingModal !== 'undefined' && loadingModal) {
            closeModal(loadingModal);
        }
    } catch (e) {
        console.warn('hideLoading failed:', e);
    }
}

// --- Event Listener Setup ---
let eventListenersAttached = false;
function setupAllEventListeners() {
    if (eventListenersAttached) return;
    console.log("Attaching event listeners for the first time...");

    // Navigation
    setupNavigationHandlers();

    // Dashboard
    document.getElementById('dashboard-rep-filter').addEventListener('change', renderDashboard);


    // Sales Page - Monthly Calendar Selector
    const salesMonthSelector = document.getElementById('sales-month-selector');
    
    function updateMonthDisplay(){
        // Month display removed from UI, but still tracking for filtering
        if(!state.activePeriod) return;
        // activePeriod is now auto-applied on change
    }
    
    if(salesMonthSelector){
        // Set default to current month
        const now = new Date();
        const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        salesMonthSelector.value = currentMonth;
        
        // Apply month filter immediately on change
        salesMonthSelector.addEventListener('change', () => {
            if(!state) state = {};
            state.activePeriod = salesMonthSelector.value ? salesMonthSelector.value : null;
            salesSearchHandler();
        });
    }
    
    // Sales Page
    const searchSalesDateInput = document.getElementById('search-sales-date');
    const clearSalesDateBtn = document.getElementById('clear-sales-date-btn');
    const salesSearchHandler = () => {
        const textFilter = document.getElementById('search-sales-text').value;
        const dateFilter = searchSalesDateInput.value;
        const taxStatusFilter = document.getElementById('tax-status-filter').value;
        const reviewFilter = document.getElementById('review-status-filter')?.value || 'all';
        clearSalesDateBtn.classList.toggle('hidden', !dateFilter);
        renderAllSales(textFilter, dateFilter, taxStatusFilter, reviewFilter);
    };
    document.getElementById('search-sales-text').addEventListener('input', salesSearchHandler);
    searchSalesDateInput.addEventListener('input', salesSearchHandler);
    document.getElementById('tax-status-filter').addEventListener('change', salesSearchHandler);
    document.getElementById('review-status-filter').addEventListener('change', salesSearchHandler);
    clearSalesDateBtn.addEventListener('click', () => {
        searchSalesDateInput.value = '';
        salesSearchHandler();
    });

    // Total Bills Page
    document.getElementById('apply-filters-btn').addEventListener('click', () => renderTotalBills());
    const resetToCurrentMonthBtn = document.getElementById('reset-to-current-month-btn');
    if (resetToCurrentMonthBtn) {
        resetToCurrentMonthBtn.addEventListener('click', () => {
            setCurrentMonthDates();
            renderTotalBills();
        });
    }
    // Debts Page - apply filters button (added)
    const applyDebtsBtn = document.getElementById('apply-debts-filters-btn');
    if (applyDebtsBtn) applyDebtsBtn.addEventListener('click', () => renderDebts());
    
    // Add event listener for "Show Unpaid Only" checkbox
    const hidePaidCheckbox = document.getElementById('hide-paid-debts');
    if (hidePaidCheckbox) {
        hidePaidCheckbox.addEventListener('change', () => {
            // Save state to localStorage
            localStorage.setItem('debts_hidePaid', hidePaidCheckbox.checked);
            renderDebts();
        });
        // Restore saved state from localStorage
        const savedState = localStorage.getItem('debts_hidePaid');
        if (savedState !== null) {
            hidePaidCheckbox.checked = savedState === 'true';
        }
    }
    
    let currentSort = { key: 'date', direction: 'desc' };
    // Highlight handler for Total Bills table
    document.getElementById('total-bills-table-body').addEventListener('click', (e) => {
        const cell = e.target.closest('.invoice-cell');
        if (cell) {
            const saleId = cell.dataset.id;
            if (saleId) {
                toggleReviewColor(saleId, cell);
            }
        }
    });

    document.getElementById('total-bills-table').querySelector('thead').addEventListener('click', (e) => {
        const header = e.target.closest('th[data-sort]');
        if (!header) return;

        const sortKey = header.dataset.sort;
        if (currentSort.key === sortKey) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.key = sortKey;
            currentSort.direction = 'desc';
        }
        renderTotalBills(currentSort.key, currentSort.direction);
    });

    const selectAllCheckbox = document.getElementById('select-all-total-bills');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('#total-bills-table-body input.total-bill-row-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }

    // Stock Control Page
    const stockControlDateEl = document.getElementById('stock-control-date');
    if (stockControlDateEl) stockControlDateEl.addEventListener('change', renderStockLedger);
    const saveStockControlBtnEl = document.getElementById('save-stock-control-btn');
    if (saveStockControlBtnEl) saveStockControlBtnEl.addEventListener('click', saveStockBalances);

    // Finished Products Page (using the same rendering as stock-control)
    const finishedProductsDateEl = document.getElementById('finished-products-date');
    if (finishedProductsDateEl) {
        finishedProductsDateEl.addEventListener('change', () => {
            try { if (typeof window.installStockEntriesListenerForDate === 'function') window.installStockEntriesListenerForDate(finishedProductsDateEl.value); } catch(_){}
            renderStockLedgerForFinishedProducts();
        });
        // Initial render + subscribe to this date's live doc
        try { if (typeof window.installStockEntriesListenerForDate === 'function') window.installStockEntriesListenerForDate(finishedProductsDateEl.value); } catch(_){}
        renderStockLedgerForFinishedProducts();
    }
    const saveFinishedProductsBtn = document.getElementById('save-finished-products-btn');
    if (saveFinishedProductsBtn) {
        saveFinishedProductsBtn.addEventListener('click', saveStockBalancesForFinishedProducts);
    }

    // Sale Modal Form
    saleForm.addEventListener('submit', saveSale);
    document.getElementById('cancel-sale-btn').addEventListener('click', () => closeModal(saleModal));
    document.getElementById('add-sale-item-btn').addEventListener('click', () => addSaleItemRow());
    document.getElementById('sale-status').addEventListener('change', updateSaleSummary);
    document.getElementById('sale-discount').addEventListener('input', updateSaleSummary);

    // Other page listeners...
    document.getElementById('search-customers').addEventListener('input', (e) => renderCustomers(e.target.value));
    initializeChainsDisplay(); // Initialize chains display on page load
    document.getElementById('search-products').addEventListener('input', (e) => renderSettings(e.target.value));
    document.getElementById('spreadsheet-save-all-btn').addEventListener('click', saveAllSpreadsheetEntries);
    document.getElementById('spreadsheet-add-row-btn').addEventListener('click', addSpreadsheetRow);
    // Compute next invoice number for a rep by querying Firestore (repId).
    // Do NOT rely on local `state` for this decision — query the canonical `invoices` collection.
    async function getNextInvoiceNumber(repId){
        try {
            if (!repId) return null;
            if (window.db && typeof db !== 'undefined') {
                try {
                    const q = await db.collection('invoices')
                        .where('repId', '==', String(repId))
                        .orderBy('invoiceNumber', 'desc')
                        .limit(1)
                        .get();
                    if (!q.empty) {
                        const d = q.docs[0].data();
                        const inv = Number(d && d.invoiceNumber) || 0;
                        if (inv > 0) return inv + 1;
                    }
                } catch (e) {
                    console.warn('getNextInvoiceNumber: firestore query failed', e);
                }
            } else {
                console.warn('getNextInvoiceNumber: no db available');
            }
        } catch (e) { console.warn('getNextInvoiceNumber failed', e); }
        // Default to 1 only if no invoices exist for this rep
        return 1;
    }

    // When user types a unified invoice number, populate rows
    unifiedInvoiceNumberInput.addEventListener('input', (e) => {
        const unifiedNumber = e.target.value.trim();
        spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => {
            const invoiceInput = row.querySelector('.spreadsheet-invoice-number');
            if (invoiceInput) invoiceInput.value = unifiedNumber;
        });
    });

    // When rep selection changes, query cloud for the last invoice (by repId) and prefill
    try {
        if (spreadsheetRepSelect) {
            spreadsheetRepSelect.addEventListener('change', async (ev) => {
                try {
                    const repNameOrId = ev.target.value;
                    if (!repNameOrId) { unifiedInvoiceNumberInput.value = ''; return; }
                    // Resolve rep id from state (dropdown contains names in many cases)
                    const rep = (state.reps||[]).find(r => r.id === repNameOrId || r.name === repNameOrId);
                    if (!rep || !rep.id) {
                        unifiedInvoiceNumberInput.value = '';
                        return;
                    }

                    // Prefer nextInvoiceNumber from the rep profile when available
                    if (rep.nextInvoiceNumber != null && rep.nextInvoiceNumber !== '') {
                        unifiedInvoiceNumberInput.value = String(rep.nextInvoiceNumber);
                        // fill rows incrementally starting from rep.nextInvoiceNumber
                        let offset = 0;
                        spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => {
                            const invoiceInput = row.querySelector('.spreadsheet-invoice-number');
                            if (invoiceInput && !invoiceInput.value) {
                                invoiceInput.value = String(Number(rep.nextInvoiceNumber) + offset);
                                offset++;
                            }
                        });
                        return;
                    }

                    // Fallback: query cloud for canonical last invoice
                    const next = await getNextInvoiceNumber(rep.id);
                    if (next != null) {
                        unifiedInvoiceNumberInput.value = String(next);
                        // fill rows with incrementing invoice numbers if they are empty
                        let offset = 0;
                        spreadsheetEntryBody.querySelectorAll('.spreadsheet-row').forEach(row => {
                            const invoiceInput = row.querySelector('.spreadsheet-invoice-number');
                            if (invoiceInput && !invoiceInput.value) {
                                invoiceInput.value = String(next + offset);
                                offset++;
                            }
                        });
                    }
                } catch(e){ console.warn('spreadsheet rep change handler failed', e); }
            });
            // If a rep is already selected on load, attempt to prefill from cloud
            (async function(){
                try {
                    const cur = spreadsheetRepSelect.value;
                    if (cur) {
                        const rep = (state.reps||[]).find(r => r.id === cur || r.name === cur);
                        if (rep && rep.id) {
                            if (rep.nextInvoiceNumber != null && rep.nextInvoiceNumber !== '') {
                                unifiedInvoiceNumberInput.value = String(rep.nextInvoiceNumber);
                            } else {
                                const n = await getNextInvoiceNumber(rep.id);
                                if (n != null) unifiedInvoiceNumberInput.value = String(n);
                            }
                        }
                    }
                } catch(_){ }
            })();
        }
    } catch(e){ console.warn('bind spreadsheetRepSelect failed', e); }

    // Settings: products & price-lists handlers
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) addProductBtn.addEventListener('click', () => openProductModal());
    const addPriceListBtn = document.getElementById('add-price-list-btn');
    if (addPriceListBtn) addPriceListBtn.addEventListener('click', () => openPriceListModal());

    // Product / Price list forms
    if (productForm) productForm.addEventListener('submit', saveProduct);
    const cancelProductBtn = document.getElementById('cancel-product-btn');
    if (cancelProductBtn) cancelProductBtn.addEventListener('click', () => closeModal(productModal));

    if (priceListForm) priceListForm.addEventListener('submit', savePriceList);
    const cancelPriceListBtn = document.getElementById('cancel-price-list-btn');
    if (cancelPriceListBtn) cancelPriceListBtn.addEventListener('click', () => closeModal(priceListModal));

    // ===== Stock Control: Add Product Buttons and Forms =====
    const addFinishedProductBtn = document.getElementById('add-finished-product-btn');
    if (addFinishedProductBtn) {
        addFinishedProductBtn.addEventListener('click', () => {
            document.getElementById('modal-add-finished-product').classList.remove('hidden');
        });
    }
    
    const addRawMaterialBtn = document.getElementById('add-raw-material-btn');
    if (addRawMaterialBtn) {
        addRawMaterialBtn.addEventListener('click', () => {
            document.getElementById('modal-add-raw-material').classList.remove('hidden');
        });
    }
    
    const addPackagingBtn = document.getElementById('add-packaging-item-btn');
    if (addPackagingBtn) {
        addPackagingBtn.addEventListener('click', () => {
            document.getElementById('modal-add-packaging').classList.remove('hidden');
        });
    }

    // Forms for stock control product additions
    const formAddFinishedProduct = document.getElementById('form-add-finished-product');
    if (formAddFinishedProduct) {
        formAddFinishedProduct.addEventListener('submit', saveFinishedProductFromStock);
    }
    
    const formAddRawMaterial = document.getElementById('form-add-raw-material');
    if (formAddRawMaterial) {
        formAddRawMaterial.addEventListener('submit', saveRawMaterialFromStock);
    }
    
    const formAddPackaging = document.getElementById('form-add-packaging');
    if (formAddPackaging) {
        formAddPackaging.addEventListener('submit', savePackagingFromStock);
    }

    // Delegated handlers for stock control add buttons (always available)
    document.addEventListener('click', (e) => {
        if (e.target.closest('#add-finished-product-btn')) {
            console.log('Clicked add finished product btn');
            document.getElementById('modal-add-finished-product').classList.remove('hidden');
        }
        if (e.target.closest('#add-raw-material-btn')) {
            console.log('Clicked add raw material btn');
            document.getElementById('modal-add-raw-material').classList.remove('hidden');
        }
        if (e.target.closest('#add-packaging-item-btn')) {
            console.log('Clicked add packaging btn');
            document.getElementById('modal-add-packaging').classList.remove('hidden');
        }
    });

    // Delegated click handlers for edit/delete buttons in Settings
    document.addEventListener('click', async (e) => {
        const editProd = e.target.closest('.edit-product-btn');
        if (editProd) {
            const id = editProd.dataset.id;
            if (id) openProductModal(id);
            return;
        }
        const delProd = e.target.closest('.delete-product-btn');
        if (delProd) {
            const id = delProd.dataset.id;
            if (!id) return;
            const confirmed = await customDialog({ isConfirm: true, message: 'هل متأكد أنك تريد حذف هذا المنتج؟', title: 'تأكيد الحذف', confirmText: 'حذف', confirmClass: 'bg-red-600 hover:bg-red-700' });
            if (confirmed) {
                try {
                    await deleteProduct(id);
                    await customDialog({ title: 'تم', message: 'تم حذف المنتج نهائياً.' });
                } catch (err) {
                    console.warn('deleteProduct failed', err);
                    await customDialog({ title: 'خطأ', message: 'تعذر حذف المنتج من السحابة.' });
                }
            }
            return;
        }

        const editPl = e.target.closest('.edit-price-list-btn');
        if (editPl) {
            const id = editPl.dataset.id;
            if (id) openPriceListModal(id);
            return;
        }
        const delPl = e.target.closest('.delete-price-list-btn');
        if (delPl) {
            const id = delPl.dataset.id;
            if (!id) return;
            const confirmed = await customDialog({ isConfirm: true, message: 'هل متأكد أنك تريد حذف هذه القائمة؟', title: 'تأكيد الحذف', confirmText: 'حذف', confirmClass: 'bg-red-600 hover:bg-red-700' });
            if (confirmed) {
                try {
                    await deletePriceListDoc(id);
                    await customDialog({ title: 'تم', message: 'تم حذف القائمة نهائياً.' });
                } catch (err) {
                    console.warn('deletePriceList failed', err);
                    await customDialog({ title: 'خطأ', message: 'تعذر حذف قائمة الأسعار من السحابة.' });
                }
            }
            return;
        }
    });

    const addCustomerBtn = document.getElementById('add-customer-btn');
    // Customers Page
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', () => {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'rep') { customDialog({ title: 'صلاحيات', message: 'المندوب لا يملك صلاحية إضافة عميل.' }); return; }
            openCustomerModal();
        });
        // إخفاء زر الإضافة للمندوب
        try { if ((typeof getUserRole === 'function') && getUserRole() === 'rep') addCustomerBtn.style.display = 'none'; } catch(_){}
    }
    document.getElementById('cancel-customer-btn').addEventListener('click', () => closeModal(customerModal));

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('customer-id').value;
        const payload = {
            name: document.getElementById('customer-name').value.trim(),
            taxNumber: document.getElementById('customer-tax-number').value.trim(),
            phone: document.getElementById('customer-phone').value.trim(),
            address: document.getElementById('customer-address').value.trim(),
            requiresTaxFiling: document.getElementById('customer-requires-tax').checked,
            priceListId: document.getElementById('customer-price-list').value || '',
            repName: document.getElementById('customer-rep').value || '',
            assignedRepId: (function(){
                const repField = document.getElementById('customer-rep').value || '';
                if (!repField) return '';
                try { const repObj = window.findRep ? window.findRep(repField) : null; return repObj ? repObj.id : ''; } catch(e){ return ''; }
            })()
        };

        if (!payload.name) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء إدخال اسم العميل.' });
            return;
        }

        const isDuplicate = Array.isArray(state.customers)
            ? state.customers.some(c => (c.name||'').trim() === payload.name && (c.id||c._id) !== id)
            : false;
        if (isDuplicate) {
            await customDialog({ title: 'اسم مكرر', message: 'يوجد عميل آخر بنفس الاسم. الرجاء استخدام اسم مختلف.' });
            return;
        }

        try {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'rep') { await customDialog({ title:'صلاحيات', message:'المندوب لا يملك صلاحية إضافة/تعديل العملاء.' }); return; }
            if (id) {
                await updateCustomer(id, payload);
            } else {
                await addCustomer(payload);
            }
            closeModal(customerModal);
            await customDialog({ message: 'تم حفظ بيانات العميل بنجاح.', title: 'نجاح' });
            // ملاحظة: سيتم تحديث القائمة تلقائياً عبر onSnapshot
        } catch (err) {
            const msg = (err && err.code === 'permission-denied') ? 'ليست لديك صلاحية تعديل العملاء' : 'فشل حفظ بيانات العميل';
            await customDialog({ title: 'خطأ', message: msg });
        }
    });

    document.getElementById('customers-list').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-customer-btn');
        const deleteBtn = e.target.closest('.delete-customer-btn');
        const claimBtn = e.target.closest('.claim-customer-btn');

        // مطالبة (تعيين) عميل غير معيّن للمندوب الحالي
        if (claimBtn) {
            try {
                const customerId = claimBtn.getAttribute('data-id');
                const current = AuthSystem.getCurrentUser();
                if (!current) { await customDialog({ title:'غير مسجل', message:'سجل الدخول أولاً.' }); return; }
                const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
                if (role !== 'rep') { await customDialog({ title:'ممنوع', message:'هذه الميزة للمندوبين فقط.' }); return; }
                const customer = (state.customers||[]).find(c => (c.id||c._id) === customerId);
                if (!customer) return;
                if (customer.assignedRepId) { await customDialog({ title:'تم التعيين', message:'هذا العميل أصبح مخصصاً بالفعل.' }); return; }
                const repNameGuess = current.name || (current.email ? current.email.split('@')[0] : 'مندوب');
                await updateCustomer(customerId, { assignedRepId: current.id, repName: customer.repName || repNameGuess });
                await customDialog({ title:'تم', message:'تم تعيين العميل لك.' });
                try { renderCustomerList(document.getElementById('search-customers')?.value || ''); } catch(e){}
            } catch(err){ console.warn('claim customer failed', err); }
            return; // لا تتابع للأزرار الأخرى
        }

        if (editBtn) {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'rep') { await customDialog({ title:'صلاحيات', message:'المندوب لا يملك صلاحية تعديل العملاء.' }); return; }
            const customerId = editBtn.dataset.id;
            const customer = (state.customers||[]).find(c => (c.id||c._id) === customerId);
            if (!canManageCustomer(customer)) {
                await customDialog({ title:'صلاحيات', message:'لا يمكنك تعديل هذا العميل لأنه ليس مخصصاً لك.' });
                return;
            }
            openCustomerModal(customerId);
        }

        if (deleteBtn) {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'rep') { await customDialog({ title:'صلاحيات', message:'المندوب لا يملك صلاحية حذف العملاء.' }); return; }
            const customerId = deleteBtn.dataset.id;
            const customer = Array.isArray(state.customers)
                ? state.customers.find(c => (c.id||c._id) === customerId)
                : null;
            if (!customer) return;
            if (!canManageCustomer(customer)) {
                await customDialog({ title:'صلاحيات', message:'لا يمكنك حذف هذا العميل لأنه ليس مخصصاً لك.' });
                return;
            }

            const customerHasSales = Array.isArray(state.sales)
                ? state.sales.some(s => s.customerId === customerId)
                : false;
            if (customerHasSales) {
                await customDialog({
                    title: 'لا يمكن الحذف',
                    message: `لا يمكن حذف العميل "${customer.name}" لأن لديه فواتير مسجلة.`
                });
                return;
            }

            const confirmed = await customDialog({
                title: 'تأكيد الحذف',
                message: `هل أنت متأكد أنك تريد حذف العميل "${customer.name}"؟`,
                isConfirm: true,
                confirmText: 'نعم، احذف',
                confirmClass: 'bg-red-600 hover:bg-red-700'
            });

            if (confirmed) {
                try {
                    await deleteCustomer(customerId);
                    await customDialog({ message: 'تم حذف العميل بنجاح.' });
                    // سيتم تحديث القائمة تلقائياً عبر onSnapshot
                } catch (err) {
                    const msg = (err && err.code === 'permission-denied') ? 'ليست لديك صلاحية حذف العملاء' : 'فشل حذف العميل';
                    await customDialog({ title: 'خطأ', message: msg });
                }
            }
        }
    });

    // Reps Page
    document.getElementById('add-rep-btn').addEventListener('click', () => openRepModal());
    document.getElementById('cancel-rep-btn').addEventListener('click', () => closeModal(repModal));

    repForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('rep-id').value;
        const name = document.getElementById('rep-name').value.trim();
        const serial = document.getElementById('rep-serial').value.trim();
        const target = parseFloat(document.getElementById('rep-target').value) || 0;
        const nextInvoiceNumber = parseInt(document.getElementById('rep-next-invoice').value) || null;

        if (!name) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء إدخال اسم المندوب.' });
            return;
        }

        const isDuplicate = (state.reps||[]).some(r => r.name === name && r.id !== id);
        if (isDuplicate) {
            await customDialog({ title: 'اسم مكرر', message: 'يوجد مندوب آخر بنفس الاسم. الرجاء استخدام اسم مختلف.' });
            return;
        }

        try {
            if (id) {
                await updateRepDoc(id, { name, serial, target, nextInvoiceNumber });
            } else {
                await addRepDoc(undefined, { name, serial, target, nextInvoiceNumber });
            }
            closeModal(repModal);
            await customDialog({ message: 'تم حفظ بيانات المندوب في السحابة.', title: 'نجاح' });
        } catch (err) {
            console.warn('saveRep cloud failed', err);
            await customDialog({ title: 'خطأ', message: 'تعذر حفظ بيانات المندوب. تحقق من الاتصال والصلاحيات.' });
        }
    });

    document.getElementById('reps-list').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-rep-btn');
        const deleteBtn = e.target.closest('.delete-rep-btn');

        if (editBtn) {
            const repId = editBtn.dataset.id;
            openRepModal(repId);
        }

        if (deleteBtn) {
            const repId = deleteBtn.dataset.id;
            const rep = (state.reps||[]).find(r => r.id === repId);
            if (!rep) return;

            const repHasSales = (state.sales||[]).some(s => s.repName === rep.name);
            if (repHasSales) {
                await customDialog({
                    title: 'لا يمكن الحذف',
                    message: `لا يمكن حذف المندوب "${rep.name}" لأن لديه فواتير مسجلة. يمكنك تعديل بياناته بدلاً من ذلك.`
                });
                return;
            }

            const confirmed = await customDialog({
                title: 'تأكيد الحذف',
                message: `هل أنت متأكد أنك تريد حذف المندوب "${rep.name}"؟`,
                isConfirm: true,
                confirmText: 'نعم، احذف',
                confirmClass: 'bg-red-600 hover:bg-red-700'
            });

            if (confirmed) {
                try {
                    await deleteRepDoc(repId);
                    await customDialog({ message: 'تم حذف المندوب نهائياً.' });
                } catch (err) {
                    console.warn('deleteRep failed', err);
                    await customDialog({ title: 'خطأ', message: 'تعذر حذف المندوب من السحابة.' });
                }
            }
        }
    });

    // Modal and Form Button Handlers
    document.getElementById('cancel-customer-btn').addEventListener('click', () => closeModal(customerModal));
    // ... Add all other modal and form handlers here from the old code

    document.getElementById('add-promotion-btn').addEventListener('click', () => openPromotionModal());
    document.getElementById('cancel-promotion-btn').addEventListener('click', () => closeModal(promotionModal));

    // Batch promotions editor wiring
    const bpAdd = document.getElementById('batch-promo-add-row');
    const bpSave = document.getElementById('batch-promo-save');
    if (bpAdd) bpAdd.addEventListener('click', () => addBatchPromoRow());
    if (bpSave) bpSave.addEventListener('click', saveBatchPromotions);

    promotionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('promotion-id').value;
        const promotionData = {
            id: id || Date.now().toString(),
            updatedAt: new Date().toISOString(),
            name: document.getElementById('promotion-name').value,
            productId: document.getElementById('promotion-product').value,
            price: parseFloat(document.getElementById('promotion-price').value),
            customerId: document.getElementById('promotion-customer-id').value || null,
            startDate: document.getElementById('promotion-start-date').value,
            endDate: document.getElementById('promotion-end-date').value,
        };

        if (!promotionData.name || !promotionData.productId || isNaN(promotionData.price) || !promotionData.startDate || !promotionData.endDate) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء ملء جميع الحقول المطلوبة (الاسم، المنتج، السعر، التواريخ).' });
            return;
        }

        try {
            if (window.db) {
                // Persist to Firestore
                if (id) {
                    await db.collection('promotions').doc(id).set({
                        name: promotionData.name,
                        productId: promotionData.productId,
                        price: Number(promotionData.price||0),
                        customerId: promotionData.customerId || null,
                        startDate: promotionData.startDate,
                        endDate: promotionData.endDate,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                } else {
                    const ref = db.collection('promotions').doc();
                    promotionData.id = ref.id;
                    await ref.set({
                        id: promotionData.id,
                        name: promotionData.name,
                        productId: promotionData.productId,
                        price: Number(promotionData.price||0),
                        customerId: promotionData.customerId || null,
                        startDate: promotionData.startDate,
                        endDate: promotionData.endDate,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }, { merge: false });
                }
            } else {
                // Fallback: update local state only
                if (id) {
                    const index = state.promotions.findIndex(p => p.id === id);
                    if (index >= 0) state.promotions[index] = promotionData; else state.promotions.push(promotionData);
                } else {
                    state.promotions.push(promotionData);
                }
            }
        } catch (err) {
            console.warn('حفظ العرض في Firestore فشل، سيتم الحفظ محلياً فقط', err);
            if (id) {
                const index = state.promotions.findIndex(p => p.id === id);
                if (index >= 0) state.promotions[index] = promotionData; else state.promotions.push(promotionData);
            } else {
                state.promotions.push(promotionData);
            }
        }

        closeModal(promotionModal);
        renderAll();
        await customDialog({ message: 'تم حفظ العرض بنجاح.', title: 'نجاح' });
    });

    document.getElementById('promotion-product').addEventListener('change', (e) => {
        updatePromotionOriginalPriceDisplay(e.target.value);
    });

    document.getElementById('promotions-list').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-promotion-btn');
        const deleteBtn = e.target.closest('.delete-promotion-btn');

        if (editBtn) {
            const promoId = editBtn.dataset.id;
            openPromotionModal(promoId);
        }

        if (deleteBtn) {
            const promoId = deleteBtn.dataset.id;
            const confirmed = await customDialog({
                title: 'تأكيد الحذف',
                message: 'هل أنت متأكد أنك تريد حذف هذا العرض؟',
                isConfirm: true,
                confirmText: 'نعم، احذف',
                confirmClass: 'bg-red-600 hover:bg-red-700'
            });

            if (confirmed) {
                try {
                    if (window.db) {
                        await db.collection('promotions').doc(promoId).delete();
                    }
                } catch (err) {
                    console.warn('فشل حذف العرض من Firestore، سيُحذف محلياً فقط', err);
                }
                state.promotions = state.promotions.filter(p => p.id !== promoId);
                renderAll();
                await customDialog({ message: 'تم حذف العرض بنجاح.' });
            }
        }
    });

    // Dynamic List Click Handlers (delegated)
    document.getElementById('sales-list').addEventListener('click', salesListClickHandler);
    // ... Add all other dynamic list handlers

    // Settings Page
    // Settings: save monthly sales target
    const saveTargetBtn = document.getElementById('save-target-btn');
    if (saveTargetBtn) saveTargetBtn.addEventListener('click', saveSalesTarget);
    document.getElementById('backup-data-btn').addEventListener('click', createBackup);
    document.getElementById('copy-backup-btn').addEventListener('click', () => copyTextToClipboard(document.getElementById('backup-data-textarea').value));
    document.getElementById('restore-data-btn').addEventListener('click', restoreBackup);
    // Admin-only: Cloud import tool wiring
    function showHideAdminImportTool(){
        try {
            const sec = document.getElementById('admin-cloud-import-section');
            if (!sec) return;
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
            if (role === 'admin') sec.classList.remove('hidden'); else sec.classList.add('hidden');
        } catch(e) { /* ignore */ }
    }
    async function handleAdminStartImport(){
        const statusEl = document.getElementById('admin-import-status');
        const btn = document.getElementById('admin-start-import-btn');
        const fileInput = document.getElementById('admin-import-file');
        const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        if (role !== 'admin') { alert('هذه الأداة متاحة للمشرف فقط'); return; }
        if (!window.db) { alert('Firestore غير جاهز. تأكد من تسجيل الدخول.'); return; }
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) { alert('من فضلك اختر ملف النسخة أولاً'); return; }
        const file = fileInput.files[0];
        btn.disabled = true;
        if (statusEl) statusEl.textContent = 'جاري قراءة الملف وتحليله...';
        try {
            const text = await new Promise((resolve, reject) => { const rdr = new FileReader(); rdr.onload = () => resolve(rdr.result); rdr.onerror = reject; rdr.readAsText(file, 'utf-8'); });
            const backup = (typeof parseBackupText === 'function') ? parseBackupText(text) : JSON.parse(text);
            if (!backup || typeof backup !== 'object') { throw new Error('صيغة الملف غير صالحة'); }
            if (statusEl) statusEl.textContent = 'جاري الاستيراد إلى Firestore (قد يستغرق دقائق للملفات الكبيرة)...';
            const options = {
                importCustomers: true,
                importProducts: true,
                importPriceLists: true,
                importSales: true,
                importReps: true,
                importPromotions: true,
                importSettings: true,
                importDispatchNotes: !!backup.dispatchNotes,
                importStockEntries: !!backup.stockEntries,
                importNotifications: !!backup.notifications
            };
            const res = await importBackupObject(backup, options);
            if (!res || res.ok !== true) {
                throw new Error('فشل الاستيراد: ' + (res && res.error ? (res.error.message || String(res.error)) : 'خطأ غير معروف'));
            }
            if (statusEl) {
                const c = res.counts || {};
                statusEl.textContent = `تم الاستيراد بنجاح ✅ — عملاء: ${c.customers||0}, منتجات: ${c.products||0}, قوائم أسعار: ${c.priceLists||0}, مناديب: ${c.reps||0}, مبيعات: ${c.sales||0}`;
            }
            try { scheduleEnsureCoreData(); } catch(e) {}
        } catch (e) {
            console.warn('Admin cloud import failed', e);
            alert('فشل الاستيراد: ' + (e && e.message ? e.message : 'خطأ غير معروف'));
        } finally {
            btn.disabled = false;
        }
    }
    showHideAdminImportTool();
    setTimeout(showHideAdminImportTool, 1200);
    setTimeout(showHideAdminImportTool, 4000);
    const adminStartBtn = document.getElementById('admin-start-import-btn');
    if (adminStartBtn) adminStartBtn.addEventListener('click', handleAdminStartImport);
    



    // Dispatch Notes Page (New Grid Implementation)
    document.getElementById('add-new-dispatch-item-btn').addEventListener('click', () => addRowToNewDispatchGrid());
    document.getElementById('save-new-dispatch-note-btn').addEventListener('click', saveNewDispatchNoteFromGrid);

    document.getElementById('page-dispatch').addEventListener('click', async (e) => {
            const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        // Expand/collapse note details
        const header = e.target.closest('.dispatch-note-header');
        if (header) {
            const card = header.closest('.dispatch-note-card');
            if (!card) return; // safety
            const details = card.querySelector('.dispatch-note-details');
            const icon = header.querySelector('i[data-lucide="chevron-down"]');
            if (!details) return; // safety
            const noteId = card.dataset.noteId;
            const isHidden = details.classList.contains('hidden');

            if (isHidden) {
                    // للمندوب: عرض للقراءة فقط
                    if (role === 'rep') {
                        try { renderReadonlyDispatchGrid(noteId, details); } catch(_) { /* fallback */ renderEditableDispatchGrid(noteId, details); }
                    } else {
                        renderEditableDispatchGrid(noteId, details);
                    }
                details.classList.remove('hidden');
                if (icon) icon.style.transform = 'rotate(180deg)';
            } else {
                details.classList.add('hidden');
                details.innerHTML = '';
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
            return;
        }

        // Update an existing note
        const updateBtn = e.target.closest('.update-dispatch-note-btn');
        if (updateBtn && role !== 'rep') {
            const noteId = updateBtn.dataset.noteId;
            const table = updateBtn.closest('.dispatch-note-details').querySelector('.editable-dispatch-table');
            await updateDispatchNote(noteId, table);
            return;
        }

        // Print a dispatch note
        const printBtn = e.target.closest('.print-dispatch-note-btn');
        if (printBtn) {
            const noteId = printBtn.dataset.noteId;
            printDispatchNote(noteId);
            return;
        }

        const copyBtn = e.target.closest('.copy-dispatch-note-btn');
        if (copyBtn) {
            const noteId = copyBtn.dataset.noteId;
            await copyDispatchNoteAsImage(noteId);
            return;
        }

        // Delete an existing note
        const deleteNoteBtn = e.target.closest('.delete-dispatch-note-btn');
        if (deleteNoteBtn && role !== 'rep') {
            const noteId = deleteNoteBtn.dataset.noteId;
            await deleteDispatchNote(noteId);
            return;
        }
        
        // Add a row to an editable grid
        const addRowBtn = e.target.closest('.add-editable-dispatch-item-btn');
        if (addRowBtn && role !== 'rep') {
            const tableBody = addRowBtn.closest('.dispatch-note-details').querySelector('tbody');
            const newRow = document.createElement('tr');
            newRow.className = 'dispatch-item-row';
            const productOptions = state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            newRow.innerHTML = `
                <td class="px-2 py-1"><select class="dispatch-item-product w-full p-1 border rounded-md text-sm" required><option value="">اختر منتج...</option>${productOptions}</select></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="quantity" placeholder="0" min="0"></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="goodReturn" placeholder="0" min="0"></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="damagedReturn" placeholder="0" min="0"></td>
                <td><input class="w-full p-1 border rounded-md text-center text-sm" type="number" data-field="freebie" placeholder="0" min="0"></td>
                <td class="px-2 py-1 text-center"><button type="button" class="delete-dispatch-item-btn text-red-500 hover:text-red-700 p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            `;
            tableBody.appendChild(newRow);
            updateIcons();
            return;
        }

        // Delete a row from any grid (new or editable)
        const deleteRowBtn = e.target.closest('.delete-dispatch-item-btn');
        if (deleteRowBtn && role !== 'rep') {
            const row = deleteRowBtn.closest('tr');
            if (row) row.remove();
            return;
        }
    });

    // Reports Page
    // Initialize chain dropdowns for reports
    populateChainsDropdown(document.getElementById('daily-report-chain'));
    populateChainsDropdown(document.getElementById('range-report-chain'));
    populateChainsDropdown(document.getElementById('monthly-report-chain'));
    populateChainsDropdown(document.getElementById('recon-report-chain'));
    populateChainsDropdown(document.getElementById('targets-chain-filter'));
    
    document.getElementById('generate-daily-report-btn').addEventListener('click', generateDailyReport);
    document.getElementById('generate-recon-report-btn').addEventListener('click', generateReconciliationReport);
    try { document.getElementById('generate-range-report-btn').addEventListener('click', generateRangeReport); } catch(e){}
    try { document.getElementById('generate-monthly-report-btn').addEventListener('click', generateMonthlyReport); } catch(e){}
    try { document.getElementById('generate-targets-report-btn').addEventListener('click', generateTargetsReport); } catch(e){}
    try { document.getElementById('generate-customer-targets-report-btn').addEventListener('click', generateCustomerTargetsReport); } catch(e){}
    // Targets: regenerate on month or rep filter change
    try {
        const tMonth = document.getElementById('targets-month');
        if (tMonth) tMonth.addEventListener('change', generateTargetsReport);
        const tRep = document.getElementById('targets-rep-filter');
        if (tRep) tRep.addEventListener('change', generateTargetsReport);
        const tChain = document.getElementById('targets-chain-filter');
        if (tChain) tChain.addEventListener('change', generateTargetsReport);
    } catch(e){}
    // Add chain change listeners to other reports
    try {
        const dChain = document.getElementById('daily-report-chain');
        if (dChain) dChain.addEventListener('change', generateDailyReport);
        const rChain = document.getElementById('range-report-chain');
        if (rChain) rChain.addEventListener('change', generateRangeReport);
        const mChain = document.getElementById('monthly-report-chain');
        if (mChain) mChain.addEventListener('change', generateMonthlyReport);
        const rcChain = document.getElementById('recon-report-chain');
        if (rcChain) rcChain.addEventListener('change', generateReconciliationReport);
    } catch(e){}
    // Customer Targets: handlers for month/category and save/refresh
    try {
        const cMonth = document.getElementById('customer-targets-month');
        if (cMonth) cMonth.addEventListener('change', generateCustomerTargetsReport);
        const cCat = document.getElementById('customer-targets-category');
        if (cCat) cCat.addEventListener('change', generateCustomerTargetsReport);
        const cRefresh = document.getElementById('refresh-customer-targets-btn');
        if (cRefresh) cRefresh.addEventListener('click', generateCustomerTargetsReport);
        const cSave = document.getElementById('save-customer-targets-btn');
        if (cSave) cSave.addEventListener('click', saveCustomerTargetsFromInputs);
    } catch(e){ console.warn('customer targets handlers failed', e); }
    // تمت إزالة تسوية بسيطة؛ لا حاجة لقوائم خاصة بها

    // Manual statement button
    document.getElementById('manual-statement-btn').addEventListener('click', () => {
        // Set default dates
        document.getElementById('end-date').value = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
        document.getElementById('start-date').value = thirtyDaysAgo;
        
        openModal(dateRangeModal);
        updateCustomerList();
    });

    

    // Manual statement form submission
    document.getElementById('date-range-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const category = document.querySelector('input[name="product-category"]:checked').value;
        const selectedCustomerNodes = document.querySelectorAll('#statement-customer-list input[type="checkbox"]:checked');
        
        if (!startDate || !endDate) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء تحديد تاريخ البداية والنهاية.' });
            return;
        }
        if (selectedCustomerNodes.length === 0) {
            await customDialog({ title: 'بيانات ناقصة', message: 'الرجاء اختيار عميل واحد على الأقل.' });
            return;
        }

        // Expand chain IDs to actual customer IDs
        let expandedIds = [];
        const chains = loadChains();
        Array.from(selectedCustomerNodes).forEach(node => {
            const val = node.value;
            if (val.startsWith('chain-')) {
                const chainId = val.substring(6);
                const chain = chains.find(c => c.id === chainId);
                if (chain) expandedIds.push(...(chain.customerIds || []));
            } else {
                expandedIds.push(val);
            }
        });
        
        const customerNames = expandedIds.map(id => findCustomer(id)?.name).filter(n => n).join(', ');
        const title = `كشف حساب يدوي`;

        generateAndShowStatement(new Date(startDate), new Date(endDate), expandedIds, title, customerNames, category);
        closeModal(dateRangeModal);
    });
    
    document.getElementById('cancel-date-range-btn').addEventListener('click', () => {
        closeModal(dateRangeModal);
    });

    // Search in statement customer list
    document.getElementById('statement-customer-search').addEventListener('input', (e) => {
        updateCustomerList(e.target.value);
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            alert('فشل تسجيل الخروج: ' + error.message);
        }
    });

    // Debts Page
    try {
        const debtCustomerInput = document.getElementById('debt-customer-filter');
        const debtRepSelect = document.getElementById('debt-rep-filter');
        const debtStartDate = document.getElementById('debt-start-date');
        const debtEndDate = document.getElementById('debt-end-date');
        const debtStatusSelect = document.getElementById('debt-status-filter');
        const debtsCsvBtn = document.getElementById('debts-csv-btn');
        const debtsPrintBtn = document.getElementById('debts-print-btn');

        if (debtRepSelect) populateRepDropdown(debtRepSelect);

        const debtsRerender = () => renderDebts();

        // debt-customer-filter is now a select populated only with customers that have invoices
        if (debtCustomerInput) debtCustomerInput.addEventListener('change', debtsRerender);
        if (debtRepSelect) debtRepSelect.addEventListener('change', debtsRerender);
        if (debtStartDate) debtStartDate.addEventListener('change', debtsRerender);
        if (debtEndDate) debtEndDate.addEventListener('change', debtsRerender);
        if (debtStatusSelect) debtStatusSelect.addEventListener('change', debtsRerender);

        if (debtsCsvBtn) {
            debtsCsvBtn.addEventListener('click', () => {
                const rows = (window._lastRenderedDebtsSales || []);
                if (!rows.length) {
                    customDialog({ title: 'تنبيه', message: 'لا توجد بيانات لتصديرها.' });
                    return;
                }
                const headers = ['اسم العميل', 'التاريخ', 'رقم الفاتورة', 'إجمالي الفاتورة', 'المسدد', 'المتبقي', 'المندوب'];
                const csv = [headers.join(',')].concat(rows.map(sale => {
                    const cust = findCustomer(sale.customerId)?.name || 'عميل محذوف';
                    const date = formatArabicDate(sale.date);
                    const inv = sale.invoiceNumber || '';
                    const total = (sale.total || 0).toFixed(2);
                    const paid = (sale.paidAmount || 0).toFixed(2);
                    const remaining = ( (sale.total || 0) - (sale.paidAmount || 0) ).toFixed(2);
                    const rep = sale.repName || '';
                    return [`"${cust}"`,`"${date}"`,`"${inv}"`,`"${total}"`,`"${paid}"`,`"${remaining}"`,`"${rep}"`].join(',');
                })).join('\n');

                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debts_export_${new Date().toISOString().slice(0,10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            });
        }

        if (debtsPrintBtn) {
            debtsPrintBtn.addEventListener('click', () => {
                const rows = (window._lastRenderedDebtsSales || []);
                const totalStats = window._lastRenderedDebtsStats || {};
                const w = window.open('', '', 'height=700,width=1000');
                if (!w) { alert('يرجى السماح بالنوافذ المنبثقة للطباعة'); return; }
                w.document.open();
                w.document.write('<html><head><title>طباعة مديونيات</title>');
                w.document.write('<link rel="stylesheet" href="https://cdn.tailwindcss.com">');
                w.document.write('<style>body{font-family: Cairo, sans-serif; direction: rtl; padding:20px;} table{width:100%;border-collapse:collapse;} th, td{padding:8px;border:1px solid #e5e7eb;text-align:center;} th{background:#fff7ed;color:#c2410c;}</style>');
                w.document.write('</head><body>');
                w.document.write('<h3 style="text-align:right">ملخص المديونيات</h3>');
                w.document.write(`<p style="text-align:right">إجمالي الفواتير: ${formatCurrency(totalStats.subtotal || 0)}</p>`);
                w.document.write(`<p style="text-align:right">المسدد: ${formatCurrency(totalStats.paid || 0)}</p>`);
                w.document.write(`<p style="text-align:right">عدد الفواتير: ${totalStats.count || 0}</p>`);
                w.document.write(`<p style="text-align:right">المديونيات: ${formatCurrency(totalStats.debts || 0)}</p>`);
                w.document.write('<hr/>');
                w.document.write('<table><thead><tr><th>اسم العميل</th><th>التاريخ</th><th>رقم الفاتورة</th><th>الإجمالي</th><th>المسدد</th><th>المتبقي</th><th>المندوب</th></tr></thead><tbody>');
                rows.forEach(sale => {
                    const cust = findCustomer(sale.customerId)?.name || 'عميل محذوف';
                    const date = formatArabicDate(sale.date);
                    const inv = sale.invoiceNumber || '';
                    const total = formatCurrency(sale.total || 0);
                    const paid = formatCurrency(sale.paidAmount || 0);
                    const remaining = formatCurrency((sale.total || 0) - (sale.paidAmount || 0));
                    const rep = sale.repName || '';
                    w.document.write(`<tr><td>${cust}</td><td>${date}</td><td>${inv}</td><td>${total}</td><td>${paid}</td><td>${remaining}</td><td>${rep}</td></tr>`);
                });
                w.document.write('</tbody></table>');
                w.document.write('</body></html>');
                w.document.close();
                const doPrint = () => { try { w.focus(); } catch(_){} try { w.print(); } catch(_){} };
                const closeBack = () => { try { w.close(); } catch(_){} try { window.focus(); } catch(_){} };
                if ('onafterprint' in w) { w.onafterprint = closeBack; } else { setTimeout(closeBack, 1200); }
                if ('onload' in w) { w.onload = () => setTimeout(doPrint, 120); } else { setTimeout(doPrint, 300); }
            });
        }
    } catch (e) {
        console.warn('Debts event listeners setup failed', e);
    }

    // Column filter UI removed; no global toggle handler attached.

    // ===== PRODUCTION PAGE TABS HANDLERS =====
    const tabActive = document.getElementById('tab-active-productions');
    const tabCompleted = document.getElementById('tab-completed-productions');
    const sectionActive = document.getElementById('active-productions-section');
    const sectionCompleted = document.getElementById('completed-productions-section');

    if (tabActive && tabCompleted && sectionActive && sectionCompleted) {
        // Handle Active Tab Click
        tabActive.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🟢 Switched to Active Productions');
            
            // Show active section, hide completed
            sectionActive.classList.remove('hidden');
            sectionCompleted.classList.add('hidden');
            
            // Update tab styling
            tabActive.classList.add('text-green-600', 'border-b-2', 'border-green-600');
            tabActive.classList.remove('text-gray-600', 'hover:text-gray-800');
            
            tabCompleted.classList.remove('text-green-600', 'border-b-2', 'border-green-600');
            tabCompleted.classList.add('text-gray-600', 'hover:text-gray-800');
        });

        // Handle Completed Tab Click
        tabCompleted.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔵 Switched to Completed Productions');
            
            // Show completed section, hide active
            sectionCompleted.classList.remove('hidden');
            sectionActive.classList.add('hidden');
            
            // Update tab styling
            tabCompleted.classList.add('text-green-600', 'border-b-2', 'border-green-600');
            tabCompleted.classList.remove('text-gray-600', 'hover:text-gray-800');
            
            tabActive.classList.remove('text-green-600', 'border-b-2', 'border-green-600');
            tabActive.classList.add('text-gray-600', 'hover:text-gray-800');
        });
    } else {
        if (!tabActive) console.warn('⚠️ tab-active-productions not found');
        if (!tabCompleted) console.warn('⚠️ tab-completed-productions not found');
        if (!sectionActive) console.warn('⚠️ active-productions-section not found');
        if (!sectionCompleted) console.warn('⚠️ completed-productions-section not found');
    }

    eventListenersAttached = true;
}

// --- Auth State Change Handler (guarded) ---
const internalAuthHandler = async (user) => {
    if (user) {
        // User is signed in
        console.log('User logged in:', user.email);
        showLoading("جاري تحميل البيانات المحلية...");
        logoutBtn.classList.remove('hidden');

            // 1. Load local data and initialize UI in a robust order:
            //    - load state
            //    - attach event listeners (so renders can wire controls)
            //    - render all UI
            //    - navigate to dashboard and force dashboard charts to render
            // loadState() مُلغاة؛ نعتمد على المستمعات اللحظية
            if (!window.state) window.state = { customers: [], products: [], sales: [], reps: [], promotions: [], settings: { salesTarget: 10000 } };
            // Preload cached collections so UI shows data even before permissions succeed
            try { preloadCachedCollections(); } catch(e){ console.warn('preloadCachedCollections (login) failed', e); }
            try { renderCompanyLogo(); } catch(e) { console.warn('renderCompanyLogo failed during startup', e); }
            try { applyWatermark(getCompanyLogoUrl()); } catch(e) { console.warn('applyWatermark failed during startup', e); }
            try { setupAllEventListeners(); } catch (e) { console.warn('setupAllEventListeners failed during startup:', e); }
            try { renderAll(); } catch (e) { console.warn('renderAll failed during startup:', e); }
            // Open dashboard by default (show data immediately)
            try { navigateTo('dashboard'); } catch (e) { console.warn('navigateTo failed during startup:', e); }
            // Small delayed forcing of dashboard charts to avoid timing issues
            setTimeout(() => {
                scheduleRender('charts', ()=>{ try { renderDashboard(); renderSales7DaysChart(); renderTopRepsChart(); renderTopProductsChart(); renderTopCustomersChart(); updateIcons(); } catch (e) { /* non-fatal */ } });
            }, 60);
            hideLoading(); // App is now usable.
            try { applyRoleUIRestrictions(); } catch(_){}

        // 2) فعّل مزامنة Firestore الحية + ضمان تعبئة البيانات الأساسية
        try {
            if (!window.__RT_LISTENERS_ATTACHED) {
                setupRealtimeListeners();
                window.__RT_LISTENERS_ATTACHED = true;
            }
        } catch(e) { console.warn('setupRealtimeListeners (auth handler) failed', e); }
        try { await importEmbeddedBackupIfNeeded(); } catch(e){ console.warn('importEmbeddedBackupIfNeeded (auth handler) failed', e); }
        try { scheduleEnsureCoreData(); } catch(e){ console.warn('scheduleEnsureCoreData (auth handler) failed', e); }

    } else {
        // User is signed out (or auth returned null). Do NOT delete localStorage automatically.
        // Treat this as offline fallback so the app keeps working with local data when opened via file://
        console.log('No authenticated user detected — starting offline/local mode');
        try { logoutBtn.classList.add('hidden'); } catch(e) {}

        try {
            // Robust offline startup: load local state, attach listeners, render UI and show dashboard
            if (!window.state) window.state = { customers: [], products: [], sales: [], reps: [], promotions: [], settings: { salesTarget: 10000 } };
            // Offline / signed-out: also hydrate from caches
            try { preloadCachedCollections(); } catch(e){ console.warn('preloadCachedCollections (offline) failed', e); }
            try { renderCompanyLogo(); } catch(e) { console.warn('renderCompanyLogo failed during offline startup', e); }
            try { applyWatermark(getCompanyLogoUrl()); } catch(e) { console.warn('applyWatermark failed during offline startup', e); }
            try { setupAllEventListeners(); } catch (e) { console.warn('setupAllEventListeners failed during offline startup:', e); }
            try { renderAll(); } catch (e) { console.warn('renderAll failed during offline startup:', e); }
            try { navigateTo('dashboard'); } catch (e) { console.warn('navigateTo failed during offline startup:', e); }
            setTimeout(() => {
                scheduleRender('charts', ()=>{ try { renderDashboard(); renderSales7DaysChart(); renderTopRepsChart(); renderTopProductsChart(); renderTopCustomersChart(); updateIcons(); } catch (e) { /* non-fatal */ } });
            }, 60);
        } catch (e) {
            console.warn('Offline startup failed, falling back to cleared state:', e);
            // As a last resort, initialize an empty state to keep the UI functional
            state = { customers: [], products: [], sales: [], priceLists: [], dispatchNotes: [], reps: [], promotions: [], settings: { salesTarget: 10000 } };
            renderAll();
        }
        try { applyRoleUIRestrictions(); } catch(_){}
    }
};

// Role-based UI restrictions
function applyRoleUIRestrictions(){
    try {
        const role = (typeof getUserRole === 'function') ? getUserRole() : 'user';
        if (role === 'rep') {
            const newDispatchSection = document.getElementById('new-dispatch-note-section');
            if (newDispatchSection) newDispatchSection.style.display = 'none';
            // Disable edit-related buttons globally on dispatch page
            document.querySelectorAll('.update-dispatch-note-btn,.delete-dispatch-note-btn,.add-editable-dispatch-item-btn,.delete-dispatch-item-btn,#save-new-dispatch-note-btn,#add-new-dispatch-item-btn').forEach(el=>{
                el.classList.add('pointer-events-none','opacity-50');
                if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') el.disabled = true;
            });
        }
    } catch(e){ console.warn('applyRoleUIRestrictions failed', e); }
}

// Register auth listener only if an auth object with a listener method exists
if (typeof auth !== 'undefined' && auth && typeof auth.onAuthStateChanged === 'function') {
    try {
        auth.onAuthStateChanged(internalAuthHandler);
    } catch (e) {
        console.warn('auth.onAuthStateChanged failed, falling back to safe handler:', e);
        internalAuthHandler(null);
    }
} else if (typeof onAuthStateChanged === 'function' && window.auth) {
    // support modular firebase export assigned to window.auth
    try {
        onAuthStateChanged(window.auth, internalAuthHandler);
    } catch (e) {
        console.warn('onAuthStateChanged(window.auth) failed, falling back:', e);
        internalAuthHandler(null);
    }
} else {
    // No auth available (likely opened via file:// or module failed).
    // Fallback: load local state and start app in offline mode instead of clearing state.
    console.warn('No Firebase auth available; loading local data for offline mode.');
    try {
        // Robust offline startup sequence: load -> listeners -> render -> navigate -> force charts
        if (!window.state) window.state = { customers: [], products: [], sales: [], reps: [], promotions: [], settings: { salesTarget: 10000 } };
        try { renderCompanyLogo(); } catch(e) { console.warn('renderCompanyLogo failed in fallback startup', e); }
        try { applyWatermark(getCompanyLogoUrl()); } catch(e) { console.warn('applyWatermark failed in fallback startup', e); }
        try { setupAllEventListeners(); } catch (e) { console.warn('setupAllEventListeners failed in fallback:', e); }
        try { renderAll(); } catch (e) { console.warn('renderAll failed in fallback:', e); }
        try { navigateTo('dashboard'); } catch (e) { console.warn('navigateTo failed in fallback:', e); }
        setTimeout(() => {
            try { renderDashboard(); renderSales7DaysChart(); renderTopRepsChart(); renderTopProductsChart(); renderTopCustomersChart(); updateIcons(); } catch (e) { /* ignore */ }
        }, 60);
    } catch (e) {
        console.error('Fallback UI initialization failed:', e);
    }
}

// --- Firestore Sync Function (merge-safe) ---
async function syncWithFirestore() {
    try {
        const lastSyncTimestamp = state.lastSyncTimestamp;
        console.log(`Starting incremental sync. Fetching changes since: ${lastSyncTimestamp || 'the beginning of time'}`);

        const collections = ['customers', 'products', 'sales', 'priceLists', 'dispatchNotes', 'reps', 'promotions', 'settings'];
        const queries = collections.map(col => {
            let query = db.collection(col);
            // For settings, we fetch the whole collection as it's usually one doc
            if (lastSyncTimestamp && col !== 'settings' && col !== 'sales') {
                query = query.where('updatedAt', '>', lastSyncTimestamp);
            }
            return query.get();
        });

        const snapshots = await Promise.all(queries);
        const newSyncTimestamp = new Date().toISOString();

        let hasChanges = false;
        snapshots.forEach((snapshot, index) => {
            const collectionName = collections[index];
            if (!snapshot.empty) {
                hasChanges = true;
                console.log(`Found ${snapshot.size} updated document(s) in ${collectionName}.`);
                snapshot.docs.forEach(doc => {
                    const data = { id: doc.id, ...doc.data() };
                    // Find and update/add the item in the local state
                    const collectionState = state[collectionName];
                    if (Array.isArray(collectionState)) {
                        const existingIndex = collectionState.findIndex(item => item.id === data.id);
                        if (existingIndex > -1) {
                            collectionState[existingIndex] = data; // Update
                        } else {
                            collectionState.push(data); // Add
                        }
                    }
                });
            } else if (collectionName === 'settings' && !snapshot.empty) {
                 // Special handling for settings (not an array)
                 hasChanges = true;
                 state.settings = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            }
        });

        if (hasChanges) {
            console.log('Changes found, state will be updated and saved.');
        } else {
            console.log('No new changes found from Firestore.');
        }

        // Update the sync timestamp regardless, to keep it current
        state.lastSyncTimestamp = newSyncTimestamp;



        // Save the newly synced state to local storage for the next offline load.
        saveState();
        console.log('Firestore sync process finished and state saved locally.');

    } catch (error) {
        console.error('syncWithFirestore failed:', error);
        // Don't update timestamp if sync fails
        throw error; // Re-throw to be caught by the caller's .catch()
    }
}

// --- Login Form Handler ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    const loginButton = e.submitter;
    loginButton.disabled = true;
    loginButton.textContent = 'جارٍ تسجيل الدخول...';

    try {
        // Use new service-based login (hybrid mode)
        const result = await (typeof window.loginUsingServices === 'function'
            ? window.loginUsingServices(email, password, { showAlertOnError: false })
            : auth.signInWithEmailAndPassword(email, password).then(() => ({ ok: true })));
        if (!result.ok) throw new Error(result.error || 'فشل تسجيل الدخول');
        // onAuthStateChanged will handle the rest
    } catch (err) {
        console.error('Login error:', err);
        alert('خطأ في تسجيل الدخول: ' + (err.message || ''));
        loginButton.disabled = false;
        loginButton.textContent = 'دخول';
    }
});

// === Cloud Helper Functions ===
window.ensureRawAndPackFromState = function(){
    const products = Array.isArray(window.state?.products) ? window.state.products : [];
    window.costPack = Array.isArray(window.costPack) ? window.costPack : [];
    const packRe = /تعبئة|تغليف|عبوة|ورق|كيس/i;
    const existIds = new Set(window.costPack.map(x => x.id));
    let added = 0;
    for (const p of products) {
        if (!p || !p.id || !p.name || p.category !== 'packaging') continue;
        if (!packRe.test(p.name)) continue;
        if (existIds.has(p.id)) continue;
        window.costPack.push({ id: p.id, name: p.name, stock: 0, price: p.price || 0 });
        existIds.add(p.id);
        added++;
    }
    if (added > 0) console.log('Added packaging items:', added);
};

window.saveCostListsToFirebase = async function(immediate){
    if (!immediate && Date.now() - (window._lastCloudSave || 0) < 3000) {
        console.log('⏳ saveCostListsToFirebase: skipping (debounced)');
        return;
    }
    window._lastCloudSave = Date.now();
    
    const rawMaterials = Array.isArray(window.costRaw) ? window.costRaw : [];
    const packaging = Array.isArray(window.costPack) ? window.costPack : [];
    const finished = Array.isArray(window.costFinished) ? window.costFinished : [];
    const operations = Array.isArray(window.costOps) ? window.costOps : [];
    
    if (rawMaterials.length === 0 && packaging.length === 0 && finished.length === 0 && operations.length === 0) {
        if (!window._appStartupComplete) {
            console.log('⏸ saveCostListsToFirebase: Startup not ready; skipping zero-save.');
            return;
        }
    }
    
    if (!window.db || !window.auth?.currentUser) {
        console.log('⚠ saveCostListsToFirebase: Firebase not ready or not logged in');
        return;
    }
    
    try {
        const serverTs = () => firebase.firestore.FieldValue.serverTimestamp();
        const ref = window.db.collection('settings').doc('costLists');
        const payload = { rawMaterials, packaging, finished, operations, updatedAt: serverTs() };
        await ref.set(payload, { merge: true });
        console.log('✅ Cost lists saved to Firestore');
    } catch (err) {
        console.error('❌ saveCostListsToFirebase failed:', err);
    }
};

    
