# Firebase Local Development vs Production Configuration

**Date**: 2025-12-02  
**Purpose**: Prevent HTTP 500 errors from Firebase config mismatch between local/prod

---

## 🐛 Problem

**Error**: `HTTP 500: Internal Server Error` when generating playlists locally

**Root Cause**: Local dev uses **production Firebase config**, causing:
- Auth failures (different API keys)
- Firestore permission denied (production security rules)
- CORS issues (localhost not in allowed origins)

---

## ✅ Solution: Separate Configs

### Current Setup (WRONG ❌)

```javascript
// public/js/firebase-config.js
window.__firebase_config = {
  apiKey: "PROD_API_KEY",        // ⚠️ Production only!
  authDomain: "mjrp-playlist-generator.firebaseapp.com",
  projectId: "mjrp-playlist-generator",
  // ...
}
```

**Problem**: Same config used for local AND production

---

### Correct Setup (RIGHT ✅)

Create **2 separate config files**:

#### 1. Production Config

**File**: `public/js/firebase-config.prod.js`

```javascript
window.__firebase_config = {
  apiKey: "AIza...",  // Production API key
  authDomain: "mjrp-playlist-generator.firebaseapp.com",
  projectId: "mjrp-playlist-generator",
  storageBucket: "mjrp-playlist-generator.appspot.com",
  messagingSenderId: "540062660076",
  appId: "1:540062660076:web:..."
}
```

#### 2. Local Development Config

**File**: `public/js/firebase-config.local.js` (gitignored!)

```javascript
window.__firebase_config = {
  apiKey: "AIza...",  // LOCAL emulator API key (or same as prod if using Firestore)
  authDomain: "localhost",
  projectId: "mjrp-playlist-generator-dev",  // Different project or emulator
  storageBucket: "mjrp-playlist-generator-dev.appspot.com",
  messagingSenderId: "...",
  appId: "..."
}
```

---

## 🔧 Implementation Steps

### Step 1: Update `.gitignore`

```diff
# Firebase
firebase-debug.log
.firebase/
+public/js/firebase-config.local.js  ← Add this
```

### Step 2: Update `index-v2.html`

```diff
<!-- Firebase Config -->
-<script src="/js/firebase-config.js"></script>
+<script src="/js/firebase-config.prod.js"></script>
```

### Step 3: Update `vite.config.js`

**Development mode**: Use local config

```javascript
export default defineConfig(({ mode }) => ({
  // ...
  plugins: [
    {
      name: 'copy-firebase-config',
      closeBundle() {
        const configFile = mode === 'production' 
          ? 'firebase-config.prod.js'
          : 'firebase-config.local.js'
        
        fs.copyFileSync(
          path.resolve(__dirname, `public/js/${configFile}`),
          path.resolve(__dirname, 'dist/js/firebase-config.js')
        )
      }
    }
  ]
}))
```

### Step 4: Create Local Config Template

**File**: `public/js/firebase-config.local.js.example`

```javascript
// Copy this to firebase-config.local.js and fill in your values
window.__firebase_config = {
  apiKey: "YOUR_LOCAL_API_KEY",
  authDomain: "localhost",
  projectId: "YOUR_DEV_PROJECT_ID",
  storageBucket: "YOUR_DEV_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

---

## 🚀 Quick Fix (For Now)

**Option A**: Use Firebase Emulator Suite (Recommended)

```bash
firebase emulators:start
```

**Option B**: Temporarily allow localhost in production

1. Go to [Firebase Console](https://console.firebase.google.com/project/mjrp-playlist-generator/authentication/settings)
2. **Authentication** → **Settings** → **Authorized domains**
3. Add `localhost`

**Option C**: Use production config but test carefully

Accept that local dev uses production database (⚠️ RISKY!)

---

## 📋 Developer Onboarding

### New devs should:

1. Clone repo
2. Copy template: `cp public/js/firebase-config.local.js.example public/js/firebase-config.local.js`
3. Fill in their Firebase project credentials
4. Run `npm run dev`

---

## 🔒 Security

**NEVER** commit:
- `firebase-config.local.js` (contains API keys)
- Production API keys to public repos

**ALWAYS** commit:
- `firebase-config.local.js.example` (template only)
- `firebase-config.prod.js` (if private repo, otherwise use env vars)

---

## 🧪 Testing

### Verify config is correct:

```javascript
// Browser console (F12)
console.log(window.__firebase_config)
// Should show localhost in authDomain for local dev
```

### Test local auth:

```bash
npm run dev
# Open http://localhost:5000
# Try to load albums or generate playlists
# Should NOT get HTTP 500 errors
```

---

## 📝 Related Files

- `public/js/firebase-config.prod.js` - Production config
- `public/js/firebase-config.local.js` - Local config (gitignored)
- `vite.config.js` - Build config selector
- `.gitignore` - Prevent local config commit

---

**Status**: 🟡 **TODO** - Needs implementation  
**Priority**: **HIGH** (Blocking local development)
