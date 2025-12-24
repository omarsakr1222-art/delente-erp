// Firebase initialization module (modular SDK)
// Provide your config via window.__FIREBASE_CONFIG = { apiKey: '...', authDomain: '...', projectId: '...' } before this file
// or replace the placeholder object below.

(function(){
  const cfg = (window.__FIREBASE_CONFIG) || null;
  if(!cfg){
    console.warn('Firebase config غير موجود؛ الاستمرار في وضع أوفلاين (stubs)');
    return; // keep existing stubs from index.html
  }
  const appUrlBase = 'https://www.gstatic.com/firebasejs/10.13.0/';
  Promise.all([
    import(appUrlBase + 'firebase-app.js'),
    import(appUrlBase + 'firebase-auth.js'),
    import(appUrlBase + 'firebase-firestore.js')
  ]).then(([appMod, authMod, fsMod]) => {
    const app = appMod.initializeApp(cfg);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    window.auth = auth;
    window.db = db;

    // Bridge legacy methods if code still calls them
    if (typeof auth.signInWithEmailAndPassword !== 'function') {
      auth.signInWithEmailAndPassword = (email, password) => authMod.signInWithEmailAndPassword(auth, email, password);
    }
    if (typeof auth.signOut !== 'function') {
      auth.signOut = () => authMod.signOut(auth);
    }

    authMod.onAuthStateChanged(auth, user => {
      console.log('Firebase auth state changed', user ? user.email : 'none');
      // If existing offline AuthSystem exists, sync minimal user
      if (user) {
        try {
          const mapped = { id: user.uid, email: user.email, name: user.displayName || (user.email||'').split('@')[0], firebase:true };
          if (window.AuthSystem && typeof window.AuthSystem.setCurrentUser === 'function') {
            window.AuthSystem.setCurrentUser(mapped);
          }
        } catch(e){ console.warn('AuthSystem sync failed', e); }
      }
    });
  }).catch(err => {
    console.error('Firebase import failed; staying offline', err);
  });
})();
