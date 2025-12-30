// Additional Render and UI Helper Functions
// This file contains renderPriceListsPage, renderSelectedPriceList, renderReps,
// renderSettings, renderPromotions, and supporting functions

function normalizeSpaces(s){ return (s||'').toString().replace(/\s+/g,' ').trim(); }

function renderPriceListsPage() {
const container=document.getElementById('all-price-lists-container');
if (!container) return;
try {
const page=document.getElementById('page-price-lists');
const hiddenByDisplay=page && (page.style.display==='none' || !page.classList.contains('active'));
if (!page || hiddenByDisplay) { return; }
} catch(_){}
try { container.style.display=''; } catch(e) {}
container.innerHTML='';
const customersWithoutPriceList=state.customers.filter(c=> !c.priceListId);
if (customersWithoutPriceList.length > 0) {
const noListEl=document.createElement('div');
noListEl.className='bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm mb-6';
const customerNames=customersWithoutPriceList.map(c=> `<span class="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">${c.name}</span>`).join('');
noListEl.innerHTML=`
<h3 class="font-bold text-lg text-yellow-800 mb-3">عملاء بدون قائمة أسعار محددة</h3>
<p class="text-sm text-gray-600 mb-3">هؤلاء العملاء يستخدمون الأسعار الافتراضية للمنتجات. يمكنك تعيين قائمة أسعار لهم من صفحة "العملاء".</p>
<div class="flex flex-wrap gap-2">
${customerNames}
</div>
`;
container.appendChild(noListEl);
}
if (!state.priceLists || state.priceLists.length===0) {
container.innerHTML +='<p class="text-center text-gray-500 p-4 bg-gray-100 rounded-lg">لا توجد قوائم أسعار معرفة.</p>';
return;
}
const customersByPriceList={};
state.customers.forEach(customer=> {
if (customer.priceListId) {
if (!customersByPriceList[customer.priceListId]) {
customersByPriceList[customer.priceListId]=[];
}
customersByPriceList[customer.priceListId].push(customer.name);
}
});
state.priceLists.sort((a, b)=> a.name.localeCompare(b.name)).forEach(priceList=> {
const productPrices=priceList.productPrices || {};
const productItems=Object.keys(productPrices).map(productId=> {
const product=findProduct(productId);
const price=productPrices[productId];
if (!product) return ''; 
return `
<li class="flex justify-between items-center py-2 px-3 hover:bg-gray-50 text-sm">
<span>${product.name} <span class="text-xs text-gray-400">(${product.id})</span></span>
<span class="font-bold text-blue-600">${formatCurrency(price)}</span>
</li>
`;
}).join('');
const associatedCustomers=customersByPriceList[priceList.id] || [];
const customersHtml=associatedCustomers.length > 0
? `<div class="mt-4 pt-3 border-t border-gray-100">
<h4 class="font-semibold text-sm text-gray-700 mb-2">العملاء المطبق عليهم هذه القائمة:</h4>
<div class="flex flex-wrap gap-2">
${associatedCustomers.map(name=> `<span class="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">${name}</span>`).join('')}
</div>
</div>`
: '<p class="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">هذه القائمة غير مطبقة على أي عميل حالياً.</p>';
const el=document.createElement('div');
el.className='bg-white p-4 rounded-lg border shadow-sm mb-4';
el.innerHTML=`
<h3 class="font-bold text-lg text-gray-800">${priceList.name}</h3>
<div class="max-h-60 overflow-y-auto mt-3 pr-2">
${productItems.length > 0 ? `<ul class="divide-y divide-gray-200">${productItems}</ul>` : '<p class="text-sm text-gray-500">لا توجد أسعار خاصة في هذه القائمة.</p>'}
</div>
${customersHtml}
`;
container.appendChild(el);
});
updateIcons();
}

