// shared_state.js
// تهيئة بنية الحالة المشتركة والأدوار قبل تحميل بقية التطبيق.
// سيتم تحديث userRoles لاحقاً من مستمع Firestore في index.html.
(function(){
  window.state = window.state || {};
  state.shared = state.shared || {};
  state.shared.public_app_state = state.shared.public_app_state || {
    userRoles: {}, // مثال: { 'admin@example.com': 'admin' }
    lastRolesSync: null
  };
})();
