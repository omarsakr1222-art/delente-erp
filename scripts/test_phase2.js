// Phase 2 Test Harness
// Validates helpers, date, currency, validation, and storage services

// Minimal browser globals
global.window = {};

// localStorage mock
const storage = new Map();
const localStorageMock = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  },
  clear() {
    storage.clear();
  },
  key(i) {
    return Array.from(storage.keys())[i] || null;
  },
  get length() {
    return storage.size;
  }
};

global.localStorage = localStorageMock;
window.localStorage = localStorageMock;

// Minimal navigator for non-tested helpers
global.navigator = { userAgent: 'NodeTest' };
window.navigator = global.navigator;

// Require modules
const ErrorHandler = require('../src/core/error-handler.js');
window.ErrorHandler = ErrorHandler;
global.ErrorHandler = ErrorHandler;
const DateUtils = require('../src/utils/date.js');
const CurrencyUtils = require('../src/utils/currency.js');
const Helpers = require('../src/utils/helpers.js');
const StorageService = require('../src/services/storage.js');
const Validation = require('../src/utils/validation.js');

// Simple test runner
let passed = 0;
let failed = 0;
const results = [];

function expect(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ name, status: 'PASS' });
  } else {
    failed++;
    results.push({ name, status: 'FAIL', detail });
  }
}

(async function run() {
  try {
    // DateUtils
    expect('DateUtils.getISODateString', DateUtils.getISODateString('2025-12-20') === '2025-12-20');
    expect('DateUtils.nextPeriod', DateUtils.nextPeriod('2025-12') === '2026-01');
    expect('DateUtils.formatArabicDate', typeof DateUtils.formatArabicDate('2025-12-20') === 'string');

    // CurrencyUtils
    expect('CurrencyUtils.calculateTax', CurrencyUtils.calculateTax(100, 14) === 14);
    expect('CurrencyUtils.withTax', CurrencyUtils.withTax(100, 14) === 114);
    expect('CurrencyUtils.withoutTax', CurrencyUtils.withoutTax(114, 14) === 100);

    // Helpers (pure functions)
    const id1 = Helpers.generateId();
    const id2 = Helpers.generateId();
    expect('Helpers.generateId unique', id1 !== id2 && typeof id1 === 'string');

    const obj = { a: { b: 1 } };
    const clone = Helpers.deepClone(obj);
    clone.a.b = 2;
    expect('Helpers.deepClone immutability', obj.a.b === 1 && clone.a.b === 2);

    expect('Helpers.slugId basic', typeof Helpers.slugId('منتج 100% ممتاز!') === 'string');
    expect('Helpers.normalizeSpaces', Helpers.normalizeSpaces('  a   b   ') === 'a b');

    // Validation
    expect('Validation.isValidEmail', Validation.isValidEmail('test@example.com'));
    expect('Validation.isValidPhone 010', Validation.isValidPhone('01012345678'));
    expect('Validation.isValidPhone +20', Validation.isValidPhone('+201012345678'));
    expect('Validation.isValidTaxNumber 9 digits', Validation.isValidTaxNumber('123456789'));

    const sale = {
      customerId: 'c1',
      repName: 'rep',
      date: '2025-12-20',
      items: [{ productId: 'p1', quantity: 2, price: 50 }],
      total: 100
    };
    const vSale = Validation.validateSale(sale);
    expect('Validation.validateSale valid', vSale.valid === true, JSON.stringify(vSale.errors));

    const badSale = { customerId: '', repName: '', date: 'invalid', items: [], total: 'x' };
    const vBadSale = Validation.validateSale(badSale);
    expect('Validation.validateSale invalid', vBadSale.valid === false && vBadSale.errors.length >= 3);

    // StorageService
    // Non-critical key
    const user = { id: 'u1', name: 'Ahmed' };
    expect('Storage.set USERS', StorageService.set(StorageService.KEYS.USERS, [user]) === true);
    const usersRead = StorageService.get(StorageService.KEYS.USERS, []);
    expect('Storage.get USERS', Array.isArray(usersRead) && usersRead[0].id === 'u1');

    // Critical key backup test
    const saleV1 = [{ id: 's1', total: 100 }];
    const saleV2 = [{ id: 's1', total: 120 }];
    StorageService.set(StorageService.KEYS.SALES, saleV1);
    StorageService.set(StorageService.KEYS.SALES, saleV2); // should create backup of V1
    const backups = StorageService.getBackups(StorageService.KEYS.SALES);
    expect('Storage.getBackups SALES length', backups.length === 1);

    // Restore backup and verify
    StorageService.restoreFromBackup(StorageService.KEYS.SALES);
    const salesRestored = StorageService.get(StorageService.KEYS.SALES, []);
    expect('Storage.restoreFromBackup SALES', salesRestored[0].total === 100);

    // Summary
    console.log('Phase 2 Test Results');
    results.forEach(r => console.log(`${r.status} - ${r.name}${r.detail ? ' -> ' + r.detail : ''}`));
    console.log(`Passed: ${passed}, Failed: ${failed}`);

    if (failed > 0) {
      process.exitCode = 1;
    } else {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Test harness error:', err);
    process.exitCode = 1;
  }
})();
