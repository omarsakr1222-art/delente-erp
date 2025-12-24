/**
 * Validation Utilities
 * دوال التحقق من صحة المدخلات
 */

const Validation = {
    /**
     * Validate email
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate Egyptian phone number
     * @param {string} phone
     * @returns {boolean}
     */
    isValidPhone(phone) {
        if (!phone) return false;
        // Egyptian format: 01xxxxxxxxx or +2001xxxxxxxxx
        const phoneRegex = /^(\+20|0)?1[0-2,5]{1}[0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s|-/g, ''));
    },

    /**
     * Validate Egyptian tax number (15 digits)
     * @param {string} taxNumber
     * @returns {boolean}
     */
    isValidTaxNumber(taxNumber) {
        if (!taxNumber) return false;
        const cleaned = taxNumber.replace(/\s|-/g, '');
        return /^\d{9}$/.test(cleaned); // 9 digits for Egyptian tax number
    },

    /**
     * Validate number
     * @param {any} value
     * @returns {boolean}
     */
    isValidNumber(value) {
        if (value === null || value === undefined || value === '') return false;
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Validate positive number
     * @param {any} value
     * @returns {boolean}
     */
    isValidPositiveNumber(value) {
        return this.isValidNumber(value) && parseFloat(value) > 0;
    },

    /**
     * Validate integer
     * @param {any} value
     * @returns {boolean}
     */
    isValidInteger(value) {
        return this.isValidNumber(value) && Number.isInteger(parseFloat(value));
    },

    /**
     * Validate date string (YYYY-MM-DD)
     * @param {string} dateString
     * @returns {boolean}
     */
    isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    },

    /**
     * Validate required field
     * @param {any} value
     * @returns {boolean}
     */
    isRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    },

    /**
     * Validate min length
     * @param {string} value
     * @param {number} minLength
     * @returns {boolean}
     */
    minLength(value, minLength) {
        if (!value) return false;
        return value.toString().length >= minLength;
    },

    /**
     * Validate max length
     * @param {string} value
     * @param {number} maxLength
     * @returns {boolean}
     */
    maxLength(value, maxLength) {
        if (!value) return true;
        return value.toString().length <= maxLength;
    },

    /**
     * Validate min value
     * @param {number} value
     * @param {number} min
     * @returns {boolean}
     */
    minValue(value, min) {
        if (!this.isValidNumber(value)) return false;
        return parseFloat(value) >= min;
    },

    /**
     * Validate max value
     * @param {number} value
     * @param {number} max
     * @returns {boolean}
     */
    maxValue(value, max) {
        if (!this.isValidNumber(value)) return false;
        return parseFloat(value) <= max;
    },

    /**
     * Validate range
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    inRange(value, min, max) {
        return this.minValue(value, min) && this.maxValue(value, max);
    },

    /**
     * Validate sale data
     * @param {object} sale
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validateSale(sale) {
        const errors = [];

        if (!sale) {
            errors.push('بيانات المبيعات مفقودة');
            return { valid: false, errors };
        }

        // Required fields
        if (!this.isRequired(sale.customerId)) {
            errors.push('العميل مطلوب');
        }

        if (!this.isRequired(sale.repName)) {
            errors.push('اسم المندوب مطلوب');
        }

        if (!this.isValidDate(sale.date)) {
            errors.push('تاريخ غير صحيح');
        }

        // Items validation
        if (!Array.isArray(sale.items) || sale.items.length === 0) {
            errors.push('يجب إضافة منتج واحد على الأقل');
        } else {
            sale.items.forEach((item, index) => {
                if (!this.isRequired(item.productId)) {
                    errors.push(`المنتج ${index + 1}: اسم المنتج مطلوب`);
                }
                if (!this.isValidPositiveNumber(item.quantity)) {
                    errors.push(`المنتج ${index + 1}: الكمية يجب أن تكون أكبر من صفر`);
                }
                if (!this.isValidNumber(item.price)) {
                    errors.push(`المنتج ${index + 1}: السعر غير صحيح`);
                }
            });
        }

        // Total validation
        if (!this.isValidNumber(sale.total)) {
            errors.push('الإجمالي غير صحيح');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate customer data
     * @param {object} customer
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validateCustomer(customer) {
        const errors = [];

        if (!customer) {
            errors.push('بيانات العميل مفقودة');
            return { valid: false, errors };
        }

        // Required fields
        if (!this.isRequired(customer.name)) {
            errors.push('اسم العميل مطلوب');
        }

        // Optional but must be valid if provided
        if (customer.phone && !this.isValidPhone(customer.phone)) {
            errors.push('رقم الهاتف غير صحيح');
        }

        if (customer.taxNumber && !this.isValidTaxNumber(customer.taxNumber)) {
            errors.push('الرقم الضريبي غير صحيح');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Validate product data
     * @param {object} product
     * @returns {{valid: boolean, errors: Array<string>}}
     */
    validateProduct(product) {
        const errors = [];

        if (!product) {
            errors.push('بيانات المنتج مفقودة');
            return { valid: false, errors };
        }

        // Required fields
        if (!this.isRequired(product.name)) {
            errors.push('اسم المنتج مطلوب');
        }

        // Price validation (if exists)
        if (product.price !== undefined && product.price !== null) {
            if (!this.isValidNumber(product.price)) {
                errors.push('السعر غير صحيح');
            } else if (parseFloat(product.price) < 0) {
                errors.push('السعر يجب أن يكون أكبر من أو يساوي صفر');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Sanitize input (remove dangerous characters)
     * @param {string} input
     * @returns {string}
     */
    sanitize(input) {
        if (!input) return '';
        return input.toString()
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    },

    /**
     * Validate and sanitize form data
     * @param {object} formData
     * @param {object} rules - Validation rules
     * @returns {{valid: boolean, errors: object, sanitized: object}}
     */
    validateForm(formData, rules) {
        const errors = {};
        const sanitized = {};

        for (let field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];

            // Required check
            if (fieldRules.required && !this.isRequired(value)) {
                errors[field] = fieldRules.message || `${field} مطلوب`;
                continue;
            }

            // Skip other validations if not required and empty
            if (!fieldRules.required && !value) {
                sanitized[field] = value;
                continue;
            }

            // Type validation
            if (fieldRules.type === 'email' && !this.isValidEmail(value)) {
                errors[field] = 'البريد الإلكتروني غير صحيح';
            } else if (fieldRules.type === 'phone' && !this.isValidPhone(value)) {
                errors[field] = 'رقم الهاتف غير صحيح';
            } else if (fieldRules.type === 'number' && !this.isValidNumber(value)) {
                errors[field] = 'يجب إدخال رقم صحيح';
            }

            // Min/Max validations
            if (fieldRules.min !== undefined && !this.minValue(value, fieldRules.min)) {
                errors[field] = `القيمة يجب أن تكون أكبر من أو تساوي ${fieldRules.min}`;
            }

            if (fieldRules.max !== undefined && !this.maxValue(value, fieldRules.max)) {
                errors[field] = `القيمة يجب أن تكون أصغر من أو تساوي ${fieldRules.max}`;
            }

            // Sanitize
            if (fieldRules.sanitize !== false) {
                sanitized[field] = this.sanitize(value);
            } else {
                sanitized[field] = value;
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors,
            sanitized: sanitized
        };
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
}
window.Validation = Validation;
