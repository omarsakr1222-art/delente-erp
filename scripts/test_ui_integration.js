// UI Integration Test - Login/Logout Scenarios
// Simulates DOM and user interactions to verify hybrid service integration

// Setup globals
global.window = {};
global.document = {};
const storageMap = new Map();
const localStorageMock = {
  getItem(k){ return storageMap.get(k) || null; },
  setItem(k,v){ storageMap.set(k, String(v)); },
  removeItem(k){ storageMap.delete(k); }
};
global.localStorage = localStorageMock;
window.localStorage = localStorageMock;

// Mock ErrorHandler
global.ErrorHandler = {
  handle(e, where, show){ console.log(`[ErrorHandler] ${where}: ${e && e.message}`); }
};
window.ErrorHandler = global.ErrorHandler;

// Mock alert and confirm
const alerts = [];
const confirms = [];
global.alert = (msg) => { alerts.push(msg); console.log('[ALERT]', msg); };
global.confirm = (msg) => { confirms.push(msg); console.log('[CONFIRM]', msg); return true; };
window.alert = global.alert;
window.confirm = global.confirm;

// Mock DOM elements and events
const listeners = {};
const elements = new Map();

function createElement(id, type = 'div') {
  const el = {
    id,
    type,
    value: '',
    checked: false,
    disabled: false,
    textContent: '',
    _listeners: {},
    addEventListener(event, handler){ this._listeners[event] = this._listeners[event] || []; this._listeners[event].push(handler); },
    dispatchEvent(ev){ (this._listeners[ev.type] || []).forEach(h => h(ev)); }
  };
  elements.set(id, el);
  return el;
}

document.getElementById = (id) => elements.get(id) || null;
document.addEventListener = (name, cb) => { (listeners[name] = listeners[name] || []).push(cb); };
document.dispatchEvent = (ev) => { (listeners[ev.type] || []).forEach(cb => cb(ev)); };
document.createElement = (tag) => ({ tag, appendChild(){}, removeChild(){}, click(){}, style:{}, select(){}, value:'' });
document.body = { appendChild(){}, removeChild(){} };

// Create DOM elements
const loginForm = createElement('login-form', 'form');
const loginEmail = createElement('login-email', 'input');
const loginPassword = createElement('login-password', 'input');
const loginRemember = createElement('login-remember', 'checkbox');
const logoutBtn = createElement('logout-btn', 'button');

// Mock UIController
global.UIController = {
  showLoginPage(){ console.log('[UI] Showing login page'); },
  showSalesPage(){ console.log('[UI] Showing sales page'); }
};
window.UIController = global.UIController;

// Mock AuthSystem (legacy fallback)
global.AuthSystem = {
  async login(email, password){
    if (password === 'wrong') return { success: false, message: 'بيانات الدخول غير صحيحة' };
    return { success: true, user: { email, uid: 'u1' } };
  },
  async logout(){ return true; }
};
window.AuthSystem = global.AuthSystem;
// Mock AuthService (for hybrid mode)
global.AuthService = {
  async signIn(email, password){
    if (password === 'wrong') throw new Error('بيانات الدخول غير صحيحة');
    return { uid: 'u1', email, via: 'AuthService' };
  },
  async signOut(){ return true; },
  getCurrentUser(){ return null; }
};
window.AuthService = global.AuthService;


// Load firebase-init.js to get loginUsingServices and logoutUsingServices
require('../firebase-init.js');

// Verify helpers loaded
if (typeof window.loginUsingServices !== 'function') {
  console.error('FAIL: window.loginUsingServices not loaded');
  process.exit(1);
}

// Setup auth state events
const authEvents = { loginSuccess: 0, logoutSuccess: 0 };
document.addEventListener('auth:login-success', () => { authEvents.loginSuccess++; console.log('[EVENT] auth:login-success'); });
document.addEventListener('auth:logout-success', () => { authEvents.logoutSuccess++; console.log('[EVENT] auth:logout-success'); });

