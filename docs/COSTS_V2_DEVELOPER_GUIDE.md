# نظام تكاليف الألبان v2 - دليل المطور

## البنية التقنية

### هيكل الملفات
```
delente-erp/
├── index.html                          # الصفحة الرئيسية (تحتوي على page-costs-v2)
├── js/
│   ├── costs-v2-logic.js              # منطق نظام التكاليف الجديد ⭐
│   ├── main.js                        # معالج التنقل والصلاحيات
│   └── inline-scripts.js              # Firebase و storeSubscription
└── COSTS_V2_INTEGRATION_SUMMARY.md    # ملخص التكامل
```

### Firebase Collections

#### 1. Ingredients (الخامات)
**Path**: `artifacts/${appId}/public/data/ingredients`

```javascript
{
  name: string,        // "لبن خام"
  unit: string,        // "كجم"
  cost: number,        // 20.00
  updatedAt: string    // ISO timestamp
}
```

#### 2. Recipes (الوصفات)
**Path**: `artifacts/${appId}/public/data/recipes`

```javascript
{
  name: string,              // "جبنة قريش"
  unit: string,              // "صفيحة"
  ingredients: [             // المكونات
    {
      id: string,            // ingredient doc ID
      qty: number            // الكمية المستخدمة
    }
  ],
  overhead: number,          // مصاريف تشغيل ثابتة
  stdPrice: number,          // سعر البيع المستهدف
  estimatedCost: number,     // التكلفة التقديرية
  updatedAt: string
}
```

#### 3. Batches (التشغيلات)
**Path**: `artifacts/${appId}/public/data/batches`

```javascript
{
  batchNumber: number,       // رقم التشغيلة (random 4-digit)
  recipeId: string,          // ربط بالوصفة
  recipeName: string,        // اسم المنتج
  status: string,            // "active" | "closed"
  estTotalCost: number,      // التكلفة المعيارية
  
  // بعد الإغلاق
  totalCost: number,         // التكلفة الفعلية
  finalQty: number,          // الكمية المنتجة
  unitCost: number,          // تكلفة الوحدة
  closedAt: string,          // تاريخ الإغلاق
  
  // المبيعات
  soldQty: number,           // الكمية المباعة
  totalRev: number,          // إجمالي الإيراد
  netProfit: number,         // صافي الربح
  
  createdAt: string
}
```

#### 4. Batch Sales (مبيعات التشغيلة)
**Path**: `artifacts/${appId}/public/data/batch_sales`

```javascript
{
  batchId: string,           // ربط بالتشغيلة
  customer: string,          // اسم العميل
  qty: number,               // الكمية المباعة
  price: number,             // سعر البيع للوحدة
  total: number,             // الإجمالي
  costAtSale: number,        // تكلفة الوحدة وقت البيع
  createdAt: string
}
```

## API Reference

### window.CostsV2

#### Methods

##### `init()`
تهيئة النظام وتحميل البيانات
```javascript
window.CostsV2.init();
```

##### `navTo(viewId)`
التنقل بين الـ views
```javascript
window.CostsV2.navTo('dashboard');  // الرئيسية
window.CostsV2.navTo('prices');     // شبكة الأسعار
window.CostsV2.navTo('recipes');    // الوصفات
window.CostsV2.navTo('batches');    // التشغيلات
window.CostsV2.navTo('reports');    // التقارير
```

##### `openModal(modalId)` / `closeModal(modalId)`
فتح/إغلاق النوافذ المنبثقة
```javascript
window.CostsV2.openModal('costsv2-modal-ingredient');
window.CostsV2.closeModal('costsv2-modal-ingredient');
```

##### `openRecipeModal()`
فتح نافذة إنشاء وصفة جديدة

##### `addIngredientRow()`
إضافة صف مكون في الوصفة

##### `calcRecipeTotal()`
حساب التكلفة الإجمالية للوصفة

##### `openPriceUpdate(id, name, cost)`
فتح نافذة تعديل سعر خامة

##### `openCloseBatchModal(id, estCost)`
فتح نافذة إغلاق تشغيلة

##### `viewBatchDetails(id)`
عرض تفاصيل تشغيلة

##### `seedSampleData()`
تحميل بيانات تجريبية

## Subscription Management

### القاعدة الذهبية
**كل** `onSnapshot` يجب أن يُلف بـ `window.storeSubscription`

### مثال صحيح ✅
```javascript
function loadIngredients() {
    const db = getDb();
    if(!db) return;
    
    const unsub = db.collection(COLL_ING).onSnapshot(snap => {
        // معالجة البيانات...
    });
    
    // تخزين الاشتراك لإلغائه لاحقاً
    window.storeSubscription('costsv2-ingredients', unsub);
}
```

### مثال خاطئ ❌
```javascript
function loadIngredients() {
    const db = getDb();
    db.collection(COLL_ING).onSnapshot(snap => {
        // ❌ لم يتم تخزين unsubscribe
    });
}
```

### Subscription Keys
- `costsv2-ingredients` - قائمة الخامات
- `costsv2-recipes` - قائمة الوصفات
- `costsv2-batches` - قائمة التشغيلات
- `costsv2-batch-details` - تفاصيل تشغيلة محددة
- `costsv2-batch-sales` - مبيعات تشغيلة
- `costsv2-dashboard-profit` - إجمالي الأرباح في Dashboard
- `costsv2-reports` - تقرير التشغيلات المكتملة

### Cleanup
عند مغادرة الصفحة، يتم تلقائياً:
```javascript
window.unsubscribeAll(); // إلغاء جميع الاشتراكات
```

