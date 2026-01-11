/**
 * reports-ui.js
 * Chart rendering, canvas export, and table formatting for reports
 * Extracted from reports-services.js to reduce file size
 */

(function() {
    'use strict';

    // Global chart instances for active reports
    window.sales7DaysChart = null;
    window.topRepsChart = null;
    window.topProductsChart = null;
    window.topCustomersChart = null;

    // ===== CHART CREATION & RENDERING =====

    window.createOrUpdateChart = function(chartInstance, canvasId, type, data, options) { 
        if (chartInstance) { chartInstance.data.labels = data.labels; chartInstance.data.datasets[0].data = data.data; chartInstance.update(); return chartInstance; }
        const ctx = document.getElementById(canvasId)?.getContext('2d'); 
        if (!ctx) return null;
        return new Chart(ctx, { type: type, data: { labels: data.labels, datasets: [{ label: options.label || 'القيمة', data: data.data, backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.5)', borderColor: options.borderColor || 'rgba(59, 130, 246, 1)', borderWidth: options.borderWidth || 1, tension: 0.3, ...options.datasetOverrides }] }, options: { responsive: true, maintainAspectRatio: false, rtl: true, plugins: { legend: { labels: { font: { family: 'Cairo' } } } }, scales: { x: { reverse: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.xTitle, text: options.xTitle, font: { family: 'Cairo' } } }, y: { beginAtZero: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.yTitle, text: options.yTitle, font: { family: 'Cairo' } } } }, ...options.overrides } }); 
    };

    window.renderSales7DaysChart = function() { 
        const data = window.getSalesDataForLast7Days(); 
        window.sales7DaysChart = window.createOrUpdateChart(window.sales7DaysChart, 'sales-7-days-chart', 'line', data, { label: 'إجمالي المبيعات (ج.م)', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)', yTitle: 'المبيعات (ج.م)', datasetOverrides: { fill: true } }); 
    };

    window.renderTopRepsChart = function() { 
        const data = window.getTopRepsData(5); 
        window.topRepsChart = window.createOrUpdateChart(window.topRepsChart, 'top-reps-chart', 'bar', data, { label: 'قيمة المبيعات (ج.م)', backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: 'rgba(16, 185, 129, 1)', yTitle: 'قيمة المبيعات', overrides: { indexAxis: 'y' } }); 
    };

    window.renderTopProductsChart = function() { 
        const data = window.getTopProductsData(5); 
        window.topProductsChart = window.createOrUpdateChart(window.topProductsChart, 'top-products-chart', 'bar', data, { label: 'الكمية (قطع)', backgroundColor: 'rgba(234, 179, 8, 0.7)', borderColor: 'rgba(234, 179, 8, 1)', yTitle: 'الكمية', overrides: { indexAxis: 'y' } }); 
    };

    window.renderTopCustomersChart = function() { 
        const data = window.getTopCustomersData(5); 
        window.topCustomersChart = window.createOrUpdateChart(window.topCustomersChart, 'top-customers-chart', 'doughnut', data, { label: 'قيمة المبيعات (ج.م)', backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'], borderColor: '#fff', overrides: { parsing: { key: 'data' } }, datasetOverrides: { hoverOffset: 4 } }); 
    };

    // ===== CANVAS & IMAGE EXPORT =====

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
                scale: scale,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            return canvas;
        } finally {
            element.style.boxShadow = prev.boxShadow;
            element.style.filter = prev.filter;
            element.style.transform = prev.transform;
        }
    };

    window.generateReportImage = async function(elementId) {
        try {
            const reportElement = document.getElementById(elementId);
            if (!reportElement) {
                alert('تقرير غير موجود');
                return;
            }
            let canvas;
            try {
                canvas = await window.captureElementCanvas(reportElement, 4);
            } catch (_) {
                try {
                    canvas = await window.captureElementCanvas(reportElement, 2);
                } catch (_) {
                    alert('فشل تحويل التقرير لصورة');
                    return;
                }
            }
            const imageUrl = canvas.toDataURL('image/png');
            const previewContainer = document.getElementById('report-image-preview');
            if (previewContainer) {
                previewContainer.innerHTML = '';
                const img = new Image();
                img.src = imageUrl;
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.width = canvas.width + 'px';
                img.style.border = '1px solid #ddd';
                img.style.marginTop = '10px';
                img.style.borderRadius = '4px';
                previewContainer.appendChild(img);
                previewContainer.style.maxWidth = canvas.width + 'px';
            }
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `report_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('html2canvas failed:', err);
            alert('فشل إنشاء صورة التقرير');
        }
    };

    // ===== TABLE FORMATTING & HTML GENERATION =====

    window.formatTableHeader = function(headers) {
        return `<tr class="bg-blue-100 border-b-2 border-blue-300">${headers.map(h => `<th class="p-2 text-right font-bold text-sm">${h}</th>`).join('')}</tr>`;
    };

    window.formatTableRow = function(values, className = '') {
        return `<tr class="${className} border-b border-gray-200 hover:bg-gray-50">${values.map(v => `<td class="p-2 text-right text-sm">${v}</td>`).join('')}</tr>`;
    };

    window.formatSalesTable = function(sales) {
        if (!Array.isArray(sales) || sales.length === 0) {
            return '<p class="text-center text-gray-500">لا توجد مبيعات</p>';
        }
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        const getStatusBadge = window.getStatusBadge || ((s) => s);
        const findCustomer = window.findCustomer || (() => null);
        
        let html = '<table class="w-full border-collapse"><thead>';
        html += window.formatTableHeader(['التاريخ', 'العميل', 'المندوب', 'الإجمالي', 'المدفوع', 'المتبقي', 'الحالة']);
        html += '</thead><tbody>';
        
        sales.forEach(sale => {
            const customer = findCustomer(sale.customerId);
            const customerName = customer?.name || sale.customerName || 'غير معروف';
            const repName = sale.repName || 'غير معروف';
            const total = sale.total || 0;
            const paid = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
            const due = total - paid;
            const date = sale.date ? new Date(sale.date).toLocaleDateString('ar-EG') : 'غير محدد';
            
            html += window.formatTableRow([
                date,
                customerName,
                repName,
                formatCurrency(total),
                formatCurrency(paid),
                formatCurrency(due),
                getStatusBadge(sale.status || 'pending')
            ]);
        });
        
        html += '</tbody></table>';
        return html;
    };

    window.formatDebtTable = function(debts) {
        if (!Array.isArray(debts) || debts.length === 0) {
            return '<p class="text-center text-gray-500">لا توجد ديون</p>';
        }
        const formatCurrency = window.formatCurrency || ((n) => String(n));
        
        let html = '<table class="w-full border-collapse"><thead>';
        html += window.formatTableHeader(['العميل', 'الدين', 'آخر تحديث']);
        html += '</thead><tbody>';
        
        debts.forEach(debt => {
            const lastUpdate = debt.lastUpdate ? new Date(debt.lastUpdate).toLocaleDateString('ar-EG') : 'غير محدد';
            html += window.formatTableRow([
                debt.customerName || 'غير معروف',
                formatCurrency(debt.amount || 0),
                lastUpdate
            ]);
        });
        
        html += '</tbody></table>';
        return html;
    };

    console.log('✓ Reports UI Services loaded');
})();
