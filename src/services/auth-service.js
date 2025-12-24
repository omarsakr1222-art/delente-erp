/**
 * Auth Service (Firebase)
 * فصل تام بين منطق المصادقة وواجهة المستخدم
 */

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
