/**
 * CustomersService - Cache-First Customer Data Management
 * =====================================================
 * 
 * Implements cache-first strategy for customer data loading:
 * 1. Check LocalStorage cache first
 * 2. If cache fresh (default: 6 hours), return cached data
 * 3. If stale or forced refresh, fetch from Firestore
 * 4. Update cache and return
 * 5. On server error, gracefully fall back to cache
 * 
 * CRITICAL: mapToLegacy ensures customer fields match legacy code expectations
 * - name: Customer name (required for display)
 * - phone: Phone number (CRITICAL for search/filtering)
 * - address: Customer address
 * - balance: Initial/current balance
 * - id: Customer ID (for invoice linking)
 */

class CustomersService {
  constructor() {
    this._StorageService = null;
    this._FirestoreService = null;
    this._ErrorHandler = null;
  }

  /**
   * Set dependencies (called during initialization)
   */
  static setDependencies(storageService, firestoreService, errorHandler) {
    if (!window.CustomersService) {
      window.CustomersService = new CustomersService();
    }
    window.CustomersService._StorageService = storageService;
    window.CustomersService._FirestoreService = firestoreService;
    window.CustomersService._ErrorHandler = errorHandler;
    return window.CustomersService;
  }

  /**
   * Map Firestore document to legacy shape
   * CRITICAL: Ensures all legacy fields are present with correct names
   */
  static mapToLegacy(doc) {
    if (!doc) return null;

    // Get id from doc.id or doc._id, default to generated
    const id = doc.id || doc._id || window.CustomersService._generateId?.();
    
    return {
      id,
      name: doc.name || doc.customerName || '',
      phone: doc.phone || doc.phoneNumber || '', // CRITICAL for search
      address: doc.address || '',
      balance: typeof doc.balance === 'number' ? doc.balance : 0,
      email: doc.email || '',
      taxNumber: doc.taxNumber || '',
      category: doc.category || 'normal',
      notes: doc.notes || '',
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null,
      isActive: doc.isActive !== false,
      
      // Preserve any additional fields from original
      ...doc
    };
  }

  /**
   * Check if cache is fresh
   */
  isCacheFresh(maxAgeMs = 6 * 60 * 60 * 1000) {
    if (!this._StorageService) return false;
    
    try {
      const cached = this._StorageService.get('CUSTOMERS');
      if (!cached || !cached.data) return false;
      
      const age = Date.now() - (cached.timestamp || 0);
      return age < maxAgeMs;
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.isCacheFresh');
      }
      return false;
    }
  }

  /**
   * Read customers from cache
   */
  readCache() {
    if (!this._StorageService) return [];
    
    try {
      const cached = this._StorageService.get('CUSTOMERS');
      return cached?.data || [];
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.readCache');
      }
      return [];
    }
  }

  /**
   * Write customers to cache
   */
  writeCache(customers) {
    if (!this._StorageService) return;
    
    try {
      this._StorageService.set('CUSTOMERS', {
        data: customers,
        timestamp: Date.now()
      });
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.writeCache', true);
      }
    }
  }

  /**
   * Fetch customers from Firestore
   */
  async fetchFromServer() {
    if (!this._FirestoreService) {
      console.warn('CustomersService: FirestoreService not ready, returning empty array');
      return [];
    }

    try {
      console.log('CustomersService: Fetching from Firestore...');
      
      // Query Firestore collection 'customers'
      const docs = await this._FirestoreService.query('customers', {
        where: [['isActive', '==', true]],
        orderBy: [['name', 'asc']],
        limit: 10000
      });

      if (!Array.isArray(docs)) {
        console.warn('CustomersService: Firestore returned non-array:', typeof docs);
        return [];
      }

      // Map to legacy shape
      const customers = docs
        .map(doc => CustomersService.mapToLegacy(doc))
        .filter(c => c && c.id); // Filter out invalid docs

      console.log(`CustomersService: Fetched ${customers.length} customers from server`);
      return customers;
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.fetchFromServer', false);
      }
      console.error('CustomersService: Server fetch failed:', e.message);
      return [];
    }
  }

  /**
   * Main: Get customers with cache-first strategy
   * 
   * @param {Object} options
   * @param {boolean} options.forceRefresh - Force fetch from server (ignore cache)
   * @param {number} options.maxAgeMs - Cache TTL in ms (default 6 hours)
   * @returns {Promise<Array>} Array of customers in legacy shape
   */
  async getCustomers({ forceRefresh = false, maxAgeMs = 6 * 60 * 60 * 1000 } = {}) {
    try {
      // Try cache if not forced refresh
      if (!forceRefresh && this.isCacheFresh(maxAgeMs)) {
        console.log('CustomersService: Using cached customers');
        return this.readCache();
      }

      // Fetch from server
      let customers = await this.fetchFromServer();

      // Write to cache (even if empty array, or on error)
      if (Array.isArray(customers) && customers.length > 0) {
        this.writeCache(customers);
        return customers;
      }

      // If no customers from server, try cache
      const cached = this.readCache();
      if (Array.isArray(cached) && cached.length > 0) {
        console.log('CustomersService: Server returned empty, using cached data');
        return cached;
      }

      return customers; // Return empty array if all else fails
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.getCustomers', false);
      }

      // Graceful fallback to cache on any error
      console.log('CustomersService: Falling back to cache due to error');
      return this.readCache();
    }
  }

  /**
   * Helper to generate IDs (fallback if needed)
   */
  static _generateId() {
    return 'cust_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache() {
    if (!this._StorageService) return;
    try {
      this._StorageService.remove('CUSTOMERS');
      console.log('CustomersService: Cache cleared');
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'CustomersService.clearCache');
      }
    }
  }

  /**
   * Get cache info (for debugging)
   */
  getCacheInfo() {
    if (!this._StorageService) return null;
    try {
      const cached = this._StorageService.get('CUSTOMERS');
      if (!cached) return null;
      
      return {
        count: cached.data?.length || 0,
        timestamp: cached.timestamp,
        ageMs: Date.now() - (cached.timestamp || 0),
        isFresh: this.isCacheFresh()
      };
    } catch (e) {
      return null;
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomersService;
}
