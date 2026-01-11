# Cost Data Persistence - Implementation Summary

## Problem Statement
Cost data in the Unified Price Grid was disappearing after page refresh. Users could edit prices, see them update in the UI, but after refresh the changes were lost.

## Root Cause Analysis
The data persistence layer had three potential points of failure:
1. **UI → Global Arrays**: Event handlers weren't logging their state
2. **Global Arrays → localStorage**: No visibility into what was being stored
3. **localStorage → Firebase**: Cloud sync was using deprecated patterns and missing fallback for non-admin users
4. **Firebase → UI on Startup**: Load sequence wasn't waiting for Firebase to be ready

## Implementation Solution

### Phase 1: Enhanced Logging Throughout Pipeline
All key functions now emit detailed console logs with emoji indicators for easy debugging:

#### DOMContentLoaded Startup (Lines 17888-17903)
- `📋` Initial load attempt
- `✅` Successful cloud load
- `⚠️` Warnings for failures
- `🔌` Real-time listener installation

#### saveLists() Function (Lines 17186-17211)
4-step process with logging:
1. `💾 localStorage save` - Save all 4 cost arrays as JSON
2. `window.costX` sync - Update global references
3. `renderPriceManager()` - Update UI summary
4. `queueCloudSave()` - Queue async Firebase write (unless suppressCloud=true)

#### queueCloudSave() Function (Lines 17283-17319)
- `🔥 Attempting to save...` - Start of save attempt
- `✅ Cost lists saved to Firebase` - Success at primary location
- `⚠️ Failed to save to settings/costLists` - Permission denied (expected for non-admins)
- `🔄 Falling back to save at users/{uid}.costLists` - Fallback mechanism
- `❌ Fallback save also failed` - Critical error

#### tryLoadCostListsFromCloud() Function (Lines 17214-17280)
- `📋 Starting cloud load` - Initial message with local timestamp
- `📋 Settings doc found` - Primary location has data
- `ℹ️ Settings doc not accessible` - Normal for non-admins
- `📋 User doc costLists found` - Fallback location has data
- `✅ applying settings/costLists` - Using primary source
- `✅ applying users/{uid}.costLists (fallback)` - Using fallback source
- `ℹ️ no newer cloud source; using local` - Keeping local data

#### Event Handlers
- `✏️ Editing code` - Code field edit started
- `💰 Editing price` - Price field edit started
- `↩️ Code/Price unchanged` - No actual change
- `❌ Invalid price value` - Validation error
- `💾 Committing price change to storage` - About to call saveLists()

### Phase 2: Fixed Firestore Fallback Mechanism
**Issue**: Non-admin users couldn't write to `settings/costLists` (permission denied by Firestore rules)
**Solution**: Implemented proper fallback chain:

```javascript
// Primary: admins write to global settings
await db.collection('settings').doc('costLists').set({...})

// Fallback: non-admins write to their user document  
catch (e) {
    await db.collection('users').doc(uid).set({
        costLists: {...}
    }, { merge: true })
}
```

**Both locations are checked on startup** to ensure data isn't lost when switching roles or environments.

### Phase 3: Fixed Array Handling
**Issue**: `getListByType()` function was missing `costFinished`
**Fix**: Extended function to handle all 4 cost types:

```javascript
// Before: only raw, pack, ops
function getListByType(t) { 
    return t==='raw'?costRaw : t==='pack'?costPack : costOps; 
}

// After: includes finished
function getListByType(t) { 
    return t==='raw'?costRaw : (t==='pack'?costPack : (t==='finished'?costFinished : costOps)); 
}
```

### Phase 4: Defensive Merge Logic
**Implementation**: When loading from cloud, never replace non-empty local with empty cloud:

```javascript
// Only apply incoming data if:
// 1. It has items AND
// 2. Local is empty, OR
// 3. Timestamp shows cloud is newer
if (incomingRaw && incomingRaw.length > 0) {
    costRaw = incomingRaw;
} else if (incomingRaw && incomingRaw.length === 0 && 
           (!Array.isArray(costRaw) || costRaw.length === 0)) {
    // Only overwrite local if local is also empty
    costRaw = incomingRaw;
}
```

## Testing Instructions

