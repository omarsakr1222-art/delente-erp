// ===== TARGETS REPORTS (Monthly KPI) =====
function getCustomerTargetsStore(){
  state.customerTargets = state.customerTargets || {};
  return state.customerTargets;
}
function getCustomerTargetsForMonth(month){
  const store = getCustomerTargetsStore();
  if (!store[month]) store[month] = {};
  return store[month];
}
function saveCustomerTargetsFromInputs(){
  const monthVal = document.getElementById('customer-targets-month')?.value;
  if (!monthVal){ customDialog({title:'تنبيه', message:'اختر الشهر أولاً.'}); return; }
  const monthKey = monthVal;
  const targetObj = getCustomerTargetsForMonth(monthKey);
  const inputs = document.querySelectorAll('#customer-targets-report-output .cust-target-input');
  inputs.forEach(inp => {
    const cid = inp.dataset.customerId; const cat = inp.dataset.category; const val = parseFloat(inp.value)||0;
    targetObj[cid] = targetObj[cid] || { multi:0, dairy:0 };
    targetObj[cid][cat] = val;
  });
  saveState();
  customDialog({title:'حفظ', message:'تم حفظ قيم التارجت.'});
  if (typeof window.generateCustomerTargetsReport === 'function') {
    window.generateCustomerTargetsReport();
  }
}
function generateTargetsReport(){
  const monthVal=(document.getElementById('targets-month')?.value)||'';
  const chainId=(document.getElementById('targets-chain-filter')?.value)||'';
  if (!monthVal){ customDialog({title:'بيانات ناقصة', message:'اختر شهر التارجت.'}); return; }
  let allowedCustomerIds=null;
  if (chainId) {
    const chains=loadChains();
    const chain=chains.find(c=> c.id===chainId);
    if (chain) allowedCustomerIds=chain.customerIds || [];
  }
  const [yearStr, monthStr]=monthVal.split('-');
  const year=parseInt(yearStr,10); const m=parseInt(monthStr,10)-1;
  const monthStart=new Date(Date.UTC(year,m,1));
  const monthEnd=new Date(Date.UTC(year,m+1,1) - 1);
  const today=new Date();
  const daysInMonth=new Date(year,m+1,0).getDate();
  const todayDay=(today.getMonth()===m && today.getFullYear()===year) ? today.getDate() : daysInMonth;
  const repsAll=(state.reps||[]).map(r=> ({ id:r.id, name:r.name||r.id, target:Number(r.target||0) }));
  const repFilterEl=document.getElementById('targets-rep-filter');
  if (repFilterEl){
    const selVal=repFilterEl.value || 'all';
    if (repFilterEl.dataset.filled !=='1' || repFilterEl.options.length-1 !==repsAll.length){
      const current=selVal;
      repFilterEl.innerHTML='<option value="all">عرض كل المناديب</option>' + repsAll.map(r=>`<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)}</option>`).join('');
      repFilterEl.dataset.filled='1';
      if ([...repFilterEl.options].some(o=>o.value===current)) repFilterEl.value=current;
    }
  }
  const selectedRepName=(repFilterEl && repFilterEl.value && repFilterEl.value!=='all') ? repFilterEl.value : null;
  const reps=selectedRepName ? repsAll.filter(r=>r.name===selectedRepName) : repsAll;
  if (reps.length===0){ reportOutputArea.innerHTML='<p class="text-center text-gray-500">لا توجد مناديب مسجلة.</p>'; return; }
  const dayAgg=new Map();
  (state.sales||[]).forEach(s=> {
    const d=new Date(s.date);
    if (isNaN(d.getTime())) return;
    if (d < monthStart || d > monthEnd) return;
    const matchesChain=!allowedCustomerIds || allowedCustomerIds.includes(s.customerId);
    if (!matchesChain) return;
    const dayKey=d.toISOString().split('T')[0];
    const repName=s.repName || 'غير محدد';
    const net=s.total;
    const mapForDay=dayAgg.get(dayKey) || new Map();
    mapForDay.set(repName, (mapForDay.get(repName)||0) + net);
    dayAgg.set(dayKey, mapForDay);
  });
  const colBgs=['#f0f9ff','#eef2ff','#f5f3ff','#fdf2f8','#fff7ed','#fefce8','#ecfccb','#f0fdf4','#fafaf9','#e0f2fe'];
  const colBgsStrong=['#e0f2fe','#e0e7ff','#ede9fe','#fde2f3','#ffedd5','#fef3c7','#d9f99d','#dcfce7','#e7e5e4','#bae6fd'];
  const rows=[];
  const cumulativeByRep={}; reps.forEach(r=> cumulativeByRep[r.name]=0);
  for (let day=1; day<=daysInMonth; day++){
    const isoDay=`${year}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const mapForDay=dayAgg.get(isoDay) || new Map();
    let totalDay=0;
    const cells=reps.map((r, idx)=> {
      const val=mapForDay.get(r.name)||0;
      cumulativeByRep[r.name] +=val;
      totalDay +=val;
      const base=colBgs[idx % colBgs.length];
      const strong=colBgsStrong[idx % colBgsStrong.length];
      const bg=val ? strong : base;
      return `<td style='background:${bg};color:#0b1b34;font-size:12px;font-weight:${val? '600':'400'}'>${val? formatCurrency(val):'0.00'}</td>`;
    }).join('');
    rows.push(`<tr>
    <td class='targets-col-day'>${String(day).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${year}</td>${cells}<td class='targets-col-total'>${totalDay? formatCurrency(totalDay):'0.00'}</td>
    </tr>`);
  }
  const achievedRowCells=reps.map((r,idx)=> `<td style='background:${colBgsStrong[idx%colBgsStrong.length]};color:#065f46;font-weight:700'>${formatCurrency(cumulativeByRep[r.name])}</td>`).join('');
  const targetRowCells=reps.map((r,idx)=> `<td style='background:${colBgs[idx%colBgs.length]};color:#111827;font-weight:700'>${formatCurrency(r.target)}</td>`).join('');
  const remainingRowCells=reps.map(r=> {
    const rem=r.target - cumulativeByRep[r.name];
    return `<td style='background:${rem>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(rem)}</td>`;
  }).join('');
  const expectedPct=todayDay / daysInMonth;
  const expectedRowCells=reps.map((r,idx)=> `<td style='background:${idx%2===0?'#e0e7ff':'#e0f2fe'};color:#0b1b34;font-weight:700'>${(expectedPct*100).toFixed(1)}%</td>`).join('');
  const achievedPctCells=reps.map(r=> {
    const pct=r.target? (cumulativeByRep[r.name]/r.target):0;
    const good=pct >=expectedPct;
    return `<td style='background:${good?'#bbf7d0':'#fecaca'};color:#065f46;font-weight:700'>${(pct*100).toFixed(1)}%</td>`;
  }).join('');
  const totalAchieved=Object.values(cumulativeByRep).reduce((a,b)=>a+b,0);
  const totalTargets=reps.reduce((a,r)=>a+r.target,0);
  const totalRemaining=totalTargets - totalAchieved;
  const tableHtml=`
  <div id='targets-report-output' style='direction:rtl;font-family:Cairo;'>
  <table class='targets-table'>
  <thead>
  <tr style='color:#fff;'>
  <th style='background:#3b82f6;font-weight:bold'>اليوم</th>
  ${reps.map((r,idx)=>`<th style='background:#2563eb;font-weight:bold'>${r.name}</th>`).join('')}
  <th style='background:#ef4444;font-weight:bold'>إجمالي اليوم</th>
  </tr>
  </thead>
  <tbody>${rows.join('')}</tbody>
  <tfoot>
  <tr><td style='background:#e0f2fe;color:#065f46;font-weight:700'>${(expectedPct*100).toFixed(1)}%</td>${expectedRowCells}<td style='background:#e0f2fe;color:#065f46;font-weight:700'>نسبة مستهدفة حتى اليوم</td></tr>
  <tr><td style='background:#bbf7d0;color:#065f46;font-weight:700'>${totalTargets? ((totalAchieved/totalTargets)*100).toFixed(1):'0.0'}%</td>${achievedPctCells}<td style='background:#bbf7d0;color:#065f46;font-weight:700'>نسبة المحقق</td></tr>
  <tr><td style='background:#fef3c7;color:#111827;font-weight:700'>${formatCurrency(totalTargets)}</td>${targetRowCells}<td style='background:#fef3c7;color:#111827;font-weight:700'>التارجت</td></tr>
  <tr><td style='background:${totalRemaining>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>${formatCurrency(totalRemaining)}</td>${remainingRowCells}<td style='background:${totalRemaining>0?'#fde68a':'#bbf7d0'};color:#111827;font-weight:700'>المتبقي</td></tr>
  <tr><td style='background:#bfdbfe;color:#0b1b34;font-weight:700'>${formatCurrency(totalAchieved)}</td>${achievedRowCells}<td style='background:#bfdbfe;color:#0b1b34;font-weight:700'>الإجمالي المحقق</td></tr>
  </tfoot>
  </table>
  <div style='display:flex;gap:12px;margin-top:12px;' class='no-print'>
  <button onclick="printSection('targets-report-output')" class='bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2'><i data-lucide='printer'></i> طباعة</button>
  <button onclick="generateReportImage('targets-report-output')" class='bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2'><i data-lucide='image'></i> صورة</button>
  </div>
  </div>`;
  reportOutputArea.innerHTML=tableHtml;
  updateIcons();
}

// Export
window.generateTargetsReport = generateTargetsReport;
window.getCustomerTargetsStore = getCustomerTargetsStore;
window.getCustomerTargetsForMonth = getCustomerTargetsForMonth;
window.saveCustomerTargetsFromInputs = saveCustomerTargetsFromInputs;
