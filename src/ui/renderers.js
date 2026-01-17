// Dashboard and Sales Rendering Functions
function renderDashboard() {
const selectedRepName=(document.getElementById('dashboard-rep-filter') || {}).value || '';
console.debug('renderDashboard called with state.sales length:', (state.sales || []).length, 'activePeriod:', state.activePeriod);
const getActivePeriodSalesLocal=()=> {
const activePeriod=state.activePeriod || '';
if (!activePeriod) return state.sales || [];
return (state.sales || []).filter(sale=> {
try {
const saleDate=sale.date ? new Date(sale.date) : null;
if (!saleDate || isNaN(saleDate.getTime())) return false;
const saleYearMonth=`${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
return saleYearMonth===activePeriod;
} catch (_) {
return false;
}
});
};
const currentMonthSales=getActivePeriodSalesLocal();
let filteredMonthSales=currentMonthSales;
let currentTarget=Number(state.settings?.salesTarget || 0);
const targetTitleEl=document.getElementById('target-title');
if (selectedRepName) {
filteredMonthSales=currentMonthSales.filter(s=> s.repName===selectedRepName);
const targetRep=findRep(selectedRepName);
currentTarget=targetRep ? (targetRep.target || 0) : 0;
if (targetTitleEl) targetTitleEl.innerHTML=`الهدف الشهري لـ <span class="text-blue-600">${selectedRepName}</span>`;
} else {
if (!currentTarget || currentTarget <=0) {
const reps = Array.isArray(state.reps) ? state.reps : [];
currentTarget=reps.reduce((sum, rep)=> sum + (rep.target || 0), 0) || 0;
}
if (targetTitleEl) targetTitleEl.textContent=`الهدف الشهري (الإجمالي):`;
}
const totalSales=filteredMonthSales.reduce((sum, s)=> sum + (s.total || 0), 0);
const totalCollected=filteredMonthSales.reduce((sum, s)=> {
const paid=s.paidAmount ?? ((s.firstPayment || 0) + (s.secondPayment || 0));
return sum + (Number(paid) || 0);
}, 0);
const totalDue=totalSales - totalCollected;
console.debug('Dashboard calculated:', {totalSales, totalCollected, totalDue, filteredMonthSalesLength: filteredMonthSales.length, selectedRepName});
if (document.getElementById('total-sales')) document.getElementById('total-sales').textContent=formatCurrency(totalSales);
if (document.getElementById('total-collected')) document.getElementById('total-collected').textContent=formatCurrency(totalCollected);
if (document.getElementById('total-due')) document.getElementById('total-due').textContent=formatCurrency(totalDue);
if (document.getElementById('sales-count')) document.getElementById('sales-count').textContent=filteredMonthSales.length;
const progress=currentTarget > 0 ? Math.min((totalSales / currentTarget) * 100, 100) : 0;
if (document.getElementById('target-amount-display')) document.getElementById('target-amount-display').textContent=formatCurrency(currentTarget);
const progressBar=document.getElementById('target-progress-bar'); if (progressBar) progressBar.style.width=`${progress}%`;
if (document.getElementById('target-progress-text')) document.getElementById('target-progress-text').textContent=`${Math.round(progress)}%`;
const recentSalesList=document.getElementById('recent-sales-list'); if (recentSalesList) recentSalesList.innerHTML='';
let recentSales=[...currentMonthSales].reverse();
if (selectedRepName) { recentSales=recentSales.filter(s=> s.repName===selectedRepName); }
recentSales=recentSales.slice(0, 5);
if (!recentSalesList) return;
if (recentSales.length===0) { recentSalesList.innerHTML='<p class="text-gray-500 text-center">لا توجد عمليات بيع بعد.</p>'; return; }
recentSales.forEach(sale=> { const customer=findCustomer(sale.customerId); 
const isReturn=sale.total < 0;
const totalAmountClass=isReturn ? 'text-red-700' : 'text-green-700';
const el=document.createElement('div'); el.className='bg-gray-50 p-3 rounded-lg flex justify-between items-center'; 
el.innerHTML=`<div><p class="font-bold">${customer && customer.name ? customer.name : (sale.customerName || 'غير معروف')}</p><p class="text-sm text-gray-500"><bdo dir="rtl">${formatArabicDateTime(sale.date)}</bdo></p><p class="text-xs text-blue-600 pt-1">${sale.repName || ''}</p></div><div class="text-left space-y-1"><p class="font-bold ${totalAmountClass}">${formatCurrency(sale.total)}</p>${getStatusBadge(sale.status)}</div>`; recentSalesList.appendChild(el); }); updateIcons();
}

function getActivePeriodSales() {
const activePeriod=state.activePeriod || '';
if (!activePeriod) return state.sales || [];
return (state.sales || []).filter(sale=> {
try {
const saleDate=sale.date ? new Date(sale.date) : null;
if (!saleDate || isNaN(saleDate.getTime())) return false;
const saleYearMonth=`${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
return saleYearMonth===activePeriod;
} catch (_) {
return false;
}
});
}

function getSalesDataForLast7Days() { 
const activePeriod=state.activePeriod || '';
if (!activePeriod) return { labels: [], data: [] };
const [year, month]=activePeriod.split('-').map(Number);
const daysInMonth=new Date(year, month, 0).getDate();
const dataMap=new Map();
const labels=[];
for (let day=1; day <=daysInMonth; day++) {
const dateString=`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
labels.push(String(day));
dataMap.set(dateString, 0);
}
const monthSales=getActivePeriodSales();
monthSales.forEach(sale=> {
try {
const sd=sale.date ? new Date(sale.date) : null;
if (!sd || isNaN(sd.getTime())) return;
const saleDateString=sd.toISOString().split('T')[0];
if (dataMap.has(saleDateString)) {
dataMap.set(saleDateString, dataMap.get(saleDateString) + (Number(sale.total) || 0));
}
} catch (_) { }
});
return { labels, data: Array.from(dataMap.values()) }; 
}

function getTopRepsData(count=5) { 
const monthSales=getActivePeriodSales();
const repSalesMap=new Map(); 
monthSales.forEach(sale=> { 
const repName=sale.repName || 'غير محدد'; 
repSalesMap.set(repName, (repSalesMap.get(repName) || 0) + sale.total); 
}); 
const sortedReps=Array.from(repSalesMap.entries()).sort((a, b)=> b[1] - a[1]).slice(0, count); 
return { labels: sortedReps.map(r=> r[0]), data: sortedReps.map(r=> r[1]) }; 
}

function getTopProductsData(count=5) {
const productQtyMap=new Map();
const monthSales=getActivePeriodSales();
monthSales.forEach(sale=> {
try {
const items=Array.isArray(sale.items) ? sale.items : [];
items.forEach(item=> {
try {
const qty=Number(item && item.quantity ? item.quantity : 0) || 0;
const product=findProduct(item && item.productId);
const productName=product && product.name ? product.name : (item && item.name ? item.name : 'منتج محذوف');
productQtyMap.set(productName, (productQtyMap.get(productName) || 0) + qty);
} catch (_) { }
});
} catch (_) { }
});
const sortedProducts=Array.from(productQtyMap.entries()).sort((a, b)=> b[1] - a[1]).slice(0, count);
return { labels: sortedProducts.map(p=> p[0]), data: sortedProducts.map(p=> p[1]) };
}

function getTopCustomersData(count=5) { 
const monthSales=getActivePeriodSales();
const customerSalesMap=new Map(); 
monthSales.forEach(sale=> { 
const customer=findCustomer(sale.customerId); 
const customerName=customer ? customer.name : 'عميل محذوف'; 
customerSalesMap.set(customerName, (customerSalesMap.get(customerName) || 0) + sale.total); 
}); 
const sortedCustomers=Array.from(customerSalesMap.entries()).sort((a, b)=> b[1] - a[1]).slice(0, count); 
return { labels: sortedCustomers.map(c=> c[0]), data: sortedCustomers.map(c=> c[1]) }; 
}

function createOrUpdateChart(chartInstance, canvasId, type, data, options) { 
if (chartInstance) { chartInstance.data.labels=data.labels; chartInstance.data.datasets[0].data=data.data; chartInstance.update(); return chartInstance; }
const ctx=document.getElementById(canvasId)?.getContext('2d'); 
if (!ctx) return null; 
return new Chart(ctx, { type: type, data: { labels: data.labels, datasets: [{ label: options.label || 'القيمة', data: data.data, backgroundColor: options.backgroundColor || 'rgba(59, 130, 246, 0.5)', borderColor: options.borderColor || 'rgba(59, 130, 246, 1)', borderWidth: options.borderWidth || 1, tension: 0.3, ...options.datasetOverrides }] }, options: { responsive: true, maintainAspectRatio: false, rtl: true, plugins: { legend: { labels: { font: { family: 'Cairo' } } } }, scales: { x: { reverse: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.xTitle, text: options.xTitle, font: { family: 'Cairo' } } }, y: { beginAtZero: true, ticks: { font: { family: 'Cairo' } }, title: { display: !!options.yTitle, text: options.yTitle, font: { family: 'Cairo' } } } }, ...options.overrides } }); 
}

function renderAllSales(textFilter='', dateFilter='', taxStatusFilter='all', reviewFilterArg=null) {
if (!window.allSales) window.allSales=[];
if (!window.sales) window.sales=[];
if (!window.state) window.state={};
if (!Array.isArray(state.sales)) state.sales=[];
const salesList=document.getElementById('sales-list'); 
if (!salesList) { return; }
salesList.innerHTML='';
try {
console.debug('renderAllSales called', { textFilter, dateFilter, taxStatusFilter, stateSalesLength: Array.isArray(state.sales) ? state.sales.length : state.sales });
} catch (e) { }
if (!Array.isArray(state.sales)) state.sales=[];
textFilter=(textFilter || '').toString().trim();
dateFilter=(dateFilter || '').toString().trim();
let filteredSales=[...state.sales];
let role=typeof getUserRole==='function' ? getUserRole() : 'rep';
let currentEmail=(window.auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email.toLowerCase() : null;
if (role==='rep' && currentEmail) {
const currentRep=(state.reps||[]).find(r=> (r.email||'').toLowerCase()===currentEmail);
const repName=currentRep?.name;
filteredSales=filteredSales.filter(sale=> {
const matchByEmail=(sale.repEmail||'').toLowerCase()===currentEmail;
const matchByName=repName && sale.repName===repName;
return matchByEmail || matchByName;
});
}
const reviewStatusFilter=reviewFilterArg || (document.getElementById('review-status-filter')?.value || 'all');
const activePeriod=(state && state.activePeriod) ? String(state.activePeriod) : '';
if (activePeriod) {
filteredSales=filteredSales.filter(sale=> {
try { return new Date(sale.date).toISOString().slice(0,7)===activePeriod; } catch(e){ return false; }
});
try { document.getElementById('daily-total-container').classList.add('hidden'); } catch(e){}
} else if (dateFilter) {
const dailyFilteredSales=filteredSales.filter(sale=> new Date(sale.date).toLocaleDateString('en-CA')===dateFilter);
const dailyTotal=dailyFilteredSales.reduce((sum, s)=> sum + s.total, 0);
try {
document.getElementById('daily-total-amount').textContent=formatCurrency(dailyTotal);
document.getElementById('daily-total-container').classList.remove('hidden');
} catch(e){}
filteredSales=dailyFilteredSales;
} else {
try { document.getElementById('daily-total-container').classList.add('hidden'); } catch(e){}
}
if (activePeriod && filteredSales.length===0) {
console.warn('Monthly filter returned no sales; showing all sales until data loads');
filteredSales=[...state.sales];
}
if (filteredSales.length===0) {
try {
const cached=JSON.parse(localStorage.getItem('cache_sales')||'[]');
if (Array.isArray(cached) && cached.length) filteredSales=cached;
} catch(_){}
}
if (textFilter) { 
const lowerCaseFilter=textFilter.toLowerCase(); 
filteredSales=filteredSales.filter(sale=> { 
const customer=findCustomer(sale.customerId); 
const customerNameMatch=customer && customer.name.toLowerCase().includes(lowerCaseFilter); 
const invoiceNumberMatch=sale.invoiceNumber.toString().includes(lowerCaseFilter); 
const totalMatch=sale.total.toString().includes(lowerCaseFilter) || formatCurrency(sale.total).includes(lowerCaseFilter); 
return customerNameMatch || invoiceNumberMatch || totalMatch; 
}); 
}
if (reviewStatusFilter==='pending') {
filteredSales=filteredSales.filter(s=> String(s.reviewStatus||'').toLowerCase()==='pending');
} else if (reviewStatusFilter==='reviewed') {
filteredSales=filteredSales.filter(s=> String(s.reviewStatus||'').toLowerCase()==='reviewed');
}
if (taxStatusFilter==='filed') {
filteredSales=filteredSales.filter(sale=> {
const customer=findCustomer(sale.customerId);
if (!customer || !customer.requiresTaxFiling) return false;
return sale.taxFilingStatus && sale.taxFilingStatus.trim().toLowerCase()==='تم';
});
} else if (taxStatusFilter==='not-filed') {
filteredSales=filteredSales.filter(sale=> {
const customer=findCustomer(sale.customerId);
if (!customer || !customer.requiresTaxFiling) return false;
return !sale.taxFilingStatus || sale.taxFilingStatus.trim().toLowerCase() !=='تم';
});
}
const filteredTotal=filteredSales.reduce((sum, s)=> sum + s.total, 0);
const filteredTotalAmountEl=document.getElementById('filtered-total-amount');
if (filteredTotalAmountEl) {
filteredTotalAmountEl.textContent=formatCurrency(filteredTotal);
}
const filteredCountEl=document.getElementById('filtered-total-count');
if (filteredCountEl) {
filteredCountEl.textContent=String(filteredSales.length);
}
try {
filteredSales.sort((a,b)=>{
const ta=new Date(a.date||0).getTime();
const tb=new Date(b.date||0).getTime();
if (ta !== tb) return tb - ta; // تنازلي: الأحدث أولاً
// إذا كان التاريخ نفسه، رتب حسب وقت الإنشاء تنازلياً
const ca=new Date(a.createdAt||0).getTime();
const cb=new Date(b.createdAt||0).getTime();
return cb - ca; // الأحدث إنشاءاً أولاً
});
} catch(_){ }
if (filteredSales.length===0) { 
const cached=JSON.parse(localStorage.getItem('cache_sales')||'[]');
if (Array.isArray(cached) && cached.length > 0) {
console.warn('⚠️ renderAllSales: No filtered results; loading from localStorage cache');
filteredSales=cached;
} else {
salesList.innerHTML='<p class="text-gray-500 text-center mt-8">لا توجد فواتير تطابق بحثك.</p>'; 
return; 
}
}
const reviewState=loadReviewState();
filteredSales.forEach((sale, index)=> { 
const customer=findCustomer(sale.customerId); 
const isReturn=sale.total < 0;
const badgeText=isReturn ? 'مرتجع' : 'فاتورة';
const badgeColor=isReturn ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';
const saleBgColor=isReturn ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200';
const totalAmountClass=(String(sale.reviewStatus||'').toLowerCase()==='pending') ? 'text-red-700' : (isReturn ? 'text-red-700' : 'text-blue-700');
const itemsList=(Array.isArray(sale.items) ? sale.items : []).map((item, itemIndex)=> { 
const product=findProduct(item.productId); 
const itemName=product ? product.name : 'منتج محذوف'; 
const itemDiscountFactor=(1 - (item.discountPercent || 0) / 100);
const itemBase=(item.quantity || 0) * (item.price || 0) * itemDiscountFactor;
const productVatRate=(product && product.vat_rate) ? Number(product.vat_rate) / 100 : 0;
const itemTax=round2(itemBase * productVatRate);
const itemTotal=round2(itemBase + itemTax);
const itemCode=product ? product.id : 'N/A'; 
const itemTotalColorClass=isReturn ? 'text-red-700' : 'text-pink-700';
try {
const prodForCheck=findProduct(item.productId) || {};
let expectedP=(prodForCheck.price !=null) ? Number(prodForCheck.price) : 0;
try { const cust=findCustomer(sale.customerId); if (cust && cust.priceListId) { const pl=findPriceList(cust.priceListId); if (pl && pl.productPrices && pl.productPrices[item.productId] !==undefined) expectedP=Number(pl.productPrices[item.productId]); } } catch(_){ }
try { const promo=getActivePromotionPrice(item.productId, sale.customerId); if (promo !==null && promo !==undefined) expectedP=Number(promo); } catch(_){ }
const priceDiff=Math.abs((Number(item.price) || 0) - (Number(expectedP) || 0));
const showAdjusted=(item && item.adjusted===true) || (String(sale.reviewReason||'').toLowerCase()==='adjusted');
const priceCellClass=showAdjusted ? 'text-red-600 font-bold' : '';
return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${itemName}</td><td class="text-center px-3 py-2 sale-item-code-cell">${itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${item.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${item.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell ${priceCellClass}">${formatCurrency(item.price)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(itemTotal)}</td></tr>`; 
} catch(e) {
return `<tr class="text-xs border-b border-gray-100 last:border-b-0"><td class="text-right px-3 py-2 font-semibold sale-item-name-cell">${itemName}</td><td class="text-center px-3 py-2 sale-item-code-cell">${itemCode}</td><td class="text-center px-3 py-2 sale-item-qty-cell font-bold ${item.quantity < 0 ? 'text-red-600' : 'text-gray-800'}">${item.quantity}</td><td class="text-center px-3 py-2 sale-item-price-cell">${formatCurrency(item.price)}</td><td class="text-center px-3 py-2 font-bold sale-item-total-cell ${itemTotalColorClass}">${formatCurrency(itemTotal)}</td></tr>`; 
}
}).join(''); 
const customerRequiresFiling=customer?.requiresTaxFiling; 
const customerTaxNumber=customer ? (customer.taxNumber || 'لا يوجد') : 'لا يوجد';
const taxNumberHtml=`<div class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-center w-full">\r\n <p class="text-xs text-gray-700 font-semibold">الرقم الضريبي:</p>\r\n <p class="text-sm font-bold text-gray-900">${customerTaxNumber}</p>\r\n <a href="https://invoicing.eta.gov.eg/" target="_blank" class="text-xs text-blue-600 hover:underline">المنظومة الإلكترونية</a>\r\n\r\n </div>`;
const el=document.createElement('div'); 
el.className=`${saleBgColor} p-4 rounded-xl border shadow-md mb-6 transition duration-300 hover:shadow-lg`; 
el.innerHTML=`<div class="grid grid-cols-1 md:grid-cols-4 gap-4">\r\n <div class="col-span-3">\r\n <p class="font-bold text-lg text-gray-800">\r\n ${customer ? customer.name : 'عميل محذوف'} \r\n <span class="text-xs font-semibold px-2 py-1 rounded-full ${badgeColor} mr-2">${badgeText}</span>\r\n ${sale.isAdminEntry ? `<span class="text-xs font-semibold px-2 py-1 rounded-full bg-purple-600 text-white mr-2" title="تم التسجيل بمعرفة: ${sale.recordedByName || 'إدارة'}"><i data-lucide="shield-check" class="w-3 h-3 inline ml-1"></i> إدارة</span>` : ''}\r\n ${customerRequiresFiling ? `<i data-lucide="file-text" class="w-4 h-4 inline text-orange-500 mr-2" title="يتطلب رفع ضريبي"></i>` : ''}\r\n </p>\r\n <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
<span><i data-lucide="calendar" class="w-3 h-3 inline ml-1"></i> فاتورة بتاريخ: <span dir="ltr" style="unicode-bidi: bidi-override; display: inline;">${formatArabicDate(sale.date)}</span></span>
<span class="invoice-review-span" data-id="${sale.id}" title="اضغط للتلوين">
<i data-lucide="hash" class="w-3 h-3 inline ml-1"></i> رقم الفاتورة: 
<span class="invoice-cell text-red-600 font-bold ${reviewState[sale.id] || ''}">
${sale.invoiceNumber || 'N/A'}
</span>
</span>
</div>\r\n </div>\r\n <div class="col-span-1 border-r pr-4 flex flex-col justify-start items-center text-center pt-2">\r\n <h4 class="text-sm font-semibold text-gray-600 mb-1">الإجمالي النهائي</h4>\r\n <p class="font-bold text-2xl ${totalAmountClass}">${formatCurrency(sale.total)}</p>\r\n </div>\r\n </div>`; 
salesList.appendChild(el); 
}); 
updateIcons();
}

