/**
 * Products Service
 * Cache-first fetching with legacy shape mapping
 */

const ProductsService = {
  /**
   * Map Firestore product doc to legacy shape expected by UI
   * @param {object} doc - Firestore doc data with id
   * @returns {object}
   */
  mapToLegacy(doc) {
    try {
      const price = Number(
        doc.price !== undefined && doc.price !== null ? doc.price :
        doc.sellPrice !== undefined && doc.sellPrice !== null ? doc.sellPrice : 0
      ) || 0;
      return {
        id: doc.id || doc.code || doc._id || '',
        code: doc.code || doc.id || '',
        name: (doc.name || doc.title || '').toString(),
        unit: doc.unit || doc.unitName || 'قطعة',
        price: price,
        vat_rate: doc.vat_rate !== undefined ? Number(doc.vat_rate) : undefined,
        category: doc.category || doc.section || '',
        updatedAt: doc.updatedAt || doc.updated_at || null
      };
    } catch (e) {
      ErrorHandler.handle(e, 'Products.mapToLegacy', false);
      return { id: doc.id || '', name: '', unit: 'قطعة', price: 0 };
    }
  },

  /**
   * Read products from local cache
   * @returns {Array}
   */
  readCache() {
    try {
      const arr = StorageService.get(StorageService.KEYS.PRODUCTS, []);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      ErrorHandler.handle(e, 'Products.readCache', false);
      return [];
    }
  },

  /**
   * Determine if cache is fresh based on timestamp
   * @param {number} maxAgeMs
   * @returns {boolean}
   */
  isCacheFresh(maxAgeMs) {
    try {
      const ts = StorageService.getTimestamp(StorageService.KEYS.PRODUCTS);
      if (!ts) return false;
      const age = Date.now() - new Date(ts).getTime();
      return age >= 0 && age <= maxAgeMs;
    } catch (e) {
      return false;
    }
  },

  /**
   * Write products to cache and timestamp
   * @param {Array} products
   */
  writeCache(products) {
    try {
      StorageService.set(StorageService.KEYS.PRODUCTS, products);
      StorageService.updateTimestamp(StorageService.KEYS.PRODUCTS);
    } catch (e) {
      ErrorHandler.handle(e, 'Products.writeCache', false);
    }
  },

  /**
   * Fetch products from Firestore
   * @returns {Promise<Array>}
   */
  async fetchFromServer() {
    try {
      const rows = await FirestoreService.query('products', {});
      const mapped = rows.map(r => this.mapToLegacy({ id: r.id, ...r }));
      return mapped;
    } catch (e) {
      ErrorHandler.handle(e, 'Products.fetchFromServer', true);
      return [];
    }
  },

  /**
   * Get products with cache-first strategy
   * @param {{forceRefresh?: boolean, maxAgeMs?: number}} options
   * @returns {Promise<Array>}
   */
  async getProducts(options = {}) {
    const { forceRefresh = false, maxAgeMs = 6 * 60 * 60 * 1000 } = options; // 6 hours
    try {
      if (!forceRefresh && this.isCacheFresh(maxAgeMs)) {
        const cached = this.readCache();
        if (cached && cached.length) return cached;
      }
      const fromServer = await this.fetchFromServer();
      if (fromServer && fromServer.length) this.writeCache(fromServer);
      return fromServer.length ? fromServer : this.readCache();
    } catch (e) {
      ErrorHandler.handle(e, 'Products.getProducts', true);
      return this.readCache();
    }
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductsService;
}
window.ProductsService = ProductsService;
