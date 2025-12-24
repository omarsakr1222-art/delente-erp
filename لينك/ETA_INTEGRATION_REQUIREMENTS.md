# متطلبات تكامل منظومة الفواتير الإلكترونية (ETA) - خطة كاملة

## 📋 الوضع الحالي

### ✅ ما تم إنجازه:
1. **3 دوال Netlify Functions جاهزة:**
   - `eta-einvoice-submit.js` - لإرسال الفواتير إلى ETA
   - `eta-einvoice-status.js` - للاستعلام عن حالة الفاتورة
   - `eta-upload.js` - لتحميل/توقيع الفاتورة

2. **ملف `.env.example` موجود** بجميع المتغيرات المطلوبة

### ❌ ما لم ينجز بعد:

---

## 🔐 الخطوة 1: إعداد بيانات اعتماد ETA

### المتغيرات البيئية المطلوبة في `.env`:

```dotenv
# منظومة الفواتير الإلكترونية (ETA)
ETA_BASE_URL=https://api.invoicing.eta.gov.eg
ETA_CLIENT_ID=****
ETA_CLIENT_SECRET=****
ETA_TAX_ID=****
ETA_ACTIVITY_CODE=****
ETA_CERT_PASSWORD=****
ETA_CERT_BASE64=****
ADMIN_API_SECRET=****
```

### البيانات المطلوبة منك:
| المتغير | المصدر | الملاحظات |
|--------|-------|---------|
| `ETA_CLIENT_ID` | بيانات اعتماد ETA | من نموذج التسجيل بمصر |
| `ETA_CLIENT_SECRET` | بيانات اعتماد ETA | سري - لا تشاركه |
| `ETA_TAX_ID` | بيانات الشركة | الرقم الضريبي |
| `ETA_ACTIVITY_CODE` | بيانات الشركة | من نموذج التسجيل |
| `ETA_CERT_PASSWORD` | الشهادة الرقمية | كلمة مرور ملف .pfx |
| `ETA_CERT_BASE64` | الشهادة الرقمية | محتوى ملف .pfx بصيغة Base64 |
| `ADMIN_API_SECRET` | أمان التطبيق | كلمة سر عشوائية قوية |

### خطوات الحصول على البيانات:

**1. من موقع ETA (أولاً سجل حسابك):**
   - روح إلى: https://invoicing.eta.gov.eg/
   - سجل بيانات الشركة (الرقم الضريبي والنشاط)
   - احصل على Client ID و Client Secret

**2. من الشهادة الرقمية:**
   - يجب أن تملك ملف `.pfx` (Pkcs12 certificate)
   - لتحويله إلى Base64:
     ```bash
     # في Windows PowerShell:
     $cert = Get-Content "C:\path\to\cert.pfx" -Encoding Byte
     $base64 = [Convert]::ToBase64String($cert)
     $base64 | Set-Content "C:\cert-base64.txt"
     ```
     أو
     ```bash
     # في Linux/Mac:
     openssl base64 -in cert.pfx -out cert-base64.txt
     ```

---

## 🎯 الخطوة 2: ملء ملف `.env` في المشروع

قم بتحديث `f:\لينك\.env` بقيم حقيقية:

```dotenv
ETA_BASE_URL=https://api.invoicing.eta.gov.eg
ETA_CLIENT_ID=YOUR_CLIENT_ID_HERE
ETA_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
ETA_TAX_ID=YOUR_TAX_ID_HERE
ETA_ACTIVITY_CODE=YOUR_ACTIVITY_CODE_HERE
ETA_CERT_PASSWORD=YOUR_CERT_PASSWORD_HERE
ETA_CERT_BASE64=VERY_LONG_BASE64_STRING_HERE...
ADMIN_API_SECRET=YOUR_STRONG_SECRET_HERE
```

---

## 💻 الخطوة 3: إضافة زر "إرسال إلى ETA" في الواجهة

يجب إضافة:

### أ) زر في صفحة تفاصيل الفاتورة:
```html
<!-- في صفحة عرض الفاتورة -->
<button id="submit-to-eta-btn" class="bg-blue-600 text-white px-4 py-2 rounded">
  إرسال إلى منظومة الفواتير
</button>
```

### ب) دالة JavaScript لإرسال الفاتورة:
```javascript
async function submitInvoiceToEta(saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;
    
    try {
        const response = await fetch('/.netlify/functions/eta-einvoice-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': localStorage.getItem('adminSecret') // أو من الإعدادات
            },
            body: JSON.stringify({ sale })
        });
        
        const result = await response.json();
        if (response.ok) {
            // حفظ UUID الإرسال
            sale.etaSubmissionUuid = result.etaResponse?.submissionUUID;
            sale.etaStatus = 'submitted';
            saveState();
            alert('تم إرسال الفاتورة إلى المنظومة بنجاح');
        } else {
            alert('فشل الإرسال: ' + result.error);
        }
    } catch (err) {
        alert('خطأ: ' + err.message);
    }
}
```

