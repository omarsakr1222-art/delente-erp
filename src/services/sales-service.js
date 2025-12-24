/**
 * SalesService - Sales & Invoices Management with Offline Queue
 * ==============================================================
 * 
 * CRITICAL FEATURES:
 * 1. Read Strategy: Fetch recent N invoices only (not all history)
 *    - Limit to last 50-100 invoices for current user/rep
 *    - Cache for offline viewing
 * 
 * 2. Write Strategy: Smart saveInvoice with offline queue
 *    - Online: Save directly to Firestore
 *    - Offline: Add to pending_invoices queue in localStorage
 *    - Auto-sync queue when connection restored
 * 
 * 3. Queue Management:
 *    - getPendingCount(): How many invoices waiting to sync
 *    - syncPendingInvoices(): Push queue to Firestore
 *    - clearQueue(): Remove all pending (after successful sync)
 */

class SalesService {
  constructor() {
    this._StorageService = null;
    this._FirestoreService = null;
    this._ErrorHandler = null;
  }

  /**
   * Set dependencies (called during initialization)
   */
  static setDependencies(storageService, firestoreService, errorHandler) {
    if (!window.SalesService) {
      window.SalesService = new SalesService();
    }
    window.SalesService._StorageService = storageService;
    window.SalesService._FirestoreService = firestoreService;
    window.SalesService._ErrorHandler = errorHandler;
    return window.SalesService;
  }

  /**
   * Map Firestore document to legacy shape
   * Ensures backward compatibility with existing UI code
   */
  static mapToLegacy(doc) {
    if (!doc) return null;

    const id = doc.id || doc._id || SalesService._generateId();
    
    return {
      id,
      invoiceNumber: doc.invoiceNumber || id,
      customerId: doc.customerId || '',
      customerName: doc.customerName || '',
      items: Array.isArray(doc.items) ? doc.items : [],
      subtotal: typeof doc.subtotal === 'number' ? doc.subtotal : 0,
      tax: typeof doc.tax === 'number' ? doc.tax : 0,
      total: typeof doc.total === 'number' ? doc.total : 0,
      date: doc.date || new Date().toISOString(),
      period: doc.period || '',
      userId: doc.userId || '',
      userName: doc.userName || '',
      status: doc.status || 'completed',
      paymentMethod: doc.paymentMethod || 'cash',
      notes: doc.notes || '',
      createdAt: doc.createdAt || null,
      updatedAt: doc.updatedAt || null,
      
      // Preserve any additional fields
      ...doc
    };
  }

  /**
   * Get recent sales (limited history for performance)
   * 
   * @param {Object} options
   * @param {number} options.limit - Max number of invoices to fetch (default: 100)
   * @param {string} options.forUserId - Filter by user ID (for reps)
   * @param {boolean} options.forceRefresh - Force fetch from server (ignore cache)
   * @param {number} options.maxAgeMs - Cache TTL in ms (default 30 mins for sales)
   * @returns {Promise<Array>} Array of sales in legacy shape
   */
  async getRecentSales({ 
    limit = 100, 
    forUserId = null, 
    forceRefresh = false, 
    maxAgeMs = 30 * 60 * 1000 // 30 minutes default for sales (shorter than products)
  } = {}) {
    try {
      const cacheKey = forUserId ? `SALES_USER_${forUserId}` : 'SALES_RECENT';
      
      // Try cache if not forced refresh
      if (!forceRefresh && this.isCacheFresh(cacheKey, maxAgeMs)) {
        console.log(`SalesService: Using cached sales (${cacheKey})`);
        return this.readCache(cacheKey);
      }

      // Fetch from server
      const sales = await this.fetchFromServer(limit, forUserId);

      // Write to cache
      if (Array.isArray(sales)) {
        this.writeCache(cacheKey, sales);
      }

      return sales;
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'SalesService.getRecentSales', false);
      }

