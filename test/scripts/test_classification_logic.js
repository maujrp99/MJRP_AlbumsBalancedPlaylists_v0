
import { GenreGateStrategy } from './public/js/services/album-search/classification/GenreGateStrategy.js';
import { AIWhitelistStrategy } from './public/js/services/album-search/classification/AIWhitelistStrategy.js';
import { RemixTracksStrategy } from './public/js/services/album-search/classification/RemixTracksStrategy.js';

// Mock Context
const mockContext = (genres, mockAiList = []) => ({
    genres,
    trackCount: 10,
    getAiList: async () => mockAiList,
    aiList: mockAiList
});

const mockAlbum = (title) => ({ title, trackCount: 10 });

async function runTests() {
    console.log('--- TESTING CLASSIFICATION LOGIC ---\n');

    const genreGate = new GenreGateStrategy();
    const aiWhitelist = new AIWhitelistStrategy();
    const remixStrategy = new RemixTracksStrategy();

    // Test 1: Rock Album (Pink Floyd) -> Should be 'Album' by GenreGate
    console.log('Test 1: Rock Album (Pink Floyd)');
    const rockContext = mockContext(['Rock', 'Progressive Rock']);
    const rockResult = genreGate.execute(mockAlbum('Dark Side of the Moon'), rockContext);
    console.log(`GenreGate Result: ${rockResult} (Expected: 'Album')`);
    console.log(rockResult === 'Album' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 2: Electronic Album (Ferry Corsten) -> Should be null by GenreGate (pass through)
    console.log('Test 2: Electronic Album (Ferry Corsten)');
    const electroContext = mockContext(['Trance', 'Electronic'], ['Blueprint', 'L.E.F.']); // AI knows Blueprint
    const electroResult = genreGate.execute(mockAlbum('Blueprint'), electroContext);
    console.log(`GenreGate Result: ${electroResult} (Expected: null/undefined)`);

    if (!electroResult) {
        console.log('-> Passed directly to AIWhitelist...');
        const aiResult = await aiWhitelist.execute(mockAlbum('Blueprint'), electroContext);
        console.log(`AIWhitelist Result: ${aiResult} (Expected: 'Album')`);
        console.log(aiResult === 'Album' ? '✅ PASS' : '❌ FAIL');
    } else {
        console.log('❌ FAIL: GenreGate blocked it prematureley');
    }
    console.log('');

    // Test 3: Electronic Album NOT in AI List (Unknown EP/Fake) -> Should be 'Uncategorized'
    console.log('Test 3: Electronic Album NOT in AI List');
    const unknownContext = mockContext(['Trance'], ['Other Album']);
    const unknownResult = await aiWhitelist.execute(mockAlbum('Unknown EP'), unknownContext);
    console.log(`AIWhitelist Result: ${unknownResult} (Expected: 'Uncategorized')`);
    console.log(unknownResult === 'Uncategorized' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 4: Localized Genre (Eletrônica) -> Should be passed by GenreGate (null) and handled by AI
    console.log('Test 4: Localized Genre (Eletrônica)');
    const localizedContext = mockContext(['Eletrônica'], ['Total Eclipse']);
    const localizedGateResult = genreGate.execute(mockAlbum('Total Eclipse'), localizedContext);
    console.log(`GenreGate Result: ${localizedGateResult} (Expected: null)`);

    if (!localizedGateResult) {
        console.log('-> Passed to AIWhitelist...');
        const localizedAiResult = await aiWhitelist.execute(mockAlbum('Total Eclipse'), localizedContext);
        console.log(`AIWhitelist Result: ${localizedAiResult} (Expected: 'Album')`);
        console.log(localizedAiResult === 'Album' ? '✅ PASS' : '❌ FAIL');
    } else {
        console.log('❌ FAIL: GenreGate treated it as Non-Electronic');
    }
    console.log('');

    // Test 5: Tiesto - Kaleidoscope (Real Scenario Simulation w/ Feedback Loop)
    console.log('Test 5: Tiesto - Kaleidoscope (Remix Strategy vs AI Rescue)');

    // 1. Setup Context: It IS Electronic, and 'Kaleidoscope' IS in the AI List
    const tiestoContext = mockContext(
        ['Trance', 'Progressive House', 'Electronic'],
        ['Kaleidoscope', 'In My Memory', 'Just Be'] // AI knows these are Studio Albums
    );

    // 2. Setup Album: 100% Remix Tracks (Extended Mixes)
    const kaleidoscopeTracks = [
        { name: 'Kaleidoscope' }, { name: 'Escape Me' }, { name: 'You Are My Diamond' },
        { name: 'I Will Be Here' }, { name: 'Century' }, { name: 'Feel It in My Bones' },
        { name: 'Who Wants to Be Alone' }, { name: 'LA Ride' }, { name: 'Bend It Like You Don\'t Care' },
        { name: 'Knock You Out' }, { name: 'Louder Than Boom' }, { name: 'Surrounded By Light' }
    ];
    // Dirty version where ALL tracks are extended mixes (triggers RemixStrategy -> EP)
    const dirtyTracks = kaleidoscopeTracks.map(t => ({ name: t.name + ' (Extended Mix)' }));
    const albumToSend = { title: 'Kaleidoscope', tracks: dirtyTracks, trackCount: 12 };

    // 3. Execution via Orchestrator (simulating full pipeline)
    // We need to use valid AlbumTypeClassifier instance if we want to test the loop logic, 
    // simply running heuristics individually won't test the orchestrator's "preliminary vs final" logic.
    // So we will instantiate the Classifier here if possible, or simulate the behavior manually.

    // Since importing the whole Classifier might be complex due to dependencies, let's look at what we have.
    // The previous tests were unit tests of strategies.
    // WE NEED TO TEST THE ORCHESTRATOR LOGIC NOW.

    // Let's rely on the previous unit test logic but acknowledging that now we need to integrate.
    // I represents the "manual orchestrator" here.

    console.log("--- Simulating Orchestrator Logic ---");
    let preliminary = remixStrategy.execute(albumToSend, tiestoContext);
    console.log(`Preliminary Heuristic (RemixStrategy): ${preliminary} (Expected: 'EP' or 'Single')`);

    // Now pass to AI Whitelist with preliminary type
    const aiContext = { ...tiestoContext, preliminaryType: preliminary };
    const finalResult = await aiWhitelist.execute(albumToSend, aiContext);

    console.log(`Final Result (AI Whitelist): ${finalResult}`);

    if (finalResult === 'Album') {
        console.log('✅ PASS: AI Rescued the album from EP to Studio Album!');
    } else {
        console.log('❌ FAIL: AI did not rescue the album.');
    }
    console.log('');

    // Test 6: Regression - Safe Rescue (Should NOT rescue Single that looks like Album)
    console.log('Test 6: Safe Rescue Regression (Should BLOCK rescue of Singles)');
    const riskyContext = mockContext(['Trance'], ['Elements of Life']); // AI knows Elements of Life
    const riskyAlbum = mockAlbum('Elements of Life - Single'); // Preliminary: Single

    // Simulate preliminary result
    const riskyPreliminary = 'Single';
    const riskyFinalContext = { ...riskyContext, preliminaryType: riskyPreliminary };

    const riskyResult = await aiWhitelist.execute(riskyAlbum, riskyFinalContext);
    console.log(`Risky Result: ${riskyResult} (Expected: 'Single')`);

    if (riskyResult === 'Single') {
        console.log('✅ PASS: AI correctly BLOCKED the rescue of a Single.');
    } else {
        console.log(`❌ FAIL: AI incorrectly rescued a Single to ${riskyResult}`);
    }
    console.log('');

    // Test 7: COMPILATION Rescue Regression (Safe Rescue should prevent "Presents" / "Volume")
    console.log('Test 7: Compilation Rescue Check (Should BLOCK "Solarstone Presents Pure Trance")');
    const compContext = mockContext(['Trance'], ['Pure']); // AI knows "Pure"
    const compAlbum = mockAlbum('Solarstone Presents Pure Trance 2'); // Preliminary: Compilation
    const compFinalContext = { ...compContext, preliminaryType: 'Compilation' };

    const compResult = await aiWhitelist.execute(compAlbum, compFinalContext);
    console.log(`Compilation Result: ${compResult} (Expected: 'Compilation')`);

    if (compResult === 'Compilation') console.log('✅ PASS: Blocked rescue of Compilation.');
    else console.log('❌ FAIL: Incorrectly rescued Compilation.');
    console.log('');

    // Test 8: SYMBOL MATCH Regression (Empty/Short Key fuzzy match)
    console.log('Test 8: Symbol Match Check (Should NOT match ".----" to "Electronic Architecture")');
    const symbolContext = mockContext(['Trance'], ['.----']); // AI returned weird symbol title
    const symbolAlbum = mockAlbum('Electronic Architecture 3');
    const symbolFinalContext = { ...symbolContext, preliminaryType: 'Compilation' }; // Preliminary: Compilation

    const symbolResult = await aiWhitelist.execute(symbolAlbum, symbolFinalContext);
    console.log(`Symbol Result: ${symbolResult} (Expected: 'Compilation')`);

    // Should return 'Compilation' (fallback) or 'Uncategorized' if logic differs, NOT 'Album'
    if (symbolResult !== 'Album') console.log('✅ PASS: Ignored empty/short key match.');
    else {
        console.log(`❌ FAIL: Incorrectly matched symbol/empty key.`);
    }
    console.log('');

    // Test 9: TOKEN MATCH Regression (Strict Word Boundaries)
    console.log('Test 9: Token Match Check (Should NOT match "One" to "Is There Anyone Out There?")');
    const tokenContext = mockContext(['Trance'], ['One']); // AI knows "One"
    const tokenAlbum = mockAlbum('Is There Anyone Out There?'); // EP
    const tokenFinalContext = { ...tokenContext, preliminaryType: 'EP' };

    const tokenResult = await aiWhitelist.execute(tokenAlbum, tokenFinalContext);
    console.log(`Token Result: ${tokenResult} (Expected: 'EP')`);

    if (tokenResult === 'EP') console.log('✅ PASS: Correctly distinguished "Anyone" from "One".');
    else console.log(`❌ FAIL: Incorrectly rescued using partial match: ${tokenResult}`);
    console.log('');

    // Test 10: RISKY KW REGRESSION (Club / Pt.)
    console.log('Test 10: Risky Keyword Regression ("Club Embrace" vs "Embrace")');
    const arminContext = mockContext(['Trance'], ['Embrace', 'Feel Again']);
    const clubAlbum = mockAlbum('Club Embrace'); // Should NOT match 'Embrace'
    const ptAlbum = mockAlbum('Feel Again, Pt. 1'); // Should NOT match 'Feel Again'

    // Preliminary types would likely be "Remix" or "EP"/Compilation
    const clubResult = await aiWhitelist.execute(clubAlbum, { ...arminContext, preliminaryType: 'Compilation' });
    const ptResult = await aiWhitelist.execute(ptAlbum, { ...arminContext, preliminaryType: 'EP' });

    console.log(`Club Result: ${clubResult} (Expected: 'Compilation')`);
    console.log(`Pt. 1 Result: ${ptResult} (Expected: 'Album')`);

    if (clubResult === 'Compilation' && ptResult === 'Album') console.log('✅ PASS: Blocked "Club" (Risky) but ALLOWED "Pt." (Valid Album).');
    else console.log(`❌ FAIL: Incorrect logic. Club=${clubResult}, Pt.1=${ptResult}`);
    console.log('');

    // Test 11: Ferry Corsten Regression (Hello World EPs & Compilations)
    console.log('Test 11: Ferry Corsten Regression (Hello World EPs vs Album)');
    const ferryContext = mockContext(['Trance', 'Electronic'], ['Hello World']); // AI knows "Hello World" is an album

    // Scenario 1: "Hello World 1" (EP, 6 tracks) -> Should be EP
    // AI currently fuzzily matches this to "Hello World" and rescues it to Album.
    const hwEp = { title: 'Hello World 1', trackCount: 6 };
    const hwEpContext = { ...ferryContext, preliminaryType: 'EP', trackCount: 6 };
    const hwResult = await aiWhitelist.execute(hwEp, hwEpContext);

    console.log(`Hello World 1 Result (AI Step): ${hwResult} (Expected: 'Album' by AI, but we want Sanity Check to fix this)`);

    // Scenario 2: "Why I'm Now Listening To" (Compilation, ~20 tracks) -> Should be Compilation
    // Likely Uncategorized or Compilation preliminary.
    const listeningAlbum = { title: "Why I'm Now Listening To", trackCount: 20 };
    const listeningContext = { ...ferryContext, preliminaryType: 'Compilation', trackCount: 20 };
    const listeningResult = await aiWhitelist.execute(listeningAlbum, listeningContext);

    console.log(`Why I'm Now Listening To Result: ${listeningResult} (Expected: 'Compilation')`);

    // --- MANUAL SANITY CHECK SIMULATION ---
    console.log('\n--- Simulating Sanity Check Post-Processing ---');
    // We need to instantiate the Sanity Check Strategy
    const { TypeSanityCheckStrategy } = await import('./public/js/services/album-search/classification/TypeSanityCheckStrategy.js');
    const sanityCheck = new TypeSanityCheckStrategy();

    // 1. Verify Hello World 1 (AI returned Album, but trackCount=6)
    const hwSanityContext = { ...hwEpContext, currentType: hwResult };
    const hwFinal = sanityCheck.execute(hwEp, hwSanityContext);
    console.log(`Hello World 1 Final Result: ${hwFinal || hwResult} (Expected: 'EP')`);

    if ((hwFinal || hwResult) === 'EP') console.log('✅ PASS: Sanity Check downgraded Hello World 1 to EP!');
    else console.log('❌ FAIL: Sanity Check failed to downgrade.');

    // 2. Verify Feel Again Pt. 1 (AI returned Album, trackCount=10)
    // Re-run execution simulation for accuracy
    const ptSanityContext = { ...arminContext, trackCount: 10, currentType: 'Album' };
    const ptAlbumRe = { title: 'Feel Again, Pt. 1', trackCount: 10 };
    const ptFinal = sanityCheck.execute(ptAlbumRe, ptSanityContext);
    console.log(`Feel Again Pt. 1 Final Result: ${ptFinal || 'Album'} (Expected: 'Album')`);

    if ((ptFinal || 'Album') === 'Album') console.log('✅ PASS: Sanity Check respected Feel Again Pt. 1 (High Track Count).');
    else console.log(`❌ FAIL: Sanity Check incorrectly downgraded Feel Again: ${ptFinal}`);

    // 3. Verify 'Why I'm Now Listening To' (Simulate it came in as ALBUM)
    // Even if AI/Apple says it's an Album, the "listening to" keyword should catch it.
    const listeningSanityContext = { ...listeningContext, currentType: 'Album' };
    const listeningFinal = sanityCheck.execute(listeningAlbum, listeningSanityContext);
    console.log(`Why I'm Now Listening To Final Result: ${listeningFinal || 'Album'} (Expected: 'Compilation')`);

    if (listeningFinal === 'Compilation') console.log('✅ PASS: Sanity Check caught "Listening To" compilation!');
    else console.log(`❌ FAIL: Sanity Check failed to catch compilation keyword.`);
    // NOTE: This test might show "FAIL" for now until we update Sanity Check.
    // The Sanity Check runs AFTER AI Whitelist in the classifier, so unit testing AIWL might show 'Album'.
    // We need to verify that Sanity Check fixes it.
}

runTests();