function renderCustomers(filter='') {
const customersList=document.getElementById('customers-list');
customersList.innerHTML='';
const role=(typeof getUserRole==='function') ? getUserRole() : 'user';
const currentUser=AuthSystem.getCurrentUser();
const filteredCustomers=(state.customers||[]).filter(c=> {
if (!c || !c.name) return false;
if (!c.name.toLowerCase().includes(filter.toLowerCase())) return false;
if (role==='admin') return true;
if (role==='rep' && currentUser) {
const assigned=c.assignedRepId || '';
return !assigned || assigned===currentUser.id;
}
return true; 
});
if (filteredCustomers.length===0) {
customersList.innerHTML='<p class="text-gray-500 text-center mt-8">لا يوجد عملاء. اضغط على زر "إضافة عميل" للبدء.</p>';
return;
}
filteredCustomers.forEach(customer=> {
const el=document.createElement('div');
el.className='bg-white p-4 rounded-lg border shadow-sm';
const address=customer.address || '';
const isLink=address.startsWith('http');
const priceList=findPriceList(customer.priceListId);
const repName=customer.repName || 'غير محدد';
const taxRequired=customer.requiresTaxFiling;
const cid=customer.id || customer._id || '';
const assignedRepId=customer.assignedRepId || '';
const isMine=assignedRepId && currentUser && currentUser.id===assignedRepId;
const assignedBadge=assignedRepId
? (isMine ? '<span class="text-xs font-semibold bg-green-100 text-green-700 rounded-full px-2 py-0.5">مخصص لك</span>' : '<span class="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">مخصص</span>')
: '<span class="text-xs bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">غير مُعيّن</span>';
const manageAllowed=(typeof canManageCustomer==='function') ? canManageCustomer(customer) : true;
let priceListInfoHTML=`<div class="mt-2"><span class="text-sm text-gray-800 bg-gray-100 rounded-full px-2 py-0.5">بدون قائمة أسعار</span></div>`;
if (priceList) {
const discountMatch=priceList.name.match(/\(خصم (.*?)%\)/);
const baseName=discountMatch ? priceList.name.replace(discountMatch[0], '').trim() : priceList.name;
let baseTag=`<span class="text-sm text-blue-800 bg-blue-100 rounded-full px-2 py-0.5">${baseName}</span>`;
let discountTag=discountMatch ? ` <span class="text-sm text-red-800 bg-red-100 rounded-full px-2 py-0.5">خصم ${discountMatch[1]}%</span>` : '';
priceListInfoHTML=`<div class="mt-2 flex flex-wrap gap-1 items-center">${baseTag}${discountTag}</div>`;
}
const taxTag=taxRequired ? `<span class="text-xs font-semibold bg-orange-100 text-orange-800 rounded-full px-2 py-0.5 flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i> يتطلب رفع ضريبي</span>` : '';
const claimBtnHtml=(role==='rep') ? '' : (!assignedRepId ? `<button data-id="${cid}" class="claim-customer-btn text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">تعيين لي</button>` : '');
const actionsHtml=(role !=='rep' && manageAllowed)
? `<div class="flex"><button data-id="${cid}" class="edit-customer-btn p-2 text-gray-500 hover:text-blue-600" title="تعديل"><i data-lucide="edit" class="w-5 h-5"></i></button><button data-id="${cid}" class="delete-customer-btn p-2 text-gray-500 hover:text-red-600" title="حذف"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`
: `<div class="flex opacity-50 cursor-not-allowed" title="لا تملك صلاحية تعديل هذا العميل"><button data-id="${cid}" class="p-2 text-gray-400" disabled><i data-lucide="edit" class="w-5 h-5"></i></button><button data-id="${cid}" class="p-2 text-gray-400" disabled><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`;
el.innerHTML=`<div class="flex justify-between items-start"><div><p class="font-bold text-lg">${customer.name} ${taxRequired ? `<i data-lucide="file-text" class="w-4 h-4 inline text-orange-500 mr-2" title="يتطلب رفع ضريبي"></i>` : ''}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="landmark" class="w-3 h-3"></i> الرقم الضريبي: ${customer.taxNumber || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="phone" class="w-3 h-3"></i> ${customer.phone || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${isLink ? `<a href="${address}" target="_blank" class="text-blue-600 hover:underline">عرض على الخريطة</a>` : address || 'لا يوجد'}</p><p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="user" class="w-3 h-3"></i> المندوب: <span class="font-semibold text-gray-700">${repName}</span> ${assignedBadge}</p>${priceListInfoHTML}</div><div class="flex flex-col items-end gap-2">${taxTag}${claimBtnHtml}${actionsHtml}</div></div>`;
customersList.appendChild(el);
});
updateIcons();
}

