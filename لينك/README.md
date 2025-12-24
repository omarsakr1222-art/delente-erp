# توحيد التطبيق مع Firebase (مزامنة لحظية)

## المتطلبات
1. مشروع Firebase مفعل به Authentication و Firestore و (اختياري) Hosting.
2. تفعيل مزود البريد/كلمة المرور، وتعطيل Anonymous ما لم يُطلب.
3. نسخ إعدادات firebaseConfig لاحقاً إلى `index.html` (أو ملف منفصل).

## الهيكل الحالي
- `index.html`: يحتوي منطق الواجهة والتوثيق.
- `shared_state.js`: يحضّر كائن الأدوار والحالة المشتركة.

## المجموعات المقترحة في Firestore
- users: { uid, email, name, role, createdAt, lastLoginAt }
- sales: { id, invoiceNumber, customerId, items:[{productId, qty, price}], total, net, date, repId, taxStatus }
- customers: { id, name, phone, taxNumber, balance }
- products: { id, name, sku, price, cost, active }

## المزامنة اللحظية
يتم تشغيل مستمعات `onSnapshot` بعد نجاح `initFirebase`:
- users -> تحديث أدوار المستخدمين وإعادة عرض اسم المستخدم بالدور.
- sales / customers / products -> ملء `state` ثم استدعاء دوال العرض (إن وُجدت).

## إضافة المستخدمين والأدوار
- الدور يحدد داخل وثيقة المستخدم (`role`).
- لتغيير الدور: عدّل حقل `role` في `users/{uid}` (مثلاً إلى admin أو rep أو viewer).

## نشر على Firebase Hosting (اختياري)
```bash
firebase login
firebase init hosting
firebase deploy
```

## الخطوات التالية
1. تزويدي بـ firebaseConfig النهائي.
2. إضافة دوال CRUD حسب الاحتياج.
3. تحسين قواعد Firestore للأمان.

## تمكين Claude (Anthropic) لكل العملاء عبر Netlify
أضفنا دالة سيرفر ليسية (Netlify Function) كبروكسي آمن لمفتاح Anthropic:

- الملف: `netlify/functions/claude-proxy.js`
- إعادة التوجيه: `netlify.toml` يوجه `/api/claude` إلى الدالة
- على الواجهة: دالة مساعدة `window.ClaudeAPI` داخل `index.html`

### الإعداد (مرة واحدة)
1) ثبّت Netlify CLI (يتطلب Node.js):
```powershell
npm install -g netlify-cli
```

2) سجّل الدخول واربط الموقع:
```powershell
netlify login
netlify init
```

3) أضف متغير البيئة (لا تضع المفتاح في الكلينت):
```powershell
netlify env:set ANTHROPIC_API_KEY "sk-ant-xxxxx"
```

4) جرّب محلياً (سيدير مسار الدوال):
```powershell
netlify dev
```

5) انشر:
```powershell
netlify deploy --prod
```

بعد النشر يمكنك من المتصفح استدعاء:
```js
await window.ClaudeAPI.simple('اكتب مرحباً');
// أو:
await window.ClaudeAPI.chat({
	messages: [{ role: 'user', content: 'اقترح أفكاراً للتسويق' }],
	max_tokens: 400
});
```

ملاحظة: إن رغبت في البث (streaming) ستحتاج لاحقاً لتبديل الدالة للسيرفر لإرجاع SSE وتمييز ذلك في العميل. النسخة الحالية ترجع استجابة مكتملة فقط.

## نظام مراجعة الفواتير (Sales Review)
يوضح هذا القسم آلية مراجعة الفواتير واعتمادها مباشرة من صفحة المبيعات:

- إنشاء الفاتورة:
	- الفواتير التي ينشئها دور `sales` أو `rep` تُحفظ بحالة `reviewStatus = "pending"`.
	- الفواتير التي ينشئها أدوار أخرى (مثل `admin`) تُسجَّل عادة بحالة `reviewed`.

- تمييز الفواتير قيد المراجعة:
	- تظهر بحد أصفر حول البطاقة وبادج نصه "قيد المراجعة".
	- يمكنك تصفية القائمة عبر قائمة `#review-status-filter` لاختيار: الكل، قيد المراجعة فقط، أو المعتمدة فقط.

- الاعتماد من بطاقة الفاتورة:
	- للمشرفين (`admin`) والمراجعين (`reviewer`) يظهر زر "اعتماد" على البطاقة.
	- الضغط عليه يحدّث الفاتورة إلى `reviewStatus = "reviewed"` فوراً.

- الاعتماد من داخل المودال:
	- افتح الفاتورة بالنقر على زر "تعديل" في البطاقة لعرض تفاصيلها.
	- إذا كانت الفاتورة `pending` وكان دورك `admin` أو `reviewer` سيظهر داخل المودال زر "اعتماد الفاتورة" لاعتمادها من هناك أيضاً.

