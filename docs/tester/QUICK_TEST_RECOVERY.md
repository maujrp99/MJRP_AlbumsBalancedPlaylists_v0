
# 🧪 Quick Test Guide: Recovery Verification

Use this guide to verify the latest critical fixes.

## 1. Verify UI Icons ("Plus" Icon)
- [ ] Go to **Inventory** page.
- [ ] Check if the **"Create Series"** button has a folder+plus icon.
- [ ] Go to **Albums** page.
- [ ] Hover over any album card.
- [ ] Check if the **"Archive"** (Box) icon appears in the overlay (4th button).
- [ ] Check if formatting icons (CD/Vinyl/etc) appear on cards.

## 2. Verify Persistence (Critical Fix)
The Series Store was using an outdated saving method. This is now fixed.

### Test Steps:
1. **Create a Series**:
   - Go to Home.
   - Click "New Series".
   - Name: "Persistence Test".
   - Add 1 album manually or via "Add Album".
   - Click **"Create Series"**.
   - **Expected**: Series created successfully, no error alerts.

2. **Verify Save**:
   - Reload the page (F5/Cmd+R).
   - Go to **Home**.
   - You should see "Persistence Test" in the "Your Series" list.
   - **If it's there, Persistence is FIXED.**

3. **Verify Inventory Persistence**:
   - Go to **Albums**.
   - Add an album to Inventory (Archive icon).
   - Go to **Inventory**.
   - Reload page.
   - Album should still be there.

---
**Technical Note**:
- We updated `SeriesStore.js` to use `serverTimestamp()` (modular) instead of `firebase.firestore.FieldValue.serverTimestamp()` (legacy), which was crashing the save operation.
