// Shared formatters and simple pure utilities
(function(){
  try { window.state = window.state || {}; } catch(e) { window.state = {}; }

  // Currency formatter (EGP, Arabic locale)
  // Money formatter (uses formatCurrency if available)
  if (typeof window.formatMoney !== 'function') {
    window.formatMoney = function(n){
      try { if (typeof window.formatCurrency === 'function') return window.formatCurrency(n); } catch(e){}
      if (n == null) return '0';
      const num = Number(n) || 0;
      try { return num.toLocaleString('en-US', { maximumFractionDigits: 2 }); } catch(e){ return String(num); }
    };
  }

  // Short date formatter -> YYYY-MM-DD from various inputs
  if (typeof window.formatShortDate !== 'function') {
    window.formatShortDate = function(val){
      if (!val && val !== 0) return '';
      try {
        if (typeof val === 'string'){
          if (val.indexOf('T') !== -1) return val.split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0,10);
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)){
            const parts = val.split('/').map(p=>Number(p));
            const d = new Date(parts[2], parts[1]-1, parts[0]);
            if (!isNaN(d)) return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
          }
        }
        if (val instanceof Date) {
          const d = val;
          return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        }
        const dd = new Date(val);
        if (!isNaN(dd) && dd.getFullYear() > 1900) return dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
      } catch(e) {}
      return String(val);
    };
  }

  // Parse discount percent from string like "10%"
  if (typeof window.parseDiscount !== 'function') {
    window.parseDiscount = function(str){
      if (!str) return 0;
      const n = parseFloat(String(str).replace('%','').trim());
      return isNaN(n) ? 0 : n;
    };
  }
  if (typeof window.formatCurrency !== 'function') {
    window.formatCurrency = function(n){
      try {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(Number(n||0));
      } catch(e){
        return (Number(n||0)).toFixed(2) + ' ج.م';
      }
    };
  }

  // Date formatters
  if (typeof window.formatArabicDate !== 'function') {
    window.formatArabicDate = function(dateString){
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
  }

  if (typeof window.formatArabicDateTime !== 'function') {
    window.formatArabicDateTime = function(dateString){
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hour}:${minute}`;
    };
  }

  // Number formatter (English digits, up to 2 decimals)
  if (typeof window.formatNumberEN !== 'function') {
    window.formatNumberEN = function(v){
      const n = Number(v ?? 0);
      if (isNaN(n)) return '0';
      const hasFraction = Math.abs(n - Math.round(n)) > 0;
      return n.toLocaleString('en-US', { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 });
    };
  }

  // Round to 2 decimals, deterministic
  if (typeof window.round2 !== 'function') {
    window.round2 = function(n){ return Math.round((Number(n) + Number.EPSILON)*100)/100; };
  }

  // Escape HTML for safe injection
  if (typeof window.escapeHtml !== 'function') {
    window.escapeHtml = function(s){
      return String(s||'')
        .replace(/&/g,'&amp;')
        .replace(/"/g,'&quot;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
    };
  }
})();