- ملاحظات هامة حول الصلاحيات:
	- يظهر شارة "وضع المراجعة" أعلى الواجهة لمن لديهم وضع قراءة فقط.
	- إذا ظهر لك تنبيه "وضع المراجعة (قراءة فقط)", فلن تُنفّذ عمليات الكتابة (ومنها الاعتماد) بسبب الحماية؛ استخدم حساب مشرف لاعتماد الفواتير.

اختصارات العناصر في الواجهة:
- فلتر المراجعة: العنصر `select#review-status-filter`.
- زر الاعتماد على البطاقة: زر صنفه `review-sale-btn`.
- زر الاعتماد داخل المودال: زر يُحقن بديناميكياً بصنف `modal-review-approve-btn` عند فتح فاتورة `pending`.

## قواعد Firestore المقترحة (محدثة)

لضمان أن لوحة إدارة المستخدمين تعمل دون أخطاء صلاحيات، أضِف القواعد التالية (يمكنك دمجها أو تعديلها حسب حاجتك). نفترض وجود مجموعة `roles/{uid}` لتحديد الدور، بالإضافة إلى التعامل مع `users/{uid}` كمصدر بيانات المستخدم في الواجهة.

انسخ القواعد التالية كاملة إلى صفحة قواعد Firestore ثم انقر Publish:

```
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		function role() {
			return get(/databases/$(database)/documents/roles/$(request.auth.uid)).data.role;
		}
		function signedIn() { return request.auth != null; }
		function isAdmin() { return role() == 'admin'; }
		function isRep() { return role() == 'rep'; }
		function isReviewer() { return role() == 'reviewer' || role() == 'viewer'; }

		// USERS: قراءة لكل مسجّل؛ إنشاء/تعديل ذاتي؛ تغيير الدور للمشرف فقط
		match /users/{uid} {
			allow read: if signedIn();
			allow create: if signedIn() && request.auth.uid == uid; // إنشاء وثيقة المستخدم لأول مرة
			// تحديث: إمّا مشرف، أو المالك بدون تغيير role
			allow update: if signedIn() && (
				isAdmin() || (
					request.auth.uid == uid &&
					!(request.resource.data.keys().hasAny(['role'])) &&
					request.resource.data.role == resource.data.role
				)
			);
		}

		// ROLES: يمكن للمشرف فقط تعديل أدوار الآخرين؛ المالك يقرأ دوره
		match /roles/{uid} {
			allow read: if signedIn() && (isAdmin() || request.auth.uid == uid);
			allow write: if signedIn() && (isAdmin() || request.auth.uid == uid);
		}

		// PRESENCE: كتابة ذاتية فقط؛ قراءة عامة للمسجلين
		match /presence/{uid} {
			allow read: if signedIn();
			allow write: if signedIn() && request.auth.uid == uid;
		}

		// CUSTOMERS: نفس منطق الواجهة (المشرف يدير الجميع، المندوب عملاءه فقط)
		match /customers/{cid} {
			allow get, list: if signedIn() && (
				isAdmin() || (
					isRep() && (
						resource.data.assignedRepId == request.auth.uid ||
						!(resource.data.keys().hasAny(['assignedRepId'])) ||
						resource.data.assignedRepId == ''
					)
				)
			);
			allow create: if signedIn() && (
				isAdmin() || (
					isRep() && (
						!(request.resource.data.keys().hasAny(['assignedRepId'])) ||
						request.resource.data.assignedRepId == '' ||
						request.resource.data.assignedRepId == request.auth.uid
					)
				)
			);
			allow update, delete: if signedIn() && (
				isAdmin() || (isRep() && resource.data.assignedRepId == request.auth.uid)
			);
		}

		// SALES: القراءة للمسجلين؛ الكتابة للمشرف؛ أو إنشاء فقط للمندوب
		match /sales/{id} {
			allow read: if signedIn();
			allow create: if signedIn() && (isAdmin() || isRep());
			allow update, delete: if signedIn() && isAdmin();
		}

		// المنتجات/القوائم/الإعدادات
		match /products/{id} {
			allow read: if signedIn();
			allow write: if signedIn() && isAdmin();
		}
		match /priceLists/{id} {
			allow read: if signedIn();
			allow write: if signedIn() && isAdmin();
		}
		match /settings/{doc} {
			allow read: if signedIn();
			allow write: if signedIn() && isAdmin();
		}

		// مستند عام (اختياري): إذا كنت تحتاجه — كتابة للمشرف فقط
		match /shared/public_app_state {
			allow read: if signedIn();
			allow write: if signedIn() && isAdmin();
		}
	}
}
```

ملاحظات مهمة:
- يجب إنشاء مستند لكل مستخدم تحت `roles/{uid}` يحتوي حقل `role` قبل أن تُطبَّق القواعد بشكل صحيح.
- الواجهة الآن توقفت عن الكتابة إلى `shared/public_app_state` عند تغيير الدور.
- إن رغبت في تقليل قراءات `users` لغير المشرفين، يمكن لاحقاً جعل الاستماع لقائمة المستخدمين حكراً على المشرفين فقط.