---

## 🔍 الخطوة 4: التحقق من حالة الفاتورة

### دالة للاستعلام عن الحالة:
```javascript
async function checkEtaInvoiceStatus(submissionUuid) {
    try {
        const response = await fetch('/.netlify/functions/eta-einvoice-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': localStorage.getItem('adminSecret')
            },
            body: JSON.stringify({ submissionUuid })
        });
        
        const result = await response.json();
        if (response.ok) {
            return result.status;
        } else {
            console.error('Status check failed:', result.error);
        }
    } catch (err) {
        console.error('Error checking status:', err);
    }
}
```

---

## 📱 الخطوة 5: إضافة حقول في قاعدة البيانات

يجب إضافة هذه الحقول لكل فاتورة (sale):

```javascript
{
    id: "...",
    // الحقول الموجودة...
    
    // حقول ETA الجديدة:
    etaSubmissionUuid: "...", // UUID الإرسالة
    etaDocumentUuid: "...",   // UUID المستند
    etaStatus: "pending|accepted|rejected", // حالة الفاتورة
    etaSubmittedAt: "2025-11-28T...", // وقت الإرسال
    etaResponse: { ... } // الرد الكامل من ETA
}
```

---

## 🛠️ الخطوة 6: الميزات الإضافية المطلوبة

### 1. عرض حالة ETA في لوحة المعلومات:
- إضافة عمود في جدول المبيعات يعرض حالة ETA
- ألوان مختلفة: أحمر (مرفوضة)، أخضر (مقبولة)، أزرق (معلقة)

### 2. إعادة محاولة الإرسال التلقائية:
- إذا فشل الإرسال، أعد المحاولة بعد 5 دقائق
- حد أقصى 3 محاولات

### 3. حفظ البيانات الحساسة بشكل آمن:
- لا تحفظ `ETA_CLIENT_SECRET` في المتصفح
- استخدم متغيرات البيئة في Netlify فقط

---

## 🔐 معلومات الأمان المهمة

### ✋ لا تفعل:
- ❌ لا تشاركك `ETA_CLIENT_SECRET` أو `ETA_CERT_PASSWORD` مع أحد
- ❌ لا تضع هذه البيانات في كود الواجهة الأمامية
- ❌ لا تضع `.env` في نظام التحكم بالإصدارات (Git)

### ✅ افعل:
- ✅ ضع المتغيرات البيئية في Netlify dashboard فقط
- ✅ استخدم `ADMIN_API_SECRET` لحماية Netlify functions
- ✅ اختبر في sandbox أولاً (preprod.invoicing.eta.gov.eg)

---

## 📝 خطوات التطبيق

1. ✅ **جهز بيانات ETA** (Client ID, Secret, Tax ID, etc.)
2. ⏳ **أملأ ملف `.env` بالبيانات الحقيقية**
3. ⏳ **رفع متغيرات البيئة إلى Netlify** (من Netlify dashboard)
4. ⏳ **أضيف واجهة المستخدم** (أزرار، حقول، عرض الحالة)
5. ⏳ **اختبر في البيئة الرملية (Sandbox)**
6. ⏳ **انتقل إلى الإنتاج**

---

## 🆘 أسئلة شائعة

**س: أين أحصل على Client ID و Secret؟**
ج: من موقع منظومة الفواتير الإلكترونية بعد التسجيل

**س: ما الفرق بين preprod و production؟**
ج: 
- `preprod`: للاختبار فقط (Sandbox)
- `production`: للفواتير الحقيقية

**س: هل يمكنني الاختبار بدون شهادة رقمية؟**
ج: في البيئة الرملية قد تكون اختيارية، لكن في الإنتاج إلزامية

**س: كيف أحول ملف .pfx إلى Base64؟**
ج: انظر الخطوة 1 أعلاه

---

## 📋 قائمة التحقق النهائية

- [ ] لديك بيانات ETA كاملة
- [ ] ملء ملف `.env`
- [ ] تم رفع المتغيرات إلى Netlify
- [ ] تم إضافة أزرار الإرسال في الواجهة
- [ ] تم اختبار الاتصال بـ Sandbox
- [ ] تم عرض حالة الفواتير
- [ ] جاهز للانتقال إلى الإنتاج
