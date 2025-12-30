// Additional utility functions and helpers
// دوال مساعدة إضافية تم استخراجها لتقليل حجم index.html

function getProductDetailsByCode(code) {
	if (!code) return null;
	const scode = String(code);
	const product = state.products.find(p => String(p.id) === scode) ||
		state.products.find(p => String(p._id) === scode) ||
		state.products.find(p => String(p.sku) === scode);
	if (!product) return null;
	const price = Number(product.price || 0);
	const category = product.category === 'multi' ? 'مالتي' : (product.category === 'dairy' ? 'ألبان' : (product.category || ''));
	return { id: product.id || product._id || product.sku, name: product.name || product.title || code, defaultPrice: price, categoryName: category };
}

function getCustomerTargetsStore() {
	state.customerTargets = state.customerTargets || {};
	return state.customerTargets;
}

function getCustomerTargetsForMonth(month) {
	const store = getCustomerTargetsStore();
	if (!store[month]) store[month] = {};
	return store[month];
}

function updateIcons() {
	try {
		if (typeof lucide !== 'undefined' && lucide.createIcons) {
			lucide.createIcons();
		}
	} catch (e) {
		console.warn('updateIcons: lucide not available', e);
	}
}

function formatCurrency(value) {
	const num = Number(value || 0);
	if (isNaN(num)) return '0.00';
	return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatArabicDate(dateString) {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
		return date.toLocaleDateString('ar-EG', options);
	} catch (e) {
		return dateString;
	}
}

function escapeHtml(s) {
	return s.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function findCustomer(id) {
	if (!id) return null;
	return (state.customers || []).find(c => String(c.id) === String(id) || String(c._id) === String(id));
}

function findProduct(id) {
	if (!id) return null;
	return (state.products || []).find(p => String(p.id) === String(id) || String(p._id) === String(id));
}

function findRep(name) {
	if (!name) return null;
	return (state.reps || []).find(r => r.name === name || r.id === name);
}

function findPriceList(id) {
	if (!id) return null;
	return (state.priceLists || []).find(pl => String(pl.id) === String(id) || String(pl._id) === String(id));
}

function getActivePromotionPrice(productId, customerId) {
	if (!productId) return null;
	const now = new Date();
	const active = (state.promotions || []).find(p => {
		if (String(p.productId) !== String(productId)) return false;
		if (p.customerId && String(p.customerId) !== String(customerId)) return false;
		const start = p.startDate ? new Date(p.startDate) : null;
		const end = p.endDate ? new Date(p.endDate) : null;
		if (start && now < start) return false;
		if (end && now > end) return false;
		return true;
	});
	return active ? Number(active.price) : null;
}

function getStatusBadge(status) {
	const statusMap = {
		'paid': '<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">مدفوع</span>',
		'due': '<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">آجل</span>',
		'partial': '<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">جزئي</span>',
		'canceled': '<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">ملغى</span>',
		'pending': '<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">قيد الانتظار</span>'
	};
	return statusMap[status] || `<span class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">${status}</span>`;
}

function populateRepDropdown(select, currentValue) {
	if (!select) return;
	const reps = state.reps || [];
	select.innerHTML = '<option value="">-- غير محدد --</option>' +
		reps.map(r => `<option value="${r.id}" ${r.id === currentValue ? 'selected' : ''}>${r.name || r.id}</option>`).join('');
}

function populateCustomerDropdown(select) {
	if (!select) return;
	const customers = state.customers || [];
	select.innerHTML = '<option value="">-- اختر عميل --</option>' +
		customers.map(c => `<option value="${c.id}">${c.name || c.id}</option>`).join('');
}

function customDialog({ message = '', title = 'تنبيه', isConfirm = false, confirmText = 'موافق', confirmClass = 'bg-blue-600 hover:bg-blue-700' }) {
	return new Promise((resolve) => {
		if (!isConfirm) {
			alert(message);
			resolve(true);
		} else {
			const userConfirmed = confirm(title + '\n\n' + message);
			resolve(userConfirmed);
		}
	});
}

function showLoading(message = 'جارٍ المعالجة...') {
	let loader = document.getElementById('global-loading');
	if (!loader) {
		loader = document.createElement('div');
		loader.id = 'global-loading';
		loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999';
		loader.innerHTML = `
			<div class="bg-white p-6 rounded-lg shadow-lg text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-gray-700">${message}</p>
			</div>
		`;
		document.body.appendChild(loader);
	} else {
		loader.querySelector('p').textContent = message;
		loader.style.display = 'flex';
	}
}

function hideLoading() {
	const loader = document.getElementById('global-loading');
	if (loader) loader.style.display = 'none';
}

function openModal(modal) {
	if (modal) {
		modal.classList.remove('hidden');
		modal.style.display = 'flex';
	}
}

function closeModal(modal) {
	if (modal) {
		modal.classList.add('hidden');
		modal.style.display = 'none';
	}
}

function serverTs() {
	return new Date().toISOString();
}

function loadChains() {
	return state.chains || [];
}

// تصدير الدوال إلى window object
window.getProductDetailsByCode = getProductDetailsByCode;
window.getCustomerTargetsStore = getCustomerTargetsStore;
window.getCustomerTargetsForMonth = getCustomerTargetsForMonth;
window.updateIcons = updateIcons;
window.formatCurrency = formatCurrency;
window.formatArabicDate = formatArabicDate;
window.escapeHtml = escapeHtml;
window.findCustomer = findCustomer;
window.findProduct = findProduct;
window.findRep = findRep;
window.findPriceList = findPriceList;

// Safe stubs and helpers used across app
function applyRoleNavRestrictions(role){
	try {
		// No-op: implement actual nav restrictions when UI nav is modularized
		return true;
	} catch(e){ return false; }
}
function saveState(){
	try { localStorage.setItem('appState', JSON.stringify(window.state||{})); return true; } catch(e){ return false; }
}
window.applyRoleNavRestrictions = applyRoleNavRestrictions;
window.saveState = saveState;
window.getActivePromotionPrice = getActivePromotionPrice;
window.getStatusBadge = getStatusBadge;
window.populateRepDropdown = populateRepDropdown;
window.populateCustomerDropdown = populateCustomerDropdown;
window.customDialog = customDialog;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.openModal = openModal;
window.closeModal = closeModal;
window.serverTs = serverTs;
window.loadChains = loadChains;
