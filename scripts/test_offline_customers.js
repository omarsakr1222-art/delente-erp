/**
 * Test: CustomersService Offline Initialization
 * Simulates offline scenario where initializeAppForUser is called
 * but CustomersService can't reach the server.
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
  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }
  async query(collection, opts) {
    if (this.shouldFail) {
      throw new Error('Network unavailable - offline');
    }
    return [];
  }
}

class MockErrorHandler {
  handle(error, context, showAlert) {
    // Silent
  }
}

// ============ Helper Functions ============

function createTestCustomer(id, name, phone) {
  return {
    id,
    name,
    phone,
    address: `Address for ${name}`,
    balance: 5000,
    email: `${id}@test.com`,
    taxNumber: `TAX${id}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
}

// ============ Tests ============

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Scenario 1: Load customers from offline cache
  try {
    console.log('\n[Scenario 1] Load customers from offline cache (cache exists)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(true); // Will fail
    const errorHandler = new MockErrorHandler();

    // Pre-populate cache with test data
    const cachedCustomers = [
      createTestCustomer('cust1', 'محمود الشرقاوي', '0123456789'),
      createTestCustomer('cust2', 'ياسمين علي', '0987654321'),
      createTestCustomer('cust3', 'أحمد عبدالله', '0555555555')
    ];
    storage.set('CUSTOMERS', {
      data: cachedCustomers,
      timestamp: Date.now()
    });

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // Initialize (simulating initializeAppForUser offline)
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true, maxAgeMs: 6 * 60 * 60 * 1000 });

    if (
      Array.isArray(customers) &&
      customers.length === 3 &&
      customers[0].name === 'محمود الشرقاوي' &&
      customers[0].phone === '0123456789'
    ) {
      console.log('✅ PASS: Loaded 3 customers from offline cache');
      passed++;
    } else {
      console.log('❌ FAIL: Expected 3 customers from cache');
      console.log('Result:', customers);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Scenario 2: Cache-first with partial offline
  try {
    console.log('\n[Scenario 2] Cache-first: initial load offline, cache empty');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(true);
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // Call without cache should return empty array gracefully
    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    if (Array.isArray(customers) && customers.length === 0) {
      console.log('✅ PASS: Gracefully handled offline with no cache (returned empty array)');
      passed++;
    } else {
      console.log('❌ FAIL: Expected empty array for offline with no cache');
      console.log('Result:', customers);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Scenario 3: initializeAppForUser simulation (offline after initial load)
  try {
    console.log('\n[Scenario 3] Simulate initializeAppForUser() offline after initial cache');
    const storage = new MockStorage();
    
    // First phase: online fetch
    const mockDocs = [
      createTestCustomer('cust1', 'محمود الشرقاوي', '0123456789'),
      createTestCustomer('cust2', 'ياسمين علي', '0987654321')
    ];
    
    // Create custom firestore that can be switched
    const firestore = {
      shouldFail: false,
      docs: mockDocs,
      async query(collection, opts) {
        if (this.shouldFail) {
          throw new Error('Network unavailable - offline');
        }
        return this.docs;
      }
    };
    
    const errorHandler = new MockErrorHandler();

    CustomersService.setDependencies(storage, firestore, errorHandler);

    // First call: fetch and cache
    const firstLoad = await window.CustomersService.getCustomers({ forceRefresh: true });
    console.log(`  - First load: ${firstLoad.length} customers cached`);

    // Second phase: switch to offline
    firestore.shouldFail = true;

    // Second call (simulating re-init): should use cache
    const secondLoad = await window.CustomersService.getCustomers({ forceRefresh: true });
    console.log(`  - Offline load: ${secondLoad.length} customers from cache`);

    if (
      Array.isArray(firstLoad) &&
      firstLoad.length === 2 &&
      Array.isArray(secondLoad) &&
      secondLoad.length === 2 &&
      secondLoad[0].name === 'محمود الشرقاوي'
    ) {
      console.log('✅ PASS: initializeAppForUser simulation successful (online → offline)');
      passed++;
    } else {
      console.log('❌ FAIL: Expected 2 customers in both loads');
      console.log('First:', firstLoad.length, 'Second:', secondLoad.length);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Scenario 4: Critical field mapping (phone for search)
  try {
    console.log('\n[Scenario 4] Critical field mapping (phone for search)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    const mockDocs = [
      {
        id: 'cust1',
        customerName: 'محمود الشرقاوي', // alternative field name
        phoneNumber: '0123456789',        // alternative field name
        address: 'شارع النيل',
        balance: 5000,
        email: 'mahmoud@test.com',
        taxNumber: 'TAX001',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }
    ];

    firestore.query = async () => mockDocs;
    CustomersService.setDependencies(storage, firestore, errorHandler);

    const customers = await window.CustomersService.getCustomers({ forceRefresh: true });

    // Check that mapToLegacy correctly maps alternative field names
    const customer = customers[0];
    if (
      customer &&
      customer.name === 'محمود الشرقاوي' &&
      customer.phone === '0123456789' &&
      customer.address === 'شارع النيل' &&
      customer.balance === 5000 &&
      customer.id === 'cust1'
    ) {
      console.log('✅ PASS: mapToLegacy correctly mapped all critical fields');
      passed++;
    } else {
      console.log('❌ FAIL: Critical field mapping failed');
      console.log('Result:', customer);
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
    console.log('✅ ALL OFFLINE TESTS PASSED!');
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
