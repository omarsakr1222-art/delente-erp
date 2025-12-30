// ===== TARGETS & SETTLEMENT REPORTS =====
function generateCustomerTargetsReport(){
const monthVal=document.getElementById('customer-targets-month')?.value || '';
const catVal=document.getElementById('customer-targets-category')?.value || 'both';
const out=document.getElementById('customer-targets-report-output');
if (!out) return;
if (!monthVal){ out.innerHTML='<p class="text-center text-gray-500">اختر شهر.</p>'; return; }
const [yStr, mStr]=monthVal.split('-'); const year=parseInt(yStr,10); const m=parseInt(mStr,10)-1;
const monthStart=new Date(Date.UTC(year,m,1)); const monthEnd=new Date(Date.UTC(year,m+1,1) - 1);
const nameKeys=['اكسبشن','سفير','الضحى'];
const customers=(state.customers||[]).filter(c=> {
const nm=(c.name||'');
const include=nameKeys.some(k=> nm.includes(k));
const isExcluded=/اكسبشن/.test(nm) && /(حلواني|حلوانى)/.test(nm);
return include && !isExcluded;
});
if (customers.length===0){ out.innerHTML='<p class="text-center text-gray-500">لا توجد عملاء مستهدفة.</p>'; return; }
const targetsMonthObj=getCustomerTargetsForMonth(monthVal);
const agg={}; 
(state.sales||[]).forEach(sale=> {
const d=new Date(sale.date);
if (isNaN(d.getTime())) return; 
if (d < monthStart || d > monthEnd) return;
const cid=sale.customerId;
const cust=customers.find(c=> c.id===cid || c._id===cid);
if (!cust) return;
sale.items.forEach(item=> {
const p=findProduct(item.productId); if (!p) return;
const nameLower=(cust.name||'').toLowerCase();
const prodLower=(p.name||'').toLowerCase();
if (nameLower.includes('اكسبشن') && prodLower.includes('شيلي')) return;
const qty=Number(item.quantity||item.qty||0);
const price=Number(p.price||0);
const value=qty * price;
const cat=String(p.category||'').toLowerCase();
const isMulti=cat.includes('مالت') || cat.includes('multi');
const isDairy=cat.includes('بان') || cat.includes('جبن') || cat.includes('cheese') || cat.includes('dairy');
agg[cid]=agg[cid] || { multiAch:0, dairyAch:0 };
if (isMulti) agg[cid].multiAch +=value; else if (isDairy) agg[cid].dairyAch +=value;
});
});
function fmt(v){ return formatCurrency(v||0); }
const rows=customers.map(c=> {
const cid=c.id || c._id; const a=agg[cid] || { multiAch:0, dairyAch:0 };
const targetData=targetsMonthObj[cid] || {}; 
const hasMultiSaved=Object.prototype.hasOwnProperty.call(targetData,'multi');
const hasDairySaved=Object.prototype.hasOwnProperty.call(targetData,'dairy');
const multiTarget=hasMultiSaved ? Number(targetData.multi||0) : 0;
const dairyTarget=hasDairySaved ? Number(targetData.dairy||0) : 0;
const multiRem=multiTarget - a.multiAch; const dairyRem=dairyTarget - a.dairyAch;
const multiPct=multiTarget? (a.multiAch/multiTarget)*100:0; const dairyPct=dairyTarget? (a.dairyAch/dairyTarget)*100:0;
const multiInputVal=hasMultiSaved ? multiTarget : '';
const dairyInputVal=hasDairySaved ? dairyTarget : '';
const multiInput=`<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='multi' data-customer-id='${cid}' value='${multiInputVal}' placeholder='0'/>`;
const dairyInput=`<input type='number' step='any' class='cust-target-input w-20 p-1 border rounded text-center text-xs' data-category='dairy' data-customer-id='${cid}' value='${dairyInputVal}' placeholder='0'/>`;
if (catVal==='multi'){
return `<tr>
<td class='name'>${escapeHtml(c.name)}</td>
<td>${multiInput}</td>
<td class='ach-cell'>${fmt(a.multiAch)}</td>
<td class='${multiRem>0?'rem-pos':'rem-zero'}'>${fmt(multiRem)}</td>
<td class='${multiPct>=50?'pct-ok':'pct-low'}'>${multiPct.toFixed(1)}%</td>
</tr>`;
} else if (catVal==='dairy'){
return `<tr>
<td class='name'>${escapeHtml(c.name)}</td>
<td>${dairyInput}</td>
<td class='ach-cell'>${fmt(a.dairyAch)}</td>
<td class='${dairyRem>0?'rem-pos':'rem-zero'}'>${fmt(dairyRem)}</td>
<td class='${dairyPct>=50?'pct-ok':'pct-low'}'>${dairyPct.toFixed(1)}%</td>
</tr>`;
} else { 
const totalTarget=multiTarget + dairyTarget;
const totalAch=a.multiAch + a.dairyAch;
const totalRem=totalTarget - totalAch;
const totalPct=totalTarget? (totalAch/totalTarget)*100:0;
return `<tr>
<td class='name'>${escapeHtml(c.name)}</td>
<td>${multiInput}</td>
<td class='ach-cell'>${fmt(a.multiAch)}</td>
<td>${dairyInput}</td>
<td class='ach-cell'>${fmt(a.dairyAch)}</td>
<td class='ach-cell'>${fmt(totalTarget)}</td>
<td class='ach-cell'>${fmt(totalAch)}</td>
<td class='${totalRem>0?'rem-pos':'rem-zero'}'>${fmt(totalRem)}</td>
<td class='${totalPct>=50?'pct-ok':'pct-low'}'>${totalPct.toFixed(1)}%</td>
</tr>`;
}
}).join('');
let thead;
if (catVal==='multi'){
thead=`<tr>
<th class='cth-name'>العميل</th>
<th class='cth-multi-target'>تارجت مالتي</th>
<th class='cth-multi-ach'>محقق مالتي</th>
<th class='cth-rem'>متبقي</th>
<th class='cth-pct'>% محقق</th>
</tr>`;
} else if (catVal==='dairy'){
thead=`<tr>
<th class='cth-name'>العميل</th>
<th class='cth-dairy-target'>تارجت البان</th>
<th class='cth-dairy-ach'>محقق البان</th>
<th class='cth-rem'>متبقي</th>
<th class='cth-pct'>% محقق</th>
</tr>`;
} else {
thead=`<tr>
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
out.innerHTML=`<div id='customer-targets-report-wrapper' class='bg-white p-3 rounded-lg shadow'>
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
}

function generateSettlementReport(){
const dateInput=document.getElementById('settlement-report-date');
const repSelect=document.getElementById('settlement-report-rep');
const date=(dateInput && dateInput.value) ? dateInput.value : (dailyReportDateInput ? dailyReportDateInput.value : '');
const repName=(repSelect && repSelect.value) ? repSelect.value : (dailyReportRepSelect ? dailyReportRepSelect.value : '');
if (!date) { customDialog({ message:'اختر تاريخاً للتسوية.', title:'بيانات ناقصة' }); return; }
if (!repName || repName==='all') { customDialog({ message:'اختر مندوب واحد للتسوية.', title:'تنبيه' }); return; }
const dispatchNote=state.dispatchNotes.find(n=> n.repName===repName && new Date(n.date).toISOString().split('T')[0]===date);
const productIds=state.products.map(p=> p.id);
const salesForDay=state.sales.filter(s=> s.repName===repName && new Date(s.date).toISOString().split('T')[0]===date);
const agg={}; 
function ensure(id){ if(!agg[id]) agg[id]={ productId:id, name: (findProduct(id)?.name)||id, dispatched:0, goodReturn:0, damagedReturn:0, freebie:0, sold:0, invoiceReturn:0 }; }
if (dispatchNote && Array.isArray(dispatchNote.items)) {
dispatchNote.items.forEach(it=>{
ensure(it.productId);
agg[it.productId].dispatched +=Number(it.quantity||0);
agg[it.productId].goodReturn +=Number(it.actualReturn||it.goodReturn||0);
agg[it.productId].damagedReturn +=Number(it.damagedReturn||0);
agg[it.productId].freebie +=Number(it.freebie||0);
});
}
salesForDay.forEach(sale=> {
sale.items.forEach(item=> {
ensure(item.productId);
const q=Number(item.quantity||item.qty||0);
if (sale.total < 0 || q < 0) { agg[item.productId].invoiceReturn +=Math.abs(q); }
else { agg[item.productId].sold +=q; }
});
});
Object.keys(agg).forEach(id=>{ if(!productIds.includes(id)) productIds.push(id); });
const rowsHtml=productIds.map(pid=> {
ensure(pid);
const m=agg[pid];
const used=m.sold + m.freebie + m.goodReturn + m.damagedReturn + m.invoiceReturn;
const diff=m.dispatched - used;
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
const billNumber=salesForDay.length ? (salesForDay[0].invoiceNumber||'') : (dispatchNote?.serial||'');
const dayNum=date.split('-')[2];
const yearNum=date.split('-')[0];
const monthNum=date.split('-')[1];
reportOutputArea.innerHTML=`
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
<th style='background:#8d0000;color:#fff'>${billNumber||''}</th>
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
}

async function shareSettlementWhatsApp(elementId) {
const el=document.getElementById(elementId);
if (!el) { await customDialog({title:'خطأ', message:'لم يتم العثور على تقرير التسوية.'}); return; }
try {
showLoading('جارٍ تجهيز مشاركة واتساب...');
const canvas=await captureElementCanvas(el, 2);
const blob=await new Promise(resolve=> canvas.toBlob(resolve, 'image/png'));
if (!blob) throw new Error('فشل إنشاء الصورة');
const url=await uploadImageBlobToStorage(blob, 'shares/settlements');
hideLoading();
const date=(window.dailyReportDateInput && dailyReportDateInput.value) ? dailyReportDateInput.value : '';
const rep=(window.dailyReportRepSelect && dailyReportRepSelect.value && dailyReportRepSelect.value !=='all') ? dailyReportRepSelect.value : '';
const msg=`تسوية ${rep ? rep + ' - ' : ''}${date ? date : ''}\n${url}`;
const wa=`https://wa.me/?text=${encodeURIComponent(msg)}`;
window.open(wa, '_blank');
} catch (e) {
console.error('WhatsApp share failed', e);
hideLoading();
await customDialog({title:'خطأ', message:'تعذر مشاركة تقرير التسوية على واتساب.'});
}
}

async function generateReconciliationReport() {
const date=document.getElementById('recon-report-date').value;
const repName=document.getElementById('recon-report-rep').value;
const chainId=document.getElementById('recon-report-chain').value;
const reportOutputArea=document.getElementById('report-output-area');
if (!date || !repName) {
await customDialog({ message: 'الرجاء تحديد التاريخ والمندوب.', title: 'بيانات ناقصة' });
return;
}
let allowedCustomerIds=null;
if (chainId) {
const chains=loadChains();
const chain=chains.find(c=> c.id===chainId);
if (chain) allowedCustomerIds=chain.customerIds || [];
}
const dispatchNote=state.dispatchNotes.find(n=> {
const d=new Date(n.date);
if (isNaN(d.getTime())) return false;
return n.repName===repName && d.toISOString().split('T')[0]===date;
});
if (!dispatchNote) {
reportOutputArea.innerHTML='<p class="text-center text-red-500 p-4">لم يتم العثور على إذن استلام لهذا المندوب في التاريخ المحدد.</p>';
return;
}
const sales=state.sales.filter(s=> {
const d=new Date(s.date);
if (isNaN(d.getTime())) return false; 
return s.repName===repName && d.toISOString().split('T')[0]===date && 
(!allowedCustomerIds || allowedCustomerIds.includes(s.customerId));
});
const salesByProduct={};
sales.forEach(sale=> {
sale.items.forEach(item=> {
salesByProduct[item.productId]=(salesByProduct[item.productId] || 0) + item.quantity;
});
});
const allProductIds=new Set([
...dispatchNote.items.map(i=> i.productId),
...Object.keys(salesByProduct)
]);
let reportRowsHtml='';
let totalDeficitValue=0;
let totalSurplusValue=0;
allProductIds.forEach(productId=> {
const product=findProduct(productId);
if (!product) return;
const dispatchItem=dispatchNote.items.find(i=> i.productId===productId) || {};
const takenOut=dispatchItem.quantity || 0;
const goodReturn=dispatchItem.goodReturn || 0;
const damagedReturn=dispatchItem.damagedReturn || 0;
const freebie=dispatchItem.freebie || 0;
const sold=salesByProduct[productId] || 0;
const expectedReturn=takenOut - sold - freebie;
const actualReturn=goodReturn + damagedReturn;
const difference=actualReturn - expectedReturn;
const differenceValue=difference * (product.price || 0);
let diffClass='text-gray-700';
if (difference < 0) {
diffClass='text-red-600 font-bold';
totalDeficitValue +=differenceValue; 
} else if (difference > 0) {
diffClass='text-green-600 font-bold';
totalSurplusValue +=differenceValue;
}
reportRowsHtml +=`
<tr style="border-bottom:1px solid #112b57;">
<td style="background:#041635;color:#fff;padding:6px 4px;text-align:right;font-weight:600">${escapeHtml(product.name)}</td>
<td style="background:#d49c3b;color:#000;padding:6px 4px;text-align:center;font-weight:600">${takenOut}</td>
<td style="background:#0b0b0b;color:#fff;padding:6px 4px;text-align:center">${sold}</td>
<td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center">${freebie}</td>
<td style="background:#041a3f;color:#fff;padding:6px 4px;text-align:center;font-weight:600">${expectedReturn}</td>
<td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center">${goodReturn}</td>
<td style="background:#041a3f;color:#fff;padding:6px 4px;text-align:center">${damagedReturn}</td>
<td style="background:#062c5c;color:#fff;padding:6px 4px;text-align:center;font-weight:600">${actualReturn}</td>
<td style="background:#041a3f;color:${difference<0?'#ff2e2e':(difference>0?'#25d366':'#fff')};padding:6px 4px;text-align:center;font-weight:${difference!==0?'700':'400'}">${difference}</td>
<td style="background:#062c5c;color:${differenceValue<0?'#ff2e2e':(differenceValue>0?'#25d366':'#fff')};padding:6px 4px;text-align:center;font-weight:${differenceValue!==0?'700':'400'}">${formatCurrency(differenceValue)}</td>
</tr>`;
});
const finalHtml=`
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
<div style='flex:1;background:linear-gradient(90deg,#007a00,#00b300);color:#fff;text-align:center;font-weight:bold;padding:12px 8px;border:2px solid #004c00;'>${(totalDeficitValue===0 && totalSurplusValue===0)?'لا توجد عجوزات وزيادات':'مراجعة القيم أعلاه'}</div>
</div>
<div class='mt-4 grid grid-cols-3 gap-2 no-print'>
<button onclick="printSection('recon-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
<button onclick="generateReportImage('recon-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> صورة HD</button>
<button onclick="shareReconciliationWhatsApp('recon-report-output')" class='bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2'><i data-lucide='send'></i> مشاركة واتساب</button>
</div>
</div>`;
reportOutputArea.innerHTML=finalHtml;
}

async function shareReconciliationWhatsApp(elementId){
const el=document.getElementById(elementId);
const date=document.getElementById('recon-report-date')?.value || '';
const rep=document.getElementById('recon-report-rep')?.value || '';
if (!el){ await customDialog({title:'خطأ', message:'تعذر العثور على التقرير.'}); return; }
try {
showLoading('جارٍ تجهيز مشاركة واتساب...');
el.classList.add('recon-export-scale');
const canvas=await captureElementCanvas(el, 4);
el.classList.remove('recon-export-scale');
const blob=await new Promise(r=> canvas.toBlob(r,'image/png'));
if (!blob) throw new Error('فشل إنشاء الصورة');
const url=await uploadImageBlobToStorage(blob, 'shares/final_settlements');
hideLoading(); 
const msg=`التسوية النهائية للمندوب ${rep} - ${date}\n${url}`;
const desktopUrl=`https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
let popup=window.open(desktopUrl, '_blank');
setTimeout(()=> {
try {
if (!popup || popup.closed) {
window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
} catch(_) {
window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
}, 1800);
} catch(e){
console.warn('shareReconciliationWhatsApp failed', e);
hideLoading();
}
}

// Export to window
window.generateCustomerTargetsReport=generateCustomerTargetsReport;
window.generateSettlementReport=generateSettlementReport;
window.generateReconciliationReport=generateReconciliationReport;
window.shareSettlementWhatsApp=shareSettlementWhatsApp;
window.shareReconciliationWhatsApp=shareReconciliationWhatsApp;
