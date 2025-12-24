/**
 * Currency Utilities
 * دوال العملة الموحدة
 */

const CurrencyUtils = {
    /**
     * Format number as currency (Egyptian Pounds)
     * @param {number} amount
     * @param {number} decimals - Number of decimal places (default: 2)
     * @returns {string} - Format: ١٢٣٫٤٥ ج.م
     */
    formatCurrency(amount, decimals = 2) {
        if (amount == null || isNaN(amount)) return '٠٫٠٠ ج.م';
        
        try {
            const num = Number(amount);
            return new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(num);
        } catch (e) {
            return `${amount.toFixed(decimals)} ج.م`;
        }
    },

    /**
     * Format number with thousands separator
     * @param {number} num
     * @returns {string}
     */
    formatNumber(num) {
        if (num == null || isNaN(num)) return '٠';
        
        try {
            return new Intl.NumberFormat('ar-EG').format(num);
        } catch (e) {
            return String(num);
        }
    },

    /**
     * Format number in English (for calculations)
     * @param {number} value
     * @returns {string}
     */
    formatNumberEN(value) {
        if (value == null || isNaN(value)) return '0';
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    },

    /**
     * Parse localized number string to number
     * @param {string} str
     * @returns {number}
     */
    parseLocalizedNumber(str) {
        if (!str) return 0;
        try {
            // Remove Arabic/English separators and convert
            const cleaned = String(str)
                .replace(/[٬,]/g, '') // Remove thousands separators
                .replace(/[٫.]/g, '.') // Normalize decimal point
                .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); // Arabic to English digits
            
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Round to 2 decimal places
     * @param {number} n
     * @returns {number}
     */
    round2(n) {
        return Math.round((n + Number.EPSILON) * 100) / 100;
    },

    /**
     * Calculate percentage
     * @param {number} value
     * @param {number} total
     * @returns {number}
     */
    calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return this.round2((value / total) * 100);
    },

    /**
     * Apply percentage to amount
     * @param {number} amount
     * @param {number} percentage
     * @returns {number}
     */
    applyPercentage(amount, percentage) {
        return this.round2(amount * (percentage / 100));
    },

    /**
     * Calculate tax amount
     * @param {number} amount - Base amount
     * @param {number} taxRate - Tax rate percentage (e.g., 14 for 14%)
     * @returns {number}
     */
    calculateTax(amount, taxRate) {
        return this.round2(amount * (taxRate / 100));
    },

    /**
     * Calculate amount with tax included
     * @param {number} baseAmount
     * @param {number} taxRate
     * @returns {number}
     */
    withTax(baseAmount, taxRate) {
        const taxAmount = this.calculateTax(baseAmount, taxRate);
        return this.round2(baseAmount + taxAmount);
    },

    /**
     * Calculate base amount from total (tax inclusive)
     * @param {number} totalAmount
     * @param {number} taxRate
     * @returns {number}
     */
    withoutTax(totalAmount, taxRate) {
        return this.round2(totalAmount / (1 + taxRate / 100));
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurrencyUtils;
}
window.CurrencyUtils = CurrencyUtils;
