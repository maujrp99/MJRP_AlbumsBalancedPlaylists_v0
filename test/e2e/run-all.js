/**
 * E2E Test Runner
 * Executes all Puppeteer tests and reports results
 */

import { runSmokeTest } from './smoke.test.js';
import { testGhostAlbums } from './issue-15-ghost-albums.test.js';
import { testViewToggle } from './issue-16-view-toggle.test.js';
import { testSeriesSwitching } from './issue-19-series-switching.test.js';
import { testStickyPlaylists } from './issue-21-sticky-playlists.test.js';
import { testUIComponents } from './ui-components.test.js';

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MJRP E2E Test Suite - Complete');
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

    // Run Issue #19 Test
    const issue19Result = await testSeriesSwitching();
    results.push({ name: 'Issue #19: Series Switching', ...issue19Result });
    totalPassed += issue19Result.passed;
    totalFailed += issue19Result.failed;

    // Run Issue #21 Test
    const issue21Result = await testStickyPlaylists();
    results.push({ name: 'Issue #21: Sticky Playlists', ...issue21Result });
    totalPassed += issue21Result.passed;
    totalFailed += issue21Result.failed;

    // Run UI Components Test
    const uiResult = await testUIComponents();
    results.push({ name: 'UI Components', ...uiResult });
    totalPassed += uiResult.passed;
    totalFailed += uiResult.failed;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPLETE TEST SUITE SUMMARY');
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
    console.log(`Test Suites: ${results.filter(r => r.success).length}/${results.length} passed`);
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
