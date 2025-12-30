// Debts and Reports Management Functions
// استخراج الدوال المتعلقة بالديون والمحاسبة من index.html

function calculateCustomerBalances() {
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
		map.forEach((v, k) => {
			v.balance = (v.total || 0) - (v.paid || 0);
		});
	} catch (e) {
		console.warn('calculateCustomerBalances error', e);
	}
	return map;
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

function renderDebts() {
	const customerFilterText = (document.getElementById('debt-customer-filter') || {}).value || '';
	const repFilter = (document.getElementById('debt-rep-filter') || {}).value || '';
	const startDateVal = (document.getElementById('debt-start-date') || {}).value || '';
	const endDateVal = (document.getElementById('debt-end-date') || {}).value || '';

	const repSelect = document.getElementById('debt-rep-filter');
	if (repSelect) {
		repSelect.innerHTML = '<option value="">جميع المناديب</option>';
		[...new Set(state.sales.map(s => s.repName))].filter(name => name).sort().forEach(name => {
			repSelect.innerHTML += `<option value="${name}" ${name === repFilter ? 'selected' : ''}>${name}</option>`;
		});
	}

	try {
		const custSelect = document.getElementById('debt-customer-filter');
		if (custSelect) {
			const customerIds = Array.from(new Set((state.sales || []).map(s => s.customerId).filter(id => id !== undefined && id !== null)));
			const prevValue = (custSelect.value || '');
			let options = '<option value="">جميع العملاء</option>';
			customerIds.sort((a, b) => {
				const aName = (findCustomer(a) && findCustomer(a).name) ? findCustomer(a).name.toLowerCase() : String(a);
				const bName = (findCustomer(b) && findCustomer(b).name) ? findCustomer(b).name.toLowerCase() : String(b);
				return aName.localeCompare(bName);
			}).forEach(id => {
				const name = (findCustomer(id) && findCustomer(id).name) ? findCustomer(id).name : ('عميل ' + id);
				options += `<option value="${id}" ${String(id) === String(prevValue) ? 'selected' : ''}>${name}</option>`;
			});
			custSelect.innerHTML = options;
		}
	} catch (e) {
		console.warn('Failed to populate debt customer select', e);
	}

	const noFilters = !customerFilterText && !repFilter && !startDateVal && !endDateVal;
	
	const tbody = document.getElementById('debts-detail-body');
	const emptyMessage = document.getElementById('debts-empty-message');
	if (!tbody) return;
	tbody.innerHTML = '';

	const dataCellStyle = 'padding:8px;border:1px solid #ddd;background:white;color:black;font-size:14px;text-align:center;';
	const rightCellStyle = dataCellStyle + 'text-align:right;';
	const centerCellStyle = dataCellStyle + 'text-align:center;';
	const moneyStyle = dataCellStyle + 'font-weight:bold;color:#1d4f91;';

	try {
		const table = document.getElementById('debts-detail-table');
		if (table) {
			table.style.cssText = 'width:100% !important;border-collapse:collapse !important;font-family:Arial,sans-serif !important;direction:rtl !important;';
		}
	} catch (e) { }

	let filteredSales = [];
	if (noFilters) {
		filteredSales = (state.sales || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
	}

	const startDate = startDateVal ? new Date(startDateVal + 'T00:00:00') : null;
	const endDate = endDateVal ? new Date(endDateVal + 'T23:59:59') : null;

	if (!filteredSales.length) {
		filteredSales = state.sales.filter(sale => {
			const saleDate = sale.date ? new Date(sale.date) : null;
			if (startDate && saleDate && saleDate < startDate) return false;
			if (endDate && saleDate && saleDate > endDate) return false;
			if (customerFilterText) {
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
		}).sort((a, b) => new Date(b.date) - new Date(a.date));
	}

	const hidePaidCheckbox = document.getElementById('hide-paid-debts');
	const hidePaid = hidePaidCheckbox ? hidePaidCheckbox.checked : true;
	if (hidePaid) {
		filteredSales = filteredSales.filter(sale => {
			const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
			const remainingAmount = (sale.total || 0) - paidAmount;
			return remainingAmount > 0.01;
		});
	}

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

	const subtotalEl2 = document.getElementById('debts-subtotal');
	const paidEl2 = document.getElementById('debts-paid');
	const countEl2 = document.getElementById('debts-invoices-count');
	const debtsEl2 = document.getElementById('debts-total-debt');
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

	filteredSales.forEach((sale, idx) => {
		const tr = document.createElement('tr');
		const custName = findCustomer(sale.customerId)?.name || 'عميل محذوف';
		const dateText = sale.date ? formatArabicDate(sale.date) : '';
		const invoiceNum = sale.invoiceNumber || '';
		const paidAmount = sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0));
		const formatTableNumber = (num) => Math.abs(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		const formattedTotal = formatTableNumber(sale.total || 0);
		const formattedPaid = formatTableNumber(paidAmount);
		const formattedRemaining = formatTableNumber((sale.total || 0) - paidAmount);
		const rep = sale.repName || '';

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

		try {
			if (sale && (sale.id !== undefined && sale.id !== null)) tr.dataset.saleId = String(sale.id);
			else if (sale && sale.invoiceNumber) tr.dataset.saleId = String(sale.invoiceNumber);
			if (sale) {
				try { if (sale.customerId !== undefined && sale.customerId !== null) tr.dataset.customerId = String(sale.customerId); } catch (e) { }
				try { tr.dataset.date = sale.date ? sale.date.split('T')[0] : ''; } catch (e) { }
				try { tr.dataset.invoice = sale.invoiceNumber ? String(sale.invoiceNumber) : ''; } catch (e) { }
				try { tr.dataset.total = String(Number(sale.total || 0)); } catch (e) { }
				try { const paidRaw = Number(sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0))); tr.dataset.paid = String(paidRaw); } catch (e) { }
				try { const rem = Number((sale.total || 0) - (sale.paidAmount ?? ((sale.firstPayment || 0) + (sale.secondPayment || 0)))); tr.dataset.remaining = String(rem); } catch (e) { }
				try { tr.dataset.rep = sale.repName ? String(sale.repName) : ''; } catch (e) { }
			}
		} catch (e) { }

		tbody.appendChild(tr);
	});

	updateIcons();
}

