// ============================================
// Quick Start Guide - استخدام سريع لـ Costs V2
// ============================================

// 1️⃣ التهيئة تتم تلقائياً عند دخول الصفحة
// (يتم استدعاء window.CostsV2.init() من main.js)

// 2️⃣ تبديل المناظر (من أي مكان في الكود)
window.CostsV2.switchCostsView('dashboard');  // الرئيسية
window.CostsV2.switchCostsView('prices');     // شبكة الأسعار
window.CostsV2.switchCostsView('recipes');    // الوصفات
window.CostsV2.switchCostsView('batches');    // التشغيلات
window.CostsV2.switchCostsView('reports');    // التقارير

// 3️⃣ فتح/إغلاق الـ Modals
window.CostsV2.openAddRecipeModal();          // فتح modal الوصفة
window.CostsV2.closeModV2('v2-modal-recipe'); // إغلاق أي modal

// 4️⃣ عمليات الوصفات
// (يتم من خلال الـ UI عادة، لكن يمكن الاستدعاء)
window.CostsV2.addIngredientRow();      // إضافة صف مكون جديد
window.CostsV2.calcRecipeCost();        // حساب تكلفة الوصفة
window.CostsV2.editRecipe('recipe-id'); // تحرير وصفة

// 5️⃣ عمليات التشغيلات
window.CostsV2.openCloseBatchModal('batch-id'); // فتح modal إغلاق

// ============================================
// مثال عملي: تطوير إضافة جديدة
// ============================================

// 📌 لو أردت إضافة زر جديد يفعل شيء ما:

// Step 1: أضف الـ HTML في index.html (داخل page-costs-v2)
/* 
<button onclick="window.customAction()" class="v2-custom-btn">
  إجراء مخصص
</button>
*/

// Step 2: أضف الدالة في costs-v2-logic.js
/*
function myCustomAction() {
    const db = getDb();
    if(!db) return;
    
    // اكتب منطقك هنا
    console.log('Custom action executed');
}

// أضفها للـ exports
window.CostsV2.customAction = myCustomAction;
*/

// Step 3: استدعها من أي مكان
// window.CostsV2.customAction();

// ============================================
// مثال: قراءة البيانات من النظام
// ============================================

// الوصول للخريطة الداخلية للخامات
console.log('الخامات المتاحة:', window.ingredientsMap);

// الوصول للوصفات
console.log('جميع الوصفات:', window.allRecipes);

// الوصول للتشغيلات
console.log('جميع التشغيلات:', window.allBatches);

// ============================================
// مثال: كيفية إضافة وصفة برمجياً
// ============================================

/*
async function addRecipeProgrammatically() {
    const db = window.db;
    if (!db) return;
    
    // بيانات الوصفة
    const recipeData = {
        name: "جبنة قريش",
        unit: "كيس",
        ingredients: [
            { id: "product-1", qty: 5 },   // 5 لتر حليب
            { id: "product-2", qty: 0.5 }  // 0.5 كجم ملح
        ],
        overhead: 50,        // مصاريف التشغيل
        stdPrice: 80,        // سعر البيع
        estimatedCost: 127.5,// التكلفة المحسوبة
        createdAt: new Date().toISOString()
    };
    
    // حفظ في Firestore
    const COLL_RECIPES = 'artifacts/dairy-app-1/public/data/recipes';
    await db.collection(COLL_RECIPES).add(recipeData);
    
    console.log('✅ تم حفظ الوصفة');
    
    // تحديث الـ UI
    window.CostsV2.loadRecipes();
}

// الاستدعاء
addRecipeProgrammatically();
*/

// ============================================
// مثال: حساب أرباح يدويه
// ============================================

/*
function calculateProfit(batch) {
    // batch = { unitCost, totalRevenue, soldQty }
    const totalCost = batch.unitCost * batch.soldQty;
    const profit = batch.totalRevenue - totalCost;
    const margin = (profit / batch.totalRevenue) * 100;
    
    return {
        cost: totalCost,
        revenue: batch.totalRevenue,
        profit: profit,
        margin: margin.toFixed(1) + '%'
    };
}

// مثال الاستخدام
const result = calculateProfit({
    unitCost: 12.75,
    totalRevenue: 800,
    soldQty: 10
});

console.log(result);
// { cost: 127.5, revenue: 800, profit: 672.5, margin: "84.1%" }
*/

// ============================================
// مثال: إضافة Listener مخصص
// ============================================

/*
function setupCustomListener() {
    const db = window.db;
    if (!db) return;
    
    const COLL_RECIPES = 'artifacts/dairy-app-1/public/data/recipes';
    
    const unsub = db.collection(COLL_RECIPES)
        .where('stdPrice', '>', 100)  // فقط الوصفات الغالية
        .onSnapshot(snap => {
            snap.docs.forEach(doc => {
                const recipe = doc.data();
                console.log(`وصفة غالية: ${recipe.name} - ${recipe.stdPrice}`);
            });
        });
    
    // تسجيل الـ listener لـ cleanup لاحقاً
    window.storeSubscription('my-custom-listener', unsub);
}

setupCustomListener();
*/

// ============================================
// قائمة الـ Helper Functions
// ============================================

// من costs-v2-logic.js:
// - getDb()              : الحصول على اتصال Firebase
// - safe(id, val)        : تعيين نص آمن
// - openModV2(id)        : فتح modal
// - closeModV2(id)       : إغلاق modal
// - loadPrices()         : تحميل الأسعار
// - loadRecipes()        : تحميل الوصفات
// - loadBatches()        : تحميل التشغيلات
// - loadReports()        : تحميل التقارير
// - loadDashboard()      : تحميل الرئيسية
// - switchCostsView(v)   : تبديل المناظر
// - init()               : التهيئة

// ============================================
// نصائح مهمة ⚠️
// ============================================

// 1. لا تحذف من window.CostsV2 - اترك الدوال القديمة
// 2. استخدم v2- للـ IDs الجديدة دائماً
// 3. لا تنسى الـ cleanup عند الـ listeners (window.storeSubscription)
// 4. اختبر على console قبل الإطلاق
// 5. استخدم try-catch عند عمليات Firebase

// ============================================
// الدعم الفني السريع
// ============================================

// افتح console في المتصفح (F12) وجرب:

// عرض الحالة الحالية
console.log({
    db: window.db ? '✅ متصل' : '❌ غير متصل',
    costsv2: window.CostsV2 ? '✅ محمل' : '❌ لم يُحمّل',
    currentUser: window.currentUser ? window.currentUser.email : '❌ لم يدخل',
    ingredients: Object.keys(window.ingredientsMap || {}).length,
    recipes: Object.keys(window.allRecipes || {}).length,
    batches: Object.keys(window.allBatches || {}).length
});

// اختبر التبديل بين المناظر
// window.CostsV2.switchCostsView('prices');

// اختبر الـ modal
// window.CostsV2.openAddRecipeModal();

// ============================================
// آخر تحديث: 14 يناير 2026
// ============================================
