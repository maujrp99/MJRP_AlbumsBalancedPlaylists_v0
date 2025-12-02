#!/usr/bin/env node
/**
 * Clear Firestore production data
 * Usage: node scripts/clear-firestore-data.js [--dry-run] [--collection=<name>]
 * 
 * Examples:
 *   node scripts/clear-firestore-data.js --dry-run           # Preview only
 *   node scripts/clear-firestore-data.js --collection=series # Delete only series
 *   node scripts/clear-firestore-data.js                     # Delete ALL (requires confirmation)
 */

const admin = require('firebase-admin');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Parse args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const collectionArg = args.find(a => a.startsWith('--collection='));
const targetCollection = collectionArg ? collectionArg.split('=')[1] : null;

// Load service account
const serviceAccountPath = path.resolve(__dirname, '../../keys/mjrp-service-account.json');
let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (e) {
    console.error('❌ Service account not found at:', serviceAccountPath);
    console.error('   Set GOOGLE_APPLICATION_CREDENTIALS or place key file there.');
    process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'mjrp-playlist-generator'
});

const db = admin.firestore();

const COLLECTIONS = ['series', 'albums', 'playlists'];

async function deleteCollection(collectionName, batchSize = 100) {
    const collectionRef = db.collection(collectionName);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve, reject);
    });
}

async function deleteQueryBatch(query, resolve, reject) {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✓ Deleted ${snapshot.size} documents`);

    // Recurse
    process.nextTick(() => {
        deleteQueryBatch(query, resolve, reject);
    });
}

async function countDocuments(collectionName) {
    const snapshot = await db.collection(collectionName).count().get();
    return snapshot.data().count;
}

async function main() {
    console.log('\n🔥 Firestore Data Cleanup Tool\n');
    console.log('Project:', 'mjrp-playlist-generator');
    console.log('Mode:', isDryRun ? 'DRY RUN (preview only)' : '🔴 LIVE DELETE');
    console.log('Target:', targetCollection || 'ALL collections');
    console.log('');

    const collectionsToDelete = targetCollection
        ? [targetCollection]
        : COLLECTIONS;

    // Count documents
    console.log('📊 Current data:');
    const counts = {};
    for (const col of collectionsToDelete) {
        try {
            const count = await countDocuments(col);
            counts[col] = count;
            console.log(`  ${col}: ${count} documents`);
        } catch (e) {
            console.log(`  ${col}: ⚠️  Collection doesn't exist or error: ${e.message}`);
            counts[col] = 0;
        }
    }
    console.log('');

    const totalDocs = Object.values(counts).reduce((sum, c) => sum + c, 0);

    if (totalDocs === 0) {
        console.log('✅ No data to delete. Exiting.');
        process.exit(0);
    }

    if (isDryRun) {
        console.log('✅ DRY RUN complete. No data was deleted.');
        console.log(`   Would delete ${totalDocs} documents across ${collectionsToDelete.length} collection(s).`);
        process.exit(0);
    }

    // Confirmation
    console.log(`⚠️  WARNING: About to DELETE ${totalDocs} documents!`);
    console.log('   This action CANNOT be undone.\n');

    rl.question('Type "DELETE" to confirm: ', async (answer) => {
        if (answer !== 'DELETE') {
            console.log('❌ Aborted. No data was deleted.');
            process.exit(0);
        }

        console.log('\n🗑️  Deleting data...\n');

        for (const col of collectionsToDelete) {
            if (counts[col] > 0) {
                console.log(`Deleting collection: ${col}`);
                try {
                    await deleteCollection(col);
                    console.log(`✅ Deleted all documents from ${col}\n`);
                } catch (e) {
                    console.error(`❌ Error deleting ${col}:`, e.message);
                }
            }
        }

        console.log('✅ Cleanup complete!');
        process.exit(0);
    });
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
