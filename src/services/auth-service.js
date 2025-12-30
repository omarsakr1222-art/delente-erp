/**
 * Authentication Service
 * نظام إدارة المستخدمين والمصادقة مع Firebase
 */

const AuthSystem = {
    USERS_KEY: 'app_users',
    CURRENT_USER_KEY: 'app_current_user',
    
    getAllUsers() {
        try {
            const data = localStorage.getItem(this.USERS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Error loading users:', e);
            return [];
        }
    },
    
    saveUsers(users) {
        try {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        } catch (e) {
            console.error('Error saving users:', e);
        }
    },
    
    findUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email === email.toLowerCase());
    },
    
    async register(email, password, name) {
        if (!window.auth) return { success: false, message: 'Firebase Auth غير جاهز' };
        
        try {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            try { await cred.user.updateProfile({ displayName: name }); } catch(e) {}
            
            // Save user document to Firestore
            try {
                if (window.db) {
                    await db.collection('users').doc(cred.user.uid).set({
                        email: email.toLowerCase(),
                        name: name,
                        createdAt: new Date().toISOString()
                    }, { merge: true });
                }
            } catch(e) { 
                console.warn('تحذير: فشل حفظ وثيقة المستخدم في Firestore', e); 
            }
            
            const newUser = { 
                id: cred.user.uid, 
                email: email.toLowerCase(), 
                name, 
                firebase: true, 
                createdAt: new Date().toISOString(), 
                data: {} 
            };
            
            this.setCurrentUser(newUser);
            return { success: true, message: 'تم إنشاء الحساب بنجاح', user: newUser };
            
        } catch (err) {
            let msg = 'فشل إنشاء الحساب';
            if (err.code === 'auth/email-already-in-use') msg = 'البريد مستخدم بالفعل';
            else if (err.code === 'auth/weak-password') msg = 'كلمة المرور ضعيفة';
            else if (err.code === 'auth/invalid-email') msg = 'البريد غير صالح';
            return { success: false, message: msg };
        }
    },
    
    async login(email, password) {
        if (!window.auth) return { success: false, message: 'Firebase Auth غير جاهز' };
        
        try {
            const cred = await auth.signInWithEmailAndPassword(email, password);
            const displayName = cred.user.displayName || (cred.user.email ? cred.user.email.split('@')[0] : 'مستخدم');
            const currentUser = { 
                id: cred.user.uid, 
                email: cred.user.email.toLowerCase(), 
                name: displayName, 
                firebase: true, 
                data: {} 
            };
            
            this.setCurrentUser(currentUser);
            return { success: true, message: 'تم الدخول بنجاح', user: currentUser };
            
        } catch (err) {
            let msg = 'فشل الدخول';
            if (err.code === 'auth/wrong-password') msg = 'كلمة المرور غير صحيحة';
            else if (err.code === 'auth/user-not-found') msg = 'المستخدم غير موجود';
            else if (err.code === 'auth/invalid-email') msg = 'البريد غير صالح';
            else if (err.code === 'auth/too-many-requests') msg = 'محاولات كثيرة، انتظر قليلاً';
            return { success: false, message: msg };
        }
    },
    
    setCurrentUser(user) {
        try {
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('Error saving current user:', e);
        }
    },
    
    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.CURRENT_USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Error loading current user:', e);
            return null;
        }
    },
    
    logout() {
        try {
            localStorage.removeItem(this.CURRENT_USER_KEY);
        } catch (e) {
            console.error('Error logging out:', e);
        }
    },
    
    updateUserData(userId, newData) {
        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return false;
        
        user.data = { ...user.data, ...newData };
        this.saveUsers(users);
        
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            this.setCurrentUser(user);
        }
        return true;
    }
};

// Forced role assignments
window.FORCED_ADMINS = (window.FORCED_ADMINS || [ 
    'omarsakr1222@gmail.com', 
    'yousefsakr1222@gmail.com' 
]);

window.FORCED_REVIEWERS = (window.FORCED_REVIEWERS || [
    'yasserhassan1222@gmail.com',
    'belalhatem1222@gmail.com',
    'mohamedhossein1222@gmail.com'
]);

/**
 * Get user role with fallback priority
 */
