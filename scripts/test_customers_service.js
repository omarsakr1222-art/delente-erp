/**
 * Test: CustomersService - Cache-First Customer Loading
 * Test 6 scenarios:
 * 1. Initial fetch from server (cold cache)
 * 2. Cache-first: uses cache on second call
 * 3. Cache-first with stale cache: refetches from server
 * 4. Force refresh: ignores fresh cache, fetches from server
 * 5. Server error: falls back to cache gracefully
 * 6. Offline (no cache): returns empty array
 */

// Mock window for Node.js
if (typeof window === 'undefined') {
  global.window = {};
}

const CustomersService = require('../src/services/customers-service.js');

// ============ Mock Setup ============

class MockStorage {
  constructor() {
    this.data = {};
  }
  get(key) {
    return this.data[key];
  }
  set(key, value) {
    this.data[key] = value;
  }
  remove(key) {
    delete this.data[key];
  }
  has(key) {
    return key in this.data;
  }
}

class MockFirestoreService {
  constructor(shouldFail = false, docs = []) {
    this.shouldFail = shouldFail;
    this.docs = docs;
    this.callCount = 0;
  }
  async query(collection, opts) {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Firestore query failed');
    }
    return this.docs;
  }
}

class MockErrorHandler {
  handle(error, context, showAlert) {
    // Silently handle for tests
  }
}

// ============ Helper Functions ============

function createTestCustomer(id, name, phone) {
  return {
    id,
    name,
    phone,
    address: `Address for ${name}`,
    balance: Math.random() * 10000,
    email: `${id}@test.com`,
    taxNumber: `TAX${id}`,
    category: 'normal',
    notes: `Test customer ${name}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
}

// ============ Tests ============

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Initial fetch from server (cold cache)
  try {
    console.log('\n[Test 1] Initial fetch from server (cold cache)');
    const storage = new MockStorage();
    const mockDocs = [
      createTestCustomer('cust1', 'أحمد محمد', '0123456789'),
      createTestCustomer('cust2', 'فاطمة علي', '0987654321'),
      createTestCustomer('cust3', 'محمود حسن', '0555555555')
    ];
    const firestore = new MockFirestoreService(false, mockDocs);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    if (
      Array.isArray(customers) &&
      customers.length === 3 &&
      customers[0].name === 'أحمد محمد' &&
      customers[0].phone === '0123456789' &&
      firestore.callCount === 1
    ) {
      console.log('✅ PASS: Fetched 3 customers from server, cache updated');
      passed++;
    } else {
      console.log('❌ FAIL: Expected 3 customers with correct mapping');
      console.log('Result:', customers);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 2: Cache-first - second call uses cache
  try {
    console.log('\n[Test 2] Cache-first: second call uses cache');
    const storage = new MockStorage();
    const mockDocs = [
      createTestCustomer('cust1', 'أحمد محمد', '0123456789')
    ];
    const firestore = new MockFirestoreService(false, mockDocs);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // First call: fetch from server
    await window.CustomersService.getCustomers({ forceRefresh: true });
    const callsAfterFirst = firestore.callCount;

    // Second call: should use cache
    const customers = await window.CustomersService.getCustomers({ forceRefresh: false });

    if (
      Array.isArray(customers) &&
      customers.length === 1 &&
      customers[0].phone === '0123456789' &&
      firestore.callCount === callsAfterFirst // No additional call
    ) {
      console.log('✅ PASS: Second call used cache without fetching from server');
      passed++;
    } else {
      console.log('❌ FAIL: Expected cache to be used on second call');
      console.log('Firestore calls:', firestore.callCount, 'Expected:', callsAfterFirst);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 3: Stale cache - refetches from server
  try {
    console.log('\n[Test 3] Stale cache (age > maxAge): refetches from server');
    const storage = new MockStorage();
    const mockDocs = [
      createTestCustomer('cust1', 'أحمد محمد', '0123456789')
    ];
    const firestore = new MockFirestoreService(false, mockDocs);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // First call: populate cache
    await window.CustomersService.getCustomers({ forceRefresh: true });
    const callsAfterFirst = firestore.callCount;

    // Manually age the cache (make timestamp old)
    const cached = storage.get('CUSTOMERS');
    if (cached) {
      cached.timestamp = Date.now() - (8 * 60 * 60 * 1000); // 8 hours ago
    }

    // Second call with short maxAge should refetch
    const customers = await window.CustomersService.getCustomers({ 
      forceRefresh: false,
      maxAgeMs: 1 * 60 * 60 * 1000 // 1 hour TTL
    });

    if (
      Array.isArray(customers) &&
      firestore.callCount === callsAfterFirst + 1 // Additional call made
    ) {
      console.log('✅ PASS: Stale cache detected, refetched from server');
      passed++;
    } else {
      console.log('❌ FAIL: Expected refetch on stale cache');
      console.log('Firestore calls:', firestore.callCount, 'Expected:', callsAfterFirst + 1);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 4: Force refresh - ignores fresh cache
  try {
    console.log('\n[Test 4] Force refresh: ignores fresh cache');
    const storage = new MockStorage();
    const mockDocs = [
      createTestCustomer('cust1', 'أحمد محمد', '0123456789')
    ];
    const firestore = new MockFirestoreService(false, mockDocs);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // First call: populate cache
    await window.CustomersService.getCustomers({ forceRefresh: true });
    const callsAfterFirst = firestore.callCount;

    // Second call with forceRefresh should fetch again
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    if (
      Array.isArray(customers) &&
      firestore.callCount === callsAfterFirst + 1 // Additional call made
    ) {
      console.log('✅ PASS: forceRefresh ignored cache and fetched from server');
      passed++;
    } else {
      console.log('❌ FAIL: Expected force refresh to fetch from server');
      console.log('Firestore calls:', firestore.callCount, 'Expected:', callsAfterFirst + 1);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 5: Server error - falls back to cache gracefully
  try {
    console.log('\n[Test 5] Server error: falls back to cache');
    const storage = new MockStorage();
    const mockDocs = [
      createTestCustomer('cust1', 'أحمد محمد', '0123456789')
    ];
    const firestore = new MockFirestoreService(false, mockDocs);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // First call: populate cache with valid data
    const firstCall = await window.CustomersService.getCustomers({ forceRefresh: true });
    const cachedCount = firstCall.length;

    // Make Firestore fail
    firestore.shouldFail = true;

    // Second call should fail on server but return cached data
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    if (
      Array.isArray(customers) &&
      customers.length === cachedCount
    ) {
      console.log('✅ PASS: Gracefully fell back to cache on server error');
      passed++;
    } else {
      console.log('❌ FAIL: Expected fallback to cache on error');
      console.log('Result:', customers.length, 'Cached:', cachedCount);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 6: Offline (no cache, no server) - returns empty array
  try {
    console.log('\n[Test 6] Offline (no cache, no server): returns empty array gracefully');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(true, []); // Will always fail
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // Call without any cached data
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    if (
      Array.isArray(customers) &&
      customers.length === 0
    ) {
      console.log('✅ PASS: Offline scenario returned empty array gracefully');
      passed++;
    } else {
      console.log('❌ FAIL: Expected empty array');
      console.log('Result:', customers);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // ============ Summary ============
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

// Run tests
runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
