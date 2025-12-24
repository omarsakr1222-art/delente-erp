// Tests for ProductsService cache-first behavior and mapping

// Globals
global.window = {};

// ErrorHandler
const ErrorHandler = require('../src/core/error-handler.js');
window.ErrorHandler = ErrorHandler;
global.ErrorHandler = ErrorHandler;

// localStorage mock
const storageMap = new Map();
const localStorageMock = {
  getItem(k){ return storageMap.get(k) || null; },
  setItem(k,v){ storageMap.set(k, String(v)); },
  removeItem(k){ storageMap.delete(k); },
  clear(){ storageMap.clear(); }
};
window.localStorage = localStorageMock;
global.localStorage = localStorageMock;

// Helpers stub
window.Helpers = { formatFileSize: (b)=>String(b) };

// Load StorageService
const StorageService = require('../src/services/storage.js');
window.StorageService = StorageService;
global.StorageService = StorageService;

// Mock FirestoreService
let serverProducts = [
  { id: 'p1', name: 'Cheese A', price: 50, unit: 'كجم' },
  { id: 'p2', name: 'Cheese B', sellPrice: 75, unit: 'كجم' }
];
window.FirestoreService = {
  async query(collection, opts){ if (collection !== 'products') return []; return serverProducts.map(r => ({ ...r })); }
};
global.FirestoreService = window.FirestoreService;

// Load ProductsService
const ProductsService = require('../src/services/products-service.js');

// Provide alert stub for ErrorHandler
global.alert = (msg) => { console.log('[ALERT]', msg); };

// Test helpers
let passed = 0, failed = 0;
function expect(name, cond, detail=''){ if (cond) { passed++; console.log('PASS -', name); } else { failed++; console.log('FAIL -', name, detail); } }

(async function run(){
  try {
    // Clear cache
    StorageService.remove(StorageService.KEYS.PRODUCTS);

    // 1) Initial fetch should hit server and cache
    const first = await ProductsService.getProducts({ maxAgeMs: 24*60*60*1000 });
    expect('Initial fetch length', first.length === 2);
    const cachedAfterFirst = StorageService.get(StorageService.KEYS.PRODUCTS, []);
    expect('Cache written after first fetch', cachedAfterFirst.length === 2);
    expect('Legacy fields present', first[0].name && typeof first[0].price === 'number');

    // 2) Modify server but with fresh cache: should return cached
    serverProducts = [
      { id: 'p1', name: 'Cheese A', price: 60, unit: 'كجم' }, // price changed on server
      { id: 'p2', name: 'Cheese B', sellPrice: 80, unit: 'كجم' }
    ];
    const second = await ProductsService.getProducts({ maxAgeMs: 24*60*60*1000 });
    expect('Cache-first returns cached price', second[0].price === 50);

    // 3) Force refresh should take server values
    const third = await ProductsService.getProducts({ forceRefresh: true });
    expect('Force refresh updates price', third[0].price === 60);
    const cachedAfterThird = StorageService.get(StorageService.KEYS.PRODUCTS, []);
    expect('Cache updated after refresh', cachedAfterThird[0].price === 60);

    console.log(`Passed: ${passed}, Failed: ${failed}`);
    process.exitCode = failed ? 1 : 0;
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  }
})();