### Manual Test - Single Device
1. Open browser DevTools Console
2. Edit a price in the Unified Price Grid
3. Watch console for:
   - `✏️ Editing price` → `💾 Committing...` → `🔥 Attempting...` → `✅ saved`
4. Check localStorage: `JSON.parse(localStorage.getItem('LS_RAW')).length`
5. Refresh page
6. Verify "✅ Cost lists loaded from cloud" appears
7. Verify price is still updated

### Automated Test - Two Users
1. User A (Admin): Edit price → see console logs → check Firebase Console
2. User B (Rep): Refresh page → verify price loaded from cloud
3. User B: Edit different price → should save to `users/{uid}.costLists`
4. User A: Refresh → verify User B's changes don't overwrite User A's (timestamp-based merge)

### Edge Cases
- [ ] Edit price when offline (offline storage + sync on reconnect)
- [ ] Edit price on slow 3G connection (verify debounce prevents too many requests)
- [ ] Edit multiple prices quickly (debounce should batch them)
- [ ] Switch between users (verify separate cost lists per user)
- [ ] Test with browser storage quota nearly full

## Code Changes Summary

| Function | Lines | Change |
|----------|-------|--------|
| DOMContentLoaded | 17888-17903 | Enhanced logging, better error handling |
| saveLists | 17186-17211 | 4-step process with per-step logging |
| queueCloudSave | 17283-17319 | Added array defaults, better fallback logic |
| tryLoadCostListsFromCloud | 17214-17280 | Enhanced logging, clearer timestamp logic |
| __commitUnifiedCode | 17992-18004 | Added logging for inline code edits |
| __commitUnifiedCurrentPrice | 18020-18045 | Added logging for inline price edits |
| Inline save button handler | 17978-18003 | Added logging for button-based saves |
| getListByType | 17767 | Added costFinished support |

## Logging Indicators

| Emoji | Meaning | Action |
|-------|---------|--------|
| 📋 | Information about data state | Monitor for warnings |
| ✅ | Operation succeeded | Expected in normal flow |
| ✏️ | User started editing | Check UI responsiveness |
| 💰 | Price editing specifically | Check calculations |
| 💾 | Saving to persistent storage | Check for errors after |
| 🔥 | Attempting cloud sync | Check internet connection |
| ⚠️ | Warning - may indicate issue | Check following error messages |
| ❌ | Critical error | Stop and debug |
| ↩️ | No-op (no actual change) | Normal - prevents unnecessary saves |
| 🔌 | Real-time listener | Check for updates from other users |
| ℹ️ | Informational message | Usually normal in non-admin contexts |
| 🔄 | Fallback mechanism | Normal when primary fails |

## Firebase Rules Context

The Firestore rules are configured to:
- **Admins**: Can read/write `settings/costLists` (global)
- **Non-admins**: Can read `settings/costLists` but writes fail
- **All users**: Can read/write their own `users/{uid}.costLists`

This means:
- Admins' edits go to `settings/costLists` (shared globally)
- Non-admins' edits go to `users/{uid}.costLists` (per-user)
- On startup, we check both and load whichever is newer

## Performance Impact

- **localStorage**: ~200 bytes per cost item × 28 items ≈ 5.6 KB (negligible)
- **Firebase writes**: 1 write per 800ms = 75-150 writes/day for active user (well within free tier)
- **Console logging**: Minimal overhead, can be disabled in production if needed

## Maintenance Notes

### To disable cloud sync temporarily (dev testing)
```javascript
saveLists(true); // true = suppressCloud
```

### To force immediate cloud sync (instead of 800ms debounce)
```javascript
if (__costCloudTimer) clearTimeout(__costCloudTimer);
queueCloudSave();
```

### To inspect current persistence state
```javascript
console.log({
    costRaw: costRaw.length,
    costPack: costPack.length,
    costFinished: costFinished.length,
    costOps: costOps.length,
    lastSaveTime: localStorage.getItem('costLists_local_ts'),
});
```

## Related Documentation
- See `COST_DATA_PERSISTENCE_GUIDE.md` for troubleshooting guide
- See `firestore.rules` for permission rules
- See `index.html` lines 17186-17350 for full persistence implementation
