/**
 * Core Initialization & Global Utilities
 * تهيئة التطبيق والدوال المساعدة العامة
 */

// ===== Global Error Handler =====
window.onerror = function (msg, url, line, col, error) {
    try {
        const isGeneric = (!url || url === '') && (line === 0 || line === '0') && String(msg).toLowerCase().includes('script error');
        if (isGeneric) {
            // Silently ignore CORS-related generic script errors - these are expected from third-party resources
            // Return true to suppress error reporting
            return true;
        }
        const fullMsg = `Error: ${msg}\nFile: ${url || 'unknown'}\nLine: ${line}:${col}`;
        const stack = (error && error.stack) ? error.stack : '';
        console.error(fullMsg);
        if (stack) console.error(stack);
        const legacy = document.getElementById('global-error-banner');
        if (legacy) legacy.remove();
    } catch (e) {
        // swallow
    }
    return true;
};

// ===== Global Clock =====
function updateGlobalClock() {
    const clockEl = document.getElementById('global-clock-time');
    if (!clockEl) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('ar-EG');
    clockEl.textContent = `${dateStr} - ${timeStr}`;
}

// ===== Icon Update Helper =====
window.updateIcons = (function(){
    let scheduled = false;
    return function(){
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            try {
                if (window.lucide && typeof window.lucide.replace === 'function') {
                    window.lucide.replace();
                } else if (window.Lucide && typeof window.Lucide.replace === 'function') {
                    window.Lucide.replace();
                }
            } catch(e) { /* silent */ }
            scheduled = false;
        });
    };
})();

// ===== Render Scheduler (Performance Optimization) =====
(function(){
    const scheduled = new Map();
    const lastRun = new Map();
    const MIN_INTERVAL = 80; // ms between same-key renders
    
    function runTask(key, fn){
        scheduled.delete(key);
        try {
            const start = performance.now();
            fn();
            lastRun.set(key, start);
        } catch(e){ 
            console.warn('render task failed', key, e); 
        }
    }
    
    window.scheduleRender = function(key, fn){
        try {
            if (typeof key !== 'string') key = 'anon';
            const now = performance.now();
            const prev = lastRun.get(key) || 0;
            
            if (scheduled.has(key)) return; // already queued
            if ((now - prev) < MIN_INTERVAL) { // defer a bit more to batch
                const handle = setTimeout(() => { 
                    scheduled.delete(key); 
                    window.requestIdleCallback ? 
                        requestIdleCallback(() => runTask(key, fn), { timeout: 300 }) : 
                        requestAnimationFrame(() => runTask(key, fn)); 
                }, MIN_INTERVAL);
                scheduled.set(key, handle);
                return;
            }
            
            const handle = window.requestIdleCallback ? 
                requestIdleCallback(() => runTask(key, fn), { timeout: 300 }) : 
                requestAnimationFrame(() => runTask(key, fn));
            scheduled.set(key, handle);
        } catch(e){ 
            try { fn(); } catch(_){} 
        }
    };
})();

// ===== Global State & Utilities =====
(function(){
    try { 
        window.state = window.state || {}; 
    } catch(e) { 
        window.state = {}; 
    }
    
    // Currency formatter
    if (typeof window.formatCurrency !== 'function') {
        window.formatCurrency = function(n){ 
            try { 
                return new Intl.NumberFormat('ar-EG',{
                    style:'currency',
                    currency:'EGP',
                    maximumFractionDigits:2
                }).format(Number(n||0)); 
            } catch(e){ 
                return (Number(n||0)).toFixed(2)+' ج.م'; 
            } 
        };
    }
    
    // Find customer helper
    if (typeof window.findCustomer !== 'function') {
        window.findCustomer = function(id){ 
            try { 
                return (state.customers||[]).find(c=> (c.id||c._id)===id) || null; 
            } catch(e){ 
                return null; 
            } 
        };
    }
    
    // Customer list updater (placeholder)
    if (typeof window.updateCustomerList !== 'function') {
        window.updateCustomerList = function(){ /* noop safety */ };
    }
    
    // Default products
    if (typeof window.DEFAULT_PRODUCTS === 'undefined') {
        window.DEFAULT_COMPANY_LOGO_URL = 'https://i.ibb.co/YT4114YW/image.jpg';
    }
})();

// ===== Grid State Savers =====
document.addEventListener('DOMContentLoaded', function(){
    // Load grid states from localStorage
    try {
        window._rawGridState = JSON.parse(localStorage.getItem('raw_materials_grid') || '{}');
    } catch(e){ 
        window._rawGridState = {}; 
    }
    
    try {
        window._packGridState = JSON.parse(localStorage.getItem('packaging_grid') || '{}');
    } catch(e){ 
        window._packGridState = {}; 
    }
    
    console.debug('Loaded State:', { raw: window._rawGridState, pack: window._packGridState });
    
    // Define save functions if not already defined
    if (!window.saveRawGridStateNow){
        window.saveRawGridStateNow = async function(){ 
            try { 
                localStorage.setItem('raw_materials_grid', JSON.stringify(window._rawGridState || {})); 
            } catch(e){} 
            try { 
                if (window.db) await db.collection('settings').doc('costLists').set({ 
                    rawGridState: window._rawGridState, 
                    updatedAt: serverTs() 
                }, { merge:true }); 
            } catch(e){} 
        };
        
        window.debouncedRawSave = function(){ 
            clearTimeout(window._rawGridSaveTimer); 
            window._rawGridSaveTimer = setTimeout(window.saveRawGridStateNow, 700); 
        };
        
        window.savePackGridStateNow = async function(){ 
            try { 
                localStorage.setItem('packaging_grid', JSON.stringify(window._packGridState || {})); 
            } catch(e){} 
            try { 
                if (window.db) await db.collection('settings').doc('costLists').set({ 
                    packGridState: window._packGridState, 
                    updatedAt: serverTs() 
                }, { merge:true }); 
            } catch(e){} 
        };
        
        window.debouncedPackSave = function(){ 
            clearTimeout(window._packGridSaveTimer); 
            window._packGridSaveTimer = setTimeout(window.savePackGridStateNow, 700); 
        };
    }
    
    // Start clock
    updateGlobalClock();
    setInterval(updateGlobalClock, 1000);
});

// ===== Page Navigation on Load =====
window.addEventListener('load', function() {
    var pages = document.getElementsByClassName('page');
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove('active');
    }
    
    var dashboard = document.getElementById('page-dashboard');
    if (dashboard) dashboard.classList.add('active');
    
    var navItems = document.getElementsByClassName('bottom-nav-item');
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove('active');
        if (navItems[j].getAttribute('data-page') === 'dashboard') {
            navItems[j].classList.add('active');
        }
    }
});

// ===== Unhandled Rejection Handler =====
window.addEventListener('unhandledrejection', function(e){
    try {
        var reason = e && e.reason;
        var msg = '';
        if (typeof reason === 'string') msg = reason;
        else if (reason && reason.message) msg = reason.message;
        else msg = 'Unhandled rejection';
        
        var stack = reason && reason.stack ? reason.stack : '';
        console.warn('Runtime error:', msg);
        if (stack) console.warn(stack);
    } catch(_){}
});

console.log('✓ Core initialization loaded');