function renderUsersTable(){
const tbody=document.getElementById('users-table-body');
const warn=document.getElementById('user-role-warning');
if (!tbody) return;
if (!canManageUsers()) { if (warn){ warn.textContent='هذه الميزة مخصصة للمشرفين فقط.'; warn.classList.remove('hidden'); } return; }
if (warn) warn.classList.add('hidden');
const list=Array.isArray(window.state && state.users) ? state.users : [];
if (list.length===0) { tbody.innerHTML='<tr><td colspan="4" class="px-2 py-3 text-center text-gray-500">لا يوجد مستخدمون بعد.</td></tr>'; return; }
const current=AuthSystem.getCurrentUser();
tbody.innerHTML=list.map(u=> {
const role=(u.role || 'user');
const disabled=(current && current.id===u._id) ? 'data-self="1"' : '';
const pres=(window.state && Array.isArray(state.presence)) ? state.presence.find(p=> (p._id===u._id) || (p.uid===u._id) || ((p.email||'').toLowerCase()===(u.email||'').toLowerCase())) : null;
const online=(typeof u.online !=='undefined') ? !!u.online : !!(pres && pres.online===true); 
const emailStr=((u.email||'').toLowerCase()) || ((pres && pres.email) ? (pres.email||'').toLowerCase() : '');
return `<tr>
<td class="px-2 py-2">${u.name || '-'}</td>
<td class="px-2 py-2 flex items-center gap-2">
<span class="inline-block w-2.5 h-2.5 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'}" title="${online ? 'متصل الآن' : 'غير متصل'}"></span>
<span>${emailStr}</span>
</td>
<td class="px-2 py-2 text-center">
<select class="user-role-select p-1 border rounded" data-uid="${u._id}" ${disabled}>
<option value="admin" ${role==='admin'?'selected':''}>admin</option>
<option value="rep" ${role==='rep'?'selected':''}>rep</option>
<option value="viewer" ${role==='viewer'?'selected':''}>viewer</option>
<option value="user" ${role==='user'?'selected':''}>user</option>
</select>
</td>
<td class="px-2 py-2 text-center">
<div class="flex items-center justify-center gap-2">
<button class="apply-role-btn bg-blue-600 text-white px-3 py-1 rounded text-xs" data-uid="${u._id}">تطبيق</button>
${emailStr ? '' : `<button class="set-user-email-btn bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs" title="إضافة بريد" data-uid="${u._id}">إضافة بريد</button>`}
</div>
</td>
</tr>`;
}).join('');
}

window.renderDashboard = renderDashboard;
window.renderAllSales = renderAllSales;
window.renderCustomers = renderCustomers;
window.renderUsersTable = renderUsersTable;
window.getActivePeriodSales = getActivePeriodSales;
window.getSalesDataForLast7Days = getSalesDataForLast7Days;
window.getTopRepsData = getTopRepsData;
window.getTopProductsData = getTopProductsData;
window.getTopCustomersData = getTopCustomersData;
window.createOrUpdateChart = createOrUpdateChart;
