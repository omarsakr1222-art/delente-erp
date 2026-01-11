# Developer Quick Start - Cost Data Persistence

## File Locations

```
f:\لينك\
├── index.html                           [Main application - 18,988 lines]
│   ├── Lines 17186-17211: saveLists()
│   ├── Lines 17214-17280: tryLoadCostListsFromCloud()
│   ├── Lines 17283-17319: queueCloudSave()
│   ├── Lines 17767: getListByType()
│   ├── Lines 17888-17903: DOMContentLoaded listener
│   ├── Lines 17978-18003: Inline save button handler
│   ├── Lines 17992-18004: __commitUnifiedCode()
│   └── Lines 18020-18045: __commitUnifiedCurrentPrice()
│
├── firestore.rules                      [Permission rules]
├── FINAL_REPORT_COST_PERSISTENCE.md    [Executive summary]
├── SESSION_SUMMARY_COST_PERSISTENCE.md [Detailed session notes]
├── COST_DATA_PERSISTENCE_GUIDE.md      [Troubleshooting guide]
├── COST_DATA_PERSISTENCE_IMPLEMENTATION.md [Technical deep dive]
└── UNIFIED_PRICE_GRID_USER_GUIDE.md    [User documentation]
```

## Key Functions

### 1. saveLists(suppressCloud?)
**Purpose**: Central persistence hub
**Location**: Lines 17186-17211
**Parameters**:
- `suppressCloud` (boolean, optional): If true, skip cloud sync
**Flow**:
1. localStorage save with 4 arrays
2. Update window globals
3. Re-render UI
4. Queue cloud sync (unless suppressCloud=true)
**Logging**: 4 emoji-marked steps
```javascript
saveLists(); // Normal save with cloud sync
saveLists(true); // Local only, skip cloud
```

### 2. queueCloudSave()
**Purpose**: Debounced Firebase write
**Location**: Lines 17283-17319
**Debounce**: 800ms
**Behavior**:
1. Try primary: `settings/costLists` (admins)
2. Catch error → Try fallback: `users/{uid}.costLists`
3. Log success or failure
**Key Feature**: Array defaults with `|| []` prevent undefined
```javascript
// Inside the function:
raw: costRaw || [],  // Never undefined
pack: costPack || [],
finished: costFinished || [],
ops: costOps || []
```

### 3. tryLoadCostListsFromCloud()
**Purpose**: Load data at startup
**Location**: Lines 17214-17280
**Triggered**: On DOMContentLoaded (Line 17897)
**Sources** (in priority order):
1. Check `settings/costLists` (shared global)
2. Check `users/{uid}.costLists` (personal fallback)
3. Use localStorage if cloud sources are stale
**Timestamp Comparison**: Uses `updatedAt` to determine source
**Defensive Merge**: Won't replace non-empty local with empty cloud
```javascript
// Example: Which source to use?
if (settingsTs > localTs) {
    // Cloud settings is newer → use it
    source = 'settings';
} else if (userTs > localTs) {
    // User doc is newer → use it
    source = 'user';
} else {
    // Local is newest → keep it
    source = null;
}
```

### 4. installCostListsListener()
**Purpose**: Real-time sync from Firebase
**Location**: Line 17330+
**Triggered**: After 1.2 seconds (Line 17904)
**Behavior**: Listens to `settings/costLists` for changes
**Updates**: Calls `applyDoc()` to merge incoming data
**Defensive**: Doesn't overwrite if incoming is empty

### 5. __commitUnifiedCurrentPrice(el)
**Purpose**: Handle inline price edits
**Location**: Lines 18020-18045
**Triggered**: By contenteditable blur/Enter
**Process**:
1. Get value from contenteditable span
2. Parse and validate as number
3. Update global array with new price
4. Add to priceHistory
5. Call saveLists()
**Validation**: NaN check, empty check, unchanged check

### 6. __commitUnifiedCode(el)
**Purpose**: Handle inline code edits
**Location**: Lines 17992-18004
**Similar to**: __commitUnifiedCurrentPrice
**Difference**: No numeric validation (text field)

## Data Structures

### Cost Arrays (Global Variables)
```javascript
costRaw = [
    { id: "raw-1", code: "R001", name: "فولاذ", unit: "كجم", 
      lastPrice: 45.5, lastPriceDate: "2024-01-15T10:30:00Z",
      priceHistory: [{price: 45.5, date: "2024-01-15T10:30:00Z", note: "تعديل مباشر"}]
    },
    // ... more items
];

costPack = [];      // Packaging items
costFinished = [];  // Finished products
costOps = [];       // Operation costs
```

### localStorage Keys
```javascript
LS_RAW = 'lsCostRaw';        // Raw materials
LS_PACK = 'lsCostPack';      // Packaging
LS_FIN = 'lsCostFinished';   // Finished products
LS_OPS = 'lsCostOps';        // Operations
// Timestamp of last save:
'costLists_local_ts'         // ISO string
```

### Firestore Paths
```
Primary:   /settings/costLists
Fallback:  /users/{uid}/costLists
          (nested inside user doc)
```

## Console Logging Reference

### Emoji Indicators
| Emoji | Meaning | Context |
|-------|---------|---------|
| 📋 | Data load/info | Loading, timestamps |
| ✅ | Success | Save completed, load completed |
| ✏️ | Edit started | Price/code edit began |
| 💰 | Price-specific | Price editing |
| 💾 | Persisting | Saving to storage |
| 🔥 | Cloud attempt | Firebase operation |
| ⚠️ | Warning | Permission denied, network error |
| ❌ | Critical error | Complete failure |
| ↩️ | No-op | No actual change |
| 🔌 | Real-time listener | Sync from cloud |
| 🔄 | Fallback | Using secondary method |
| ℹ️ | Informational | Normal non-error message |