function initPriceListsPage(){
try {
const modeSel=document.getElementById('pl-filter-mode');
const sel=document.getElementById('pl-selector');
const printBtn=document.getElementById('pl-print');
const imageBtn=document.getElementById('pl-image');
const discountInput=document.getElementById('pl-global-discount');
if (!modeSel || !sel) return;
populatePlSelector();
modeSel.onchange=()=> populatePlSelector();
sel.onchange=()=> renderSelectedPriceList();
if (printBtn) printBtn.onclick=()=> printSection('pl-sheet-container');
if (imageBtn) imageBtn.onclick=()=> generateReportImage('pl-sheet-container');
if (discountInput){
discountInput.addEventListener('input', ()=> renderSelectedPriceList());
}
renderSelectedPriceList();
} catch(e){ console.warn('initPriceListsPage error', e); }
}

function populatePlSelector(){
const modeSel=document.getElementById('pl-filter-mode');
const sel=document.getElementById('pl-selector');
if (!modeSel || !sel) return;
const mode=modeSel.value || 'customer';
if (mode==='customer'){
const excluded=new Set(['عميل جمله واحد','عميل قطاعي اثنين','عميل قطاعي اثنين'].map(normalizeSpaces));
const options=[];
const list=(state.customers||[])
.filter(c=> !excluded.has(normalizeSpaces(c.name)))
.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
options.push(...list.map(c=> `<option value="cust:${c.id}">${escapeHtml(c.name||'')}</option>`));
const chains=loadChains();
if (chains.length > 0) {
options.push('<optgroup label="السلاسل">');
chains.forEach(chain=> {
options.push(`<option value="chain:${chain.id}">[سلسلة] ${escapeHtml(chain.name||'')}</option>`);
});
options.push('</optgroup>');
}
sel.innerHTML=options.join('');
} else {
const list=(state.priceLists||[]).slice().sort((a,b)=> (a.name||'').localeCompare(b.name||''));
sel.innerHTML=list.map(pl=> `<option value="pl:${pl.id}">${escapeHtml(pl.name||pl.id)}</option>`).join('');
}
}

function renderSelectedPriceList(){
const modeSel=document.getElementById('pl-filter-mode');
const sel=document.getElementById('pl-selector');
const container=document.getElementById('pl-sheet-container');
if (!modeSel || !sel || !container) return;
const selectedValue=sel.value || '';
const mode=modeSel.value || 'customer';
container.innerHTML='<p class="text-gray-500">جاري تحميل...</p>';
try {
let priceListId=null;
let customerName=null;
let selectedChain=null;
if (selectedValue.startsWith('pl:')) {
priceListId=selectedValue.substring(3);
} else if (selectedValue.startsWith('chain:')) {
const chainId=selectedValue.substring(6);
selectedChain=loadChains().find(c=> c.id===chainId);
if (selectedChain) {
customerName=`سلسلة: ${selectedChain.name}`;
}
} else if (selectedValue.startsWith('cust:')) {
const customerId=selectedValue.substring(5);
const customer=findCustomer(customerId);
if (customer) {
customerName=customer.name;
priceListId=customer.priceListId;
}
}
renderPriceListSheet(priceListId, customerName, selectedChain);
} catch(e) {
console.warn('renderSelectedPriceList error', e);
container.innerHTML='<p class="text-red-500">حدث خطأ في التحميل</p>';
}
}

