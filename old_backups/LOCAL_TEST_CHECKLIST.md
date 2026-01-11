# Local Testing Checklist for Login/Logout Integration

## Pre-Test Setup
- [ ] Open `index.html` in a local browser (file:// or local server)
- [ ] Open browser DevTools console (F12)
- [ ] Ensure no critical errors on page load

## Test Scenario 1: Wrong Password
**Steps:**
1. Navigate to login page
2. Enter email: `test@example.com`
3. Enter password: `wrongpassword`
4. Click "تسجيل الدخول"

**Expected Result:**
- ❌ Alert appears: "خطأ: ..." (error message)
- User stays on login page
- No navigation occurs

## Test Scenario 2: Correct Login
**Steps:**
1. Navigate to login page
2. Enter valid credentials (if AuthSystem has demo mode)
3. Click "تسجيل الدخول"

**Expected Result:**
- ✅ No error alert
- Page navigates to sales/dashboard
- User info loads correctly
- Bottom nav appears
- Login page hidden

## Test Scenario 3: Logout
**Steps:**
1. After successful login, find logout button
2. Click "تسجيل الخروج"
3. Confirm in dialog

**Expected Result:**
- ✅ Confirmation dialog appears
- After confirm: returns to login page
- Sales page hidden
- Login form cleared
- Remembered email removed (if unchecked)

## Test Scenario 4: Remember Me
**Steps:**
1. Check "تذكرني" checkbox
2. Login successfully
3. Logout
4. Reload page

**Expected Result:**
- ✅ Email field pre-filled on login page
- Password field empty

## Console Checks
During all tests, watch console for:
- ✅ "auth:login-success" event (on successful login)
- ✅ "auth:logout-success" event (on logout)
- ✅ No undefined function errors
- ✅ No "AuthService غير جاهز" errors

## Hybrid Mode Verification
In console, verify these exist:
```javascript
typeof window.loginUsingServices === 'function'
typeof window.logoutUsingServices === 'function'
typeof window.safeAuth === 'object'
```

## Notes
- If Firebase config is not set, app runs in offline/stub mode
- AuthSystem.login fallback should work if services unavailable
- All UI behavior must match pre-refactor version exactly
