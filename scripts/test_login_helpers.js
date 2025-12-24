// Test login/logout helpers in firebase-init.js

// Minimal globals
global.window = {};

// Simple document event system
const listeners = {};
global.document = {
  addEventListener(name, cb){ (listeners[name] = listeners[name] || []).push(cb); },
  dispatchEvent(ev){ const arr = listeners[ev.type] || []; arr.forEach(cb => cb(ev)); }
};

// ErrorHandler stub
global.ErrorHandler = { handle: (e, where, alertUser) => console.log('[EH]', where, e && e.message) };
window.ErrorHandler = global.ErrorHandler;

// Mock AuthService and legacy auth
let authChanged = 0;
window.auth = {
  async signInWithEmailAndPassword(email, pass){ return { user: { uid:'u1', email } }; },
  async signOut(){ return true; },
  onAuthStateChanged(cb){ cb({ uid:'u1', email:'x@y.com' }); }
};

window.AuthService = {
  async signIn(email, pass){ return { uid:'u1', email, via:'AuthService' }; },
  async signOut(){ return true; },
  getCurrentUser(){ return { uid:'u1', email:'tester@example.com' }; }
};

// Provide safeAuth fallback
window.safeAuth = {
  async signIn(email, pass){ return window.AuthService.signIn(email, pass); },
  async signOut(){ return window.AuthService.signOut(); },
  currentUser(){ return window.AuthService.getCurrentUser(); }
};

// Attach event listeners
let loginEventReceived = false;
let logoutEventReceived = false;
document.addEventListener('auth:login-success', (ev) => { loginEventReceived = true; console.log('login-success', ev.detail && ev.detail.user && ev.detail.user.email); });
document.addEventListener('auth:logout-success', () => { logoutEventReceived = true; console.log('logout-success'); });

// Load firebase-init (will call defineLoginHelpers immediately)
require('../firebase-init.js');

(async function run(){
  const res1 = await window.loginUsingServices('user@example.com','123');
  console.log('loginUsingServices ->', res1);
  const res2 = await window.logoutUsingServices();
  console.log('logoutUsingServices ->', res2);
  console.log('Events:', { loginEventReceived, logoutEventReceived });
  const ok = res1 && res1.ok && res2 && res2.ok && loginEventReceived && logoutEventReceived;
  console.log(ok ? 'PASS' : 'FAIL');
  process.exitCode = ok ? 0 : 1;
})();
