// Reports Generation Functions
// استخراج دوال إنشاء التقارير

function generateDailyReport() {
	const date = dailyReportDateInput.value;
	const repName = dailyReportRepSelect.value;
	const chainId = document.getElementById('daily-report-chain').value;

	if (!date) {
		customDialog({ message: 'الرجاء تحديد تاريخ التقرير اليومي.', title: 'بيانات ناقصة' });
		return;
	}

	let allowedCustomerIds = null;
	if (chainId) {
		const chains = loadChains();
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

function generateRangeReport() {
	const start = rangeStartDateInput.value;
	const end = rangeEndDateInput.value;
	const repName = rangeReportRepSelect.value;
	const chainId = document.getElementById('range-report-chain').value;

	if (!start || !end) {
		customDialog({ message: 'الرجاء تحديد تاريخ البداية والنهاية.', title: 'بيانات ناقصة' });
		return;
	}

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
		if (isNaN(d.getTime())) return false;
		const matchesDate = d >= startDate && d <= endDate;
		const matchesRep = repName === 'all' || s.repName === repName;
		const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
		return matchesDate && matchesRep && matchesChain;
	}).sort((a, b) => new Date(a.date) - new Date(b.date));

	let totalSales = 0;
	let totalReturns = 0;
	const rowsHtml = salesInRange.map(sale => {
		const customer = findCustomer(sale.customerId);
		const isReturn = sale.total < 0;
		if (isReturn) totalReturns += sale.total; else totalSales += sale.total;
		const totalClass = isReturn ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
		return `<tr class="border-b ${isReturn ? 'bg-red-50' : ''}">
<td class="px-3 py-1 text-center">${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
<td class="px-3 py-1">${sale.invoiceNumber || ''}</td>
<td class="px-3 py-1">${customer?.name || 'عميل محذوف'}</td>
<td class="px-3 py-1">${sale.repName || ''}</td>
<td class="px-3 py-1 text-center ${totalClass}">${formatCurrency(sale.total)}</td>
<td class="px-3 py-1 text-center">${getStatusBadge(sale.status)}</td>
</tr>`;
	}).join('');

	const netSales = totalSales + totalReturns;
	const chainName = chainId ? document.querySelector('#range-report-chain option[value="' + chainId + '"]').textContent : '';

	const dailyMap = new Map();
	salesInRange.forEach(s => {
		const dayKey = new Date(s.date).toISOString().split('T')[0];
		const prev = dailyMap.get(dayKey) || { sales: 0, returns: 0 };
		if (s.total < 0) prev.returns += s.total; else prev.sales += s.total;
		dailyMap.set(dayKey, prev);
	});

	const dailyRows = Array.from(dailyMap.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]))
		.map(([day, agg]) => {
			const net = agg.sales + agg.returns;
			return `<tr class="border-b"><td class="px-2 py-1">${day}</td><td class="px-2 py-1 text-green-700 font-semibold">${formatCurrency(agg.sales)}</td><td class="px-2 py-1 text-red-700 font-semibold">${formatCurrency(agg.returns)}</td><td class="px-2 py-1 text-blue-700 font-semibold">${formatCurrency(net)}</td></tr>`;
		}).join('');

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
	const month = monthlyReportMonthInput.value;
	const repName = monthlyReportRepSelect.value;
	const chainId = document.getElementById('monthly-report-chain').value;

	if (!month) {
		customDialog({ message: 'الرجاء اختيار شهر.', title: 'بيانات ناقصة' });
		return;
	}

	let allowedCustomerIds = null;
	if (chainId) {
		const chains = loadChains();
		const chain = chains.find(c => c.id === chainId);
		if (chain) allowedCustomerIds = chain.customerIds || [];
	}

	const [yearStr, monthStr] = month.split('-');
	const year = parseInt(yearStr, 10);
	const m = parseInt(monthStr, 10) - 1;
	const startDate = new Date(Date.UTC(year, m, 1));
	const endDate = new Date(Date.UTC(year, m + 1, 0, 23, 59, 59));

	const monthSales = state.sales.filter(s => {
		const d = new Date(s.date);
		if (isNaN(d.getTime())) return false;
		const matchesDate = d >= startDate && d <= endDate;
		const matchesRep = repName === 'all' || s.repName === repName;
		const matchesChain = !allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
		return matchesDate && matchesRep && matchesChain;
	});

	let totalSales = 0;
	let totalReturns = 0;
	const byRep = new Map();
	monthSales.forEach(s => {
		const key = s.repName || 'غير محدد';
		const agg = byRep.get(key) || { sales: 0, returns: 0 };
		if (s.total < 0) {
			agg.returns += s.total;
			totalReturns += s.total;
		} else {
			agg.sales += s.total;
			totalSales += s.total;
		}
		byRep.set(key, agg);
	});

	const netSales = totalSales + totalReturns;
	const repRows = Array.from(byRep.entries()).map(([rep, agg]) => {
		const net = agg.sales + agg.returns;
		return `<tr class="border-b"><td class="px-3 py-1">${rep}</td><td class="px-3 py-1 text-center text-green-700 font-semibold">${formatCurrency(agg.sales)}</td><td class="px-3 py-1 text-center text-red-700 font-semibold">${formatCurrency(agg.returns)}</td><td class="px-3 py-1 text-center text-blue-700 font-semibold">${formatCurrency(net)}</td></tr>`;
	}).join('');

	const customerAgg = new Map();
	monthSales.forEach(s => {
		const cid = s.customerId || 'unknown';
		const ag = customerAgg.get(cid) || { net: 0 };
		ag.net += s.total;
		customerAgg.set(cid, ag);
	});

	const chainName = chainId ? document.querySelector('#monthly-report-chain option[value="' + chainId + '"]').textContent : '';
	const topCustomers = Array.from(customerAgg.entries()).sort((a, b) => b[1].net - a[1].net).slice(0, 5)
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

window.generateDailyReport = generateDailyReport;
window.generateRangeReport = generateRangeReport;
window.generateMonthlyReport = generateMonthlyReport;
