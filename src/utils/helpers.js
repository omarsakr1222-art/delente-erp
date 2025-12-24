/**
 * General Helper Utilities
 * دوال مساعدة عامة
 */

const Helpers = {
    /**
     * Generate unique ID
     * @returns {string}
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Normalize spaces in string
     * @param {string} s
     * @returns {string}
     */
    normalizeSpaces(s) {
        return (s || '').toString().replace(/\s+/g, ' ').trim();
    },

    /**
     * Create slug from name (for IDs)
     * @param {string} name
     * @param {string} fallback
     * @returns {string}
     */
    slugId(name, fallback = 'item') {
        if (!name) return fallback;
        return this.normalizeSpaces(name)
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} s
     * @returns {string}
     */
    escapeHtml(s) {
        if (!s) return '';
        return s.toString()
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    /**
     * Debounce function execution
     * @param {Function} func
     * @param {number} wait - milliseconds
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Deep clone object
     * @param {any} obj
     * @returns {any}
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            console.warn('Deep clone failed, using shallow copy', e);
            return { ...obj };
        }
    },

    /**
     * Check if object is empty
     * @param {object} obj
     * @returns {boolean}
     */
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return !obj;
    },

    /**
     * Get nested property safely
     * @param {object} obj
     * @param {string} path - e.g., 'user.profile.name'
     * @param {any} defaultValue
     * @returns {any}
     */
    getNestedProperty(obj, path, defaultValue = null) {
        if (!obj || !path) return defaultValue;
        
        try {
            const keys = path.split('.');
            let result = obj;
            
            for (const key of keys) {
                if (result === null || result === undefined) return defaultValue;
                result = result[key];
            }
            
            return result !== undefined ? result : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },

    /**
     * Set nested property safely
     * @param {object} obj
     * @param {string} path
     * @param {any} value
     */
    setNestedProperty(obj, path, value) {
        if (!obj || !path) return;
        
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    },

    /**
     * Sort array by property
     * @param {Array} array
     * @param {string} property
     * @param {string} direction - 'asc' or 'desc'
     * @returns {Array}
     */
    sortBy(array, property, direction = 'asc') {
        if (!Array.isArray(array)) return array;
        
        return array.sort((a, b) => {
            const aVal = this.getNestedProperty(a, property);
            const bVal = this.getNestedProperty(b, property);
            
            if (aVal === bVal) return 0;
            
            const comparison = aVal > bVal ? 1 : -1;
            return direction === 'asc' ? comparison : -comparison;
        });
    },

    /**
     * Group array by property
     * @param {Array} array
     * @param {string} property
     * @returns {object}
     */
    groupBy(array, property) {
        if (!Array.isArray(array)) return {};
        
        return array.reduce((groups, item) => {
            const key = this.getNestedProperty(item, property);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },

    /**
     * Remove duplicates from array
     * @param {Array} array
     * @param {string} property - Optional: property to check uniqueness
     * @returns {Array}
     */
    unique(array, property = null) {
        if (!Array.isArray(array)) return array;
        
        if (property) {
            const seen = new Set();
            return array.filter(item => {
                const value = this.getNestedProperty(item, property);
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        
        return [...new Set(array)];
    },

    /**
     * Wait for specified time
     * @param {number} ms
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Retry async function with exponential backoff
     * @param {Function} fn - Async function to retry
     * @param {number} maxRetries
     * @param {number} delay - Initial delay in ms
     * @returns {Promise}
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await this.sleep(delay * Math.pow(2, i));
            }
        }
    },

    /**
     * Format file size
     * @param {number} bytes
     * @returns {string}
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Copy text to clipboard
     * @param {string} text
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            }
        } catch (e) {
            console.error('Copy to clipboard failed', e);
            return false;
        }
    },

    /**
     * Download text as file
     * @param {string} content
     * @param {string} filename
     * @param {string} mimeType
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Check if running on mobile
     * @returns {boolean}
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Get browser info
     * @returns {object}
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        
        if (ua.includes('Chrome')) browserName = 'Chrome';
        else if (ua.includes('Safari')) browserName = 'Safari';
        else if (ua.includes('Firefox')) browserName = 'Firefox';
        else if (ua.includes('Edge')) browserName = 'Edge';
        else if (ua.includes('MSIE') || ua.includes('Trident')) browserName = 'IE';
        
        return {
            name: browserName,
            isMobile: this.isMobile(),
            userAgent: ua
        };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}
window.Helpers = Helpers;
