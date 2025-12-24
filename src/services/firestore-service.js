/**
 * Firestore Service (Firebase)
 * فصل عمليات القراءة/الكتابة عن الواجهة
 */

const FirestoreService = {
  _db: null,

  setDb(dbInstance) {
    this._db = dbInstance;
  },

  isReady() {
    return !!(this._db && typeof this._db.collection === 'function');
  },

  serverTs() {
    try {
      if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue) {
        return firebase.firestore.FieldValue.serverTimestamp();
      }
      if (typeof window !== 'undefined' && window.serverTs) return window.serverTs();
    } catch (_) {}
    return new Date();
  },

  collectionRef(name) {
    if (!this.isReady()) throw new Error('Firestore غير جاهز');
    return this._db.collection(name);
  },

  docRef(name, id) {
    return this.collectionRef(name).doc(id);
  },

  async getDoc(collection, id) {
    try {
      const snap = await this.docRef(collection, id).get();
      return snap.exists ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.getDoc', true);
      return null;
    }
  },

  async setDoc(collection, id, data, merge = true) {
    try {
      const payload = { ...data };
      await this.docRef(collection, id).set(payload, { merge });
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.setDoc', true);
      return false;
    }
  },

  async updateDoc(collection, id, data) {
    try {
      await this.docRef(collection, id).update({ ...data });
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.updateDoc', true);
      return false;
    }
  },

  async deleteDoc(collection, id) {
    try {
      await this.docRef(collection, id).delete();
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.deleteDoc', true);
      return false;
    }
  },

  async addDoc(collection, data) {
    try {
      const res = await this.collectionRef(collection).add({ ...data });
      return res && res.id ? res.id : null;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.addDoc', true);
      return null;
    }
  },

  async query(collection, opts = {}) {
    try {
      let q = this.collectionRef(collection);
      const where = Array.isArray(opts.where) ? opts.where : [];
      where.forEach(([field, op, value]) => { q = q.where(field, op, value); });
      if (opts.orderBy && Array.isArray(opts.orderBy)) {
        const [field, dir] = opts.orderBy;
        q = q.orderBy(field, dir || 'asc');
      }
      if (opts.limit) q = q.limit(opts.limit);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      ErrorHandler.handle(error, 'FS.query', true);
      return [];
    }
  },

  async batchWrite(ops = []) {
    if (!this.isReady() || typeof this._db.batch !== 'function') throw new Error('Firestore غير جاهز');
    try {
      const batch = this._db.batch();
      for (const op of ops) {
        const ref = this.docRef(op.collection, op.id);
        if (op.op === 'set') batch.set(ref, { ...op.data }, { merge: !!op.merge });
        else if (op.op === 'update') batch.update(ref, { ...op.data });
        else if (op.op === 'delete') batch.delete(ref);
      }
      await batch.commit();
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'FS.batchWrite', true);
      return false;
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirestoreService;
}
window.FirestoreService = FirestoreService;