function getUserRole() {
    try {
        const user = AuthSystem.getCurrentUser();
        if (!user) return 'guest';
        
        // Priority 1: Forced admin
        if (window.FORCED_ADMINS.includes((user.email || '').toLowerCase())) return 'admin';
        
        // Priority 2: Forced reviewer
        if (window.FORCED_REVIEWERS.includes((user.email || '').toLowerCase())) return 'reviewer';
        
        // Priority 3: From roles map (realtime sync)
        if (window.__rolesMap && window.__rolesMap[user.id]) return window.__rolesMap[user.id];
        
        // Priority 4: From state.users (synced from Firestore)
        if (window.state && Array.isArray(state.users)) {
            const byId = state.users.find(u => u._id === user.id);
            if (byId && byId.role) return byId.role;
            
            const byEmail = state.users.find(u => (u.email || '').toLowerCase() === (user.email || '').toLowerCase());
            if (byEmail && byEmail.role) return byEmail.role;
        }
    } catch(e) { /* ignore */ }
    
    // Default: any logged-in user is a rep
    return 'rep';
}

// Helper functions for role checks
function isReviewer() {
    try { 
        return typeof getUserRole === 'function' && getUserRole() === 'reviewer'; 
    } catch(e){ 
        return false; 
    }
}

function isReadOnly(){
    try {
        if (typeof getUserRole !== 'function') return false;
        const r = getUserRole();
        return r === 'reviewer' || r === 'manager';
    } catch(e){ 
        return false; 
    }
}

// Auto-create test user if none exist
document.addEventListener('DOMContentLoaded', () => {
    if (AuthSystem.getAllUsers().length === 0) {
        AuthSystem.register('test@example.com', 'test123', 'مستخدم تجريبي');
    }
});

// Make AuthSystem and helpers globally available
if (typeof window !== 'undefined') {
    window.AuthSystem = AuthSystem;
    window.getUserRole = getUserRole;
    window.isReviewer = isReviewer;
    window.isReadOnly = isReadOnly;
}

console.log('✓ AuthSystem loaded');

// Auth Service (Firebase)
// فصل تام بين منطق المصادقة وواجهة المستخدم

const AuthService = {
  _auth: null,

  setAuth(authInstance) {
    this._auth = authInstance;
  },

  isReady() {
    return !!(this._auth && typeof this._auth.signInWithEmailAndPassword === 'function');
  },

  async signIn(email, password) {
    if (!this.isReady()) throw new Error('Firebase auth غير جاهز');
    try {
      const res = await this._auth.signInWithEmailAndPassword(email, password);
      return res && res.user ? res.user : null;
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.signIn', true);
      throw error;
    }
  },

  async signOut() {
    if (!this.isReady() || typeof this._auth.signOut !== 'function') return true;
    try {
      await this._auth.signOut();
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.signOut', true);
      return false;
    }
  },

  onAuthStateChanged(callback) {
    try {
      if (!this._auth || typeof this._auth.onAuthStateChanged !== 'function') return () => {};
      return this._auth.onAuthStateChanged(callback);
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.onAuthStateChanged', false);
      return () => {};
    }
  },

  getCurrentUser() {
    try {
      return this._auth && this._auth.currentUser ? this._auth.currentUser : null;
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.getCurrentUser', false);
      return null;
    }
  },

  async getIdToken(forceRefresh = false) {
    const user = this.getCurrentUser();
    if (!user || typeof user.getIdToken !== 'function') return null;
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.getIdToken', false);
      return null;
    }
  },

  async getUserRole() {
    const user = this.getCurrentUser();
    if (!user) return 'user';
    try {
      if (typeof user.getIdTokenResult === 'function') {
        const tokenRes = await user.getIdTokenResult();
        const role = tokenRes && tokenRes.claims && tokenRes.claims.role;
        return role || (user.role || 'user');
      }
      return user.role || 'user';
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.getUserRole', false);
      return 'user';
    }
  },

  async hasRole(role) {
    try {
      const r = await this.getUserRole();
      if (!role) return false;
      if (Array.isArray(r)) return r.includes(role);
      return String(r).toLowerCase() === String(role).toLowerCase();
    } catch (error) {
      ErrorHandler.handle(error, 'Auth.hasRole', false);
      return false;
    }
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
window.AuthService = AuthService;