// Simulate login form handler (as in index.html line 4824)
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault = () => {};
  e.preventDefault();
  
  const email = loginEmail.value;
  const password = loginPassword.value;
  const remember = loginRemember.checked;
  
  const result = await (typeof window.loginUsingServices === 'function'
    ? window.loginUsingServices(email, password, { showAlertOnError: false })
    : AuthSystem.login(email, password));
  
  if (result.ok || result.success) {
    if (remember) localStorage.setItem('app_remember_email', email);
    console.log('[LOGIN HANDLER] Success, should navigate to sales');
  } else {
    alert('❌ خطأ: ' + (result.error || result.message));
  }
});

// Simulate logout button handler (as in index.html line 4922)
logoutBtn.addEventListener('click', async () => {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    await (typeof window.logoutUsingServices === 'function'
      ? window.logoutUsingServices({ showAlertOnError: false })
      : AuthSystem.logout());
    localStorage.removeItem('app_remember_email');
    UIController.showLoginPage();
  }
});

// Run tests
(async function runTests(){
  console.log('\n=== Starting UI Integration Tests ===\n');
  
  // Test 1: Wrong Password
  console.log('--- Test 1: Wrong Password Scenario ---');
  alerts.length = 0;
  loginEmail.value = 'test@example.com';
  loginPassword.value = 'wrong';
  loginRemember.checked = false;
  await loginForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  
  await new Promise(r => setTimeout(r, 100)); // wait for async
  
  const test1Pass = alerts.length === 1 && alerts[0].includes('خطأ');
  console.log(`Test 1 Result: ${test1Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Alert shown: ${alerts[0] || 'NONE'}`);
  
  // Test 2: Successful Login
  console.log('\n--- Test 2: Successful Login Scenario ---');
  alerts.length = 0;
  authEvents.loginSuccess = 0;
  loginEmail.value = 'user@example.com';
  loginPassword.value = 'correct123';
  loginRemember.checked = true;
  await loginForm.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  
  await new Promise(r => setTimeout(r, 100));
  
  const test2Pass = alerts.length === 0 && authEvents.loginSuccess === 1 && localStorage.getItem('app_remember_email') === 'user@example.com';
  console.log(`Test 2 Result: ${test2Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - No alert: ${alerts.length === 0 ? 'YES' : 'NO (got: ' + alerts.join(', ') + ')'}`);
  console.log(`  - Login event fired: ${authEvents.loginSuccess === 1 ? 'YES' : 'NO'}`);
  console.log(`  - Remember me saved: ${localStorage.getItem('app_remember_email') === 'user@example.com' ? 'YES' : 'NO'}`);
  
  // Test 3: Logout Flow
  console.log('\n--- Test 3: Logout Flow ---');
  confirms.length = 0;
  authEvents.logoutSuccess = 0;
  await logoutBtn.dispatchEvent({ type: 'click' });
  
  await new Promise(r => setTimeout(r, 100));
  
  const test3Pass = confirms.length === 1 && authEvents.logoutSuccess === 1 && !localStorage.getItem('app_remember_email');
  console.log(`Test 3 Result: ${test3Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`  - Confirm shown: ${confirms.length === 1 ? 'YES' : 'NO'}`);
  console.log(`  - Logout event fired: ${authEvents.logoutSuccess === 1 ? 'YES' : 'NO'}`);
  console.log(`  - Remember me cleared: ${!localStorage.getItem('app_remember_email') ? 'YES' : 'NO'}`);
  
  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Test 1 (Wrong Password Alert): ${test1Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Test 2 (Successful Login): ${test2Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log(`Test 3 (Logout Flow): ${test3Pass ? 'PASS ✅' : 'FAIL ❌'}`);
  
  const allPass = test1Pass && test2Pass && test3Pass;
  console.log(`\n🎯 Overall: ${allPass ? 'ALL TESTS PASS ✅' : 'SOME TESTS FAILED ❌'}`);
  
  process.exit(allPass ? 0 : 1);
})();
