(function(){
    // Taxes module: renders tax report and e-invoice log
    async function fetchProductsMap(){
        const map = {};
        try{
            const snap = await db.collection('products').get();
            snap.forEach(d => { const data = d.data() || {}; map[d.id] = data; });
        }catch(e){ console.warn('fetchProductsMap failed', e); }
        return map;
    }

    function formatNum(n){ try { return (Math.round((Number(n)||0)*100)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); } catch(e){ return '0.00'; } }

    function monthRangeFromInput(val){
        if (!val) { const d = new Date(); return {start: new Date(d.getFullYear(), d.getMonth(),1).toISOString(), end: new Date(d.getFullYear(), d.getMonth()+1,0,23,59,59,999).toISOString(), label: `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`}; }
        const parts = val.split('-'); const y = Number(parts[0]); const m = Number(parts[1]) - 1;
        const start = new Date(y, m, 1).toISOString();
        const end = new Date(y, m+1, 0,23,59,59,999).toISOString();
        return { start, end, label: `${y}-${String(m+1).padStart(2,'0')}` };
    }

    async function loadTaxReport(monthInputVal){
        const range = monthRangeFromInput(monthInputVal);
        const prodMap = await fetchProductsMap();

        // Output VAT from sales
        let totalSalesTaxable = 0;
        let totalOutputVat = 0;
        try{
            const snap = await db.collection('sales').where('date','>=', range.start).where('date','<=', range.end).get();
            for (const doc of snap.docs){
                const s = doc.data() || {};
                // Prefer precomputed fields when available (saved by app): subtotal and taxAmount
                if (s.subtotal !== undefined && s.subtotal !== null) {
                    totalSalesTaxable += Number(s.subtotal) || 0;
                }
                if (s.taxAmount !== undefined && s.taxAmount !== null) {
                    totalOutputVat += Number(s.taxAmount) || 0;
                    continue; // skip per-line compute when explicit taxAmount exists
                }

                // Fallback: compute from items and product master
                const items = Array.isArray(s.items) ? s.items : [];
                let saleSubtotal = 0;
                items.forEach(it => {
                    const qty = Number(it.quantity || it.qty || it.q || 1);
                    const price = Number(it.price || it.p || 0);
                    const line = qty * price;
                    saleSubtotal += line;
                    const p = prodMap[it.productId] || {};
                    const vatRate = (it.vat_rate !== undefined && it.vat_rate !== null) ? Number(it.vat_rate)/100 : ((p && p.vat_rate) ? Number(p.vat_rate)/100 : 0);
                    totalOutputVat += line * vatRate;
                });
                totalSalesTaxable += saleSubtotal;
            }
        }catch(e){ console.warn('loadTaxReport: sales fetch failed', e); }

        // Input VAT from transactions collection (supply / add_stock)
        let totalInputVat = 0;
        try{
            const types = ['supply','add_stock'];
            const queries = types.map(t => db.collection('transactions').where('type','==', t).where('date','>=', range.start).where('date','<=', range.end).get());
            const snaps = await Promise.all(queries);
            snaps.forEach(snap => {
                snap.forEach(d => {
                    const rec = d.data() || {};
                    totalInputVat += Number(rec.paidVat || rec.input_vat || 0) || 0;
                });
            });
        }catch(e){ console.warn('loadTaxReport: transactions fetch failed', e); }

        const netPayable = totalOutputVat - totalInputVat;

        // render
        document.getElementById('tax-total-sales').textContent = formatNum(totalSalesTaxable);
        document.getElementById('tax-output-vat').textContent = formatNum(totalOutputVat);
        document.getElementById('tax-input-vat').textContent = formatNum(totalInputVat);
        document.getElementById('tax-net-payable').textContent = formatNum(netPayable);
    }

    async function loadEInvoiceLog(){
        const tbody = document.getElementById('einvoice-log-table-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6" class="p-2 text-sm text-gray-500">جارٍ التحميل...</td></tr>';
        try{
            const snap = await db.collection('einvoice_logs').orderBy('date','desc').limit(50).get();
            if (snap.empty) { tbody.innerHTML = '<tr><td colspan="6" class="p-2 text-sm text-gray-500">لا توجد سجلات.</td></tr>'; return; }
            let html = '';
            snap.forEach(d => {
                const r = d.data() || {};
                const inv = r.invoiceNumber || r.invoice || r.ref || d.id;
                const date = r.date ? new Date(r.date).toLocaleString('ar-EG') : (r.createdAt ? new Date(r.createdAt.seconds*1000).toLocaleString('ar-EG') : '');
                html += `<tr class="text-sm"><td class="p-2">${inv}</td><td class="p-2">${date}</td><td class="p-2">${r.customerName||''}</td><td class="p-2 text-right">${formatNum(r.total||0)}</td><td class="p-2">${r.uuid||r.submissionUUID||''}</td><td class="p-2">${r.status|| (r.accepted? 'Valid':'Invalid') || ''}</td></tr>`;
            });
            tbody.innerHTML = html;
        }catch(e){ console.warn('loadEInvoiceLog failed', e); tbody.innerHTML = '<tr><td colspan="6" class="p-2 text-sm text-red-600">خطأ في تحميل السجل.</td></tr>'; }
    }

    function initTaxesPage(){
        const tabReport = document.getElementById('tax-tab-report');
        const tabEinvoices = document.getElementById('tax-tab-einvoices');
        const reportDiv = document.getElementById('tax-report-tab');
        const einvDiv = document.getElementById('tax-einvoices-tab');
        const monthInput = document.getElementById('tax-month-input');
        const refreshBtn = document.getElementById('tax-refresh-btn');

        if (tabReport) tabReport.addEventListener('click', () => { reportDiv.style.display='block'; einvDiv.style.display='none'; tabReport.classList.add('bg-gray-100'); tabEinvoices.classList.remove('bg-gray-100'); });
        if (tabEinvoices) tabEinvoices.addEventListener('click', async () => { reportDiv.style.display='none'; einvDiv.style.display='block'; tabEinvoices.classList.add('bg-gray-100'); tabReport.classList.remove('bg-gray-100'); await loadEInvoiceLog(); });
        if (refreshBtn) refreshBtn.addEventListener('click', async () => { await loadTaxReport(monthInput.value); });

        // default month to current
        try{ const d = new Date(); monthInput.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }catch(e){}
        // initial load
        loadTaxReport(monthInput.value);
    }

    // expose init on window so caller can run when page shown
    window.initTaxesPage = initTaxesPage;
    window.renderTaxesPage = initTaxesPage; // Alias for compatibility with renderer

    // auto-init when page element exists and db is ready
    document.addEventListener('DOMContentLoaded', function(){
        setTimeout(() => { try { if (document.getElementById('page-taxes')) initTaxesPage(); } catch(e){} }, 800);
    });
})();
