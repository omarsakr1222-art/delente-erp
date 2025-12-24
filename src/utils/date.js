/**
 * Date Utilities
 * دوال التاريخ الموحدة
 */

const DateUtils = {
    /**
     * Format date as Arabic short date
     * @param {string|Date} dateString
     * @returns {string} - Format: ١٥/١٢/٢٠٢٥
     */
    formatArabicDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return '';
        }
    },

    /**
     * Format date and time in Arabic
     * @param {string|Date} dateString
     * @returns {string} - Format: ١٥/١٢/٢٠٢٥ ٣:٤٥ م
     */
    formatArabicDateTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return date.toLocaleString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return '';
        }
    },

    /**
     * Get ISO date string (YYYY-MM-DD)
     * @param {string|Date} input
     * @returns {string}
     */
    getISODateString(input) {
        try {
            const d = input instanceof Date ? input : new Date(input);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            return d.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    },

    /**
     * Get previous date (day before)
     * @param {string} dateString - Format: YYYY-MM-DD
     * @returns {string}
     */
    getPreviousDate(dateString) {
        try {
            const d = new Date(dateString);
            d.setDate(d.getDate() - 1);
            return this.getISODateString(d);
        } catch (e) {
            return dateString;
        }
    },

    /**
     * Format period (YYYY-MM)
     * @param {Date} dateObj
     * @returns {string}
     */
    formatPeriod(dateObj) {
        try {
            if (!dateObj) return '';
            const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
        } catch (e) {
            return '';
        }
    },

    /**
     * Get default previous month period
     * @returns {string} - Format: YYYY-MM
     */
    defaultPrevMonthPeriod() {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - 1);
        return this.formatPeriod(d);
    },

    /**
     * Convert period to date range
     * @param {string} period - Format: YYYY-MM
     * @returns {{start: Date, end: Date}}
     */
    periodToRange(period) {
        try {
            const [y, m] = period.split('-').map(Number);
            const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
            const end = new Date(y, m, 0, 23, 59, 59, 999);
            return { start, end };
        } catch (e) {
            return { start: new Date(), end: new Date() };
        }
    },

    /**
     * Get next period
     * @param {string} period - Format: YYYY-MM
     * @returns {string}
     */
    nextPeriod(period) {
        try {
            const [y, m] = period.split('-').map(Number);
            const d = new Date(y, m - 1, 1);
            d.setMonth(d.getMonth() + 1);
            return this.formatPeriod(d);
        } catch (e) {
            return period;
        }
    },

    /**
     * Check if date is today
     * @param {string|Date} dateString
     * @returns {boolean}
     */
    isToday(dateString) {
        try {
            const d = new Date(dateString);
            const today = new Date();
            return d.toDateString() === today.toDateString();
        } catch (e) {
            return false;
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
}
window.DateUtils = DateUtils;