### Example Log Sequences

**Normal Save (Admin)**
```
✏️ Editing price: {...}
💾 Committing...
🔄 saveLists: queued cloud sync
🔥 Attempting Firebase save...
✅ Cost lists saved to Firebase (settings/costLists)
```

**Save with Fallback (Non-Admin)**
```
✏️ Editing price: {...}
💾 Committing...
🔄 saveLists: queued cloud sync
🔥 Attempting Firebase save...
⚠️ Failed to save: permission-denied
🔄 Falling back to users/{uid}...
✅ Cost lists saved to Firebase (users/{uid})
```

**Startup Load**
```
📋 Starting cloud load...
📋 Settings doc found
📋 User doc found
✅ applying settings/costLists
✅ Cost lists loaded successfully
🔌 Installing real-time listener
```

## Testing Commands

### Browser Console

```javascript
// Inspect current state
console.table({
    costRaw: costRaw.length,
    costPack: costPack.length,
    costFinished: costFinished.length,
    costOps: costOps.length
});

// Check localStorage
localStorage.getItem('costLists_local_ts');
JSON.parse(localStorage.getItem('LS_RAW')).length;

// Force local save only (skip cloud)
saveLists(true);

// Force immediate cloud save
if (__costCloudTimer) clearTimeout(__costCloudTimer);
queueCloudSave();

// Manually trigger load from cloud
await tryLoadCostListsFromCloud();
renderUnifiedPriceGrid();

// Check Firestore rules for current user
db.collection('users').doc(auth.currentUser.uid).get()
  .then(d => console.log('User:', d.data().name, 'Role:', d.data().role));
```

## Debugging Workflow

### If prices not persisting:

1. **Check localStorage exists**
   ```javascript
   localStorage.getItem('LS_RAW')?.length // Should have data
   ```

2. **Check console for errors**
   - Filter for ❌ or ⚠️
   - Look for Firebase errors

3. **Check Firebase permissions**
   - Non-admins should see fallback message
   - Check Firestore rules match expected behavior

4. **Check real-time listener**
   - Should see 🔌 message after 1.2s
   - Should sync changes from other users

5. **Manual test**
   ```javascript
   // 1. Edit array directly
   costRaw[0].lastPrice = 999;
   // 2. Force save
   saveLists();
   // 3. Check localStorage
   JSON.parse(localStorage.getItem('LS_RAW'))[0].lastPrice;
   // Should be 999
   ```

### If not loading from cloud:

1. **Check startup sequence**
   - DOMContentLoaded fired?
   - tryLoadCostListsFromCloud called?
   - Look for 📋 messages

2. **Check timestamps**
   - Compare localTs vs cloudTs
   - Check timestamp parsing logic

3. **Check permissions**
   - Can access settings/costLists? (admin only)
   - Can access users/{uid}/costLists? (all users)

4. **Check data freshness**
   - When was cloud data last written?
   - Is it newer than localStorage?

## Performance Optimization

### Current Settings
```javascript
__costCloudTimer = null;  // Global debounce timer
// Debounce delay in queueCloudSave:
setTimeout(async () => {
    // ... save operation
}, 800); // 800ms delay
```

### Optimization Ideas
1. **Increase debounce** for high-frequency edits (1000ms+)
2. **Batch multiple edits** before saving
3. **Use Service Worker** for better offline support
4. **Compress data** if localStorage quota is issue
5. **Reduce priceHistory** to last 10 entries instead of all

## Common Tasks

### Add a new cost type (e.g., transportation)

1. **Create array**
   ```javascript
   let costTransport = [];
   const LS_TRANSPORT = 'lsCostTransport';
   ```

2. **Update getListByType**
   ```javascript
   function getListByType(t) {
       return t==='raw'?costRaw : 
              (t==='pack'?costPack : 
               (t==='finished'?costFinished : 
                (t==='transport'?costTransport : costOps)));
   }
   ```

3. **Update saveLists**
   ```javascript
   localStorage.setItem(LS_TRANSPORT, JSON.stringify(costTransport));
   window.costTransport = costTransport;
   ```

4. **Update queueCloudSave**
   ```javascript
   transport: costTransport || [],
   ```

5. **Update tryLoadCostListsFromCloud**
   ```javascript
   const incomingTransport = Array.isArray(src.transport) ? src.transport : null;
   if (incomingTransport && incomingTransport.length > 0) costTransport = incomingTransport;
   ```

### Disable cloud sync (dev mode)

1. **Modify saveLists call**
   ```javascript
   saveLists(true); // Skip cloud sync
   ```

2. **Or modify DOMContentLoaded**
   ```javascript
   // Comment out queueCloudSave
   // cloudSync would only be localStorage
   ```

### Clear all cost data (testing)

```javascript
localStorage.removeItem('LS_RAW');
localStorage.removeItem('LS_PACK');
localStorage.removeItem('LS_FIN');
localStorage.removeItem('LS_OPS');
localStorage.removeItem('costLists_local_ts');

costRaw = [];
costPack = [];
costFinished = [];
costOps = [];

renderUnifiedPriceGrid(); // Refresh UI
```

## Related Links

- **Main App**: `f:\لينك\index.html`
- **Rules**: `f:\لينك\firestore.rules`
- **Troubleshooting**: See `COST_DATA_PERSISTENCE_GUIDE.md`
- **Implementation**: See `COST_DATA_PERSISTENCE_IMPLEMENTATION.md`
- **Tests**: See `FINAL_REPORT_COST_PERSISTENCE.md`

---

**Last Updated**: February 2024
**Status**: Production Ready
