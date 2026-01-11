# Cost Data Persistence Troubleshooting Guide

## Overview
This document explains how cost data persists in the Unified Price Grid and how to troubleshoot persistence issues.

## Data Flow Architecture

### Save Flow (User Edit → Cloud)
```
User edits price in Unified Price Grid
    ↓
__commitUnifiedCurrentPrice() or unified-save-price button click handler
    ↓
Update global array (costRaw, costPack, costFinished, costOps)
    ↓
saveLists()
    ↓
1. Save to localStorage (LS_RAW, LS_PACK, LS_FIN, LS_OPS, costLists_local_ts)
2. Update window globals (window.costRaw, window.costPack, etc.)
3. Re-render UI (renderPriceManager, renderUnifiedPriceGrid)
4. Queue cloud save via queueCloudSave()
    ↓
queueCloudSave() [800ms debounce]
    ↓
PRIMARY: db.collection('settings').doc('costLists').set({...})
    ↓ (if permission denied)
FALLBACK: db.collection('users/{uid}').set({ costLists: {...} })
```

### Load Flow (App Startup)
```
DOMContentLoaded event
    ↓
tryLoadCostListsFromCloud()
    ↓
1. Check localStorage timestamp (costLists_local_ts)
2. Try to load settings/costLists
3. Try to load users/{uid}.costLists (fallback)
4. Compare timestamps to determine newest source
5. Apply whichever is newest (defensive merge)
6. Persist to localStorage via saveLists(true)
    ↓
setupAllEventListeners() and renderUnifiedPriceGrid()
    ↓
installCostListsListener() [real-time sync after 1.2s]
```

## Console Logging Guide

When editing prices, check browser DevTools console for these messages:

### Successful Save Sequence
```
✏️ Editing price: {typeLabel: "خامة", id: "item-123", newPrice: 45.5}
💾 Committing price change to storage... {oldPrice: 40, newPrice: 45.5}
saveLists() called - starting 4-step persistence
1️⃣ localStorage saved (LS_RAW with 12 items)
2️⃣ globals synced (window.costRaw updated)
3️⃣ UI rendered (renderPriceManager, renderUnifiedPriceGrid)
4️⃣ queueCloudSave() scheduled (800ms delay)
🔥 Attempting to save cost lists to Firebase (settings/costLists)...
✅ Cost lists saved to Firebase (settings/costLists) {finished: 5, raw: 12, pack: 8, ops: 3}
```

### Fallback Save Sequence (User not admin)
```
⚠️ Failed to save to settings/costLists: [permission-denied error]
🔄 Falling back to save at users/{uid}.costLists...
✅ Cost lists saved to Firebase (users/{uid}.costLists)
```

### Startup Load Sequence
```
📋 DOMContentLoaded: Attempting to load cost lists from Firebase...
📋 tryLoadCostListsFromCloud: Starting cloud load (localTs=2024-01-15T10:30:45.000Z)
ℹ️ Settings doc not accessible (normal for non-admins): permission-denied
📋 User doc costLists found: {finished: 5, raw: 12, pack: 8, ops: 3}
✅ tryLoadCostListsFromCloud: applying users/{uid}.costLists (fallback)
✅ Cost lists loaded from cloud successfully
🔌 Installing real-time cost lists listener...
```

## Debugging Checklist

### 1. Verify localStorage is working
```javascript
// In browser console:
console.log('LS_RAW:', localStorage.getItem('LS_RAW')?.length, 'bytes');
console.log('costLists_local_ts:', localStorage.getItem('costLists_local_ts'));
JSON.parse(localStorage.getItem('LS_RAW')).length; // Should show count
```

### 2. Verify global arrays are updated
```javascript
// In browser console:
console.log('costRaw.length:', costRaw.length);
console.log('First item:', costRaw[0]);
```

### 3. Check Firebase permissions
```javascript
// Try manual write to each location:
// As non-admin user, you should get permission denied on settings/costLists
// but succeed on users/{uid}.costLists

// Check current user role:
db.collection('users').doc(auth.currentUser.uid).get().then(d => console.log('Role:', d.data().role));
```

### 4. Monitor real-time listener
```javascript
// Look for these messages every time data changes:
🔌 Installing real-time cost lists listener...
📋 Real-time update from settings/costLists...
// or
📋 Real-time update from users/{uid}.costLists...
```

