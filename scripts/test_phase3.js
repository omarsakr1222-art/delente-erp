// Phase 3 Test Harness
// Validates auth-service and firestore-service with mocked Firebase

// Globals
global.window = {};

// ErrorHandler minimal
const ErrorHandler = require('../src/core/error-handler.js');
window.ErrorHandler = ErrorHandler;
global.ErrorHandler = ErrorHandler;

// Mock Auth
function createMockAuth() {
  const listeners = [];
  const currentUser = {
    uid: 'u1',
    email: 'tester@example.com',
    role: 'admin',
    async getIdToken(forceRefresh) { return 'token123'; },
    async getIdTokenResult() { return { claims: { role: 'admin' } }; }
  };
  return {
    currentUser,
    async signInWithEmailAndPassword(email, pass) { return { user: { ...currentUser, email } }; },
    async signOut() { return true; },
    onAuthStateChanged(cb) { listeners.push(cb); cb(currentUser); return () => {}; }
  };
}

// Mock Firestore
function createMockDb() {
  const store = new Map(); // key: collection, value: Map(id->data)
  function getCol(name) { if (!store.has(name)) store.set(name, new Map()); return store.get(name); }

  const api = {
    collection(name) {
      const col = getCol(name);
      return {
        doc(id) {
          return {
            id,
            async get() { const d = col.get(id); return { id, exists: !!d, data: () => d }; },
            async set(data, opts) { const prev = col.get(id) || {}; col.set(id, opts && opts.merge ? { ...prev, ...data } : { ...data }); },
            async update(data) { const prev = col.get(id) || {}; col.set(id, { ...prev, ...data }); },
            async delete() { col.delete(id); }
          };
        },
        async add(data) { const newId = 'id_' + Math.random().toString(36).slice(2, 8); col.set(newId, { ...data }); return { id: newId }; },
        where(field, op, value) { this._where = this._where || []; this._where.push([field, op, value]); return this; },
        orderBy(field, dir) { this._order = [field, dir]; return this; },
        limit(n) { this._limit = n; return this; },
        async get() {
          let arr = Array.from(col.entries()).map(([id, data]) => ({ id, data: () => data }));
          if (this._where) arr = arr.filter(({ data }) => this._where.every(([f, o, v]) => (o === '==' ? data()[f] === v : true)));
          if (this._order) { const [f, dir] = this._order; arr.sort((a, b) => (a.data()[f] > b.data()[f] ? 1 : -1) * (dir === 'desc' ? -1 : 1)); }
          if (this._limit) arr = arr.slice(0, this._limit);
          return { docs: arr };
        }
      };
    },
    batch() {
      const ops = [];
      return {
        set(ref, data, opts) { ops.push(['set', ref, data, opts]); },
        update(ref, data) { ops.push(['update', ref, data]); },
        delete(ref) { ops.push(['delete', ref]); },
        async commit() {
          for (const [op, ref, data, opts] of ops) {
            if (op === 'set') await ref.set(data, opts);
            else if (op === 'update') await ref.update(data);
            else if (op === 'delete') await ref.delete();
          }
        }
      };
    }
  };
  return api;
}

// Attach firebase FieldValue mock (optional)
global.firebase = { firestore: { FieldValue: { serverTimestamp: () => new Date() } } };

// Require services
const AuthService = require('../src/services/auth-service.js');
const FirestoreService = require('../src/services/firestore-service.js');

// Initialize mocks
const mockAuth = createMockAuth();
AuthService.setAuth(mockAuth);
const mockDb = createMockDb();
FirestoreService.setDb(mockDb);

// Test runner
let passed = 0, failed = 0;
function expect(name, cond, detail='') { if (cond) { passed++; console.log('PASS -', name); } else { failed++; console.log('FAIL -', name, detail); } }

(async function run(){
  try {
    // Auth tests
    expect('Auth.isReady', AuthService.isReady());
    const user = await AuthService.signIn('user@example.com', 'pass');
    expect('Auth.signIn returns user', !!user && user.email === 'user@example.com');
    expect('Auth.getCurrentUser', !!AuthService.getCurrentUser());
    expect('Auth.getIdToken', (await AuthService.getIdToken()) === 'token123');
    expect('Auth.getUserRole', (await AuthService.getUserRole()) === 'admin');
    expect('Auth.hasRole(admin)', await AuthService.hasRole('admin'));
    expect('Auth.signOut', await AuthService.signOut());

    // Firestore CRUD
    const id = await FirestoreService.addDoc('products', { name: 'Cheese', price: 50 });
    expect('FS.addDoc returns id', !!id);
    const got = await FirestoreService.getDoc('products', id);
    expect('FS.getDoc reads data', got && got.name === 'Cheese');
    expect('FS.setDoc merge', await FirestoreService.setDoc('products', id, { unit: 'kg' }, true));
    const upd = await FirestoreService.updateDoc('products', id, { price: 55 });
    expect('FS.updateDoc', upd);
    const list = await FirestoreService.query('products', { where: [['price','==',55]], limit: 1 });
    expect('FS.query filtered', list.length === 1 && list[0].price === 55);
    expect('FS.deleteDoc', await FirestoreService.deleteDoc('products', id));

    // Batch
    const id1 = await FirestoreService.addDoc('customers', { name: 'A' });
    const id2 = await FirestoreService.addDoc('customers', { name: 'B' });
    const ok = await FirestoreService.batchWrite([
      { op: 'update', collection: 'customers', id: id1, data: { name: 'A1' } },
      { op: 'delete', collection: 'customers', id: id2 }
    ]);
    expect('FS.batchWrite', ok);
    const q = await FirestoreService.query('customers', {});
    expect('FS.query after batch', q.length === 1 && q[0].name === 'A1');

    console.log(`Passed: ${passed}, Failed: ${failed}`);
    process.exitCode = failed ? 1 : 0;
  } catch (err) {
    console.error('Test error', err);
    process.exitCode = 1;
  }
})();