function renderRepDebts() {
	loadReps();
	const tbody = document.getElementById('rep-debts-list-body');
	if (!tbody) return;
	tbody.innerHTML = '';

	const balances = Array.from(calculateRepBalances().entries()).map(([repName, obj]) => ({ repName, ...obj }))
		.filter(r => r.totalSales > 0)
		.sort((a, b) => b.balance - a.balance);

	if (balances.length === 0) {
		tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">لا توجد مبيعات مسجلة للمناديب بعد.</td></tr>`;
		return;
	}

	balances.forEach(row => {
		const balanceClass = row.balance > 0 ? 'text-red-700 font-bold' : (row.balance < 0 ? 'text-green-700 font-bold' : 'text-gray-700');
		const balanceText = formatCurrency(row.balance);
		const tr = document.createElement('tr');
		tr.className = 'hover:bg-orange-50';
		tr.innerHTML = `<td class="px-4 py-3 text-right font-medium text-gray-800">${row.repName}</td><td class="px-4 py-3 text-center">${formatCurrency(row.totalSales)}</td><td class="px-4 py-3 text-center">${formatCurrency(row.totalCollected)}</td><td class="px-4 py-3 text-center ${balanceClass}">${balanceText}</td><td class="px-4 py-3 text-center"><button data-rep-name="${row.repName}" class="view-rep-summary-btn text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-md hover:bg-orange-200 transition">عرض كشف الحساب</button></td>`;
		tbody.appendChild(tr);
	});

	tbody.querySelectorAll('.view-rep-summary-btn').forEach(button => {
		button.addEventListener('click', (e) => {
			const repName = e.currentTarget.dataset.repName;
			generateAndShowRepSummary(repName);
		});
	});

	updateIcons();
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

async function loadReps() {
	const repSelect = document.getElementById('debt-rep-filter');
	const isFileProtocol = window.location && window.location.protocol === 'file:';
	const fallbackPopulate = (reps) => {
		try {
			if (!repSelect) return;
			repSelect.innerHTML = `\n <option value="">جميع المناديب</option>\n ${reps.map(rep => `<option value="${rep.id}">${rep.name}</option>`).join('')}\n `;
		} catch (e) {
			console.warn('populate reps fallback failed', e);
		}
	};

	if (isFileProtocol) {
		try {
			const reps = Array.isArray(state.reps) ? state.reps : [];
			fallbackPopulate(reps);
			return reps;
		} catch (e) {
			console.warn('loadReps fallback failed', e);
			return [];
		}
	}

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

// تصدير الدوال إلى window object
window.calculateCustomerBalances = calculateCustomerBalances;
window.calculateRepBalances = calculateRepBalances;
window.renderDebts = renderDebts;
window.renderRepDebts = renderRepDebts;
window.generateAndShowRepSummary = generateAndShowRepSummary;
window.loadReps = loadReps;
