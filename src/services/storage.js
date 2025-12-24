/**
 * LocalStorage Service - CRITICAL
 * خدمة التخزين المحلي - حماية بيانات المناديب
 * 
 * ⚠️ هذا الملف مسؤول عن كل عمليات LocalStorage
 * أي خطأ هنا قد يؤدي لفقدان البيانات - يُرجى الحذر الشديد
 */

const StorageService = {
    // Keys used in the application
    KEYS: {
        SALES: 'sales',
        CUSTOMERS: 'customers',
        PRODUCTS: 'products',
        PRICE_LISTS: 'priceLists',
        COST_RAW: 'cost_raw',
        COST_PACK: 'cost_pack',
        COST_FINISHED: 'cost_finished',
        COST_OPS: 'cost_ops',
        STOCK_BALANCES: 'stockBalances',
        CHAINS: 'chains',
        PROMOTIONS: 'promotions',
        DISPATCH_NOTES: 'dispatchNotes',
        USERS: 'app_users',
        CURRENT_USER: 'app_current_user',
        ACTIVE_PERIOD: 'activePeriod',
        CLOSED_PERIODS: 'closedPeriods',
        BACKUPS: 'localBackups',
        ERROR_LOGS: 'error_logs',
        GPS_ENABLED: 'gps_sharing_enabled',
        LAST_SYNC: 'lastSyncTimestamp'
    },

    /**
     * Get item from localStorage with error handling
     * @param {string} key
     * @param {any} defaultValue - Value to return if not found or error
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            
            // Try to parse as JSON
            try {
                return JSON.parse(item);
            } catch (e) {
                // Return as string if not valid JSON
                return item;
            }
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.get', false);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with error handling and validation
     * @param {string} key
     * @param {any} value
     * @returns {boolean} - Success status
     */
    set(key, value) {
        try {
            // Create backup before overwriting critical data
            if (this.isCriticalKey(key)) {
                this.createBackupBeforeWrite(key);
            }

            // Serialize value
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            
            // Check storage quota
            if (!this.checkQuota(serialized.length)) {
                console.warn('LocalStorage quota exceeded, cleaning old data...');
                this.cleanOldData();
            }

            // Write to storage
            localStorage.setItem(key, serialized);
            
            // Update last modified timestamp
            this.updateTimestamp(key);
            
            return true;
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded!');
                this.handleQuotaExceeded(key, value);
            } else {
                ErrorHandler.handle(error, 'Storage.set', true);
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
        try {
            // Create backup before removing critical data
            if (this.isCriticalKey(key)) {
                this.createBackupBeforeWrite(key);
            }

            localStorage.removeItem(key);
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.remove', false);
            return false;
        }
    },

    /**
     * Clear all localStorage (use with extreme caution!)
     * @param {boolean} keepBackups - Whether to keep backup data
     */
    clear(keepBackups = true) {
        try {
            if (keepBackups) {
                // Save backups before clearing
                const backups = this.get(this.KEYS.BACKUPS, []);
                localStorage.clear();
                this.set(this.KEYS.BACKUPS, backups);
            } else {
                localStorage.clear();
            }
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.clear', true);
            return false;
        }
    },

    /**
     * Check if key exists
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Get all keys in localStorage
     * @returns {Array<string>}
     */
    getAllKeys() {
        try {
            return Object.keys(localStorage);
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.getAllKeys', false);
            return [];
        }
    },

    /**
     * Get storage usage info
     * @returns {object}
     */
    getUsageInfo() {
        try {
            let totalSize = 0;
            const items = {};

            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    items[key] = size;
                }
            }

            return {
                totalSize: totalSize,
                totalSizeFormatted: Helpers.formatFileSize(totalSize * 2), // *2 for UTF-16
                itemCount: Object.keys(items).length,
                items: items,
                quotaEstimate: '5-10 MB' // Most browsers
            };
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.getUsageInfo', false);
            return { totalSize: 0, itemCount: 0, items: {} };
        }
    },

    /**
     * Check if key is critical (requires backup)
     * @param {string} key
     * @returns {boolean}
     */
    isCriticalKey(key) {
        const criticalKeys = [
            this.KEYS.SALES,
            this.KEYS.CUSTOMERS,
            this.KEYS.PRODUCTS,
            this.KEYS.PRICE_LISTS,
            this.KEYS.DISPATCH_NOTES
        ];
        return criticalKeys.includes(key);
    },

    /**
     * Create backup before writing critical data
     * @param {string} key
     */
    createBackupBeforeWrite(key) {
        try {
            const existingData = localStorage.getItem(key);
            if (!existingData) return;

            const backups = this.get(this.KEYS.BACKUPS, []);
            
            backups.push({
                key: key,
                data: existingData,
                timestamp: new Date().toISOString(),
                type: 'auto'
            });

            // Keep only last 10 backups per key
            const keyBackups = backups.filter(b => b.key === key);
            if (keyBackups.length > 10) {
                const toKeep = backups.filter(b => b.key !== key);
                const recentKeyBackups = keyBackups.slice(-10);
                this.set(this.KEYS.BACKUPS, [...toKeep, ...recentKeyBackups]);
            } else {
                this.set(this.KEYS.BACKUPS, backups);
            }
        } catch (error) {
            console.warn('Backup creation failed', error);
        }
    },

    /**
     * Restore from backup
     * @param {string} key
     * @param {string} timestamp - Optional: specific backup timestamp
     * @returns {boolean}
     */
    restoreFromBackup(key, timestamp = null) {
        try {
            const backups = this.get(this.KEYS.BACKUPS, []);
            let backup;

            if (timestamp) {
                backup = backups.find(b => b.key === key && b.timestamp === timestamp);
            } else {
                // Get most recent backup for this key
                const keyBackups = backups.filter(b => b.key === key);
                backup = keyBackups[keyBackups.length - 1];
            }

            if (!backup) {
                console.warn('No backup found for key:', key);
                return false;
            }

            localStorage.setItem(key, backup.data);
            console.log('✅ Restored from backup:', key, backup.timestamp);
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.restoreFromBackup', true);
            return false;
        }
    },

    /**
     * Get all backups for a key
     * @param {string} key
     * @returns {Array}
     */
    getBackups(key) {
        const backups = this.get(this.KEYS.BACKUPS, []);
        return backups.filter(b => b.key === key);
    },

    /**
     * Check if there's enough quota for data
     * @param {number} requiredSize
     * @returns {boolean}
     */
    checkQuota(requiredSize) {
        const usage = this.getUsageInfo();
        const maxQuota = 5 * 1024 * 1024; // 5MB estimate
        return (usage.totalSize + requiredSize) < maxQuota;
    },

    /**
     * Handle quota exceeded error
     * @param {string} key
     * @param {any} value
     */
    handleQuotaExceeded(key, value) {
        try {
            // Strategy 1: Clean old backups
            console.log('Cleaning old backups...');
            const backups = this.get(this.KEYS.BACKUPS, []);
            if (backups.length > 5) {
                this.set(this.KEYS.BACKUPS, backups.slice(-5));
            }

            // Strategy 2: Clean error logs
            console.log('Cleaning error logs...');
            this.remove(this.KEYS.ERROR_LOGS);

            // Strategy 3: Try to write again
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            console.log('✅ Successfully wrote after cleanup');
        } catch (error) {
            // Last resort: Show error to user
            ErrorHandler.handle(
                new Error('مساحة التخزين ممتلئة. يُرجى مسح بعض البيانات القديمة.'),
                'Storage.QuotaExceeded',
                true
            );
        }
    },

    /**
     * Clean old data to free up space
     */
    cleanOldData() {
        try {
            // Remove old error logs
            this.remove(this.KEYS.ERROR_LOGS);

            // Keep only last 3 backups
            const backups = this.get(this.KEYS.BACKUPS, []);
            if (backups.length > 3) {
                this.set(this.KEYS.BACKUPS, backups.slice(-3));
            }

            console.log('✅ Cleaned old data');
        } catch (error) {
            console.warn('Failed to clean old data', error);
        }
    },

    /**
     * Update last modified timestamp for key
     * @param {string} key
     */
    updateTimestamp(key) {
        try {
            const timestamps = this.get('_timestamps', {});
            timestamps[key] = new Date().toISOString();
            localStorage.setItem('_timestamps', JSON.stringify(timestamps));
        } catch (error) {
            // Silently fail - not critical
        }
    },

    /**
     * Get last modified timestamp for key
     * @param {string} key
     * @returns {string|null}
     */
    getTimestamp(key) {
        try {
            const timestamps = this.get('_timestamps', {});
            return timestamps[key] || null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Export all data as JSON
     * @returns {string}
     */
    exportAll() {
        try {
            const data = {};
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && !key.startsWith('_')) {
                    data[key] = this.get(key);
                }
            }
            return JSON.stringify(data, null, 2);
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.exportAll', true);
            return '{}';
        }
    },

    /**
     * Import data from JSON
     * @param {string} jsonData
     * @returns {boolean}
     */
    importAll(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Create full backup before import
            const fullBackup = this.exportAll();
            this.set('_import_backup', fullBackup);

            // Import data
            for (let key in data) {
                this.set(key, data[key]);
            }

            console.log('✅ Data imported successfully');
            return true;
        } catch (error) {
            ErrorHandler.handle(error, 'Storage.importAll', true);
            return false;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
}
window.StorageService = StorageService;