      // Graceful fallback to cache
      console.log('SalesService: Falling back to cache due to error');
      const cacheKey = forUserId ? `SALES_USER_${forUserId}` : 'SALES_RECENT';
      return this.readCache(cacheKey);
    }
  }

  /**
   * Fetch sales from Firestore (limited query)
   */
  async fetchFromServer(limit = 100, forUserId = null) {
    if (!this._FirestoreService) {
      console.warn('SalesService: FirestoreService not ready, returning empty array');
      return [];
    }

    try {
      console.log(`SalesService: Fetching last ${limit} sales from Firestore...`);
      
      // Build query options
      const queryOpts = {
        orderBy: [['createdAt', 'desc']], // Most recent first
        limit: limit
      };

      // Add user filter if specified
      if (forUserId) {
        queryOpts.where = [['userId', '==', forUserId]];
      }

      const docs = await this._FirestoreService.query('sales', queryOpts);

      if (!Array.isArray(docs)) {
        console.warn('SalesService: Firestore returned non-array:', typeof docs);
        return [];
      }

      // Map to legacy shape
      const sales = docs
        .map(doc => SalesService.mapToLegacy(doc))
        .filter(s => s && s.id);

      console.log(`SalesService: Fetched ${sales.length} sales from server`);
      return sales;
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'SalesService.fetchFromServer', false);
      }
      console.error('SalesService: Server fetch failed:', e.message);
      return [];
    }
  }

  /**
   * CRITICAL: Save invoice with offline queue support
   * 
   * Online: Save directly to Firestore
   * Offline: Add to pending_invoices queue for later sync
   * 
   * @param {Object} invoiceData - Invoice to save
   * @returns {Promise<Object>} { ok, id, queued, error }
   */
  async saveInvoice(invoiceData) {
    try {
      // Validate invoice data
      if (!invoiceData || typeof invoiceData !== 'object') {
        throw new Error('Invalid invoice data');
      }

      // Add timestamps
      const now = Date.now();
      const invoice = {
        ...invoiceData,
        createdAt: invoiceData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _localTimestamp: now // For queue ordering
      };

      // Try to save to Firestore
      if (this._FirestoreService && navigator.onLine !== false) {
        try {
          console.log('SalesService: Attempting to save invoice to Firestore...');
          
          const docId = invoice.id || SalesService._generateId();
          await this._FirestoreService.setDoc('sales', docId, invoice);
          
          console.log(`✅ SalesService: Invoice ${docId} saved to Firestore`);
          return { ok: true, id: docId, queued: false };
        } catch (serverError) {
          console.warn('SalesService: Firestore save failed, adding to queue:', serverError.message);
          // Fall through to queue logic
        }
      }

      // Firestore unavailable or offline: Add to queue
      console.log('SalesService: Adding invoice to pending queue (offline mode)');
      const queueId = this.addToQueue(invoice);
      
      return { ok: true, id: queueId, queued: true, message: 'Saved to offline queue' };
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'SalesService.saveInvoice', true);
      }
      console.error('SalesService: saveInvoice failed:', e);
      return { ok: false, error: e.message };
    }
  }

  /**
   * Add invoice to pending queue
   */
  addToQueue(invoice) {
    try {
      const queue = this.getPendingQueue();
      
      // Generate ID if not present
      const queueId = invoice.id || SalesService._generateId();
      const queueItem = {
        ...invoice,
        id: queueId,
        _queuedAt: Date.now()
      };
      
      queue.push(queueItem);
      
      // Save to localStorage
      if (this._StorageService) {
        this._StorageService.set('PENDING_INVOICES', queue);
      } else {
        localStorage.setItem('pending_invoices', JSON.stringify(queue));
      }
      
      console.log(`SalesService: Invoice ${queueId} added to queue (${queue.length} pending)`);
      return queueId;
    } catch (e) {
      console.error('SalesService: Failed to add to queue:', e);
      throw e;
    }
  }

  /**
   * Get pending invoices queue
   */
  getPendingQueue() {
    try {
      if (this._StorageService) {
        return this._StorageService.get('PENDING_INVOICES') || [];
      } else {
        const data = localStorage.getItem('pending_invoices');
        return data ? JSON.parse(data) : [];
      }
    } catch (e) {
      console.warn('SalesService: Failed to read pending queue:', e);
      return [];
    }
  }

  /**
   * Get count of pending invoices
   */
  getPendingCount() {
    return this.getPendingQueue().length;
  }

  /**
   * Sync pending invoices to Firestore
   * Returns { synced, failed, errors }
   */
  async syncPendingInvoices() {
    const queue = this.getPendingQueue();
    
    if (queue.length === 0) {
      console.log('SalesService: No pending invoices to sync');
      return { synced: 0, failed: 0, errors: [] };
    }

    console.log(`SalesService: Syncing ${queue.length} pending invoices...`);
    
    const results = { synced: 0, failed: 0, errors: [] };
    const remaining = [];

    for (const invoice of queue) {
      try {
        if (!this._FirestoreService) {
          throw new Error('FirestoreService not available');
        }

        // Remove queue metadata before saving
        const { _queuedAt, _localTimestamp, ...cleanInvoice } = invoice;
        
        await this._FirestoreService.setDoc('sales', invoice.id, cleanInvoice);
        
        console.log(`✅ Synced invoice ${invoice.id}`);
        results.synced++;
      } catch (e) {
        console.error(`❌ Failed to sync invoice ${invoice.id}:`, e.message);
        results.failed++;
        results.errors.push({ id: invoice.id, error: e.message });
        remaining.push(invoice); // Keep in queue
      }
    }

    // Update queue with remaining items
    if (this._StorageService) {
      this._StorageService.set('PENDING_INVOICES', remaining);
    } else {
      localStorage.setItem('pending_invoices', JSON.stringify(remaining));
    }

    console.log(`SalesService: Sync complete - ${results.synced} synced, ${results.failed} failed`);
    return results;
  }

  /**
   * Clear all pending invoices (use with caution)
   */
  clearQueue() {
    if (this._StorageService) {
      this._StorageService.remove('PENDING_INVOICES');
    } else {
      localStorage.removeItem('pending_invoices');
    }
    console.log('SalesService: Queue cleared');
  }

  /**
   * Check if cache is fresh
   */
  isCacheFresh(key, maxAgeMs = 30 * 60 * 1000) {
    if (!this._StorageService) return false;
    
    try {
      const cached = this._StorageService.get(key);
      if (!cached || !cached.data) return false;
      
      const age = Date.now() - (cached.timestamp || 0);
      return age < maxAgeMs;
    } catch (e) {
      return false;
    }
  }

  /**
   * Read sales from cache
   */
  readCache(key) {
    if (!this._StorageService) {
      // Fallback to direct localStorage
      try {
        const data = localStorage.getItem(key);
        if (!data) return [];
        const parsed = JSON.parse(data);
        return parsed.data || [];
      } catch (e) {
        return [];
      }
    }
    
    try {
      const cached = this._StorageService.get(key);
      return cached?.data || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Write sales to cache
   */
  writeCache(key, sales) {
    if (!this._StorageService) {
      try {
        localStorage.setItem(key, JSON.stringify({
          data: sales,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('SalesService: Cache write failed:', e);
      }
      return;
    }
    
    try {
      this._StorageService.set(key, {
        data: sales,
        timestamp: Date.now()
      });
    } catch (e) {
      if (this._ErrorHandler) {
        this._ErrorHandler.handle(e, 'SalesService.writeCache', false);
      }
    }
  }

  /**
   * Helper to generate IDs
   */
  static _generateId() {
    return 'inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SalesService;
}