### 5. Verify startup sequence
```javascript
// Check Network tab in DevTools -> XHR filter
// Should see:
1. GET /users/{uid} - loads current user role
2. GET /settings/costLists - attempts (may fail for non-admins)
3. GET /users/{uid} - loads costLists data (succeeds)
4. SET /users/{uid} - initial save via saveLists(true)
```

## Common Issues & Solutions

### Issue: Price disappears after page refresh
**Diagnosis:**
1. Edit a price, see it update in the grid
2. Refresh the page
3. Price reverts to old value

**Root Causes & Solutions:**

**Cause 1: localStorage not saving**
- Check Step 1 in console logs
- Verify: `localStorage.getItem('LS_RAW')` has data
- Solution: Check browser storage quota: `navigator.storage.estimate()`

**Cause 2: Firebase save failing silently**
- Check Step 4 in console logs
- Look for "❌ Fallback save to users/{uid}.costLists also failed"
- Solution: Verify Firestore rules allow write to `users/{uid}.costLists`

**Cause 3: Cloud load not happening on startup**
- Check if "📋 DOMContentLoaded: Attempting to load..." appears
- Check if "✅ Cost lists loaded from cloud" appears
- Solution: Wait for DOMContentLoaded event before editing

**Cause 4: Wrong data source used**
- Check timestamp comparison logs
- Solution: If localTs > cloudTs, local is kept (expected)
- Solution: If cloudTs > localTs, cloud overwrites (verify cloud data is correct)

### Issue: Changes not syncing between devices
**Diagnosis:**
1. Edit price on Device A, see console "✅ saved"
2. Open app on Device B, refresh page
3. Device B doesn't show Device A's changes

**Root Causes & Solutions:**

**Cause 1: Fallback saves to different location**
- Device A (admin): saves to settings/costLists
- Device B (rep): saves to users/{uid}.costLists
- Solution: Check which location has newer data
- Solution: Consider loading from BOTH locations and merging

**Cause 2: Real-time listener not connected**
- Check "🔌 Installing real-time cost lists listener..." in console
- Check if "📋 Real-time update..." appears when B loads
- Solution: Wait 1.2 seconds after DOMContentLoaded for listener to attach

**Cause 3: Arrays not being merged correctly**
- Look for "Defensive merge" logs
- Check if incoming data has length > 0
- Solution: If incoming array is empty, local data is kept (expected)

### Issue: Firebase quota errors
**Diagnosis:**
- See errors like "quota-exceeded" or "resource-exhausted"

**Solutions:**
1. Reduce write frequency: increase debounce time (currently 800ms)
2. Batch multiple edits before saving
3. Use `saveLists(true)` to skip cloud sync temporarily
4. Check Firestore usage: Firebase Console → Usage → Detailed Usage Stats

## Manual Save/Load Commands

### Force save to localStorage only (no cloud)
```javascript
saveLists(true); // true = suppressCloud
```

### Force save to cloud immediately (no debounce)
```javascript
clearTimeout(__costCloudTimer); // Cancel any pending save
queueCloudSave(); // Immediately triggers save
```

### Force reload from cloud
```javascript
await tryLoadCostListsFromCloud();
renderUnifiedPriceGrid();
```

### Inspect current state
```javascript
console.table({
    costRaw: costRaw.length,
    costPack: costPack.length,
    costFinished: costFinished.length,
    costOps: costOps.length,
    localTs: localStorage.getItem('costLists_local_ts'),
});
```

## Firestore Rules Reference

Current rules for cost data:

```firestore rules
// Global settings - admins only
match /settings/{docId} {
    allow read: if authed();
    allow write: if isAdmin();
}

// User document - each user can write their own
match /users/{uid} {
    allow read: if authed();
    allow create: if authed() && request.auth.uid == uid;
    allow update: if authed() && request.auth.uid == uid && !(request.resource.data.keys().hasAny(['role']));
    allow write: if isAdmin();
}
```

**Implication:**
- Admins: can write to `settings/costLists`
- Non-admins (reps, sales): can write to `users/{uid}.costLists`

## Testing Checklist

- [ ] Edit price as a non-admin user
- [ ] Verify "💾 Committing price change..." appears in console
- [ ] Verify "✅ Cost lists saved..." appears (either location)
- [ ] Refresh page
- [ ] Verify "✅ Cost lists loaded from cloud" appears
- [ ] Verify price is still there
- [ ] Repeat in incognito window to test different user
- [ ] Test on slow 3G connection (DevTools → Throttling)

## Related Files
- Main application: `index.html`
- Firestore rules: `firestore.rules`
- Netlify functions: `netlify/functions/*.js`
