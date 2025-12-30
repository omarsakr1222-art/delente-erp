// Promotions and Notifications Management Functions
// استخراج الدوال المتعلقة بالعروض والإخطارات من index.html

function addBatchPromoRow(prefill) {
	const tbody = document.getElementById('batch-promo-rows');
	if (!tbody) return;
	const tr = document.createElement('tr');
	const rowBg = 'background:linear-gradient(90deg, rgba(249,224,190,1) 0%, rgba(245,183,77,0.08) 100%);';
	const cellBase = 'padding:8px;border-bottom:1px solid rgba(0,0,0,0.05);text-align:center;font-size:14px;';
	tr.innerHTML = `
		<td style="${cellBase};background:linear-gradient(90deg,#fff8e1,#ffe0b2);color:#7a3f00;font-weight:700;${rowBg}"><input type="number" class="bp-price p-1 border rounded w-24 text-center" step="any" placeholder="0"></td>
		<td style="${cellBase};${rowBg}"><input type="date" class="bp-to p-1 border rounded"></td>
		<td style="${cellBase};${rowBg}"><input type="date" class="bp-from p-1 border rounded"></td>
		<td style="${cellBase};background:linear-gradient(90deg,#e8f7ff,#dbeefd);color:#0b3d91;font-weight:600;${rowBg}"><input type="text" class="bp-name p-1 border rounded w-64" placeholder="اسم الصنف" readonly></td>
		<td style="${cellBase};background:linear-gradient(90deg,#e9e8ff,#cbd7ff);font-weight:700;color:#0b3d91;${rowBg}"><input type="text" class="bp-code p-1 border rounded w-20 text-center" placeholder="كود"></td>
		<td style="${cellBase};${rowBg}"><span class="bp-customer-display"></span></td>
		<td style="${cellBase};${rowBg}"><button type="button" class="bp-del px-2 py-1 bg-red-600 text-white rounded">حذف</button></td>`;
	tbody.appendChild(tr);

	const fromInput = tr.querySelector('.bp-from');
	const toInput = tr.querySelector('.bp-to');
	const codeInput = tr.querySelector('.bp-code');
	const nameInput = tr.querySelector('.bp-name');
	const priceInput = tr.querySelector('.bp-price');
	const custDisplay = tr.querySelector('.bp-customer-display');
	const custSel = document.getElementById('batch-promo-customer');
	const fromGlobal = document.getElementById('batch-promo-from');
	const toGlobal = document.getElementById('batch-promo-to');

	if (fromGlobal && !fromInput.value) fromInput.value = fromGlobal.value;
	if (toGlobal && !toInput.value) toInput.value = toGlobal.value;
	if (custSel) custDisplay.textContent = custSel.options[custSel.selectedIndex]?.text || 'جميع العملاء';

	codeInput.addEventListener('change', () => {
		const p = getProductDetailsByCode(codeInput.value);
		if (p) {
			nameInput.value = p.name;
			nameInput.classList.remove('text-red-600');
		} else {
			nameInput.value = 'كود غير صحيح';
			nameInput.classList.add('text-red-600');
		}
	});

	document.getElementById('batch-promo-customer')?.addEventListener('change', () => {
		const sel = document.getElementById('batch-promo-customer');
		if (sel) custDisplay.textContent = sel.options[sel.selectedIndex]?.text || 'جميع العملاء';
	});

	tr.querySelector('.bp-del').addEventListener('click', () => tr.remove());

	if (prefill) {
		if (prefill.code) {
			codeInput.value = prefill.code;
			codeInput.dispatchEvent(new Event('change'));
		}
		if (prefill.price) priceInput.value = prefill.price;
		if (prefill.from) fromInput.value = prefill.from;
		if (prefill.to) toInput.value = prefill.to;
	}
}

