// Test: Offline fallback - products load from cache without server

// Globals
global.window = {};
global.localStorage = (() => {
  const map = new Map();
  return {
    getItem(k){ return map.get(k) || null; },
    setItem(k,v){ map.set(k, String(v)); },
    removeItem(k){ map.delete(k); },
    clear(){ map.clear(); }
  };
})();
window.localStorage = global.localStorage;

// ErrorHandler
const ErrorHandler = require('../src/core/error-handler.js');
window.ErrorHandler = ErrorHandler;
global.ErrorHandler = ErrorHandler;

// Helpers stub
window.Helpers = { formatFileSize: (b)=>String(b) };
global.Helpers = window.Helpers;

// StorageService
const StorageService = require('../src/services/storage.js');
window.StorageService = StorageService;
global.StorageService = StorageService;

// Mock FirestoreService (will be unavailable in offline test)
let serverAvailable = false;
window.FirestoreService = {
  async query(){ if (!serverAvailable) throw new Error('Server unavailable'); return []; }
};
global.FirestoreService = window.FirestoreService;

// Mock alert
global.alert = (msg) => console.log('[ALERT]', msg);

// ProductsService
const ProductsService = require('../src/services/products-service.js');
window.ProductsService = ProductsService;

(async function run(){
  console.log('\n=== Offline Fallback Test ===\n');
  
  try {
    // Scenario 1: Populate cache first (offline simulation)
    console.log('--- Scenario 1: Populate cache (server available) ---');
    serverAvailable = true;
    const testProducts = [
      { id: 'p1', name: 'Product 1', price: 100, unit: 'unit1' },
      { id: 'p2', name: 'Product 2', price: 200, unit: 'unit2' }
    ];
    
    // Directly set cache to simulate prior data
    StorageService.set(StorageService.KEYS.PRODUCTS, testProducts);
    StorageService.updateTimestamp(StorageService.KEYS.PRODUCTS);
    console.log('✓ Products cached (simulating prior fetch)');
    
    // Scenario 2: Go offline and load from cache
    console.log('\n--- Scenario 2: Load from cache (server unavailable) ---');
    serverAvailable = false;
    
    const offlineProducts = await ProductsService.getProducts({ maxAgeMs: 24*60*60*1000 });
    
    const scenario2Pass = offlineProducts.length === 2 && 
                          offlineProducts[0].name === 'Product 1' &&
                          offlineProducts[0].price === 100;
    
    console.log(`Scenario 2: ${scenario2Pass ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`  - Products returned: ${offlineProducts.length}`);
    if (offlineProducts.length > 0) {
      console.log(`  - First product: ${offlineProducts[0].name} (price: ${offlineProducts[0].price})`);
    }
    
    // Scenario 3: initializeAppForUser simulation
    console.log('\n--- Scenario 3: initializeAppForUser simulation (offline) ---');
    
    const state = { products: [], customers: [], sales: [] };
    
    try {
      if (typeof window.ProductsService === 'object' && typeof window.ProductsService.getProducts === 'function') {
        console.log('Loading products with Cache-First strategy...');
        const products = await window.ProductsService.getProducts({ maxAgeMs: 6 * 60 * 60 * 1000 });
        if (Array.isArray(products) && products.length > 0) {
          state.products = products;
          console.log(`✅ Loaded ${products.length} products from cache`);
        } else {
          console.warn('No products loaded, using empty array');
          state.products = [];
        }
      }
    } catch(e) {
      console.error('Failed to load products:', e.message);
      state.products = [];
    }
    
    const scenario3Pass = state.products.length === 2 && state.products[0].price !== undefined;
    console.log(`Scenario 3: ${scenario3Pass ? 'PASS ✅' : 'FAIL ❌'}`);
    console.log(`  - window.state.products would have: ${state.products.length} items`);
    
    // Final result
    const allPass = scenario2Pass && scenario3Pass;
    console.log(`\n🎯 Overall: ${allPass ? 'ALL PASS ✅' : 'SOME FAILED ❌'}`);
    
    process.exitCode = allPass ? 0 : 1;
  } catch(err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  }
})();
