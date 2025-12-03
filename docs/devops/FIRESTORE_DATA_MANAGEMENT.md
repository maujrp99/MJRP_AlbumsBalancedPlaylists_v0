# Firestore Data Management

**Last Updated**: 2025-12-02  
**Purpose**: How to manage production Firestore data

---

## 🗄️ Data Storage Architecture

### IndexedDB (Browser - Local Cache)
- **Location**: User's browser
- **Collections**: `albums`, `series`, `playlists`
- **Scope**: Per-user, per-device
- **Persistence**: Cleared on browser cache clear

### Firestore (Firebase - Cloud Database)
- **Location**: Cloud (shared across all users)
- **Collections**: `series`, `albums`, `playlists`
- **Scope**: Global (all users see same data)
- **Persistence**: Permanent until manually deleted

---

## 🗑️ Clearing Data

### Option 1: Clear Browser Cache Only (Safe)

**When to use**: Testing locally, clearing your own cache

```javascript
// Browser console (F12):
indexedDB.deleteDatabase('mjrp-playlists-db')
location.reload()
```

**Impact**: Affects ONLY your browser

---

### Option 2: Firebase Console (Manual)

**When to use**: Delete specific documents

**Steps**:
1. Go to [Firestore Console](https://console.firebase.google.com/project/mjrp-playlist-generator/firestore/databases/-default-/data)
2. Navigate to collection: `series`, `albums`, or `playlists`
3. Select document(s)
4. Click delete icon

**Impact**: Affects ALL users

---

### Option 3: Cleanup Script (Recommended)

**When to use**: Bulk deletion, safe preview

#### Dry Run (Preview Only)
```bash
node scripts/clear-firestore-data.js --dry-run
```

**Output**:
```
📊 Current data:
  series: 5 documents
  albums: 12 documents
  playlists: 8 documents

✅ DRY RUN complete. Would delete 25 documents.
```

#### Delete Specific Collection
```bash
node scripts/clear-firestore-data.js --collection=series
```

**Prompts for confirmation**: Type "DELETE" to confirm

#### Delete ALL Collections
```bash
node scripts/clear-firestore-data.js
```

**⚠️ WARNING**: Requires typing "DELETE" to confirm (safety mechanism)

---

## 🔐 Prerequisites

### Service Account Key

Script requires Firebase Admin SDK access:

```bash
# Option 1: Service account file (recommended)
# Place at: ../keys/mjrp-service-account.json

# Option 2: Environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

### Install Dependencies
```bash
npm install firebase-admin  # If not already installed
```

---

## ⚠️ Safety Features

The cleanup script includes:

1. **Dry Run Mode**: Preview before deletion
2. **Document Count**: Shows exactly what will be deleted
3. **Confirmation Prompt**: Must type "DELETE" to proceed
4. **Batch Processing**: Handles large collections safely
5. **Error Handling**: Won't crash on missing collections

---

## 🚨 Important Notes

### ⚠️ NO UNDO!

Firestore deletions are **permanent**. There is NO automatic backup.

**Before bulk delete**:
1. ✅ Run `--dry-run` first
2. ✅ Consider exporting data (see below)
3. ✅ Verify you're targeting correct collection

### 💾 Export Data (Backup)

**Via Firebase CLI**:
```bash
firebase firestore:export gs://mjrp-playlist-generator.appspot.com/backups/$(date +%Y%m%d)
```

**Via Console**:
1. Go to [Firestore Console](https://console.firebase.google.com/project/mjrp-playlist-generator/firestore)
2. Click Import/Export
3. Choose Export
4. Select Cloud Storage bucket

---

## 📖 Examples

### Clear test data after UAT
```bash
# Preview first
node scripts/clear-firestore-data.js --dry-run

# Delete series only
node scripts/clear-firestore-data.js --collection=series
# Type: DELETE
```

### Fresh start (all collections)
```bash
# Backup first!
firebase firestore:export gs://mjrp-playlist-generator.appspot.com/backups/manual-backup

# Preview
node scripts/clear-firestore-data.js --dry-run

# Delete
node scripts/clear-firestore-data.js
# Type: DELETE
```

### Clear local browser cache
```javascript
// F12 Console:
indexedDB.deleteDatabase('mjrp-playlists-db')
localStorage.clear()
location.reload()
```

---

## 🔍 Troubleshooting

### "Service account not found"

**Solution**: Place service account key at `../keys/mjrp-service-account.json` or set `GOOGLE_APPLICATION_CREDENTIALS`

### "Permission denied"

**Cause**: Service account lacks Firestore permissions

**Solution**: 
1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=mjrp-playlist-generator)
2. Find service account
3. Grant "Cloud Datastore User" role

### "firebase-admin not found"

**Solution**:
```bash
npm install firebase-admin
```

---

## 📚 Related Documentation

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Export](https://firebase.google.com/docs/firestore/manage-data/export-import)

---

**Questions?** Check [CONTRIBUTING.md](../CONTRIBUTING.md) or Firebase docs.
