/**
 * Test: SalesService - Offline Queue & Sync
 * Test scenarios:
 * 1. Fetch recent sales (limited query)
 * 2. Save invoice online (Firestore)
 * 3. Save invoice offline (queue)
 * 4. Get pending count
 * 5. Sync pending invoices
 * 6. Clear queue
 */

// Mock window for Node.js
if (typeof window === 'undefined') {
  global.window = {};
}

const SalesService = require('../src/services/sales-service.js');

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
    this.savedDocs = {};
    this.callCount = 0;
  }
  
  async query(collection, opts) {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Firestore query failed');
    }
    
    // Return mock sales
    return [
      { id: 'sale1', invoiceNumber: 'INV001', total: 1000, createdAt: new Date().toISOString() },
      { id: 'sale2', invoiceNumber: 'INV002', total: 2000, createdAt: new Date().toISOString() }
    ];
  }
  
  async setDoc(collection, docId, data) {
    if (this.shouldFail) {
      throw new Error('Firestore write failed');
    }
    this.savedDocs[docId] = data;
    return { ok: true };
  }
}

class MockErrorHandler {
  handle(error, context, showAlert) {
    // Silent for tests
  }
}

// ============ Helper Functions ============

function createTestInvoice(id, total) {
  return {
    id,
    invoiceNumber: `INV${id}`,
    customerId: 'cust123',
    customerName: 'Test Customer',
    items: [{ name: 'Product 1', price: total, qty: 1 }],
    subtotal: total,
    tax: total * 0.14,
    total: total * 1.14,
    date: new Date().toISOString(),
    userId: 'user123',
    status: 'completed'
  };
}

// ============ Tests ============

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Fetch recent sales
  try {
    console.log('\n[Test 1] Fetch recent sales (limited query)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    const sales = await window.SalesService.getRecentSales({ limit: 50 });

    if (
      Array.isArray(sales) &&
      sales.length === 2 &&
      sales[0].invoiceNumber === 'INV001' &&
      firestore.callCount === 1
    ) {
      console.log('✅ PASS: Fetched recent sales from server');
      passed++;
    } else {
      console.log('❌ FAIL: Expected 2 sales from server');
      console.log('Result:', sales);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 2: Save invoice online (success)
  try {
    console.log('\n[Test 2] Save invoice online (Firestore available)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    const invoice = createTestInvoice('test001', 5000);
    const result = await window.SalesService.saveInvoice(invoice);

    if (
      result.ok === true &&
      result.queued === false &&
      firestore.savedDocs['test001']
    ) {
      console.log('✅ PASS: Invoice saved to Firestore');
      passed++;
    } else {
      console.log('❌ FAIL: Expected invoice saved to Firestore');
      console.log('Result:', result);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 3: Save invoice offline (queue)
  try {
    console.log('\n[Test 3] Save invoice offline (added to queue)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(true); // Will fail
    const errorHandler = new MockErrorHandler();

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    const invoice = createTestInvoice('test002', 3000);
    const result = await window.SalesService.saveInvoice(invoice);

    const pendingCount = window.SalesService.getPendingCount();

    if (
      result.ok === true &&
      result.queued === true &&
      pendingCount === 1
    ) {
      console.log('✅ PASS: Invoice added to offline queue');
      passed++;
    } else {
      console.log('❌ FAIL: Expected invoice in queue');
      console.log('Result:', result, 'Pending:', pendingCount);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 4: Get pending count
  try {
    console.log('\n[Test 4] Get pending count (multiple invoices)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(true);
    const errorHandler = new MockErrorHandler();

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    // Add 3 invoices to queue
    await window.SalesService.saveInvoice(createTestInvoice('q1', 1000));
    await window.SalesService.saveInvoice(createTestInvoice('q2', 2000));
    await window.SalesService.saveInvoice(createTestInvoice('q3', 3000));

    const count = window.SalesService.getPendingCount();

    if (count === 3) {
      console.log('✅ PASS: Pending count correct (3 invoices)');
      passed++;
    } else {
      console.log('❌ FAIL: Expected 3 pending invoices');
      console.log('Count:', count);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 5: Sync pending invoices
  try {
    console.log('\n[Test 5] Sync pending invoices (queue → Firestore)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    // Pre-populate queue
    const queue = [
      createTestInvoice('sync1', 1000),
      createTestInvoice('sync2', 2000)
    ];
    storage.set('PENDING_INVOICES', queue);

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    const result = await window.SalesService.syncPendingInvoices();
    const remainingCount = window.SalesService.getPendingCount();

    if (
      result.synced === 2 &&
      result.failed === 0 &&
      remainingCount === 0 &&
      firestore.savedDocs['sync1'] &&
      firestore.savedDocs['sync2']
    ) {
      console.log('✅ PASS: All pending invoices synced successfully');
      passed++;
    } else {
      console.log('❌ FAIL: Sync did not complete correctly');
      console.log('Result:', result, 'Remaining:', remainingCount);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 6: Sync with partial failure
  try {
    console.log('\n[Test 6] Sync with partial failure (1 success, 1 fail)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    // Pre-populate queue
    const queue = [
      createTestInvoice('partial1', 1000),
      createTestInvoice('partial2', 2000)
    ];
    storage.set('PENDING_INVOICES', queue);

    // Make firestore fail on second doc
    let callNum = 0;
    firestore.setDoc = async function(collection, docId, data) {
      callNum++;
      if (callNum === 2) {
        throw new Error('Network error on second doc');
      }
      this.savedDocs[docId] = data;
      return { ok: true };
    };

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    const result = await window.SalesService.syncPendingInvoices();
    const remainingCount = window.SalesService.getPendingCount();

    if (
      result.synced === 1 &&
      result.failed === 1 &&
      remainingCount === 1 // Failed one remains in queue
    ) {
      console.log('✅ PASS: Partial sync handled correctly (failed item kept in queue)');
      passed++;
    } else {
      console.log('❌ FAIL: Partial sync did not behave correctly');
      console.log('Result:', result, 'Remaining:', remainingCount);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 7: Clear queue
  try {
    console.log('\n[Test 7] Clear pending queue');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    // Pre-populate queue
    storage.set('PENDING_INVOICES', [createTestInvoice('clear1', 1000)]);

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    window.SalesService.clearQueue();
    const count = window.SalesService.getPendingCount();

    if (count === 0) {
      console.log('✅ PASS: Queue cleared successfully');
      passed++;
    } else {
      console.log('❌ FAIL: Queue not cleared');
      console.log('Count:', count);
      failed++;
    }
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    failed++;
  }

  // Test 8: Cache recent sales
  try {
    console.log('\n[Test 8] Cache recent sales (second call uses cache)');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService(false);
    const errorHandler = new MockErrorHandler();

    SalesService.setDependencies(storage, firestore, errorHandler);
    
    // First call: fetch from server
    await window.SalesService.getRecentSales({ limit: 50 });
    const callsAfterFirst = firestore.callCount;

    // Second call: should use cache
    await window.SalesService.getRecentSales({ limit: 50 });

    if (firestore.callCount === callsAfterFirst) {
      console.log('✅ PASS: Second call used cache (no additional server request)');
      passed++;
    } else {
      console.log('❌ FAIL: Expected cache to be used');
      console.log('Calls:', firestore.callCount, 'Expected:', callsAfterFirst);
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
