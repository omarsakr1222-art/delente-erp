/**
 * Test: SalesService Offline → Online Scenario
 * Simulates real-world offline invoice creation and sync on reconnect
 */

// Mock window for Node.js
if (typeof window === 'undefined') {
  global.window = {};
  global.navigator = { onLine: true };
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
}

class MockFirestoreService {
  constructor() {
    this.isOnline = true;
    this.savedDocs = {};
  }
  
  async query(collection, opts) {
    if (!this.isOnline) {
      throw new Error('Network unavailable');
    }
    return [];
  }
  
  async setDoc(collection, docId, data) {
    if (!this.isOnline) {
      throw new Error('Network unavailable');
    }
    this.savedDocs[docId] = data;
    console.log(`  [Mock Firestore] Saved doc ${docId}`);
  }
}

class MockErrorHandler {
  handle(error, context, showAlert) {
    // Silent
  }
}

function createTestInvoice(id, customerName, total) {
  return {
    id,
    invoiceNumber: `INV-${id}`,
    customerId: `cust_${id}`,
    customerName,
    items: [
      { code: 'P001', name: 'منتج 1', price: total / 2, qty: 1 },
      { code: 'P002', name: 'منتج 2', price: total / 2, qty: 1 }
    ],
    subtotal: total,
    tax: total * 0.14,
    total: total * 1.14,
    date: new Date().toISOString(),
    period: '2024-12',
    userId: 'rep001',
    userName: 'مندوب التجربة',
    status: 'completed',
    paymentMethod: 'cash'
  };
}

// ============ Offline → Online Scenario ============

async function runOfflineOnlineScenario() {
  console.log('='.repeat(70));
  console.log('SCENARIO: Rep creates invoices offline → Syncs when back online');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  try {
    console.log('\n--- Phase 1: Rep goes OFFLINE (no internet) ---');
    const storage = new MockStorage();
    const firestore = new MockFirestoreService();
    const errorHandler = new MockErrorHandler();
    
    // Simulate offline
    firestore.isOnline = false;
    navigator.onLine = false;

    SalesService.setDependencies(storage, firestore, errorHandler);

    console.log('  Status: OFFLINE ❌');
    console.log('  Rep creates 3 invoices while visiting customers...\n');

    // Create 3 invoices offline
    const inv1 = await window.SalesService.saveInvoice(
      createTestInvoice('OFF001', 'محمد أحمد - مطعم النيل', 5000)
    );
    console.log(`  Invoice 1: ${inv1.queued ? '📋 QUEUED' : '✅ SAVED'} (${inv1.id})`);

    const inv2 = await window.SalesService.saveInvoice(
      createTestInvoice('OFF002', 'فاطمة علي - سوبرماركت الأمل', 8000)
    );
    console.log(`  Invoice 2: ${inv2.queued ? '📋 QUEUED' : '✅ SAVED'} (${inv2.id})`);

    const inv3 = await window.SalesService.saveInvoice(
      createTestInvoice('OFF003', 'ياسمين محمود - مكتبة القاهرة', 3500)
    );
    console.log(`  Invoice 3: ${inv3.queued ? '📋 QUEUED' : '✅ SAVED'} (${inv3.id})`);

    const pendingAfterOffline = window.SalesService.getPendingCount();
    console.log(`\n  📊 Total pending invoices: ${pendingAfterOffline}`);

    if (inv1.queued && inv2.queued && inv3.queued && pendingAfterOffline === 3) {
      console.log('  ✅ Phase 1 PASS: All 3 invoices queued correctly');
      passed++;
    } else {
      console.log('  ❌ Phase 1 FAIL: Expected 3 queued invoices');
      failed++;
    }

    // --- Phase 2: Rep goes back ONLINE ---
    console.log('\n--- Phase 2: Rep returns to office → Internet restored ---');
    
    firestore.isOnline = true;
    navigator.onLine = true;
    
    console.log('  Status: ONLINE ✅');
    console.log('  Auto-syncing pending invoices...\n');

    const syncResult = await window.SalesService.syncPendingInvoices();
    
    console.log(`  📤 Sync Results:`);
    console.log(`     - Synced: ${syncResult.synced}`);
    console.log(`     - Failed: ${syncResult.failed}`);
    
    const pendingAfterSync = window.SalesService.getPendingCount();
    console.log(`     - Remaining in queue: ${pendingAfterSync}`);

    if (
      syncResult.synced === 3 &&
      syncResult.failed === 0 &&
      pendingAfterSync === 0 &&
      firestore.savedDocs['OFF001'] &&
      firestore.savedDocs['OFF002'] &&
      firestore.savedDocs['OFF003']
    ) {
      console.log('  ✅ Phase 2 PASS: All invoices synced to Firestore');
      passed++;
    } else {
      console.log('  ❌ Phase 2 FAIL: Sync incomplete');
      console.log('  Firestore docs:', Object.keys(firestore.savedDocs));
      failed++;
    }

    // --- Phase 3: Verify data integrity ---
    console.log('\n--- Phase 3: Verify data integrity (all fields preserved) ---');
    
    const syncedInv = firestore.savedDocs['OFF001'];
    
    if (
      syncedInv &&
      syncedInv.customerName === 'محمد أحمد - مطعم النيل' &&
      syncedInv.total === 5000 * 1.14 &&
      syncedInv.items.length === 2 &&
      syncedInv.userName === 'مندوب التجربة' &&
      !syncedInv._queuedAt // Queue metadata removed
    ) {
      console.log('  ✅ Phase 3 PASS: Data integrity maintained (all fields correct)');
      passed++;
    } else {
      console.log('  ❌ Phase 3 FAIL: Data integrity issue');
      console.log('  Synced data:', syncedInv);
      failed++;
    }

    // --- Phase 4: Create new invoice while ONLINE ---
    console.log('\n--- Phase 4: Create invoice while ONLINE (direct save) ---');
    
    const onlineInv = await window.SalesService.saveInvoice(
      createTestInvoice('ON001', 'أحمد حسن - صيدلية الشفاء', 12000)
    );

    console.log(`  Invoice: ${onlineInv.queued ? '📋 QUEUED' : '✅ DIRECT SAVE'} (${onlineInv.id})`);
    
    const pendingAfterOnline = window.SalesService.getPendingCount();

    if (
      onlineInv.ok &&
      !onlineInv.queued &&
      pendingAfterOnline === 0 &&
      firestore.savedDocs['ON001']
    ) {
      console.log('  ✅ Phase 4 PASS: Online invoice saved directly (no queue)');
      passed++;
    } else {
      console.log('  ❌ Phase 4 FAIL: Expected direct save');
      failed++;
    }

    // --- Summary ---
    console.log('\n' + '='.repeat(70));
    console.log(`SCENARIO SUMMARY: ${passed}/4 phases passed`);
    console.log('='.repeat(70));

    if (failed === 0) {
      console.log('✅ FULL OFFLINE → ONLINE SCENARIO PASSED!');
      console.log('\nKey achievements:');
      console.log('  ✓ Offline invoices queued correctly');
      console.log('  ✓ Queue synced to Firestore when online');
      console.log('  ✓ Data integrity preserved');
      console.log('  ✓ Online mode bypasses queue');
      process.exit(0);
    } else {
      console.log('❌ SCENARIO FAILED');
      process.exit(1);
    }

  } catch (e) {
    console.error('\n❌ SCENARIO ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

// Run scenario
runOfflineOnlineScenario();
