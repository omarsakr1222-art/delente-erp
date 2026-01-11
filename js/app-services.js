/**
 * Application Services Module
 * CustomersService و SalesService - الخدمات الأساسية للتطبيق
 */

/**
 * CustomersService - Inline Implementation
 * Cache-first customer data loading for offline support
 * CRITICAL: Ensures name, phone, address, balance, id fields exist for legacy code
 */
window.CustomersService = {
    // Cache the service dependencies once they're ready
    _storageService: null,
    _firestoreService: null,
    _errorHandler: null,

    // Initialize with dependencies (called by firebase-init or manually)
    setDependencies(storageService, firestoreService, errorHandler) {
        window.CustomersService._storageService = storageService;
        window.CustomersService._firestoreService = firestoreService;
        window.CustomersService._errorHandler = errorHandler;
        console.log('✓ CustomersService dependencies injected');
    },

    // Map Firestore doc to legacy shape
    mapToLegacy(doc) {
        if (!doc) return null;
        const id = doc.id || doc._id || ('cust_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
        
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
            ...doc
        };
    },

    // Check if cache is fresh
    isCacheFresh(maxAgeMs) {
        maxAgeMs = maxAgeMs || (6 * 60 * 60 * 1000); // 6 hours default
        const cached = this.readCache();
        if (!cached || !cached.length) return false;
        
        // For inline version, check localStorage directly
        try {
            const data = localStorage.getItem('CUSTOMERS');
            if (!data) return false;
            const parsed = JSON.parse(data);
            if (!parsed.timestamp) return false;
            const age = Date.now() - parsed.timestamp;
            return age < maxAgeMs;
        } catch(e) {
            return false;
        }
    },

    // Read cache
    readCache() {
        try {
            const data = localStorage.getItem('CUSTOMERS');
            if (!data) return [];
            const parsed = JSON.parse(data);
            return parsed.data || [];
        } catch(e) {
            console.warn('CustomersService: Cache read failed:', e);
            return [];
        }
    },

    // Write cache
    writeCache(customers) {
        try {
            localStorage.setItem('CUSTOMERS', JSON.stringify({
                data: customers,
                timestamp: Date.now()
            }));
        } catch(e) {
            console.warn('CustomersService: Cache write failed:', e);
        }
    },

    // Fetch from Firestore
    async fetchFromServer() {
        try {
            if (!window.db) {
                console.warn('CustomersService: Firestore not ready');
                return [];
            }

            console.log('CustomersService: Fetching from Firestore...');
            const snapshot = await window.db.collection('customers')
                .where('isActive', '==', true)
                .orderBy('name')
                .limit(10000)
                .get();

            const customers = snapshot.docs
                .map(doc => window.CustomersService.mapToLegacy(doc.data() ? { id: doc.id, ...doc.data() } : { id: doc.id }))
                .filter(c => c && c.id);

            console.log(`CustomersService: Fetched ${customers.length} customers from server`);
            return customers;
        } catch(e) {
            console.error('CustomersService: Server fetch failed:', e.message);
            return [];
        }
    },

    // Main: Get customers with cache-first
    async getCustomers(opts) {
        opts = opts || {};
        const forceRefresh = opts.forceRefresh || false;
        const maxAgeMs = opts.maxAgeMs || (6 * 60 * 60 * 1000);

        try {
            // Try cache if not forced refresh
            if (!forceRefresh && this.isCacheFresh(maxAgeMs)) {
                console.log('CustomersService: Using cached customers');
                return this.readCache();
            }

            // Fetch from server
            const customers = await this.fetchFromServer();

            // Write to cache
            if (Array.isArray(customers) && customers.length > 0) {
                this.writeCache(customers);
                return customers;
            }

            // Fallback to cache
            const cached = this.readCache();
            if (Array.isArray(cached) && cached.length > 0) {
                console.log('CustomersService: Server returned empty, using cached data');
                return cached;
            }

            return customers; // Empty array
        } catch(e) {
            console.error('CustomersService: getCustomers failed:', e);
            // Graceful fallback to cache on error
            return this.readCache();
        }
    },

    // Clear cache (for testing)
    clearCache() {
        try {
            localStorage.removeItem('CUSTOMERS');
        } catch(e) {
            console.warn('CustomersService: Cache clear failed:', e);
        }
    }
};

