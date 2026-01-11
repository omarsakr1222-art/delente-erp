/**
 * reports-services.js
 * Extracted reporting, charting, export, and advanced search functionality
 * Uses window.db and window.formatCurrency (defined in main scripts)
 */

(function() {
    'use strict';

    // ===== HELPER FUNCTIONS FOR REPORTS =====
    // NOTE: Chart rendering functions (createOrUpdateChart, renderSales7DaysChart, etc.)
    // have been moved to js/reports-ui.js to reduce file size.
    
    // Helper function to filter sales by active period
    window.getActivePeriodSales = function() {
        const state = window.state || {};
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

    // ===== DASHBOARD FUNCTIONS =====

    window.renderDashboard = function() {
        const state = window.state || {};
        const findCustomer = window.findCustomer || (() => null);
        const findRep = window.findRep || (() => null);
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const updateIcons = window.updateIcons || (() => {});
        const formatArabicDateTime = window.formatArabicDateTime || ((d) => new Date(d).toLocaleString('ar-EG'));
        const getStatusBadge = window.getStatusBadge || ((s) => s);

        const selectedRepName = (document.getElementById('dashboard-rep-filter') || {}).value || '';
        console.debug('renderDashboard called with state.sales length:', (state.sales || []).length, 'activePeriod:', state.activePeriod);
        
        // Helper function للحصول على مبيعات الشهر النشط
        const getActivePeriodSalesLocal = () => {
            state.sales = state.sales || [];
            const activePeriod = state.activePeriod || '';
            if (!activePeriod) return state.sales;
            
            return state.sales.filter(sale => {
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
       
        state.reps = state.reps || [];
        let currentTarget = Number(state.settings?.salesTarget || 0);
        const targetTitleEl = document.getElementById('target-title');
        if (selectedRepName) {
            filteredMonthSales = currentMonthSales.filter(s => s.repName === selectedRepName);
            const targetRep = findRep(selectedRepName);
            currentTarget = targetRep ? (targetRep.target || 0) : 0;
            if (targetTitleEl) targetTitleEl.innerHTML = `الهدف الشهري لـ <span class="text-blue-600">${selectedRepName}</span>`;
        } else {
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
            const isReturn = sale.total < 0;
            const totalAmountClass = isReturn ? 'text-red-700' : 'text-green-700';

            const el = document.createElement('div'); el.className = 'bg-gray-50 p-3 rounded-lg flex justify-between items-center'; 
            el.innerHTML = `<div><p class="font-bold">${customer && customer.name ? customer.name : (sale.customerName || 'غير معروف')}</p><p class="text-sm text-gray-500"><bdo dir="rtl">${formatArabicDateTime(sale.date)}</bdo></p><p class="text-xs text-blue-600 pt-1">${sale.repName || ''}</p></div><div class="text-left space-y-1"><p class="font-bold ${totalAmountClass}">${formatCurrency(sale.total)}</p>${getStatusBadge(sale.status)}</div>`; 
            recentSalesList.appendChild(el); 
        }); 
        updateIcons();
    };

    // ===== CHART RENDERING FUNCTIONS =====

    window.getSalesDataForLast7Days = function() { 
        const state = window.state || {};
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
        
        const monthSales = window.getActivePeriodSales();
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
    };

    window.getTopRepsData = function(count = 5) { 
        const monthSales = window.getActivePeriodSales();
        const repSalesMap = new Map(); 
        monthSales.forEach(sale => { 
            const repName = sale.repName || 'غير محدد'; 
            repSalesMap.set(repName, (repSalesMap.get(repName) || 0) + sale.total); 
        }); 
        const sortedReps = Array.from(repSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, count); 
        return { labels: sortedReps.map(r => r[0]), data: sortedReps.map(r => r[1]) }; 
    };

    window.getTopProductsData = function(count = 5) {
        const state = window.state || {};
        const findProduct = window.findProduct || (() => null);
        const productQtyMap = new Map();
        const monthSales = window.getActivePeriodSales();
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
    };

    window.getTopCustomersData = function(count = 5) { 
        const findCustomer = window.findCustomer || (() => null);
        const monthSales = window.getActivePeriodSales();
        const customerSalesMap = new Map(); 
        monthSales.forEach(sale => { 
            const customer = findCustomer(sale.customerId); 
            const customerName = customer ? customer.name : 'عميل محذوف'; 
            customerSalesMap.set(customerName, (customerSalesMap.get(customerName) || 0) + sale.total); 
        }); 
        const sortedCustomers = Array.from(customerSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, count); 
        return { labels: sortedCustomers.map(c => c[0]), data: sortedCustomers.map(c => c[1]) }; 
    };

    // NOTE: Chart creation and rendering functions moved to js/reports-ui.js
    // - createOrUpdateChart()
    // - renderSales7DaysChart()
    // - renderTopRepsChart()
    // - renderTopProductsChart()
    // - renderTopCustomersChart()

    // ===== REPORT GENERATION FUNCTIONS =====

    window.generateDailyReport = function() {
        const state = window.state || {};
        const findCustomer = window.findCustomer || (() => null);
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const customDialog = window.customDialog || (async (o) => alert(o.message));
        const updateIcons = window.updateIcons || (() => {});
        const getStatusBadge = window.getStatusBadge || ((s) => s);
        const printSection = window.printSection || (() => {});
        const generateReportImage = window.generateReportImage || (() => {});

        const dailyReportDateInput = document.getElementById('daily-report-date');
        const dailyReportRepSelect = document.getElementById('daily-report-rep');
        const reportOutputArea = document.getElementById('report-output-area');

        const date = dailyReportDateInput?.value;
        const repName = dailyReportRepSelect?.value;
        const chainId = document.getElementById('daily-report-chain')?.value;
        
        if (!date) {
            customDialog({ message: 'الرجاء تحديد تاريخ التقرير اليومي.', title: 'بيانات ناقصة' });
            return;
        }
        
        let allowedCustomerIds = null;
        if (chainId) {
            const chains = window.loadChains?.() || [];
            const chain = chains.find(c => c.id === chainId);
            if (chain) allowedCustomerIds = chain.customerIds || [];
        }
        
        const salesForDay = state.sales.filter(s => {
            const saleDate = new Date(s.date);
            if (isNaN(saleDate.getTime())) return false;
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
        
        const netSales = totalSales + totalReturns;
        const chainName = chainId ? document.querySelector('#daily-report-chain option[value="' + chainId + '"]')?.textContent : '';

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
    };

    window.generateRangeReport = function() {
        const state = window.state || {};
        const findCustomer = window.findCustomer || (() => null);
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const customDialog = window.customDialog || (async (o) => alert(o.message));
        const updateIcons = window.updateIcons || (() => {});
        const getStatusBadge = window.getStatusBadge || ((s) => s);
        const printSection = window.printSection || (() => {});
        const generateReportImage = window.generateReportImage || (() => {});

        const rangeStartDateInput = document.getElementById('range-start-date');
        const rangeEndDateInput = document.getElementById('range-end-date');
        const rangeReportRepSelect = document.getElementById('range-report-rep');
        const reportOutputArea = document.getElementById('report-output-area');

        const start = rangeStartDateInput?.value;
        const end = rangeEndDateInput?.value;
        const repName = rangeReportRepSelect?.value;
        const chainId = document.getElementById('range-report-chain')?.value;
        
        if (!start || !end) {
            customDialog({ message: 'الرجاء تحديد تاريخ البداية والنهاية.', title: 'بيانات ناقصة' });
            return;
        }
        
        let allowedCustomerIds = null;
        if (chainId) {
            const chains = window.loadChains?.() || [];
            const chain = chains.find(c => c.id === chainId);
            if (chain) allowedCustomerIds = chain.customerIds || [];
        }
        
        const startDate = new Date(start + 'T00:00:00Z');
        const endDate = new Date(end + 'T23:59:59Z');
        const salesInRange = state.sales.filter(s => {
            const d = new Date(s.date);
            if (isNaN(d.getTime())) return false;
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
        const chainName = chainId ? document.querySelector('#range-report-chain option[value="' + chainId + '"]')?.textContent : '';

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
        window.updateIcons?.();
    };

    window.generateMonthlyReport = function() {
        const state = window.state || {};
        const findCustomer = window.findCustomer || (() => null);
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const customDialog = window.customDialog || (async (o) => alert(o.message));
        const updateIcons = window.updateIcons || (() => {});
        const escapeHtml = window.escapeHtml || ((s) => s);
        const printSection = window.printSection || (() => {});
        const generateReportImage = window.generateReportImage || (() => {});

        const monthlyReportMonthInput = document.getElementById('monthly-report-month');
        const monthlyReportRepSelect = document.getElementById('monthly-report-rep');
        const reportOutputArea = document.getElementById('report-output-area');

        const month = monthlyReportMonthInput?.value;
        const repName = monthlyReportRepSelect?.value;
        const chainId = document.getElementById('monthly-report-chain')?.value;
        
        if (!month) { customDialog({ message: 'الرجاء اختيار شهر.', title: 'بيانات ناقصة' }); return; }
        
        let allowedCustomerIds = null;
        if (chainId) {
            const chains = window.loadChains?.() || [];
            const chain = chains.find(c => c.id === chainId);
            if (chain) allowedCustomerIds = chain.customerIds || [];
        }
        
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr,10); const m = parseInt(monthStr,10) - 1;
        const startDate = new Date(Date.UTC(year, m, 1));
        const endDate = new Date(Date.UTC(year, m+1, 0, 23,59,59));
        const monthSales = state.sales.filter(s => {
            const d = new Date(s.date);
            if (isNaN(d.getTime())) return false;
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
        const customerAgg = new Map();
        monthSales.forEach(s => {
            const cid = s.customerId || 'unknown';
            const ag = customerAgg.get(cid) || { net:0 };
            ag.net += s.total; customerAgg.set(cid, ag);
        });
        const chainName = chainId ? document.querySelector('#monthly-report-chain option[value="' + chainId + '"]')?.textContent : '';
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
        updateIcons?.();
    };

    // ===== EXPORT & PRINT FUNCTIONS =====

    window.captureElementCanvas = async function(element, scale = 2) {
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
    };

    window.printSection = function(elementId) {
        const printElement = document.getElementById(elementId);
        if (!printElement) return;

        printElement.classList.add('printable-content');
        
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                printElement.classList.remove('printable-content');
            }, 500);
        }, 50);
    };

    window.generateReportImage = async function(elementId) {
        const reportElement = document.getElementById(elementId);
        const customDialog = window.customDialog || (async (o) => alert(o.message));
        const showLoading = window.showLoading || (() => {});
        const hideLoading = window.hideLoading || (() => {});
        const openModal = window.openModal || (() => {});

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
                canvas = await window.captureElementCanvas(reportElement, 4);
                reportElement.classList.remove('recon-export-scale');
            } else {
                canvas = await window.captureElementCanvas(reportElement, 2);
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
    };

    window.exportSelectedRows = async function(exportType) {
        const state = window.state || {};
        const findCustomer = window.findCustomer || (() => null);
        const findProduct = window.findProduct || (() => null);
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const customDialog = window.customDialog || (async (o) => alert(o.message));
        const getStatusBadge = window.getStatusBadge || ((s) => s);
        const printSection = window.printSection || (() => {});
        const generateReportImage = window.generateReportImage || (() => {});

        const checkedBoxes = document.querySelectorAll('#total-bills-table-body input.total-bill-row-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            await customDialog({ title: 'لم يتم التحديد', message: 'الرجاء تحديد صف واحد على الأقل لتصديره.' });
            return;
        }

        const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
        const selectedSales = state.sales.filter(s => selectedIds.includes(s.id));

        const includeTotalCheckbox = document.getElementById('include-total-in-export');
        let totalHtml = '';
        if (includeTotalCheckbox && includeTotalCheckbox.checked) {
            const totalContainer = document.getElementById('total-bills-summary-container');
            if (totalContainer) {
                const clonedTotal = totalContainer.cloneNode(true);
                const checkboxDiv = clonedTotal.querySelector('div:last-child');
                if (checkboxDiv) checkboxDiv.remove();
                clonedTotal.classList.add('mb-4');
                totalHtml = clonedTotal.outerHTML;
            }
        }

        const originalThead = document.querySelector('#total-bills-table thead');
        const clonedThead = originalThead.cloneNode(true);
        clonedThead.querySelector('th').remove();
        
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

        if (exportType === 'print') {
            await printSection('temp-export-area');
        } else if (exportType === 'image') {
            await generateReportImage('temp-export-area');
        }

        document.body.removeChild(tempExportElement);
    };

    // Alias for legacy callers expecting exportToExcel name
    window.exportToExcel = window.exportSelectedRows;

    // ===== TARGETS REPORT =====
    window.generateTargetsReport = function() {
        const state = window.state || {};
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const updateIcons = window.updateIcons || (() => {});
        const customDialog = window.customDialog || (() => {});
        const reportOutputArea = document.getElementById('report-output-area');

        const monthVal = document.getElementById('targets-month')?.value || '';
        const chainId = document.getElementById('targets-chain')?.value || null;
        if (!monthVal) {
            customDialog({ title: 'بيانات ناقصة', message: 'اختر شهر التارجت.' });
            return;
        }

        // Get chain customer IDs if a chain is selected
        let allowedCustomerIds = null;
        if (chainId) {
            const chains = (window.loadChains && window.loadChains()) || [];
            const chain = chains.find(c => c.id === chainId);
            if (chain) allowedCustomerIds = chain.customerIds || [];
        }

        const [yearStr, monthStr] = monthVal.split('-');
        const year = parseInt(yearStr, 10);
        const m = parseInt(monthStr, 10) - 1;
        const monthStart = new Date(Date.UTC(year, m, 1));
        const monthEnd = new Date(Date.UTC(year, m + 1, 1) - 1);
        const today = new Date();
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const todayDay = (today.getMonth() === m && today.getFullYear() === year) ? today.getDate() : daysInMonth;

        // Build reps list and populate filter options
        const repsAll = (state.reps || []).map(r => ({ id: r.id, name: r.name || r.id, target: Number(r.target || 0) }));
        const repFilterEl = document.getElementById('targets-rep-filter');
        if (repFilterEl) {
            const selVal = repFilterEl.value || 'all';
            if (repFilterEl.dataset.filled !== '1' || repFilterEl.options.length - 1 !== repsAll.length) {
                const current = selVal;
                repFilterEl.innerHTML = '<option value="all">عرض كل المناديب</option>' + repsAll.map(r => `<option value="${window.escapeHtml(r.name)}">${window.escapeHtml(r.name)}</option>`).join('');
                repFilterEl.dataset.filled = '1';
                if ([...repFilterEl.options].some(o => o.value === current)) repFilterEl.value = current;
            }
        }
        const selectedRepName = (repFilterEl && repFilterEl.value && repFilterEl.value !== 'all') ? repFilterEl.value : null;
        const reps = selectedRepName ? repsAll.filter(r => r.name === selectedRepName) : repsAll;
        if (reps.length === 0) {
            reportOutputArea.innerHTML = '<p class="text-center text-gray-500">لا توجد مناديب مسجلة.</p>';
            return;
        }

        const dayAgg = new Map();
        (state.sales || []).forEach(s => {
            const d = new Date(s.date);
            if (isNaN(d.getTime())) return;
            if (d < monthStart || d > monthEnd) return;
            const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
            if (!matchesChain) return;
            const dayKey = d.toISOString().split('T')[0];
            const repName = s.repName || 'غير محدد';
            const net = s.total;
            const mapForDay = dayAgg.get(dayKey) || new Map();
            mapForDay.set(repName, (mapForDay.get(repName) || 0) + net);
            dayAgg.set(dayKey, mapForDay);
        });

        const colBgs = ['#f0f9ff', '#eef2ff', '#f5f3ff', '#fdf2f8', '#fff7ed', '#fefce8', '#ecfccb', '#f0fdf4', '#fafaf9', '#e0f2fe'];
        const colBgsStrong = ['#e0f2fe', '#e0e7ff', '#ede9fe', '#fde2f3', '#ffedd5', '#fef3c7', '#d9f99d', '#dcfce7', '#e7e5e4', '#bae6fd'];
        const rows = [];
        const cumulativeByRep = {};
        reps.forEach(r => cumulativeByRep[r.name] = 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const isoDay = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const mapForDay = dayAgg.get(isoDay) || new Map();
            let totalDay = 0;
            const cells = reps.map((r, idx) => {
                const val = mapForDay.get(r.name) || 0;
                cumulativeByRep[r.name] += val;
                totalDay += val;
                const base = colBgs[idx % colBgs.length];
                const strong = colBgsStrong[idx % colBgsStrong.length];
                const bg = val ? strong : base;
                return `<td style='background:${bg};color:#0b1b34;font-size:12px;font-weight:${val ? '600' : '400'}'>${val ? formatCurrency(val) : '0.00'}</td>`;
            }).join('');
            rows.push(`<tr>
                <td class='targets-col-day'>${String(day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${year}</td>${cells}<td class='targets-col-total'>${totalDay ? formatCurrency(totalDay) : '0.00'}</td>
            </tr>`);
        }

        const achievedRowCells = reps.map((r, idx) => `<td style='background:${colBgsStrong[idx % colBgsStrong.length]};color:#065f46;font-weight:700'>${formatCurrency(cumulativeByRep[r.name])}</td>`).join('');
        const targetRowCells = reps.map((r, idx) => `<td style='background:${colBgs[idx % colBgs.length]};color:#111827;font-weight:700'>${formatCurrency(r.target)}</td>`).join('');
        const remainingRowCells = reps.map(r => {
            const rem = r.target - cumulativeByRep[r.name];
            return `<td style='background:${rem > 0 ? '#fde68a' : '#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(rem)}</td>`;
        }).join('');
        const expectedPct = todayDay / daysInMonth;
        const expectedRowCells = reps.map((r, idx) => `<td style='background:${idx % 2 === 0 ? '#e0e7ff' : '#e0f2fe'};color:#0b1b34;font-weight:700'>${(expectedPct * 100).toFixed(1)}%</td>`).join('');
        const achievedPctCells = reps.map(r => {
            const pct = r.target ? (cumulativeByRep[r.name] / r.target) : 0;
            const good = pct >= expectedPct;
            return `<td style='background:${good ? '#bbf7d0' : '#fecaca'};color:#065f46;font-weight:700'>${(pct * 100).toFixed(1)}%</td>`;
        }).join('');

        const totalAchieved = Object.values(cumulativeByRep).reduce((a, b) => a + b, 0);
        const totalTargets = reps.reduce((a, r) => a + r.target, 0);
        const totalRemaining = totalTargets - totalAchieved;

        const tableHtml = `
        <div id='targets-report-output' style='direction:rtl;font-family:Cairo;'>
            <table class='targets-table'>
                <thead>
                    <tr style='color:#fff;'>
                        <th style='background:#3b82f6;font-weight:bold'>اليوم</th>
                        ${reps.map((r, idx) => `<th style='background:#2563eb;font-weight:bold'>${r.name}</th>`).join('')}
                        <th style='background:#ef4444;font-weight:bold'>إجمالي اليوم</th>
                    </tr>
                </thead>
                <tbody>${rows.join('')}</tbody>
                <tfoot>
                    <tr><td style='background:#e0f2fe;color:#065f46;font-weight:700'>${(expectedPct * 100).toFixed(1)}%</td>${expectedRowCells}<td style='background:#e0f2fe;color:#065f46;font-weight:700'>نسبة مستهدفة حتى اليوم</td></tr>
                    <tr><td style='background:#bbf7d0;color:#065f46;font-weight:700'>${totalTargets ? ((totalAchieved / totalTargets) * 100).toFixed(1) : '0.0'}%</td>${achievedPctCells}<td style='background:#bbf7d0;color:#065f46;font-weight:700'>نسبة المحقق</td></tr>
                    <tr><td style='background:#fef3c7;color:#111827;font-weight:700'>${formatCurrency(totalTargets)}</td>${targetRowCells}<td style='background:#fef3c7;color:#111827;font-weight:700'>التارجت</td></tr>
                    <tr><td style='background:${totalRemaining > 0 ? '#fde68a' : '#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(totalRemaining)}</td>${remainingRowCells}<td style='background:${totalRemaining > 0 ? '#fde68a' : '#bbf7d0'};color:#111827;font-weight:700'>المتبقي</td></tr>
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
    };

    // ===== CUSTOMER TARGETS REPORT HELPER FUNCTIONS =====
    window.getCustomerTargetsStore = function() {
        const state = window.state || {};
        state.customerTargets = state.customerTargets || {};
        return state.customerTargets;
    };

    window.getCustomerTargetsForMonth = function(month) {
        const store = window.getCustomerTargetsStore();
        if (!store[month]) store[month] = {};
        return store[month];
    };

    window.saveCustomerTargetsFromInputs = function() {
        const state = window.state || {};
        const customDialog = window.customDialog || (() => {});
        const saveState = window.saveState || (() => {});
        const monthVal = document.getElementById('customer-targets-month')?.value;
        if (!monthVal) {
            customDialog({ title: 'تنبيه', message: 'اختر الشهر أولاً.' });
            return;
        }
        const monthKey = monthVal;
        const targetObj = window.getCustomerTargetsForMonth(monthKey);
        const inputs = document.querySelectorAll('#customer-targets-report-output .cust-target-input');
        inputs.forEach(inp => {
            const cid = inp.dataset.customerId;
            const cat = inp.dataset.category;
            const val = parseFloat(inp.value) || 0;
            targetObj[cid] = targetObj[cid] || { multi: 0, dairy: 0 };
            targetObj[cid][cat] = val;
        });
        saveState();
        customDialog({ title: 'حفظ', message: 'تم حفظ قيم التارجت.' });
        window.generateCustomerTargetsReport();
    };

    window.generateCustomerTargetsReport = function() {
        const state = window.state || {};
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const updateIcons = window.updateIcons || (() => {});
        const findProduct = window.findProduct || (() => null);
        const escapeHtml = window.escapeHtml || ((s) => s);

        const monthVal = document.getElementById('customer-targets-month')?.value || '';
        const catVal = document.getElementById('customer-targets-category')?.value || 'both';
        const out = document.getElementById('customer-targets-report-output');
        if (!out) return;
        if (!monthVal) {
            out.innerHTML = '<p class="text-center text-gray-500">اختر شهر.</p>';
            return;
        }

        const [yStr, mStr] = monthVal.split('-');
        const year = parseInt(yStr, 10);
        const m = parseInt(mStr, 10) - 1;
        const monthStart = new Date(Date.UTC(year, m, 1));
        const monthEnd = new Date(Date.UTC(year, m + 1, 1) - 1);

        const nameKeys = ['اكسبشن', 'سفير', 'الضحى'];
        const customers = (state.customers || []).filter(c => {
            const nm = (c.name || '');
            const include = nameKeys.some(k => nm.includes(k));
            const isExcluded = /اكسبشن/.test(nm) && /(حلواني|حلوانى)/.test(nm);
            return include && !isExcluded;
        });
        if (customers.length === 0) {
            out.innerHTML = '<p class="text-center text-gray-500">لا توجد عملاء مستهدفة.</p>';
            return;
        }

        const targetsMonthObj = window.getCustomerTargetsForMonth(monthVal);
        const agg = {};
        (state.sales || []).forEach(sale => {
            const d = new Date(sale.date);
            if (isNaN(d.getTime())) return;
            if (d < monthStart || d > monthEnd) return;
            const cid = sale.customerId;
            const cust = customers.find(c => c.id === cid || c._id === cid);
            if (!cust) return;
            sale.items.forEach(item => {
                const p = findProduct(item.productId);
                if (!p) return;
                const nameLower = (cust.name || '').toLowerCase();
                const prodLower = (p.name || '').toLowerCase();
                if (nameLower.includes('اكسبشن') && prodLower.includes('شيلي')) return;
                const qty = Number(item.quantity || item.qty || 0);
                const price = Number(p.price || 0);
                const value = qty * price;
                const cat = String(p.category || '').toLowerCase();
                const isMulti = cat.includes('مالت') || cat.includes('multi');
                const isDairy = cat.includes('بان') || cat.includes('جبن') || cat.includes('cheese') || cat.includes('dairy');
                agg[cid] = agg[cid] || { multiAch: 0, dairyAch: 0 };
                if (isMulti) agg[cid].multiAch += value;
                else if (isDairy) agg[cid].dairyAch += value;
            });
        });

        function fmt(v) { return formatCurrency(v || 0); }
        const rows = customers.map(c => {
            const cid = c.id || c._id;
            const a = agg[cid] || { multiAch: 0, dairyAch: 0 };
            const targetData = targetsMonthObj[cid] || {};
            const hasMultiSaved = Object.prototype.hasOwnProperty.call(targetData, 'multi');
            const hasDairySaved = Object.prototype.hasOwnProperty.call(targetData, 'dairy');
            const multiTarget = hasMultiSaved ? Number(targetData.multi || 0) : 0;
            const dairyTarget = hasDairySaved ? Number(targetData.dairy || 0) : 0;
            const multiRem = multiTarget - a.multiAch;
            const dairyRem = dairyTarget - a.dairyAch;
            const multiPct = multiTarget ? (a.multiAch / multiTarget) * 100 : 0;
            const dairyPct = dairyTarget ? (a.dairyAch / dairyTarget) * 100 : 0;
            const multiInputVal = hasMultiSaved ? multiTarget : '';
            const dairyInputVal = hasDairySaved ? dairyTarget : '';
            const multiInput = `<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='multi' data-customer-id='${cid}' value='${multiInputVal}' placeholder='0'/>`;
            const dairyInput = `<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='dairy' data-customer-id='${cid}' value='${dairyInputVal}' placeholder='0'/>`;

            if (catVal === 'multi') {
                return `<tr>
                    <td class='name'>${escapeHtml(c.name)}</td>
                    <td>${multiInput}</td>
                    <td class='ach-cell'>${fmt(a.multiAch)}</td>
                    <td class='${multiRem > 0 ? 'rem-pos' : 'rem-zero'}'>${fmt(multiRem)}</td>
                    <td class='${multiPct >= 50 ? 'pct-ok' : 'pct-low'}'>${multiPct.toFixed(1)}%</td>
                </tr>`;
            } else if (catVal === 'dairy') {
                return `<tr>
                    <td class='name'>${escapeHtml(c.name)}</td>
                    <td>${dairyInput}</td>
                    <td class='ach-cell'>${fmt(a.dairyAch)}</td>
                    <td class='${dairyRem > 0 ? 'rem-pos' : 'rem-zero'}'>${fmt(dairyRem)}</td>
                    <td class='${dairyPct >= 50 ? 'pct-ok' : 'pct-low'}'>${dairyPct.toFixed(1)}%</td>
                </tr>`;
            } else {
                const totalTarget = multiTarget + dairyTarget;
                const totalAch = a.multiAch + a.dairyAch;
                const totalRem = totalTarget - totalAch;
                const totalPct = totalTarget ? (totalAch / totalTarget) * 100 : 0;
                return `<tr>
                    <td class='name'>${escapeHtml(c.name)}</td>
                    <td>${multiInput}</td>
                    <td class='ach-cell'>${fmt(a.multiAch)}</td>
                    <td>${dairyInput}</td>
                    <td class='ach-cell'>${fmt(a.dairyAch)}</td>
                    <td class='ach-cell'>${fmt(totalTarget)}</td>
                    <td class='ach-cell'>${fmt(totalAch)}</td>
                    <td class='${totalRem > 0 ? 'rem-pos' : 'rem-zero'}'>${fmt(totalRem)}</td>
                    <td class='${totalPct >= 50 ? 'pct-ok' : 'pct-low'}'>${totalPct.toFixed(1)}%</td>
                </tr>`;
            }
        }).join('');

        let thead;
        if (catVal === 'multi') {
            thead = `<tr>
                <th class='cth-name'>العميل</th>
                <th class='cth-multi-target'>تارجت مالتي</th>
                <th class='cth-multi-ach'>محقق مالتي</th>
                <th class='cth-rem'>متبقي</th>
                <th class='cth-pct'>% محقق</th>
            </tr>`;
        } else if (catVal === 'dairy') {
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
    };

    // ===== SETTLEMENT REPORT =====
    window.generateSettlementReport = function() {
        const state = window.state || {};
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const updateIcons = window.updateIcons || (() => {});
        const findProduct = window.findProduct || (() => null);
        const customDialog = window.customDialog || (() => {});
        const reportOutputArea = document.getElementById('report-output-area');

        const dateInput = document.getElementById('settlement-report-date');
        const repSelect = document.getElementById('settlement-report-rep');
        const date = (dateInput && dateInput.value) ? dateInput.value : (window.dailyReportDateInput ? window.dailyReportDateInput.value : '');
        const repName = (repSelect && repSelect.value) ? repSelect.value : (window.dailyReportRepSelect ? window.dailyReportRepSelect.value : '');

        if (!date) {
            customDialog({ message: 'اختر تاريخاً للتسوية.', title: 'بيانات ناقصة' });
            return;
        }
        if (!repName || repName === 'all') {
            customDialog({ message: 'اختر مندوب واحد للتسوية.', title: 'تنبيه' });
            return;
        }

        const dispatchNote = state.dispatchNotes.find(n => n.repName === repName && new Date(n.date).toISOString().split('T')[0] === date);
        const productIds = state.products.map(p => p.id);
        const salesForDay = state.sales.filter(s => s.repName === repName && new Date(s.date).toISOString().split('T')[0] === date);

        const agg = {};
        function ensure(id) {
            if (!agg[id]) {
                agg[id] = { productId: id, name: (findProduct(id)?.name) || id, dispatched: 0, goodReturn: 0, damagedReturn: 0, freebie: 0, sold: 0, invoiceReturn: 0 };
            }
        }

        if (dispatchNote && Array.isArray(dispatchNote.items)) {
            dispatchNote.items.forEach(it => {
                ensure(it.productId);
                agg[it.productId].dispatched += Number(it.quantity || 0);
                agg[it.productId].goodReturn += Number(it.actualReturn || it.goodReturn || 0);
                agg[it.productId].damagedReturn += Number(it.damagedReturn || 0);
                agg[it.productId].freebie += Number(it.freebie || 0);
            });
        }

        salesForDay.forEach(sale => {
            sale.items.forEach(item => {
                ensure(item.productId);
                const q = Number(item.quantity || item.qty || 0);
                if (sale.total < 0 || q < 0) {
                    agg[item.productId].invoiceReturn += Math.abs(q);
                } else {
                    agg[item.productId].sold += q;
                }
            });
        });

        Object.keys(agg).forEach(id => {
            if (!productIds.includes(id)) productIds.push(id);
        });

        const rowsHtml = productIds.map(pid => {
            ensure(pid);
            const m = agg[pid];
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

        const billNumber = salesForDay.length ? (salesForDay[0].invoiceNumber || '') : (dispatchNote?.serial || '');
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
                            <th style='background:#8d0000;color:#fff'>${billNumber || ''}</th>
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
    };

    // ===== RECONCILIATION REPORT =====
    window.generateReconciliationReport = async function() {
        const state = window.state || {};
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const findProduct = window.findProduct || (() => null);
        const escapeHtml = window.escapeHtml || ((s) => s);
        const customDialog = window.customDialog || (() => {});
        const reportOutputArea = document.getElementById('report-output-area');

        const date = document.getElementById('recon-report-date')?.value || '';
        const repName = document.getElementById('recon-report-rep')?.value || '';
        const chainId = document.getElementById('recon-report-chain')?.value || '';

        if (!date || !repName) {
            await customDialog({ message: 'الرجاء تحديد التاريخ والمندوب.', title: 'بيانات ناقصة' });
            return;
        }

        let allowedCustomerIds = null;
        if (chainId) {
            const chains = (window.loadChains && window.loadChains()) || [];
            const chain = chains.find(c => c.id === chainId);
            if (chain) allowedCustomerIds = chain.customerIds || [];
        }

        const dispatchNote = state.dispatchNotes.find(n => {
            const d = new Date(n.date);
            if (isNaN(d.getTime())) return false;
            return n.repName === repName && d.toISOString().split('T')[0] === date;
        });

        if (!dispatchNote) {
            reportOutputArea.innerHTML = '<p class="text-center text-red-500 p-4">لم يتم العثور على إذن استلام لهذا المندوب في التاريخ المحدد.</p>';
            return;
        }

        const sales = state.sales.filter(s => {
            const d = new Date(s.date);
            if (isNaN(d.getTime())) return false;
            return s.repName === repName && d.toISOString().split('T')[0] === date && 
                (!allowedCustomerIds || allowedCustomerIds.includes(s.customerId));
        });

        const salesByProduct = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                salesByProduct[item.productId] = (salesByProduct[item.productId] || 0) + item.quantity;
            });
        });

        const allProductIds = new Set([
            ...dispatchNote.items.map(i => i.productId),
            ...Object.keys(salesByProduct)
        ]);

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
                totalDeficitValue += differenceValue;
            } else if (difference > 0) {
                diffClass = 'text-green-600 font-bold';
                totalSurplusValue += differenceValue;
            }

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
                    <td style="background:#041a3f;color:${difference < 0 ? '#ff2e2e' : (difference > 0 ? '#25d366' : '#fff')};padding:6px 4px;text-align:center;font-weight:${difference !== 0 ? '700' : '400'}">${difference}</td>
                    <td style="background:#062c5c;color:${differenceValue < 0 ? '#ff2e2e' : (differenceValue > 0 ? '#25d366' : '#fff')};padding:6px 4px;text-align:center;font-weight:${differenceValue !== 0 ? '700' : '400'}">${formatCurrency(differenceValue)}</td>
                </tr>`;
        });

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
                    <div style='flex:1;background:linear-gradient(90deg,#007a00,#00b300);color:#fff;text-align:center;font-weight:bold;padding:12px 8px;border:2px solid #004c00;'>${(totalDeficitValue === 0 && totalSurplusValue === 0) ? 'لا توجد عجوزات وزيادات' : 'مراجعة القيم أعلاه'}</div>
                </div>
                <div class='mt-4 grid grid-cols-3 gap-2 no-print'>
                    <button onclick="printSection('recon-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
                    <button onclick="generateReportImage('recon-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> صورة HD</button>
                    <button onclick="shareReconciliationWhatsApp('recon-report-output')" class='bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2'><i data-lucide='send'></i> مشاركة واتساب</button>
                </div>
            </div>`;

        reportOutputArea.innerHTML = finalHtml;
    };

    // ===== WhatsApp Share Helpers =====
    window.shareSettlementWhatsApp = async function(elementId) {
        try {
            const el = document.getElementById(elementId);
            if (!el) { (window.customDialog||(()=>{}))({ title: 'خطأ', message: 'تعذر العثور على التقرير.' }); return; }
            const date = document.getElementById('settlement-report-date')?.value || '';
            const rep = document.getElementById('settlement-report-rep')?.value || '';
            if (el) el.classList.add('recon-export-scale');
            const canvas = await window.captureElementCanvas(el, 3);
            if (el) el.classList.remove('recon-export-scale');
            const dataUrl = canvas.toDataURL('image/png');
            const w = window.open('about:blank','_blank');
            if (w) {
                w.document.write('<title>صورة تقرير التسوية</title><p style="font-family:sans-serif">احفظ الصورة ثم أرفقها في واتساب.</p><img style="max-width:100%;" src="'+dataUrl+'" />');
            }
            const msg = `تقرير التسوية للمندوب ${rep} - ${date}`;
            try { await navigator.clipboard.writeText(msg); } catch(_) {}
            const wa = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            let popup = window.open(wa, '_blank');
            setTimeout(() => {
                try {
                    if (!popup || popup.closed) {
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                } catch(_) {
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }
            }, 1200);
        } catch (e) {
            console.warn('shareSettlementWhatsApp failed', e);
            (window.customDialog||(()=>{}))({ title: 'خطأ', message: 'تعذر تجهيز المشاركة.' });
        }
    };

    window.shareReconciliationWhatsApp = async function(elementId) {
        try {
            const el = document.getElementById(elementId);
            if (!el) { (window.customDialog||(()=>{}))({ title: 'خطأ', message: 'تعذر العثور على التقرير.' }); return; }
            const date = document.getElementById('recon-report-date')?.value || '';
            const rep = document.getElementById('recon-report-rep')?.value || '';
            if (el) el.classList.add('recon-export-scale');
            const canvas = await window.captureElementCanvas(el, 3);
            if (el) el.classList.remove('recon-export-scale');
            const dataUrl = canvas.toDataURL('image/png');
            const w = window.open('about:blank','_blank');
            if (w) {
                w.document.write('<title>صورة التسوية النهائية</title><p style="font-family:sans-serif">احفظ الصورة ثم أرفقها في واتساب.</p><img style="max-width:100%;" src="'+dataUrl+'" />');
            }
            const msg = `التسوية النهائية للمندوب ${rep} - ${date}`;
            try { await navigator.clipboard.writeText(msg); } catch(_) {}
            const wa = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            let popup = window.open(wa, '_blank');
            setTimeout(() => {
                try {
                    if (!popup || popup.closed) {
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                } catch(_) {
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }
            }, 1200);
        } catch (e) {
            console.warn('shareReconciliationWhatsApp failed', e);
            (window.customDialog||(()=>{}))({ title: 'خطأ', message: 'تعذر تجهيز المشاركة.' });
        }
    };

})();