function renderPriceListSheet(priceListId, customerName, chainData){
const container=document.getElementById('pl-sheet-container');
if (!container) return;
const globalDiscount=Number(document.getElementById('pl-global-discount')?.value || 0);
let priceList=null;
if (priceListId) {
priceList=(state.priceLists||[]).find(pl=> pl.id===priceListId);
}
if (!priceList && !chainData) {
container.innerHTML='<p class="text-gray-500">لم يتم تحديد قائمة أسعار.</p>';
return;
}
const products=(state.products||[]).slice().sort((a, b)=> (a.name||'').localeCompare(b.name||''));
const rows=products.map(product=> {
let price=product.price || 0;
if (priceList && priceList.productPrices && priceList.productPrices[product.id]) {
price=priceList.productPrices[product.id];
}
const discountedPrice=price * (1 - globalDiscount / 100);
return `
<tr class="text-sm hover:bg-gray-50">
<td class="border-b px-3 py-2 font-semibold">${product.name || ''}</td>
<td class="border-b px-3 py-2 text-center">${product.id || ''}</td>
<td class="border-b px-3 py-2 text-right">${formatCurrency(price)}</td>
${globalDiscount > 0 ? `<td class="border-b px-3 py-2 text-right font-bold text-blue-600">${formatCurrency(discountedPrice)}</td>` : ''}
</tr>
`;
}).join('');
const headerTitle=customerName || (priceList ? priceList.name : 'قائمة الأسعار');
const html=`
<div class="bg-white p-6 rounded-lg border shadow-sm">
<div class="text-center mb-6">
<h2 class="text-2xl font-bold text-gray-800">${escapeHtml(headerTitle)}</h2>
${globalDiscount > 0 ? `<p class="text-sm text-gray-600 mt-2">مع خصم إضافي: ${globalDiscount}%</p>` : ''}
<p class="text-xs text-gray-500 mt-1">${new Date().toLocaleDateString('ar-EG')}</p>
</div>
<div class="overflow-x-auto">
<table class="w-full" dir="rtl">
<thead class="bg-gray-100 border-b">
<tr>
<th class="px-3 py-2 text-right font-semibold">الصنف</th>
<th class="px-3 py-2 text-center font-semibold">الكود</th>
<th class="px-3 py-2 text-right font-semibold">السعر</th>
${globalDiscount > 0 ? `<th class="px-3 py-2 text-right font-semibold">السعر بعد الخصم</th>` : ''}
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</div>
</div>
`;
container.innerHTML=html;
}

function renderReps() {
const container=document.getElementById('reps-list');
if (!container) return;
container.innerHTML='';
const reps=(state.reps||[]).sort((a, b)=> (a.name||'').localeCompare(b.name||''));
if (reps.length===0) {
container.innerHTML='<p class="text-gray-500 text-center mt-8">لا يوجد مندوبون بعد.</p>';
return;
}
reps.forEach(rep=> {
const el=document.createElement('div');
el.className='bg-white p-4 rounded-lg border shadow-sm';
const salesCount=(state.sales||[]).filter(s=> s.repId===rep.id || s.repName===rep.name).length;
const totalSales=(state.sales||[])
.filter(s=> s.repId===rep.id || s.repName===rep.name)
.reduce((sum, s)=> sum + (s.total || 0), 0);
el.innerHTML=`
<div class="flex justify-between items-start">
<div>
<p class="font-bold text-lg">${rep.name || ''}</p>
<p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="mail" class="w-3 h-3"></i> ${rep.email || 'بدون بريد'}</p>
<p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="phone" class="w-3 h-3"></i> ${rep.phone || 'بدون هاتف'}</p>
<p class="text-sm text-gray-500 flex items-center gap-1 mt-1"><i data-lucide="target" class="w-3 h-3"></i> الهدف الشهري: ${formatCurrency(rep.target || 0)}</p>
</div>
<div class="text-left">
<p class="text-sm text-gray-600">عمليات البيع: <span class="font-bold">${salesCount}</span></p>
<p class="text-lg font-bold text-blue-600 mt-2">${formatCurrency(totalSales)}</p>
<button data-id="${rep.id}" class="edit-rep-btn mt-3 text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">تعديل</button>
<button data-id="${rep.id}" class="delete-rep-btn text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-2">حذف</button>
</div>
</div>
`;
container.appendChild(el);
});
updateIcons();
}

