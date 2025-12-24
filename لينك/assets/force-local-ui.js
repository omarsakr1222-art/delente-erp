// force-local-ui.js
// يعرض واجهة التطبيق إذا وجدت بيانات محلية حتى بدون تسجيل دخول

document.addEventListener('DOMContentLoaded', function() {
    window.state = window.state || {};
    var keys = ['cache_sales','cache_customers','cache_products','cache_priceLists','cache_dispatchNotes','cache_promotions','cache_openingBalances'];
    for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        var raw = localStorage.getItem(key);
        if (raw) {
            var arr = [];
            try { arr = JSON.parse(raw); } catch(e){}
            if (Array.isArray(arr) && arr.length) {
                var prop = key.replace('cache_','');
                state[prop] = arr;
            }
        }
    }
    var hasData = false;
    var props = ['sales','customers','products','priceLists'];
    for (var i = 0; i < props.length; i++) {
        if (Array.isArray(state[props[i]]) && state[props[i]].length) {
            hasData = true;
            break;
        }
    }
    if (hasData) {
        if (window.UIController && typeof UIController.showApp === 'function') {
            UIController.showApp();
        }
        var dashboard = document.getElementById('page-dashboard');
        if (dashboard) dashboard.classList.add('active');
        var pages = document.getElementsByClassName('page');
        for (var j = 0; j < pages.length; j++) {
            if (pages[j] !== dashboard) pages[j].classList.remove('active');
        }
    }
});