## Access Control

### فحص الصلاحيات
```javascript
// في js/main.js
if (target === 'costs-v2') {
    const role = getUserRole();
    if (role !== 'admin') {
        alert('هذه الصفحة متاحة للمسؤولين فقط');
        return;
    }
}
```

### إخفاء الزر لغير المسؤولين
```javascript
// في js/inline-scripts.js
// ROLE_PAGE_ALLOW لا يحتوي على costs-v2 إلا للـ admin
const ROLE_PAGE_ALLOW = {
    admin: 'ALL',  // يرى كل شيء بما فيها costs-v2
    rep: new Set(['dashboard', 'sales', ...]),  // لا يرى costs-v2
    // ...
};
```

## Styling

### CSS Classes

#### Navigation Links
```css
.costsv2-nav-link.active {
    background-color: #2563eb;
    color: white;
    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.costsv2-nav-link.inactive {
    color: #cbd5e1;
}
```

#### Glass Card
```css
.glass-card {
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
}
```

## Workflow Examples

### سيناريو كامل: من الخامة للربح

#### 1. إضافة خامات
```javascript
// المستخدم يضيف خامات من UI
// النظام يحفظ في Firebase:
await db.collection(COLL_ING).add({
    name: 'لبن خام',
    unit: 'كجم',
    cost: 20,
    updatedAt: new Date().toISOString()
});
```

#### 2. إنشاء وصفة
```javascript
// المستخدم يصمم وصفة جبنة قريش:
// - 100 كجم لبن خام (2000 ج.م)
// - 2 لتر منفحة (1000 ج.م)
// - 1 كجم ملح (5 ج.م)
// - مصاريف تشغيل: 500 ج.م
// = إجمالي: 3505 ج.م
const recipeData = {
    name: 'جبنة قريش',
    unit: 'كجم',
    ingredients: [
        { id: 'ing1', qty: 100 },
        { id: 'ing2', qty: 2 },
        { id: 'ing3', qty: 1 }
    ],
    overhead: 500,
    stdPrice: 80,  // سعر البيع المستهدف
    estimatedCost: 3505
};

// عند الحفظ، يتم إنشاء تشغيلة تلقائياً
const batchData = {
    batchNumber: 1234,
    recipeId: docRef.id,
    recipeName: 'جبنة قريش',
    status: 'active',
    estTotalCost: 3505
};
```

#### 3. إغلاق التشغيلة
```javascript
// بعد الإنتاج، المستخدم يسجل:
// - التكلفة الفعلية: 3600 ج.م
// - الكمية المنتجة: 50 كجم
// = تكلفة الوحدة: 72 ج.م/كجم

await db.collection(COLL_BATCHES).doc(id).update({
    status: 'closed',
    totalCost: 3600,
    finalQty: 50,
    unitCost: 72,
    soldQty: 0,
    totalRev: 0,
    netProfit: -3600  // خسارة مبدئية
});
```

#### 4. تسجيل مبيعات
```javascript
// بيع 30 كجم بسعر 80 ج.م
const saleData = {
    batchId: id,
    customer: 'محل الألبان',
    qty: 30,
    price: 80,
    total: 2400,
    costAtSale: 72
};

// تحديث التشغيلة:
// soldQty = 30
// totalRev = 2400
// netProfit = 2400 - (30 × 72) = 240 ج.م ربح
```

## Performance Tips

### 1. Lazy Loading
```javascript
// تهيئة النظام فقط عند الفتح لأول مرة
if (!window.__costsv2_initialized) {
    window.__costsv2_initialized = true;
    window.CostsV2.init();
}
```

### 2. Debouncing
```javascript
// عند حساب التكلفة أثناء الكتابة
let calcTimeout;
function calcRecipeTotal() {
    clearTimeout(calcTimeout);
    calcTimeout = setTimeout(() => {
        // الحساب الفعلي...
    }, 300);
}
```

### 3. Batch Operations
```javascript
// استخدام batch للعمليات المتعددة
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

## Troubleshooting

### المشكلة: الأيقونات لا تظهر
**الحل**: تأكد من تحميل Lucide
```javascript
if (window.lucide) {
    window.lucide.createIcons();
}
```

### المشكلة: البيانات لا تُحفظ
**الحل**: تحقق من:
1. Firebase initialized: `window.db` موجود
2. المستخدم مسجل دخول
3. Firestore rules تسمح بالكتابة

### المشكلة: الصفحة لا تظهر
**الحل**: تحقق من:
1. الدور = admin: `getUserRole() === 'admin'`
2. الزر موجود في HTML
3. `window.CostsV2` محمّل

## Testing Checklist

- [ ] تسجيل دخول كـ Admin
- [ ] رؤية زر "تكاليف2"
- [ ] فتح الصفحة بنجاح
- [ ] إضافة خامة جديدة
- [ ] تعديل سعر خامة موجودة
- [ ] إنشاء وصفة جديدة
- [ ] التحقق من حساب التكلفة التلقائي
- [ ] التحقق من إنشاء تشغيلة تلقائياً
- [ ] إغلاق تشغيلة
- [ ] تسجيل بيع
- [ ] التحقق من حساب الربح
- [ ] عرض التقارير
- [ ] تحميل بيانات تجريبية
- [ ] تسجيل خروج ودخول كـ user
- [ ] التأكد من عدم ظهور الزر

---

**أي أسئلة؟** راجع [COSTS_V2_INTEGRATION_SUMMARY.md](COSTS_V2_INTEGRATION_SUMMARY.md)