function renderSettings(productFilter='') {
const container=document.getElementById('products-list');
if (!container) return;
container.innerHTML='';
try { console.log('renderSettings called, productFilter:', productFilter); } catch(e) {}
const products=(state.products||[])
.filter(p=> !p.name || !productFilter || p.name.toLowerCase().includes(productFilter.toLowerCase()))
.sort((a, b)=> (a.name||'').localeCompare(b.name||''));
if (products.length===0) {
container.innerHTML='<p class="text-gray-500 text-center mt-8">لا يوجد منتجات. اضغط على زر "إضافة منتج" للبدء.</p>';
return;
}
products.forEach(product=> {
const el=document.createElement('div');
el.className='bg-white p-4 rounded-lg border shadow-sm';
const productVat=product.vat_rate || 14;
const el_html=`
<div class="flex justify-between items-start">
<div class="flex-1">
<p class="font-bold text-lg">${product.name || ''}</p>
<p class="text-sm text-gray-600 flex items-center gap-1 mt-1"><i data-lucide="barcode" class="w-3 h-3"></i> الكود: <span class="font-mono">${product.id || 'N/A'}</span></p>
<p class="text-sm text-gray-600 flex items-center gap-1 mt-1"><i data-lucide="tag" class="w-3 h-3"></i> السعر: <span class="font-bold">${formatCurrency(product.price || 0)}</span></p>
<p class="text-sm text-gray-600 flex items-center gap-1 mt-1"><i data-lucide="percent" class="w-3 h-3"></i> ضريبة القيمة المضافة: <span class="font-bold">${productVat}%</span></p>
${product.unit ? `<p class="text-sm text-gray-600 flex items-center gap-1 mt-1"><i data-lucide="box" class="w-3 h-3"></i> الوحدة: ${product.unit}</p>` : ''}
</div>
<div class="flex flex-col gap-2 ml-4">
<button data-id="${product.id}" class="edit-product-btn text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">تعديل</button>
<button data-id="${product.id}" class="delete-product-btn text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">حذف</button>
</div>
</div>
`;
el.innerHTML=el_html;
container.appendChild(el);
});
updateIcons();
try { if (typeof setupGpsSharingControls==='function') setupGpsSharingControls(); } catch(e){}
try { if (typeof renderRepLocations==='function') renderRepLocations(); } catch(e){}
}

function renderPromotions() {
const listEl=document.getElementById('promotions-list');
if (!listEl) return;
listEl.innerHTML='';
const promotions=(state.promotions||[]).sort((a, b)=> new Date(b.startDate||0) - new Date(a.startDate||0));
if (promotions.length===0) {
listEl.innerHTML='<p class="text-gray-500 text-center mt-8">لا توجد عروض ترويجية.</p>';
return;
}
promotions.forEach(promo=> {
const el=document.createElement('div');
el.className='bg-white p-4 rounded-lg border shadow-sm';
const isActive=(new Date() >= new Date(promo.startDate||0)) && (new Date() <= new Date(promo.endDate||0));
const statusClass=isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
const statusText=isActive ? 'نشط' : 'غير نشط';
el.innerHTML=`
<div class="flex justify-between items-start">
<div>
<p class="font-bold text-lg">${promo.productName || ''}</p>
<p class="text-sm text-gray-500 mt-1">من: ${new Date(promo.startDate||'').toLocaleDateString('ar-EG')} إلى: ${new Date(promo.endDate||'').toLocaleDateString('ar-EG')}</p>
<p class="text-sm text-blue-600 font-bold mt-2">السعر المروج: ${formatCurrency(promo.promotionalPrice || 0)}</p>
</div>
<div class="flex flex-col gap-2">
<span class="text-xs font-semibold px-3 py-1 rounded-full ${statusClass}">${statusText}</span>
<button data-id="${promo.id}" class="edit-promo-btn text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">تعديل</button>
<button data-id="${promo.id}" class="delete-promo-btn text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">حذف</button>
</div>
</div>
`;
listEl.appendChild(el);
});
updateIcons();
}

// Export functions
window.renderPriceListsPage = renderPriceListsPage;
window.renderSelectedPriceList = renderSelectedPriceList;
window.renderPriceListSheet = renderPriceListSheet;
window.renderReps = renderReps;
window.renderSettings = renderSettings;
window.renderPromotions = renderPromotions;
window.initPriceListsPage = initPriceListsPage;
window.populatePlSelector = populatePlSelector;
window.normalizeSpaces = normalizeSpaces;
