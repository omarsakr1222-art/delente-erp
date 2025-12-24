
                // ===== Thermal HTML Fallback Print =====
                (function(){
                    const CSS_ID = 'thermal-print-style';
                    function ensurePrintCss(){
                        if (document.getElementById(CSS_ID)) return;
                        const style = document.createElement('style');
                        style.id = CSS_ID;
                        style.textContent = `@media print {
  body * { visibility: hidden !important; }
  #thermal-print-root, #thermal-print-root * { visibility: visible !important; }
  #thermal-print-root { position: absolute; left:0; top:0; width:58mm; padding:4px 2px; font-family: 'Cairo', Arial, sans-serif; font-size:11px; line-height:1.25; direction:rtl; }
  #thermal-print-root .row { display:flex; justify-content:space-between; }
  #thermal-print-root .center { text-align:center; }
  #thermal-print-root hr { border:0; border-top:1px dashed #000; margin:4px 0; }
}
@page { margin:2mm; size:58mm auto; }`;
                        document.head.appendChild(style);
                    }
                    function money(n){ try { return (Number(n)||0).toFixed(2); } catch(_) { return '0.00'; } }
                    function buildHtmlReceipt(sale){
                        if (!sale) return '<div class="center">لا توجد فاتورة للعرض</div>';
                        const itemsHtml = (Array.isArray(sale.items)? sale.items: []).map(it => {
                            const name = (it.name||it.productName||it.productId||'صنف');
                            const qty = it.qty||it.quantity||0;
                            const price = it.price||it.unitPrice||0;
                            const total = qty*price;
                            return `<div class='row'><span>${name}</span><span>${qty}x${money(price)}=${money(total)}</span></div>`;
                        }).join('');
                        const total = money(sale.total||sale.net||sale.amount||0);
                        return `<div class='center'><strong>فاتورة بيع</strong></div>
<div class='center'>رقم: ${(sale.invoiceNumber||sale.id||'--')}</div>
<div>التاريخ: ${(sale.date||'').toString().split('T')[0]||'--'}</div>
<div>العميل: ${(sale.customerName||'--')}</div>
<hr>
${itemsHtml}
<hr>
<div class='row'><strong>الإجمالي</strong><strong>${total} ج.م</strong></div>
<div class='center'>شكراً لكم</div>`;
                    }
                    async function printHtmlReceiptLatest(){
                        try {
                            const root = document.getElementById('thermal-print-root');
                            const sale = (window.state && Array.isArray(state.sales) && state.sales[0]) ? state.sales[0] : null;
                            root.innerHTML = buildHtmlReceipt(sale);
                            root.style.display = 'block';
                            ensurePrintCss();
                            window.print();
                            setTimeout(()=>{ root.style.display='none'; root.innerHTML=''; }, 400);
                        } catch(e){ alert('فشل الطباعة العادية: '+ e.message); }
                    }
                    window.printHtmlReceiptLatest = printHtmlReceiptLatest;
                })();

                // ===== Thermal Receipt Builder (simplified ESC/POS) =====
                // NOTE: This encodes a very basic Arabic receipt; adjust per printer specs.
                function buildEscPosReceipt(sale){
                    const enc = new TextEncoder();
                    const lines = [];
                    const center = (t)=>"\x1B\x61\x01"+t+"\n"; // ESC a 1 (center)
                    const left = (t)=>"\x1B\x61\x00"+t+"\n";  // ESC a 0 (left)
                    lines.push(center("*** فاتورة بيع ***"));
                    if (sale && sale.invoiceNumber) lines.push(center("رقم: "+sale.invoiceNumber));
                    if (sale && sale.date) lines.push(left("التاريخ: "+(sale.date.split('T')[0])));
                    if (sale && sale.customerName) lines.push(left("العميل: "+sale.customerName));
                    lines.push(left("------------------------------"));
                    if (sale && Array.isArray(sale.items)){
                        sale.items.forEach(it=>{
                            const name = (it.name||it.productName||it.productId||"صنف").slice(0,12);
                            const qty = it.qty || it.quantity || 0;
                            const price = it.price || it.unitPrice || 0;
                            const total = (qty*price).toFixed(2);
                            lines.push(left(name+" "+qty+"x"+price+"="+total));
                        });
                    }
                    lines.push(left("------------------------------"));
                    const totalAmt = sale ? (sale.total || sale.net || sale.amount || 0) : 0;
                    lines.push(center("الإجمالي: "+Number(totalAmt).toFixed(2)+" ج.م"));
                    lines.push(center("شكراً لكم"));
                    // Feed & cut (if supported) \x1D V 0
                    lines.push("\n\n\x1D\x56\x00");
                    const all = lines.join("");
                    return enc.encode(all);
                }

                async function bluetoothPrintLatest(){
                    if (!('bluetooth' in navigator)){
                        alert('المتصفح لا يدعم Web Bluetooth (جرب Chrome أو Edge على أندرويد).');
                        return;
                    }
                    // أحدث فاتورة
                    const sale = (window.state && Array.isArray(state.sales) && state.sales[0]) ? state.sales[0] : null;
                    const payload = buildEscPosReceipt(sale);
                    // UUIDs محتملة لطابعات حرارية BLE شائعة (قد تحتاج تعديل)
                    const SERVICE_UUIDS = [0xFFE0,'0000ffe0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb'];
                    const CHAR_UUIDS = ['ffe1','0000ffe1-0000-1000-8000-00805f9b34fb','0000ff01-0000-1000-8000-00805f9b34fb'];
                    let device;
                    try {
                        // نستخدم acceptAllDevices لتفادي خطأ اسم الخدمة ثم نحاول الخدمات بعد الاتصال
                        device = await navigator.bluetooth.requestDevice({ acceptAllDevices:true, optionalServices: SERVICE_UUIDS });
                    } catch(e){
                        alert('تعذر اختيار جهاز بلوتوث: '+ e.message);
                        return;
                    }
                    let gatt;
                    try { gatt = await device.gatt.connect(); } catch(e){ alert('فشل الاتصال بالطابعة: '+e.message); return; }
                    let characteristic = null;
                    for (const su of SERVICE_UUIDS){
                        try {
                            const service = await gatt.getPrimaryService(su);
                            for (const cu of CHAR_UUIDS){
                                try {
                                    characteristic = await service.getCharacteristic(cu);
                                    if (characteristic) break;
                                } catch(_){ }
                            }
                            if (characteristic) break;
                        } catch(_){ }
                    }
                    if (!characteristic){
                        alert('لم يتم العثور على خاصية الكتابة للطابعة (جرب تحديث قائمة UUID أو تأكد أن الطابعة BLE).');
                        try { gatt.disconnect(); } catch(_){ }
                        return;
                    }
                    try {
                        const CHUNK = 20;
                        for (let i=0;i<payload.length;i+=CHUNK){
                            const slice = payload.slice(i,i+CHUNK);
                            await characteristic.writeValue(slice);
                            await new Promise(r=>setTimeout(r,12));
                        }
                        alert('تم إرسال الفاتورة للطابعة (بلوتوث).');
                    } catch(e){
                        console.error('Bluetooth write failed', e);
                        alert('فشل إرسال البيانات للطابعة: '+ e.message);
                    } finally {
                        try { gatt.disconnect(); } catch(_){ }
                    }

                // Discover Bluetooth printers only (do not print immediately)
                async function bluetoothDiscoverPrinter(){
                    try {
                        if (!('bluetooth' in navigator)) { alert('المتصفح لا يدعم Bluetooth'); return; }
                        const SERVICE_UUIDS = [0xFFE0,'0000ffe0-0000-1000-8000-00805f9b34fb','0000ff00-0000-1000-8000-00805f9b34fb'];
                        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices:true, optionalServices: SERVICE_UUIDS });
                        if (!device) { alert('لم يتم اختيار أي جهاز'); return; }
                        // Save selected device for later printing
                        window._lastBluetoothPrinter = device;
                        alert('تم اختيار الطابعة: ' + (device.name || device.id) + '\nيمكنك الآن الضغط على زر بلوتوث الطباعة لإرسال الفاتورة أو استخدام زر الطباعة الموجود على كل فاتورة.');
                    } catch(e){ console.warn('bluetooth discover failed', e); alert('فشل العثور على جهاز بلوتوث: ' + (e && e.message ? e.message : 'خطأ')); }
                }

                document.addEventListener('DOMContentLoaded', ()=>{
                    const btBtn = document.getElementById('sales-bt-print-btn');
                    if (btBtn) btBtn.addEventListener('click', bluetoothDiscoverPrinter);
                    const htmlBtn = document.getElementById('sales-html-print-btn');
                    if (htmlBtn) htmlBtn.addEventListener('click', async function(){
                        try {
                            // If exactly one sale row checkbox is checked, print that sale
                            const checked = Array.from(document.querySelectorAll('.total-bill-row-checkbox:checked'));
                            if (checked.length === 1) {
                                const saleId = checked[0].value;
                                if (saleId) return await window.printSaleById(saleId);
                            }
                            // If multiple selected, ask user to confirm printing the latest among them
                            if (checked.length > 1) {
                                const ids = checked.map(c => c.value);
                                const latest = (state.sales||[]).filter(s=>ids.includes(String(s.id))).sort((a,b)=> new Date(b.date)-new Date(a.date))[0];
                                if (latest) {
                                    const ok = confirm('طباعة أحدث فاتورة من المحددات؟ رقم: ' + (latest.invoiceNumber||latest.id));
                                    if (ok) return await window.printSaleById(latest.id);
                                }
                            }
                            // Fallback: prompt for invoice number, try to find it, else print latest
                            const inv = prompt('أدخل رقم الفاتورة للطباعة (اتركه فارغًا لطباعة أحدث فاتورة):');
                            if (inv && String(inv).trim() !== '') {
                                const sale = (state.sales||[]).find(s => String(s.invoiceNumber||s.id||'') === String(inv).trim());
                                if (sale) return await window.printSaleById(sale.id);
                                alert('لم يُعثر على فاتورة بهذا الرقم. سيتم طباعة أحدث فاتورة بدلاً من ذلك.');
                            }
                            // Default: print latest
                            try { await window.printHtmlReceiptLatest(); } catch(e){ console.warn('print latest fallback failed', e); }
                        } catch(e){ console.warn('sales-html-print-btn handler failed', e); }
                    });
                });

                // ===== END Bluetooth Print Section =====

                // Invoice quick-search: slide-in/out from left wall with lens handle
                document.addEventListener('DOMContentLoaded', function(){
                    const wrap = document.getElementById('invoice-quick-search-wrap');
                    const content = document.getElementById('invoice-quick-search-content');
                    const toggle = document.getElementById('invoice-quick-search-toggle');
                    if (!wrap || !content || !toggle) return;
                    let open = false; // start hidden in the wall
                    function apply(){
                        // Hide completely: translate by full width
                        content.style.transform = open ? 'translateX(0%)' : 'translateX(-100%)';
                    }
                    toggle.addEventListener('click', function(){ open = !open; apply(); try { updateIcons(); } catch(_){} });
                    apply();
                    // Keep the handle visible above content
                    try { wrap.style.zIndex = '50'; } catch(_){}
                });

                // Invoice quick-search wiring (searches `state.sales` for invoice number)
                document.addEventListener('DOMContentLoaded', function(){
                    const input = document.getElementById('invoice-search-input');
                    const btn = document.getElementById('invoice-search-btn');
                    const clearBtn = document.getElementById('invoice-clear-btn');

                    function formatMoney(n){
                        try{ if (typeof formatCurrency === 'function') return formatCurrency(n); }catch(e){}
                        if (n == null) return '0';
                        return (Number(n) || 0).toLocaleString();
                    }

                    // Return a short date string (YYYY-MM-DD) for a variety of input shapes
                    function formatShortDate(val){
                        if (!val && val !== 0) return '';
                        try {
                            // If already an ISO-like string with time, take the date portion
                            if (typeof val === 'string'){
                                if (val.indexOf('T') !== -1) return val.split('T')[0];
                                if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0,10);
                                // common DD/MM/YYYY or D/M/YYYY -> parse accordingly
                                if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)){
                                    const parts = val.split('/').map(p=>Number(p));
                                    // assume DD/MM/YYYY
                                    const d = new Date(parts[2], parts[1]-1, parts[0]);
                                    if (!isNaN(d)) return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                                }
                            }
                            // If already a Date
                            if (val instanceof Date) {
                                const d = val;
                                return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
                            }
                            // Try constructing Date from value
                            const dd = new Date(val);
                            if (!isNaN(dd)) return dd.getFullYear() + '-' + String(dd.getMonth()+1).padStart(2,'0') + '-' + String(dd.getDate()).padStart(2,'0');
                        } catch(e) {}
                        // fallback to original string representation
                        return String(val);
                    }

                    function findInvoice(num){
                        if (!num) return null;
                        if (!window.state || !Array.isArray(state.sales)) return null;
                        // match invoiceNumber, nested invoice.number, id, number, ref, etc.
                        const s = state.sales.find(item => {
                            const candidates = [
                                item.invoiceNumber,
                                (item.invoice && item.invoice.number),
                                (item.invoice && item.invoice.id),
                                item.invoice,
                                item.id,
                                item.number,
                                item.ref,
                                item.invoice_no,
                                item.invoiceNumberString
                            ];
                            return candidates.some(c => c != null && String(c) === String(num));
                        });
                        return s || null;
                    }

                    function renderResult(sale){
                        const dateEl = document.getElementById('invoice-result-date');
                        const custEl = document.getElementById('invoice-result-customer');
                        const totalEl = document.getElementById('invoice-result-total');
                        const typeEl = document.getElementById('invoice-result-type');
                        const noData = document.getElementById('invoice-no-data');
                        // New compact panel fields
                        const vNumber = document.getElementById('invoice-val-number');
                        const vTotal = document.getElementById('invoice-val-total');
                        const vReturn = document.getElementById('invoice-val-return');
                        const vNet = document.getElementById('invoice-val-net');
                        const vCname = document.getElementById('invoice-val-cname');
                        const vDate = document.getElementById('invoice-val-date');

                        if (!sale){
                            if (dateEl) dateEl.textContent = '--';
                            if (custEl) custEl.textContent = '--';
                            if (totalEl) totalEl.textContent = '--';
                            if (typeEl) typeEl.textContent = '--';
                            if (vNumber) vNumber.textContent = '--';
                            if (vTotal) vTotal.textContent = '--';
                            if (vReturn) vReturn.textContent = '--';
                            if (vNet) vNet.textContent = '--';
                            if (vCname) vCname.textContent = '--';
                            if (vDate) vDate.textContent = '--';
                            if (noData) noData.classList.remove('hidden');
                            return;
                        }

                        if (noData) noData.classList.add('hidden');
                        if (dateEl) dateEl.textContent = sale.date || sale.createdAt || sale.timestamp || '--';
                        if (custEl) custEl.textContent = (sale.customerName || sale.customer || (sale.customerObj && sale.customerObj.name) || '--');
                        if (totalEl) totalEl.textContent = formatMoney(sale.total || sale.amount || sale.net || 0) + ' ج.م';
                        if (typeEl) typeEl.textContent = (sale.type || sale.kind || (sale.isReturn ? 'مرتجع' : 'بيع') || (sale.total < 0 ? 'مرتجع' : 'بيع'));
                        // populate compact panel values
                        if (vNumber) vNumber.textContent = (sale.invoiceNumber || sale.id || sale.number || '--');
                        if (vTotal) vTotal.textContent = formatMoney(sale.total || sale.amount || sale.net || 0);
                        if (vReturn) vReturn.textContent = (sale.returnAmount || (sale.total < 0 ? String(Math.abs(sale.total)) : '--'));
                        if (vNet) vNet.textContent = formatMoney(sale.net || sale.total || sale.amount || 0);
                        if (vCname) {
                            // Try many possible property names and object shapes to resolve customer name
                            var cname = '--';
                            try {
                                // Direct string-ish fields (many possible names)
                                cname = sale.customerName || sale.clientName || sale.cname || sale.customer_name || sale.customer_fullname || sale.customerNameAr || sale.customer_name_ar || sale.partyName || sale.contactName || sale.contact_name || sale.buyerName || sale.customerDisplay || sale.customer || sale.client || sale.client_name || sale.clientName || cname;

                                // If sale.customer is an object, extract its name-like fields
                                if (cname && typeof cname === 'object') {
                                    var co = cname;
                                    cname = co.name || co.fullName || co.displayName || co.title || (co.company && co.company.name) || co.customerName || co.customer_name || co.label || co.customerDisplay || '--';
                                }

                                // Check nested well-known objects
                                if ((cname === '--' || cname == null || typeof cname === 'number')) {
                                    if (sale.customerObj && typeof sale.customerObj === 'object') cname = sale.customerObj.name || sale.customerObj.fullName || sale.customerObj.displayName || cname;
                                    if ((cname === '--' || cname == null || typeof cname === 'number') && sale.client && typeof sale.client === 'object') cname = sale.client.name || sale.client.displayName || cname;
                                    if ((cname === '--' || cname == null || typeof cname === 'number') && sale.account && typeof sale.account === 'object') cname = sale.account.name || sale.account.title || cname;
                                }

                                // If sale contains phone/tax fields, try to find matching customer by those
                                if ((cname === '--' || cname == null || typeof cname === 'number') && window.state && Array.isArray(window.state.customers)) {
                                    var possibleIds = [sale.customerId, sale.customer_id, sale.clientId, sale.client_id, sale.customer_ref, sale.customerRef, sale.accountId, sale.account_id, sale.partyId, sale.party_id, sale.customerCode, sale.clientCode, sale.ref, sale.customerMobile, sale.customerPhone, sale.mobile, sale.phone, sale.taxNumber, sale.tax_number];
                                    // flatten and remove nulls
                                    possibleIds = possibleIds.filter(x=> x != null && x !== '');
                                    var found = null;
                                    if (possibleIds.length > 0) {
                                        found = window.state.customers.find(function(c){
                                            var keys = [c.id, c._id, c.customerId, c.customer_id, c.code, c.customerCode, c.mobile, c.phone, c.taxNumber, c.tax_number, c.phoneNumber, c.msisdn];
                                            return possibleIds.some(function(pid){
                                                return keys.some(function(k){ return k != null && String(k) === String(pid); });
                                            });
                                        });
                                    }
                                    // If none by ids, try fuzzy match by mobile/tax if sale has those
                                    if (!found && sale.customerPhone) {
                                        found = window.state.customers.find(function(c){ return String(c.mobile) === String(sale.customerPhone) || String(c.phone) === String(sale.customerPhone); });
                                    }
                                    if (!found && sale.customerMobile) {
                                        found = window.state.customers.find(function(c){ return String(c.mobile) === String(sale.customerMobile) || String(c.phone) === String(sale.customerMobile); });
                                    }
                                    if (!found && sale.taxNumber) {
                                        found = window.state.customers.find(function(c){ return String(c.taxNumber) === String(sale.taxNumber) || String(c.tax_number) === String(sale.taxNumber); });
                                    }
                                    if (found) {
                                        cname = found.name || found.customerName || found.fullName || found.displayName || found.title || (found.company && found.company.name) || found.customer_name || cname;
                                    }
                                }

                                // If sale.customerId is present, attempt a direct lookup using helper or by id
                                try {
                                    if ((cname === '--' || cname == null || typeof cname === 'number' || cname === 'غير معروف') && sale && (sale.customerId || sale.customer_id)) {
                                        var cidVal = sale.customerId || sale.customer_id;
                                        // try central helper first
                                        try {
                                            if (typeof findCustomer === 'function') {
                                                var f = findCustomer(cidVal);
                                                if (f && (f.name || f.customerName || f.displayName)) {
                                                    cname = f.name || f.customerName || f.fullName || f.displayName || cname;
                                                }
                                            }
                                        } catch(e) { /* ignore */ }
                                        // fallback: lookup in state.customers by id-like fields
                                        if ((cname === '--' || cname == null || cname === 'غير معروف' || typeof cname === 'number') && window.state && Array.isArray(window.state.customers)) {
                                            var found2 = window.state.customers.find(function(c){
                                                return [c.id, c._id, c.customerId, c.customer_id, c.code, c.customerCode].some(function(k){ return k != null && String(k) === String(cidVal); });
                                            });
                                            if (found2) cname = found2.name || found2.customerName || found2.displayName || found2.fullName || cname;
                                        }
                                    }
                                } catch (e) { /* ignore */ }

                                // final fallback: if cname is still an object or null, stringify a safe field or use 'غير معروف'
                                if (cname && typeof cname === 'object') {
                                    cname = cname.name || cname.displayName || JSON.stringify(cname).slice(0,60) || 'غير معروف';
                                }
                                if (!cname || cname === '--') cname = 'غير معروف';
                            } catch (e) { cname = 'غير معروف'; }
                            vCname.textContent = (cname == null ? 'غير معروف' : cname);
                        }
                        if (vDate) {
                            var rawDate = sale.date || sale.createdAt || sale.timestamp || '';
                            vDate.textContent = rawDate ? formatShortDate(rawDate) : '--';
                        }
                    }

                    if (btn) btn.addEventListener('click', function(){
                        const v = input ? input.value.trim() : '';
                        if (!v) { renderResult(null); return; }
                        const res = findInvoice(v);
                        renderResult(res);
                    });

                    if (input) input.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); btn && btn.click(); } });

                    if (clearBtn) clearBtn.addEventListener('click', function(){ if (input) input.value = ''; renderResult(null); });

                    // initialize with empty view
                    renderResult(null);

                    // Ensure there is at least one sample sale so the quick-search can be tested
                    try {
                        if (!window.state) window.state = {};
                        if (!Array.isArray(window.state.sales)) window.state.sales = [];
                        if (window.state.sales.length === 0) {
                            window.state.sales.push({
                                id: '148556',
                                invoiceNumber: '148556',
                                customerName: 'ماركت سفير',
                                total: 21252,
                                net: 21252,
                                isReturn: false,
                                date: '12/11/2025'
                            });
                        }
                    } catch (e) { console.warn('sample sale init failed', e); }
                    
                    // Wire the export button to show the sale object in a textarea for easy copy
                    try {
                        const exportBtn = document.getElementById('invoice-export-btn');
                        const exportModal = document.getElementById('invoice-export-modal');
                        const exportTextarea = document.getElementById('invoice-export-textarea');
                        const exportClose = document.getElementById('invoice-export-close-btn');
                        const exportCopy = document.getElementById('invoice-export-copy-btn');

                        function showSaleObjectForCurrentInput(){
                            try{
                                const num = (input && input.value && input.value.trim()) ? input.value.trim() : (document.getElementById('invoice-val-number') ? document.getElementById('invoice-val-number').textContent.trim() : '');
                                if (!num) {
                                    exportTextarea.value = 'لم يتم تحديد رقم الفاتورة.';
                                } else {
                                    const sale = findInvoice(num) || null;
                                    exportTextarea.value = sale ? JSON.stringify(sale, null, 2) : 'لم يتم العثور على فاتورة برقم: ' + num;
                                }
                                exportModal.style.display = 'block';
                                exportTextarea.select();
                            }catch(e){ exportTextarea.value = 'خطأ أثناء تجهيز الكائن:\n'+String(e); exportModal.style.display='block'; }
                        }

                        if (exportBtn) exportBtn.addEventListener('click', function(){ showSaleObjectForCurrentInput(); });
                        if (exportClose) exportClose.addEventListener('click', function(){ exportModal.style.display = 'none'; });
                        if (exportCopy) exportCopy.addEventListener('click', function(){ try{ exportTextarea.select(); document.execCommand('copy'); exportCopy.textContent = 'تم النسخ'; setTimeout(()=> exportCopy.textContent = 'نسخ', 1200); }catch(e){ alert('نسخ لم ينجح، انسخ النص يدوياً.'); } });
                    } catch (e) { console.warn('invoice export wiring failed', e); }
                });
            