async function saveBatchPromotions() {
	const custId = document.getElementById('batch-promo-customer')?.value || null;
	const rows = Array.from(document.querySelectorAll('#batch-promo-rows tr'));
	if (!rows.length) {
		await customDialog({ message: 'أضف صفاً واحداً على الأقل.', title: 'تنبيه' });
		return;
	}

	if (!window.db) {
		console.warn('Firestore غير جاهز');
	}

	const batch = window.db ? db.batch() : null;
	const toCreateLocal = [];
	let created = 0;

	for (const tr of rows) {
		const code = tr.querySelector('.bp-code').value.trim();
		const nameOk = !tr.querySelector('.bp-name').classList.contains('text-red-600');
		const price = parseFloat(tr.querySelector('.bp-price').value);
		const from = tr.querySelector('.bp-from').value;
		const to = tr.querySelector('.bp-to').value;

		if (!code || !nameOk || !from || !to || isNaN(price) || price <= 0) continue;

		const prod = getProductDetailsByCode(code);
		if (!prod) continue;

		const data = {
			id: db && db.collection ? db.collection('promotions').doc().id : (Date.now() + '' + Math.random()).slice(0, 16),
			name: `عرض ${prod.name}`,
			productId: String(prod.id),
			price: Number(price),
			customerId: custId || null,
			startDate: from,
			endDate: to,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		if (batch) {
			const ref = db.collection('promotions').doc(data.id);
			batch.set(ref, data, { merge: false });
		} else {
			toCreateLocal.push(data);
		}
		created++;
	}

	if (!created) {
		await customDialog({ message: 'لا توجد صفوف صالحة للحفظ.', title: 'تنبيه' });
		return;
	}

	try {
		if (batch) await batch.commit();
		else {
			state.promotions = (state.promotions || []).concat(toCreateLocal);
		}
		await customDialog({ message: `تم حفظ ${created} عرض`, title: 'تم' });
		document.getElementById('batch-promo-rows').innerHTML = '';
		renderPromotions();
	} catch (e) {
		console.warn('saveBatchPromotions failed', e);
		await customDialog({ message: 'فشل الحفظ. حاول مرة أخرى.', title: 'خطأ' });
	}
}

function openNotifyModal(type) {
	const modal = document.getElementById('notify-modal');
	if (!modal) return;

	const title = modal.querySelector('#notify-modal-title');
	const typeInput = modal.querySelector('#notify-type');
	const productSelect = document.getElementById('notify-product');
	const promoSelect = document.getElementById('notify-promo');
	const newItemInput = document.getElementById('notify-new-item-name');
	const messageShort = document.getElementById('notify-short-text');
	const rowsBody = document.getElementById('notify-rows-body');
	const pasteArea = document.getElementById('notify-paste-area');
	const productContainer = document.getElementById('notify-product-container');
	const promoContainer = document.getElementById('notify-promo-container');
	const newItemContainer = document.getElementById('notify-new-item-container');

	productContainer.style.display = 'none';
	promoContainer.style.display = 'none';
	newItemContainer.style.display = 'none';
	pasteArea.style.display = 'none';
	rowsBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 p-4">لا توجد صفوف بعد.</td></tr>';

	if (type === 'prices' || type === 'prices-select') {
		title.textContent = 'اخطار — تغيير سعر';
		typeInput.value = 'prices';
		productContainer.style.display = '';
		productSelect.innerHTML = '<option value="">-- اختر صنف --</option>' +
			(state.products || []).map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(String(p.id))})</option>`).join('');
	} else if (type === 'new-item') {
		title.textContent = 'اخطار — صنف جديد';
		typeInput.value = 'new-item';
		newItemContainer.style.display = '';
	} else if (type === 'promotions') {
		title.textContent = 'اخطار — عرض';
		typeInput.value = 'promotions';
		promoContainer.style.display = '';
		promoSelect.innerHTML = '<option value="">-- اختر عرض --</option>' +
			(state.promotions || []).map(pr => `<option value="${pr.id}">${escapeHtml(pr.name || ('عرض ' + pr.id))}</option>`).join('');
	}

	modal.classList.remove('modal-hidden');
	modal.style.display = 'flex';

	const notifyCustomer = document.getElementById('notify-customer');
	const notifyGlobal = document.getElementById('notify-global-discount');
	if (notifyCustomer) notifyCustomer.value = '';
	if (notifyGlobal) notifyGlobal.value = '';

	try {
		if (notifyCustomer) {
			notifyCustomer.innerHTML = '<option value="">-- غير محدد --</option>' +
				(state.customers || []).map(c => `<option value="${c.id}">${escapeHtml(c.name || c.id)}</option>`).join('');
		}
	} catch (e) {
		console.warn('populate notify-customer failed', e);
	}
}

function closeNotifyModal() {
	const modal = document.getElementById('notify-modal');
	if (!modal) return;
	modal.classList.add('modal-hidden');
	modal.style.display = 'none';
}

function sendNotification(e) {
	e.preventDefault();
	const form = document.getElementById('notify-form');
	const type = document.getElementById('notify-type-select')?.value || document.getElementById('notify-type')?.value || 'prices';
	const title = document.getElementById('notify-title')?.value || '';
	const shortText = document.getElementById('notify-short-text')?.value || '';
	const productId = document.getElementById('notify-product')?.value || null;
	const promoId = document.getElementById('notify-promo')?.value || null;
	const newItemName = document.getElementById('notify-new-item-name')?.value || null;
	const customerId = document.getElementById('notify-customer')?.value || null;
	const globalDiscount = parseFloat(document.getElementById('notify-global-discount')?.value) || 0;

	const rows = [];
	const rowsBody = document.getElementById('notify-rows-body');
	if (rowsBody) {
		Array.from(rowsBody.querySelectorAll('tr')).forEach(tr => {
			const code = tr.querySelector('.nr-code')?.value || '';
			if (!code) return;
			const name = tr.querySelector('.nr-name')?.value || '';
			const price = parseFloat(tr.querySelector('.nr-price')?.value) || 0;
			const discount = parseFloat(tr.querySelector('.nr-discount')?.value) || 0;
			const priceAfter = parseFloat(tr.querySelector('.nr-price-after')?.value) || Math.round((price * (1 - (discount / 100))) * 100) / 100;
			rows.push({ code, name, price, discount, priceAfter });
		});
	}

	state.notifications = state.notifications || [];
	const notif = {
		id: 'n_' + Date.now(),
		type, title, shortText, productId, promoId, newItemName, customerId, globalDiscount, rows,
		date: new Date().toISOString()
	};
	state.notifications.push(notif);

	try {
		saveState();
	} catch (e) {
		console.warn('saveState failed after creating notification', e);
	}

	console.log('Notification created:', notif);
	closeNotifyModal();

	try {
		renderNotifications();
	} catch (e) {
		console.warn('renderNotifications error', e);
	}

	alert('تم حفظ الإخطار محلياً. يمكنك عرضه من قسم الأخطار داخل صفحة العروض.');
}

function renderNotifications() {
	const container = document.getElementById('notifications-list');
	if (!container) return;

	container.innerHTML = '';
	const list = (state.notifications || []).slice().reverse();

	if (list.length === 0) {
		container.innerHTML = '<p class="text-gray-500 text-center mt-8">لا توجد اخطارات بعد. استخدم زر "اخطار" لإنشاء واحد.</p>';
		return;
	}

	list.forEach(notif => {
		const el = document.createElement('div');
		el.className = 'bg-white p-3 rounded-lg border shadow-sm';

		const title = escapeHtml(notif.title || (notif.type || 'اخطار'));
		const short = escapeHtml(notif.shortText || '');
		const rowsHtml = (notif.rows || []).map(r =>
			`<tr><td class="px-2 py-1 text-right">${escapeHtml(r.code)}</td><td class="px-2 py-1">${escapeHtml(r.name)}</td><td class="px-2 py-1 text-center">${formatCurrency(r.price)}</td><td class="px-2 py-1 text-center">${r.discount || 0}%</td><td class="px-2 py-1 text-center">${formatCurrency(r.priceAfter)}</td></tr>`
		).join('');

		const tableHtml = notif.rows && notif.rows.length > 0 ?
			`<div class="overflow-x-auto mt-2"><table class="min-w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-2 py-1 text-right">كود</th><th class="px-2 py-1">صنف</th><th class="px-2 py-1 text-center">سعر</th><th class="px-2 py-1 text-center">خصم</th><th class="px-2 py-1 text-center">بعد الخصم</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>` : '';

		el.innerHTML = `<div class="flex justify-between items-start"><div><h4 class="font-semibold">${title}</h4><div class="text-xs text-gray-500">${short}</div></div><div class="text-xs text-gray-500">${new Date(notif.date).toLocaleString()}</div></div>${tableHtml}<div class="flex justify-end gap-2 mt-3"><button data-id="${notif.id}" class="view-notif-btn bg-blue-600 text-white px-3 py-1 rounded-md">عرض</button><button data-id="${notif.id}" class="delete-notif-btn bg-red-100 text-red-600 px-3 py-1 rounded-md">حذف</button></div>`;
		container.appendChild(el);
	});

	container.querySelectorAll('.view-notif-btn').forEach(b => b.addEventListener('click', (e) => {
		const id = b.dataset.id;
		const n = (state.notifications || []).find(x => x.id === id);
		if (!n) return alert('الإخطار غير موجود');

		openNotifyModal(n.type);
		setTimeout(() => {
			document.getElementById('notify-title').value = n.title || '';
			document.getElementById('notify-short-text').value = n.shortText || '';
			try { if (document.getElementById('notify-customer')) document.getElementById('notify-customer').value = n.customerId || ''; } catch (e) { }
			try { if (document.getElementById('notify-global-discount')) document.getElementById('notify-global-discount').value = n.globalDiscount || ''; } catch (e) { }
			const body = document.getElementById('notify-rows-body');
			body.innerHTML = '';
			(n.rows || []).forEach(r => addRowPreview(r));
		}, 120);
	}));

	container.querySelectorAll('.delete-notif-btn').forEach(b => b.addEventListener('click', (e) => {
		const id = b.dataset.id;
		state.notifications = (state.notifications || []).filter(x => x.id !== id);
		try { saveState(); } catch (e) { console.warn('saveState failed after deleting notification', e); }
		renderNotifications();
	}));
}

function addRowPreview(r) {
	const body = document.getElementById('notify-rows-body');
	if (!body) return;

	const tr = document.createElement('tr');
	tr.innerHTML = `<td class="px-2 py-1 text-right">${escapeHtml(r.code || '')}</td><td class="px-2 py-1">${escapeHtml(r.name || '')}</td><td class="px-2 py-1 text-center">${formatCurrency(r.price || 0)}</td><td class="px-2 py-1 text-center">${r.discount || 0}%</td><td class="px-2 py-1 text-center">${formatCurrency(r.priceAfter || 0)}</td><td></td>`;
	body.appendChild(tr);
}

// تصدير الدوال إلى window object
window.addBatchPromoRow = addBatchPromoRow;
window.saveBatchPromotions = saveBatchPromotions;
window.openNotifyModal = openNotifyModal;
window.closeNotifyModal = closeNotifyModal;
window.sendNotification = sendNotification;
window.renderNotifications = renderNotifications;
window.addRowPreview = addRowPreview;
