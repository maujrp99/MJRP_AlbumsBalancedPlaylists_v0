/**
 * E2E Test Runner
 * Executes all Puppeteer tests and reports results
 */

import { runSmokeTest } from './smoke.test.js';
import { testGhostAlbums } from './issue-15-ghost-albums.test.js';
import { testViewToggle } from './issue-16-view-toggle.test.js';

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MJRP E2E Test Suite');
    console.log('='.repeat(60));

    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;

    // Run Smoke Test
    const smokeResult = await runSmokeTest();
    results.push({ name: 'Smoke Test', ...smokeResult });
    totalPassed += smokeResult.passed;
    totalFailed += smokeResult.failed;

    // Run Issue #15 Test
    const issue15Result = await testGhostAlbums();
    results.push({ name: 'Issue #15: Ghost Albums', ...issue15Result });
    totalPassed += issue15Result.passed;
    totalFailed += issue15Result.failed;

    // Run Issue #16 Test
    const issue16Result = await testViewToggle();
    results.push({ name: 'Issue #16: View Toggle', ...issue16Result });
    totalPassed += issue16Result.passed;
    totalFailed += issue16Result.failed;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(60));

    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.name}: ${result.passed} passed, ${result.failed} failed`);
        if (result.error) {
            console.log(`    Error: ${result.error.message}`);
        }
    });

    console.log('='.repeat(60));
    console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log('='.repeat(60) + '\n');

    const allPassed = totalFailed === 0;
    if (allPassed) {
        console.log('🎉 All tests passed!\n');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.\n');
    }

    return allPassed;
}

// Execute
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
});
