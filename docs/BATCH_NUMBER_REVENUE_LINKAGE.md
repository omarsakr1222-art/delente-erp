# ربط الإيرادات برقم التشغيلة (Batch Number Revenue Linkage)

## الهدف
فصل إيرادات التشغيلات المختلفة لنفس المنتج، بحيث يمكن حساب الربحية لكل تشغيلة على حدة.

## الحالة الراهنة
- **تجميع الإيرادات الحالي**: يتم تجميع الإيرادات حسب `productId` فقط في `salesRevenueByProductId`.
- **المشكلة**: إذا كان هناك تشغيلتان لنفس المنتج (مثل زبادي #100 و زبادي #101)، يتم تجميع إيراداتهما معاً.
- **الحاجة**: فصل الإيرادات حسب `(productId, batchNumber)` لكل تشغيلة.

## الخطوات المطلوبة للتنفيذ

### 1. إضافة حقل `batchNumber` لعناصر الفاتورة
في واجهة إضافة/تعديل الفواتير (`js/inline-scripts.js`):
- إضافة عمود أو حقل لاختيار رقم التشغيلة لكل صنف في الفاتورة.
- يمكن أن يكون dropdown يعرض التشغيلات النشطة للمنتج المختار.
- عند حفظ الفاتورة، يتم تخزين `batchNumber` ضمن كل عنصر في `items[]`:
  ```javascript
  {
    productId: "P-001",
    qty: 10,
    price: 50,
    batchNumber: 100  // ← إضافة هذا الحقل
  }
  ```

### 2. تعديل مستمع الإيرادات في `costs-v2-integrated.js`
تحديث دالة `initSalesRevenueListener()` لتجميع الإيرادات حسب `(productId, batchNumber)`:

```javascript
function initSalesRevenueListener(){
    const db = getDb();
    if(!db) return;
    try {
        db.collection('sales').onSnapshot(snap => {
            const agg = {}; // { "productId|batchNumber": totalRevenue }
            snap.forEach(doc => {
                const s = doc.data() || {};
                const items = Array.isArray(s.items) ? s.items : [];
                for(const it of items){
                    const pid = it.productId || it.id || null;
                    if(!pid) continue;
                    const batchNum = it.batchNumber || null;
                    const key = batchNum ? `${pid}|${batchNum}` : pid; // فصل بـ | أو استخدام كائن متداخل
                    const qty = Number(it.qty != null ? it.qty : (it.quantity || 0));
                    const price = Number(it.price || 0);
                    const subtotal = (isFinite(qty) ? qty : 0) * (isFinite(price) ? price : 0);
                    agg[key] = (agg[key] || 0) + subtotal;
                }
            });
            salesRevenueByProductId = agg;
            // إعادة رسم التقارير وتفاصيل التشغيلات
            try { rerenderReportsFromRevenue(); } catch(_){ }
            try {
                const isBatchDetailsVisible = !!document.querySelector('[data-cv2-view="batch-details"]:not(.hidden)');
                if(isBatchDetailsVisible && currentBatchId){ viewBatchDetails(currentBatchId); }
            } catch(_){ }
        }, err => {
            // Silent on permission errors
        });
    } catch(e){ /* ignore */ }
}
```

### 3. تحديث `loadReports()` و `viewBatchDetails()`
عند حساب إيراد تشغيلة معينة:
```javascript
const finishedPid = findFinishedProductIdByName(b.recipeName);
const batchNum = b.batchNumber;
const revenueKey = finishedPid && batchNum ? `${finishedPid}|${batchNum}` : finishedPid;
const realRevenue = revenueKey ? (salesRevenueByProductId[revenueKey] || 0) : 0;
```

### 4. واجهة الفاتورة: اختيار التشغيلة
**الخيار 1: Dropdown لكل صنف**
- عند اختيار منتج في صف الفاتورة، عرض قائمة منسدلة بالتشغيلات النشطة من `batches_v2`:
  ```javascript
  db.collection('batches_v2')
    .where('recipeName', '==', productName)
    .where('status', '==', 'active')
    .get()
    .then(snap => {
      // populate dropdown with batchNumbers
    });
  ```

**الخيار 2: حقل إدخال يدوي**
- إضافة input بسيط لإدخال رقم التشغيلة يدوياً (للسرعة).

**الخيار 3: ربط تلقائي**
- عند اختيار المنتج، اختيار التشغيلة النشطة الأحدث تلقائياً، مع إمكانية التعديل.

### 5. التحقق من البيانات القديمة
الفواتير الموجودة لا تحتوي على `batchNumber`:
- **حل مؤقت**: إذا لم يكن `batchNumber` موجوداً، تجميع الإيرادات على مستوى المنتج فقط.
- **حل دائم**: تشغيل script لتعيين `batchNumber` للفواتير القديمة بناءً على التاريخ أو التشغيلة الوحيدة المتاحة.

## الفوائد
- ✅ فصل دقيق للإيرادات لكل تشغيلة
- ✅ حساب ربحية حقيقية لكل دفعة إنتاج
- ✅ تتبع أداء تشغيلات مختلفة لنفس المنتج
- ✅ تقارير أدق للتكاليف والمبيعات

## ملاحظات التنفيذ
- **الأولوية**: متوسطة – النظام الحالي يعمل لكن بدقة أقل.
- **التعقيد**: متوسط – يتطلب تعديل واجهة الفاتورة وlogic التجميع.
- **التوافق مع الإصدارات السابقة**: يجب التعامل مع الفواتير القديمة التي لا تحتوي على `batchNumber`.

## كود تجريبي لاختبار التنفيذ
```javascript
// Example invoice item with batchNumber
const invoiceItem = {
  productId: "P-001",
  qty: 10,
  price: 50,
  batchNumber: 100
};

// Revenue aggregation with batch separation
const key = invoiceItem.batchNumber 
  ? `${invoiceItem.productId}|${invoiceItem.batchNumber}` 
  : invoiceItem.productId;
salesRevenueByProductId[key] = (salesRevenueByProductId[key] || 0) + (invoiceItem.qty * invoiceItem.price);

// Later, when computing batch profit:
const batch = { batchNumber: 100, recipeName: "زبادي" };
const finishedPid = findFinishedProductIdByName(batch.recipeName);
const revenueKey = `${finishedPid}|${batch.batchNumber}`;
const realRevenue = salesRevenueByProductId[revenueKey] || 0;
```

## المرجع
- ملف التنفيذ: `js/costs-v2-integrated.js`
- دالة التجميع: `initSalesRevenueListener()`
- واجهة الفاتورة: `js/inline-scripts.js` → `addSaleItemRow()`, `saveSale()`
