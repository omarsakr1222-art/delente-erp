/**
 * Centralized Error Handler
 * معالج أخطاء مركزي موحد
 */

class ErrorHandler {
    /**
     * Handle any error with context
     * @param {Error} error - The error object
     * @param {string} context - Where the error occurred
     * @param {boolean} showUser - Whether to show message to user
     */
    static handle(error, context = 'Unknown', showUser = true) {
        // Log to console with context
        console.error(`[${context}]`, error);

        // Show user-friendly message if requested
        if (showUser) {
            this.showUserMessage(error, context);
        }

        // Log to monitoring service if configured
        this.logToMonitoring(error, context);
    }

    /**
     * Show user-friendly error message
     */
    static showUserMessage(error, context) {
        const message = this.getUserFriendlyMessage(error, context);
        
        // Use custom dialog if available, otherwise alert
        if (typeof customDialog === 'function') {
            customDialog({
                title: 'خطأ',
                message: message,
                isConfirm: false
            });
        } else {
            alert(message);
        }
    }

    /**
     * Get user-friendly error message in Arabic
     */
    static getUserFriendlyMessage(error, context) {
        // Firebase errors
        if (error.code) {
            const firebaseMessages = {
                'permission-denied': 'ليس لديك صلاحية لهذا الإجراء',
                'not-found': 'البيانات المطلوبة غير موجودة',
                'already-exists': 'البيانات موجودة بالفعل',
                'unauthenticated': 'يجب تسجيل الدخول أولاً',
                'network-request-failed': 'خطأ في الاتصال بالإنترنت'
            };
            
            if (firebaseMessages[error.code]) {
                return firebaseMessages[error.code];
            }
        }

        // Network errors
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            return 'خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى.';
        }

        // Validation errors
        if (error.name === 'ValidationError') {
            return error.message || 'بيانات غير صحيحة';
        }

        // Generic error with context
        return `حدث خطأ في ${this.getContextInArabic(context)}: ${error.message || 'خطأ غير معروف'}`;
    }

    /**
     * Translate context to Arabic
     */
    static getContextInArabic(context) {
        const translations = {
            'Sales': 'المبيعات',
            'Customers': 'العملاء',
            'Products': 'المنتجات',
            'Inventory': 'المخزون',
            'Pricing': 'الأسعار',
            'Tax': 'الضرائب',
            'Print': 'الطباعة',
            'Bluetooth': 'البلوتوث',
            'Firebase': 'قاعدة البيانات',
            'Storage': 'التخزين',
            'Unknown': 'عملية غير محددة'
        };

        return translations[context] || context;
    }

    /**
     * Log error to monitoring service (placeholder for future)
     */
    static logToMonitoring(error, context) {
        // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
        // For now, just log to localStorage for debugging
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                context: context,
                message: error.message,
                stack: error.stack,
                userAgent: navigator.userAgent
            };

            const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
            logs.push(errorLog);

            // Keep only last 50 errors
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }

            localStorage.setItem('error_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Failed to log error to storage', e);
        }
    }

    /**
     * Wrapper for async functions with automatic error handling
     * @param {Function} fn - Async function to execute
     * @param {string} context - Context for error reporting
     * @returns {Promise<any>}
     */
    static async asyncWrapper(fn, context = 'Unknown') {
        try {
            return await fn();
        } catch (error) {
            this.handle(error, context);
            throw error; // Re-throw for caller to handle if needed
        }
    }

    /**
     * Wrapper for sync functions with automatic error handling
     * @param {Function} fn - Function to execute
     * @param {string} context - Context for error reporting
     * @returns {any}
     */
    static syncWrapper(fn, context = 'Unknown') {
        try {
            return fn();
        } catch (error) {
            this.handle(error, context);
            throw error;
        }
    }

    /**
     * Get all logged errors (for debugging)
     */
    static getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('error_logs') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Clear error logs
     */
    static clearErrorLogs() {
        localStorage.removeItem('error_logs');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

// Make available globally
window.ErrorHandler = ErrorHandler;