console.log('✓ CustomersService defined');

/**
 * SalesService - Inline Implementation
 * Smart invoice saving with offline queue + auto-sync
 * 
 * KEY FEATURES:
 * - Read: Limited recent sales (50-100 invoices)
 * - Write Online: Direct save to Firestore
 * - Write Offline: Add to pending_invoices queue
 * - Auto-Sync: syncPendingInvoices() when connection restored
 */
window.SalesService = {
    _storageService: null,
    _firestoreService: null,
    _errorHandler: null,

    setDependencies(storageService, firestoreService, errorHandler) {
        window.SalesService._storageService = storageService;
        window.SalesService._firestoreService = firestoreService;
        window.SalesService._errorHandler = errorHandler;
        console.log('✓ SalesService dependencies injected');
    },

    // Map Firestore doc to legacy shape
    mapToLegacy(doc) {
        if (!doc) return null;
        const id = doc.id || doc._id || ('inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
        
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
            ...doc
        };
    },

    // Get recent sales (limited query)
    async getRecentSales(opts) {
        opts = opts || {};
        const limit = opts.limit || 100;
        const forUserId = opts.forUserId || null;
        const cacheKey = forUserId ? ('SALES_USER_' + forUserId) : 'SALES_RECENT';
        
        try {
            // Try cache first (30 min TTL for sales)
            const cached = localStorage.getItem(cacheKey);
            if (cached && !opts.forceRefresh) {
                const parsed = JSON.parse(cached);
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < 30 * 60 * 1000) {
                    console.log('SalesService: Using cached recent sales');
                    return parsed.data || [];
                }
            }

            // Fetch from Firestore
            if (!window.db) {
                console.warn('SalesService: Firestore not ready, using cache');
                return cached ? (JSON.parse(cached).data || []) : [];
            }

            // Calculate current month dates
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const startOfMonth = `${year}-${month}-01`;
            const endOfMonth = new Date(year, now.getMonth() + 1, 0);
            const lastDay = String(endOfMonth.getDate()).padStart(2, '0');
            const endOfMonthStr = `${year}-${month}-${lastDay}`;

            console.log('SalesService: Fetching sales for current month ' + startOfMonth + ' to ' + endOfMonthStr + '...');
            let query = window.db.collection('sales')
                .where('date', '>=', startOfMonth)
                .where('date', '<=', endOfMonthStr)
                .orderBy('date', 'desc')
                .limit(limit);

            if (forUserId) {
                query = query.where('userId', '==', forUserId);
            }

            const snapshot = await query.get();
            const sales = snapshot.docs
                .map(doc => window.SalesService.mapToLegacy({ id: doc.id, ...doc.data() }))
                .filter(s => s && s.id);

            // Cache results
            localStorage.setItem(cacheKey, JSON.stringify({
                data: sales,
                timestamp: Date.now()
            }));

            console.log('SalesService: Fetched ' + sales.length + ' sales for current month');
            return sales;
        } catch (e) {
            console.error('SalesService: getRecentSales failed:', e);
            // Fallback to cache
            const cached = localStorage.getItem(cacheKey);
            return cached ? (JSON.parse(cached).data || []) : [];
        }
    },

    // CRITICAL: Save invoice with offline queue
    async saveInvoice(invoiceData) {
        try {
            if (!invoiceData) {
                throw new Error('Invalid invoice data');
            }

            const invoice = {
                ...invoiceData,
                createdAt: invoiceData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Try Firestore first if online
            if (window.db && navigator.onLine !== false) {
                try {
                    const docId = invoice.id || ('inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
                    await window.db.collection('sales').doc(docId).set(invoice);
                    console.log('✅ SalesService: Invoice ' + docId + ' saved to Firestore');
                    return { ok: true, id: docId, queued: false };
                } catch (serverError) {
                    console.warn('SalesService: Firestore save failed, queuing:', serverError.message);
                    // Fall through to queue
                }
            }

            // Add to queue
            console.log('SalesService: Adding invoice to offline queue');
            const queueId = this.addToQueue(invoice);
            return { ok: true, id: queueId, queued: true, message: 'Queued for sync' };
        } catch (e) {
            console.error('SalesService: saveInvoice failed:', e);
            return { ok: false, error: e.message };
        }
    },

    // Add to pending queue
    addToQueue(invoice) {
        const queue = this.getPendingQueue();
        const queueId = invoice.id || ('inv_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36));
        
        queue.push({
            ...invoice,
            id: queueId,
            _queuedAt: Date.now()
        });

        localStorage.setItem('pending_invoices', JSON.stringify(queue));
        console.log('SalesService: Invoice ' + queueId + ' queued (' + queue.length + ' pending)');
        return queueId;
    },

    // Get pending queue
    getPendingQueue() {
        try {
            const data = localStorage.getItem('pending_invoices');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    // Get pending count
    getPendingCount() {
        return this.getPendingQueue().length;
    },

    // Sync pending invoices
    async syncPendingInvoices() {
        const queue = this.getPendingQueue();
        
        if (queue.length === 0) {
            console.log('SalesService: No pending invoices');
            return { synced: 0, failed: 0, errors: [] };
        }

        console.log('SalesService: Syncing ' + queue.length + ' pending invoices...');
        
        const results = { synced: 0, failed: 0, errors: [] };
        const remaining = [];

        for (let i = 0; i < queue.length; i++) {
            const invoice = queue[i];
            try {
                if (!window.db) {
                    throw new Error('Firestore not available');
                }

                // Clean queue metadata
                const clean = { ...invoice };
                delete clean._queuedAt;
                delete clean._localTimestamp;

                await window.db.collection('sales').doc(invoice.id).set(clean);
                console.log('✅ Synced invoice ' + invoice.id);
                results.synced++;
            } catch (e) {
                console.error('❌ Failed to sync ' + invoice.id + ':', e.message);
                results.failed++;
                results.errors.push({ id: invoice.id, error: e.message });
                remaining.push(invoice);
            }
        }

        // Update queue
        localStorage.setItem('pending_invoices', JSON.stringify(remaining));
        console.log('SalesService: Sync complete - ' + results.synced + ' synced, ' + results.failed + ' failed');
        return results;
    },

    // Clear queue
    clearQueue() {
        localStorage.removeItem('pending_invoices');
        console.log('SalesService: Queue cleared');
    }
};

console.log('✓ SalesService defined');

// Auto-sync on connection restore
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', function() {
        console.log('🌐 Connection restored - auto-syncing pending invoices...');
        setTimeout(function() {
            if (window.SalesService && typeof window.SalesService.syncPendingInvoices === 'function') {
                window.SalesService.syncPendingInvoices().then(function(result) {
                    if (result.synced > 0) {
                        console.log('✅ Auto-sync: ' + result.synced + ' invoices synced');
                        try {
                            if (typeof customDialog === 'function') {
                                customDialog({
                                    title: 'تم المزامنة',
                                    message: 'تم رفع ' + result.synced + ' فاتورة معلقة للسيرفر بنجاح'
                                });
                            } else {
                                alert('تم رفع ' + result.synced + ' فاتورة معلقة');
                            }
                        } catch(e) {}
                    }
                }).catch(function(e) {
                    console.error('Auto-sync failed:', e);
                });
            }
        }, 2000); // Wait 2s after connection restore
    });
}
