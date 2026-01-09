const { extractAlbum } = require('./server/lib/normalize');

const mockBadResponse = {
    data: {
        artist: "Michael Jackson",
        title: "Thriller",
        tracks: {
            "0": { title: "Wanna Be Startin' Somethin'" },
            "1": { title: "Baby Be Mine" },
            "2": { title: "The Girl Is Mine" },
            "3": { title: "Thriller" }
        }
    }
};

console.log("Testing Normalization Logic...");
const result = extractAlbum(mockBadResponse);
console.log("Result:", JSON.stringify(result, null, 2));

if (result && Array.isArray(result.tracks) && result.tracks.length === 4) {
    console.log("PASS: Tracks normalized to array");
} else {
    console.error("FAIL: Tracks are not an array or length mismatch");
    process.exit(1);
}

const mockGoodResponse = {
    data: {
        artist: "Test",
        title: "Good Album",
        tracks: [{ title: "T1" }, { title: "T2" }]
    }
};

const result2 = extractAlbum(mockGoodResponse);
if (result2 && Array.isArray(result2.tracks) && result2.tracks.length === 2) {
    console.log("PASS: Already correct array remains array");
} else {
    console.error("FAIL: Good response broken");
    process.exit(1);
}
