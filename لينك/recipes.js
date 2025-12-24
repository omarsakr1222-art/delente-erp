// Simplified Cost (Recipe) Feature (extracted from index.html)
(function(){
    const LS_SIMPLE_RECIPES = 'simple_cost_recipes';
    let simpleRecipes = [];
    let lastFocusedRecipeId = null;

    function loadSimpleRecipes(){
        try { const raw = localStorage.getItem(LS_SIMPLE_RECIPES); simpleRecipes = raw ? JSON.parse(raw) : []; if(!Array.isArray(simpleRecipes)) simpleRecipes = []; } catch(e){ simpleRecipes = []; }
        try { window.simpleRecipes = simpleRecipes; } catch(_){}
    }
    function saveSimpleRecipes(){ try { localStorage.setItem(LS_SIMPLE_RECIPES, JSON.stringify(simpleRecipes)); } catch(e){} }
    function toNum(v){ return parseFloat(v||0) || 0; }
    function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function computeRecipe(r){
        const ingredientsCost = (r.ingredients||[]).reduce((a,x)=> a + (toNum(x.qtyKg) * toNum(x.unitCost)), 0);
        const packagingCost = (r.packaging||[]).reduce((a,x)=> a + toNum(x.cost), 0);
        const operationsCost = (r.operations||[]).reduce((a,x)=> a + toNum(x.cost), 0);
        const totalBatchCost = ingredientsCost + packagingCost + operationsCost;
        const costPerKg = toNum(r.batchSizeKg) > 0 ? totalBatchCost / toNum(r.batchSizeKg) : 0;
        return { ingredientsCost, packagingCost, operationsCost, totalBatchCost, costPerKg };
    }
    function ingredientRow(idx, ing){
        return `<div class="flex gap-2 items-center" data-row="${idx}" data-type="ing">\n<input class="ing-name flex-1 p-1 border rounded text-xs" placeholder="اسم" value="${esc(ing.name)}" />\n<input class="ing-qty w-20 p-1 border rounded text-xs text-center" placeholder="كمية" value="${esc(ing.qtyKg)}" />\n<input class="ing-cost w-20 p-1 border rounded text-xs text-center" placeholder="سعر/كجم" value="${esc(ing.unitCost)}" />\n<button class="row-del bg-red-500 text-white px-2 py-1 rounded text-xs">×</button>\n</div>`;
    }
    function packagingRow(idx, pk){
        return `<div class="flex gap-2 items-center" data-row="${idx}" data-type="pack">\n<input class="pack-name flex-1 p-1 border rounded text-xs" placeholder="اسم" value="${esc(pk.name)}" />\n<input class="pack-cost w-24 p-1 border rounded text-xs text-center" placeholder="قيمة" value="${esc(pk.cost)}" />\n<button class="row-del bg-red-500 text-white px-2 py-1 rounded text-xs">×</button>\n</div>`;
    }
    function operationRow(idx, op){
        return `<div class="flex gap-2 items-center" data-row="${idx}" data-type="op">\n<input class="op-name flex-1 p-1 border rounded text-xs" placeholder="وصف" value="${esc(op.name)}" />\n<input class="op-cost w-24 p-1 border rounded text-xs text-center" placeholder="قيمة" value="${esc(op.cost)}" />\n<button class="row-del bg-red-500 text-white px-2 py-1 rounded text-xs">×</button>\n</div>`;
    }
    function computeAndCardHTML(r){
        const c = computeRecipe(r);
        return `<div class="flex items-center gap-2 mb-2">\n<input class="recipe-name w-full p-2 border rounded" placeholder="اسم المنتج" value="${esc(r.name)}" />\n<input class="recipe-batch w-28 p-2 border rounded" placeholder="دفعة كجم" value="${esc(r.batchSizeKg)}" />\n<button class="delete-recipe bg-red-600 text-white px-2 py-1 rounded text-sm">حذف</button>\n</div>\n<div class="grid md:grid-cols-3 gap-4">\n<div>\n<h4 class="font-semibold text-sm mb-1">الخامات</h4>\n<div class="ingredients space-y-2">${(r.ingredients||[]).map((ing,i)=> ingredientRow(i, ing)).join('')}</div>\n<button class="add-ingredient bg-blue-500 text-white text-xs px-2 py-1 rounded mt-2">+ خامة</button>\n</div>\n<div>\n<h4 class="font-semibold text-sm mb-1">التعبئة</h4>\n<div class="packaging space-y-2">${(r.packaging||[]).map((pk,i)=> packagingRow(i, pk)).join('')}</div>\n<button class="add-packaging bg-blue-500 text-white text-xs px-2 py-1 rounded mt-2">+ تغليف</button>\n</div>\n<div>\n<h4 class="font-semibold text-sm mb-1">التشغيل</h4>\n<div class="operations space-y-2">${(r.operations||[]).map((op,i)=> operationRow(i, op)).join('')}</div>\n<button class="add-operation bg-blue-500 text-white text-xs px-2 py-1 rounded mt-2">+ تشغيل</button>\n</div>\n</div>\n<div class="text-sm bg-gray-50 border rounded p-3 grid grid-cols-2 md:grid-cols-5 gap-2">\n<div><span class="text-gray-600">خامات:</span> <span class="font-bold">${c.ingredientsCost.toFixed(2)}</span></div>\n<div><span class="text-gray-600">تغليف:</span> <span class="font-bold">${c.packagingCost.toFixed(2)}</span></div>\n<div><span class="text-gray-600">تشغيل:</span> <span class="font-bold">${c.operationsCost.toFixed(2)}</span></div>\n<div><span class="text-gray-600">إجمالي الدفعة:</span> <span class="font-bold">${c.totalBatchCost.toFixed(2)}</span></div>\n<div><span class="text-gray-600">التكلفة / كجم:</span> <span class="font-bold">${c.costPerKg.toFixed(2)}</span></div>\n</div>\n<textarea class="recipe-notes w-full p-2 border rounded text-sm" placeholder="ملاحظات">${esc(r.notes||'')}</textarea>`;
    }
    function renderRecipes(){
        const listEl = document.getElementById('recipes-list'); if(!listEl) return;
        listEl.innerHTML = '';
        if(simpleRecipes.length === 0){
            listEl.innerHTML = '<div class="p-4 bg-white rounded shadow text-sm text-gray-600">لا توجد منتجات بعد. اضغط "منتج جديد".</div>';
            return;
        }
        simpleRecipes.forEach(r => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow border p-4 space-y-3';
            card.setAttribute('data-id', r.id);
            card.innerHTML = computeAndCardHTML(r);
            listEl.appendChild(card);
        });
    }
    function renderQuickLists(){
        const wrap = document.getElementById('recipe-quick-lists'); if(!wrap) return;
        function esc2(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
        const fin = Array.isArray(window.costFinished) ? window.costFinished : [];
        const raw = Array.isArray(window.costRaw) ? window.costRaw : [];
        const pack = Array.isArray(window.costPack) ? window.costPack : [];
        const summary = `القوائم السريعة — منتجات: ${fin.length} • خامات: ${raw.length} • تغليف: ${pack.length}`;
        const prodHtml = `<div class="bg-white border rounded p-3 shadow"><h4 class="font-semibold text-sm mb-2">المنتجات</h4><div class="flex flex-wrap gap-2">${fin.map(p=>`<button type=\"button\" class=\"quick-add-item px-2 py-1 rounded text-xs bg-blue-100 hover:bg-blue-200\" data-add-type=\"ing\" data-name=\"${esc2(p.name)}\">${esc2(p.name)}</button>`).join('') || '<span class=\"text-xs text-gray-500\">لا يوجد</span>'}</div></div>`;
        const rawHtml = `<div class="bg-white border rounded p-3 shadow"><h4 class="font-semibold text-sm mb-2">الخامات</h4><div class="flex flex-wrap gap-2">${raw.map(p=>`<button type=\"button\" class=\"quick-add-item px-2 py-1 rounded text-xs bg-green-100 hover:bg-green-200\" data-add-type=\"ing\" data-name=\"${esc2(p.name)}\">${esc2(p.name)}</button>`).join('') || '<span class=\"text-xs text-gray-500\">لا يوجد</span>'}</div></div>`;
        const packHtml = `<div class="bg-white border rounded p-3 shadow"><h4 class="font-semibold text-sm mb-2">التعبئة والتغليف</h4><div class="flex flex-wrap gap-2">${pack.map(p=>`<button type=\"button\" class=\"quick-add-item px-2 py-1 rounded text-xs bg-purple-100 hover:bg-purple-200\" data-add-type=\"pack\" data-name=\"${esc2(p.name)}\">${esc2(p.name)}</button>`).join('') || '<span class=\"text-xs text-gray-500\">لا يوجد</span>'}</div></div>`;
        wrap.innerHTML = `<details class="bg-indigo-50 border border-indigo-200 rounded-md">`+
            `<summary class="cursor-pointer px-3 py-2 text-sm font-semibold text-indigo-800 flex items-center gap-2"><i data-lucide=\"list\" class=\"w-4 h-4\"></i> ${summary}</summary>`+
            `<div class="p-3 grid md:grid-cols-3 gap-4">${prodHtml}${rawHtml}${packHtml}</div>`+
        `</details>`;
        if (typeof updateIcons === 'function') { try { updateIcons(); } catch(e){} }
    }
    function addRecipe(){
        const r = { id: 'rec-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6), name: '', batchSizeKg: '', ingredients: [], packaging: [], operations: [], notes: '' };
        simpleRecipes.push(r); saveSimpleRecipes(); renderRecipes();
    }
    function importFromOld(){
        try{ if(typeof loadLists === 'function'){ loadLists(); } }catch(e){}
        const fins = Array.isArray(window.costFinished)? window.costFinished : [];
        const raws = Array.isArray(window.costRaw)? window.costRaw : [];
        const packs = Array.isArray(window.costPack)? window.costPack : [];
        let created = 0, updated = 0;
        const byId = (arr,id)=> arr.find(x=> String(x.id) === String(id));
        const unitCostOfRaw = r => (r && (r.lastPrice!=null?r.lastPrice:r.cost)) || 0;
        const unitCostOfPack = p => (p && (p.lastPrice!=null?p.lastPrice:p.cost)) || 0;
        fins.forEach(p => {
            const name = (p && (p.name||p.code||'')).toString(); if(!name) return;
            let existing = simpleRecipes.find(r=> (r.name||'') === name);
            if(!existing){ existing = { id: 'rec-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6), name, batchSizeKg: '', ingredients: [], packaging: [], operations: [], notes: '' }; simpleRecipes.push(existing); created++; }
            const keys = [ p.id, p.code, p.name ].filter(Boolean).map(v => 'bom_' + v);
            let bomObj = null;
            for(const k of keys){ try{ const raw = localStorage.getItem(k); if(raw){ bomObj = JSON.parse(raw); break; } }catch(e){} }
            if(!bomObj || !Array.isArray(bomObj.items)){ updated += 0; return; }
            const ings = []; const pkgs = [];
            bomObj.items.forEach(it => {
                const qty = parseFloat(it.qty||0) || 0;
                if((it.type||'').toLowerCase() === 'raw'){
                    const r = byId(raws, it.id);
                    ings.push({ name: (r && r.name) || (it.name||'مكوّن'), qtyKg: qty || '', unitCost: unitCostOfRaw(r) });
                } else if((it.type||'').toLowerCase() === 'pack'){
                    const pk = byId(packs, it.id);
                    const uc = unitCostOfPack(pk);
                    pkgs.push({ name: (pk && pk.name) || (it.name||'تغليف'), cost: (qty * uc) || 0 });
                }
            });
            const batch = ings.reduce((a,x)=> a + (parseFloat(x.qtyKg||0)||0), 0);
            if(batch > 0 && !existing.batchSizeKg) existing.batchSizeKg = batch;
            if(existing.ingredients.length === 0) existing.ingredients = ings;
            if(existing.packaging.length === 0) existing.packaging = pkgs;
            updated++;
        });
        saveSimpleRecipes(); renderRecipes(); renderQuickLists();
        alert(`تم الاستيراد: أنشئت ${created} وصفات، وتم تحديث ${updated}.`);
    }
    function silentImportIfEmpty(){
        try{ if(typeof loadLists === 'function'){ loadLists(); } }catch(e){}
        if (simpleRecipes.length > 0) return;
        const fins = Array.isArray(window.costFinished)? window.costFinished : [];
        const raws = Array.isArray(window.costRaw)? window.costRaw : [];
        const packs = Array.isArray(window.costPack)? window.costPack : [];
        if (!fins.length && !raws.length && !packs.length) return;
        let created = 0;
        fins.forEach(p => {
            const name = (p && (p.name||p.code||'')); if(!name) return;
            if(!simpleRecipes.some(r => r.name === name)){
                simpleRecipes.push({ id: 'rec-' + Date.now().toString(36) + Math.random().toString(36).slice(2,6), name, batchSizeKg:'', ingredients:[], packaging:[], operations:[], notes:'' });
                created++;
            }
        });
        if (created){ saveSimpleRecipes(); renderRecipes(); renderQuickLists(); }
    }
    window.autoImportLegacyRecipesOnce = (function(){ let done=false; return function(){ if(done) return; try { silentImportIfEmpty(); } catch(_){} done=true; }; })();
    window.importOldCosts = importFromOld;
    window.importOldCostsSilent = silentImportIfEmpty;
    function syncCard(card){
        const id = card.getAttribute('data-id'); const r = simpleRecipes.find(x=>x.id===id); if(!r) return;
        r.name = card.querySelector('.recipe-name')?.value.trim() || '';
        r.batchSizeKg = card.querySelector('.recipe-batch')?.value.trim() || '';
        r.notes = card.querySelector('.recipe-notes')?.value || '';
        r.ingredients = Array.from(card.querySelectorAll('.ingredients > div')).map(d => ({ name: d.querySelector('.ing-name')?.value.trim() || '', qtyKg: d.querySelector('.ing-qty')?.value.trim() || '', unitCost: d.querySelector('.ing-cost')?.value.trim() || '' }));
        r.packaging = Array.from(card.querySelectorAll('.packaging > div')).map(d => ({ name: d.querySelector('.pack-name')?.value.trim() || '', cost: d.querySelector('.pack-cost')?.value.trim() || '' }));
        r.operations = Array.from(card.querySelectorAll('.operations > div')).map(d => ({ name: d.querySelector('.op-name')?.value.trim() || '', cost: d.querySelector('.op-cost')?.value.trim() || '' }));
        saveSimpleRecipes(); renderRecipes();
    }
    document.addEventListener('click', function(e){
        if(e.target && e.target.id === 'add-recipe-btn'){ addRecipe(); }
        if(e.target && e.target.id === 'import-old-costs-btn'){ importFromOld(); }
        if(e.target && e.target.id === 'restore-costs-from-products-btn'){ try { if (window.restoreFromPriceLists) window.restoreFromPriceLists(); if (window.renderQuickLists) window.renderQuickLists(); if (window.renderRecipes) window.renderRecipes(); } catch(_){} }
        const card = e.target && e.target.closest && e.target.closest('[data-id]');
        if(card){
            if(e.target.classList.contains('add-ingredient')){ const id = card.getAttribute('data-id'); const r = simpleRecipes.find(x=>x.id===id); if(r){ r.ingredients.push({ name:'', qtyKg:'', unitCost:'' }); saveSimpleRecipes(); renderRecipes(); } }
            if(e.target.classList.contains('add-packaging')){ const id = card.getAttribute('data-id'); const r = simpleRecipes.find(x=>x.id===id); if(r){ r.packaging.push({ name:'', cost:'' }); saveSimpleRecipes(); renderRecipes(); } }
            if(e.target.classList.contains('add-operation')){ const id = card.getAttribute('data-id'); const r = simpleRecipes.find(x=>x.id===id); if(r){ r.operations.push({ name:'', cost:'' }); saveSimpleRecipes(); renderRecipes(); } }
            if(e.target.classList.contains('delete-recipe')){ if(confirm('حذف المنتج؟')){ const id = card.getAttribute('data-id'); simpleRecipes = simpleRecipes.filter(x=>x.id!==id); saveSimpleRecipes(); renderRecipes(); } }
            if(e.target.classList.contains('row-del')){ const row = e.target.closest('div[data-row]'); const type = row.getAttribute('data-type'); const idx = parseInt(row.getAttribute('data-row')); const id = card.getAttribute('data-id'); const r = simpleRecipes.find(x=>x.id===id); if(r){ if(type==='ing'){ r.ingredients.splice(idx,1); } else if(type==='pack'){ r.packaging.splice(idx,1); } else if(type==='op'){ r.operations.splice(idx,1); } saveSimpleRecipes(); renderRecipes(); } }
        }
    });
    document.addEventListener('input', function(e){
        const card = e.target && e.target.closest && e.target.closest('[data-id]');
        if(card && (e.target.classList.contains('recipe-name') || e.target.classList.contains('recipe-batch') || e.target.classList.contains('recipe-notes') || e.target.classList.contains('ing-name') || e.target.classList.contains('ing-qty') || e.target.classList.contains('ing-cost') || e.target.classList.contains('pack-name') || e.target.classList.contains('pack-cost') || e.target.classList.contains('op-name') || e.target.classList.contains('op-cost'))){
            syncCard(card);
        }
    });
    document.addEventListener('focusin', function(e){
        const card = e.target && e.target.closest && e.target.closest('[data-id]');
        if(card) lastFocusedRecipeId = card.getAttribute('data-id');
    });
    document.addEventListener('click', function(e){
        if(e.target && e.target.getAttribute && e.target.getAttribute('data-page')==='costs'){ setTimeout(()=>{ renderRecipes(); renderQuickLists(); }, 80); }
        if(e.target && e.target.classList.contains('quick-add-item')){
            const name = e.target.getAttribute('data-name')||''; const type = e.target.getAttribute('data-add-type');
            if(!name) return;
            let target = simpleRecipes.find(r=>r.id===lastFocusedRecipeId);
            if(!target){ target = simpleRecipes.length === 1 ? simpleRecipes[0] : null; }
            if(!target){ addRecipe(); target = simpleRecipes[simpleRecipes.length-1]; lastFocusedRecipeId = target.id; }
            if(type === 'ing'){ target.ingredients.push({ name, qtyKg:'', unitCost:'' }); }
            else if(type === 'pack'){ target.packaging.push({ name, cost:'' }); }
            saveSimpleRecipes(); renderRecipes();
        }
    });
    window.renderRecipes = renderRecipes;
    window.renderQuickLists = renderQuickLists;
    window.saveSimpleRecipes = saveSimpleRecipes;
    window.loadSimpleRecipes = loadSimpleRecipes;
    loadSimpleRecipes();
    renderQuickLists();
})();
