# 🔧 Stock Cloud Persistence Fix

**التاريخ:** 25 ديسمبر 2025  
**المشكلة:** صفحة الاستوك كاملة لا تحفظ على السحابة  
**الحالة:** ✅ تم الحل

---

## 📋 تحليل المشكلة

### أسباب عدم الحفظ على السحابة:

1. **❌ استخدام `firebase.firestore.FieldValue.serverTimestamp()` مباشرة**
   - في `adjustStock()`: يحاول تعيين الطابع الزمني مباشرة
   - في `saveNewItem()`: نفس المشكلة
   - في `flushPendingInventoryUpdates()`: نفس المشكلة
   - **المشكلة:** قد يكون `undefined` إذا لم يتم تحميل Firebase بشكل كامل

2. **❌ عدم استدعاء الحفظ على السحابة بعد `adjustStock`**
   - عند تعديل الرصيد، يتم التحديث محلياً فقط
   - لا يتم استدعاء `saveLists()` أو `saveCostListsToFirebase()`
   - النتيجة: الحفظ المحلي فقط، لا سحابة

3. **❌ معرف المنتج الجديد غير مسجل**
   - عند استخدام `add()`، لا يتم تسجيل `id` المُرجع
   - النتيجة: لا يمكن تحديث العنصر لاحقاً

---

## ✅ الحل المطبق

### 1. استبدال `firebase.firestore.FieldValue.serverTimestamp()` بـ `serverTs()`

**في `adjustStock()` (سطر 25775):**
```javascript
// قبل
updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

// بعد
updatedAt: serverTs(),  // الدالة الآمنة مع fallback
```

**في `saveNewItem()` (سطر 25873-25879):**
```javascript
// قبل
createdAt: firebase.firestore.FieldValue.serverTimestamp(),
updatedAt: firebase.firestore.FieldValue.serverTimestamp()

// بعد
createdAt: serverTs(),
updatedAt: serverTs()
```

**في `flushPendingInventoryUpdates()` (سطر 25958):**
```javascript
// قبل
updatedAt: firebase.firestore.FieldValue.serverTimestamp()

// بعد
updatedAt: serverTs()
```

### 2. إضافة استدعاء الحفظ التلقائي بعد `adjustStock`

**في `adjustStock()` (سطر 25816-25820):**
```javascript
// Auto-save to cloud if available (with debounce)
if (this.currentTab === 'finished') {
    try { if (typeof window.debouncedFinishedSave === 'function') window.debouncedFinishedSave(); } catch(_){ }
} else {
    try { if (typeof window.saveLists === 'function') window.saveLists(); } catch(_){ }
}
```

**التفاصيل:**
- للمنتجات التامة: استدعاء `debouncedFinishedSave()` مع تأخير 1500ms
- للخامات والتغليف: استدعاء `saveLists()` مباشرة
- كلاهما يحفظ على السحابة عبر `saveCostListsToFirebase(true)`

### 3. تسجيل معرف المنتج الجديد

**في `saveNewItem()` (سطر 25882-25885):**
```javascript
// قبل
await db.collection('inventory_items').add(newItem);
console.log(`✅ New item added to Firestore: ${name}`);

// بعد
const docRef = await db.collection('inventory_items').add(newItem);
const newId = docRef.id;

// Update the item with its new ID
newItem.id = newId;
await docRef.update({ id: newId });

console.log(`✅ New item added to Firestore: ${name} (id: ${newId})`);
```

---

## 🔄 تسلسل العملية (Flow)

### عند تعديل رصيد:
```
المستخدم ينقر: adjustStock('add')
         ↓
التحديث في الذاكرة (window.costRaw/Pack/Finished)
         ↓
الحفظ في localStorage
         ↓
محاولة الحفظ على Firestore (إذا online)
         ↓
استدعاء saveLists() أو debouncedFinishedSave()
         ↓
يتم حفظ البيانات على السحابة عبر:
  - saveCostListsToFirebase() → settings/costLists (merge)
  - saveFinishedGridStateNow() → for finished products
  - saveCostListsPayload() → merge update
```

### عند إضافة منتج جديد:
```
المستخدم يملأ النموذج → saveNewItem()
         ↓
إنشاء وثيقة على Firestore (add)
         ↓
تسجيل المعرف المُرجع
         ↓
تحديث الوثيقة بـ id = docRef.id
         ↓
إضافة إلى window array
         ↓
حفظ في localStorage
         ↓
استدعاء saveLists() للحفظ على السحابة
```

---

## 🧪 اختبار الحل

### خطوات الاختبار:

1. **اختبار تعديل الرصيد - Raw Materials:**
   - افتح صفحة Stock Control
   - حدد التبويب "خامات"
   - انقر على أي صنف
   - اضغط على زر "إضافة" أو "صرف"
   - ✅ تحقق: البيانات محفوظة محلياً + السحابة

2. **اختبار تعديل الرصيد - Packaging:**
   - نفس الخطوات مع تبويب "التغليف"
   - ✅ تحقق: `debouncedFinishedSave()` تم استدعاؤها

3. **اختبار إضافة منتج:**
   - افتح نموذج "إضافة صنف جديد"
   - املأ البيانات
   - اضغط "إضافة"
   - ✅ تحقق: المعرف مسجل + Firestore محدثة

4. **اختبار المزامنة:
   - عدّل رصيد على جهاز
   - تحقق من جهاز آخر
   - ✅ تحقق: التحديثات تظهر من `onSnapshot()`

---

## 📊 الملفات المتغيرة

```
h:\delente-erp\index.html
- سطر 25775: firebase.firestore.FieldValue.serverTimestamp() → serverTs()
- سطر 25781: category setting
- سطر 25816-25820: إضافة استدعاء الحفظ التلقائي
- سطر 25873-25879: serverTs() في saveNewItem
- سطر 25882-25885: تسجيل المعرف الجديد
- سطر 25958: serverTs() في flush queue
```

---

## 🚀 التحسينات المستقبلية

1. **تفعيل onSnapshot للمزامنة الفعلية** ✅ (تم)
2. **إضافة retry logic مع exponential backoff** ✅ (موجود)
3. **تفعيل offline queue flushing تلقائياً** ✅ (موجود)
4. **عرض حالة المزامنة للمستخدم** ✅ (sync-status)

---

## 🎯 النتيجة

✅ جميع عمليات تعديل الاستوك **تحفظ على السحابة الآن**

- **تحديثات الرصيد:** مباشر على `inventory_items` collection
- **بيانات المنتجات:** في `settings/costLists` (للمزامنة)
- **بيانات المنتجات التامة:** في `daily_cost_lists` (للديناميكية)
- **المزامنة الفعلية:** عبر `onSnapshot()` (بدون حلقات)
