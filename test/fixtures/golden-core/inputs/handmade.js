// The hand-made part of the golden corpus (F78, TASK-04; from spike S1, 2026-11-20). Catalog-like data only (album and track titles), no data
// of the owner. Built to hit what the rules are sensitive to:
// - tracks WITHOUT `id` almost everywhere, so the id port (newId, shared/platform/newId.js) is called;
// - accents and non-Latin scripts (Portuguese, Icelandic, Japanese, Cyrillic, Greek final sigma,
//   Turkish dotted I, a ligature and full-width letters), whose handling depends on the engine's
//   String.prototype.normalize, toLowerCase and \p{L} tables;
// - edition notes in parentheses and brackets, medleys, a reprise (same title twice in one album),
//   a title shared by two albums;
// - ratings and popularity with ties, missing values (null, absent, -1), a rating given as text;
// - an empty album, a one-track album, a 20-track album, a 9-track album;
// - the side lists the rankings read (rankingConsolidated, bestEverEvidence, rankingAcclaim,
//   tracksOriginalOrder, userRanking) written with other spellings of the titles.

const t = (title, duration, rating, spotifyPopularity, extra = {}) => {
    const track = { title, duration }
    if (rating !== undefined) track.rating = rating
    if (spotifyPopularity !== undefined) track.spotifyPopularity = spotifyPopularity
    return { ...track, ...extra }
}

export const pitty = {
    id: 'alb-pitty-admiravel',
    title: 'Admirável Chip Novo',
    artist: 'Pitty',
    year: 2003,
    tracks: [
        t('Teto de Vidro', 212, 88, 71),
        t('Admirável Chip Novo', 189, 92, 80),
        t('Máscara', 223, 90, 74),
        t('Equalize', 233, 90, 78),
        t('O Lobo', 201, null, 55),
        t('Emboscada', 178, 81, undefined),
        t('Do Mesmo Lado', 195, 81, 40),
        t('Só de Passagem', 241, 77, 40),
        t('I Wanna Be', 168, null, null),
        t('Semana Que Vem', 254, 84, 62),
        t('Temporal', 206, '79', 33)
    ],
    bestEverEvidence: [
        { trackTitle: 'Admiravel Chip Novo', rating: 93 },
        { trackTitle: 'MASCARA', rating: 90 },
        { trackTitle: 'Só De Passagem (Ao Vivo)', rating: 70 }
    ]
}

export const sigurRos = {
    id: 'alb-sigur-agaetis',
    title: 'Ágætis byrjun',
    artist: 'Sigur Rós',
    tracks: [
        t('Intro', 96, 60, 30),
        t('Svefn-g-englar', 604, 95, 64),
        t('Starálfur', 407, 94, 70),
        t('Flugufrelsarinn', 467, 86, 38),
        t('Ný batterí', 491, 88, 41),
        t('Hjartað hamast (bamm bamm bamm)', 431, 85, 35),
        t('Viðrar vel til loftárása', 617, 92, 45),
        t('Olsen Olsen', 483, 89, 44),
        t('Ágætis byrjun', 476, 89, 39),
        t('Avalon', 240, 70, 28)
    ],
    tracksOriginalOrder: [
        { title: 'Intro', position: 1 }, { title: 'Svefn-g-englar', position: 2 },
        { title: 'Staralfur', position: 3 }, { title: 'Flugufrelsarinn', position: 4 },
        { title: 'Ny batteri', position: 5 }, { title: 'Hjartad hamast', position: 6 },
        { title: 'Viðrar vel til loftárása', position: 7 }, { title: 'Olsen Olsen', position: 8 },
        { title: 'Ágætis byrjun', position: 9 }, { title: 'Avalon', position: 10 }
    ]
}

export const utada = {
    id: 'alb-utada-firstlove',
    title: 'First Love (15th Anniversary Edition) [2014 Remaster]',
    artist: '宇多田ヒカル',
    tracks: [
        t('Automatic -Album Edit-', 312, 88, 66),
        t("Movin' on without you", 280, 85, 58),
        t('In My Room', 312, 80, 47),
        t('First Love', 257, 96, 84),
        t('甘いワナ ～Paint It, Black', 289, 82, 52),
        t('time will tell', 330, 84, 61),
        t('Never Let Go', 288, 78, 40),
        t('B&C', 278, 75, 40),
        t('Another Chance', 335, 74, 38),
        t('Interlude', 30, null, 20),
        t('Give Me A Reason', 315, 79, 45),
        t('Automatic Part II', 189, 70, 33),
        t('ﬁrst love （ＡＣＯＵＳＴＩＣ）', 260, 73, 30)
    ],
    rankingAcclaim: [
        { title: 'First Love', rank: 1 },
        { title: 'Automatic', rank: 2 },
        { title: 'あまいわな', rank: 3 }
    ]
}

export const kino = {
    id: 'alb-kino-gruppa',
    title: 'Группа крови',
    artist: 'Кино',
    tracks: [
        t('Группа крови', 285, 97, 90),
        t('Закрой за мной дверь, я ухожу', 262, 90, 70),
        t('Война', 230, 85, 52),
        t('Спокойная ночь', 375, 94, 77),
        t('Мама, мы все тяжело больны', 301, 88, 60),
        t('Мы хотим танцевать', 254, 80, 40),
        t('Бошетунмай', 260, 86, 55),
        t('Прохожий', 251, 78, 40),
        t('Ёлка (Live)', 199, null, 12),
        t('ΟΔΟΣ', 120, 50, 10),
        t('İstanbul', 180, 50, 10)
    ],
    rankingConsolidated: [
        { trackTitle: 'группа крови', finalPosition: 1, rating: 97, normalizedScore: 99 },
        { trackTitle: 'Спокойная Ночь', finalPosition: 2, rating: 94, normalizedScore: 95 },
        { trackTitle: 'Закрой за мной дверь я ухожу', finalPosition: 3, rating: 90, normalizedScore: 90 },
        { trackTitle: 'Елка', finalPosition: 4, rating: 60 },
        { trackTitle: 'οδος', finalPosition: 5, rating: 50 }
    ]
}

export const abbeyRoad = {
    id: 'alb-beatles-abbey',
    title: 'Abbey Road (Super Deluxe Edition)',
    artist: 'The Beatles',
    tracks: [
        t('Come Together (2019 Mix)', 260, 92, 88),
        t('Something (2019 Mix)', 183, 94, 85),
        t("Maxwell's Silver Hammer (2019 Mix)", 207, 65, 60),
        t('Oh! Darling (2019 Mix)', 207, 82, 62),
        t("Octopus's Garden (2019 Mix)", 171, 70, 66),
        t("I Want You (She's So Heavy) (2019 Mix)", 467, 90, 61),
        t('Here Comes The Sun (2019 Mix)', 185, 96, 95),
        t('Because (2019 Mix)', 165, 88, 55),
        t('You Never Give Me Your Money (2019 Mix)', 242, 91, 58),
        t('Sun King (2019 Mix)', 146, 80, 49),
        t('Mean Mr. Mustard (2019 Mix)', 66, 78, 48),
        t('Polythene Pam (2019 Mix)', 72, 79, 48),
        t('She Came In Through The Bathroom Window (2019 Mix)', 117, 83, 52),
        t('Golden Slumbers / Carry That Weight / The End (Medley) (2019 Mix)', 335, 95, 64),
        t('Her Majesty (2019 Mix)', 25, 60, 50),
        t('Come Together (Take 5)', 260, null, 20)
    ],
    rankingAcclaim: [
        { title: 'Something', rank: 2 },
        { title: 'Here Comes the Sun', rank: 1 },
        { title: 'Medley: Golden Slumbers / Carry That Weight / The End', rank: 3 }
    ]
}

export const revolver = {
    id: 'alb-beatles-revolver',
    title: 'Revolver (2022 Mix/Master)',
    artist: 'Beatles, The',
    tracks: [
        t('Taxman (2022 Mix)', 159, 87, 70),
        t('Eleanor Rigby (2022 Mix)', 127, 93, 80),
        t("I'm Only Sleeping (2022 Mix)", 181, 85, 55),
        t('Love You To (2022 Mix)', 181, 70, 40),
        t('Here, There And Everywhere (2022 Mix)', 145, 92, 68),
        t('Yellow Submarine (2022 Mix)', 159, 72, 75),
        t('She Said She Said (2022 Mix)', 157, 88, 50),
        t('Good Day Sunshine (2022 Mix)', 129, 80, 52),
        t('And Your Bird Can Sing (2022 Mix)', 121, 86, 54),
        t('For No One (2022 Mix)', 121, 90, 50),
        t('Doctor Robert (2022 Mix)', 135, 75, 41),
        t('I Want To Tell You (2022 Mix)', 149, 78, 43),
        t('Got To Get You Into My Life (2022 Mix)', 150, 84, 57),
        t('Tomorrow Never Knows (2022 Mix)', 177, 95, 62)
    ]
}

// Same track title as in another album (Come Together), a reprise inside one album, ties everywhere
export const anthology = {
    id: 'alb-beatles-anthology',
    title: 'Anthology 3',
    artist: 'The Beatles',
    tracks: [
        t('Come Together', 260, 80, 50),
        t('Something', 183, 80, 50),
        t('Reprise', 90, 80, 50),
        t('Because', 165, 80, 50),
        t('Reprise', 95, 80, 50),
        t('Her Majesty', 25, 80, 50),
        t('Sun King', 146, 80, 50),
        t('The End', 140, 80, 50)
    ],
    userRanking: [
        { title: 'Reprise', userRank: 2 },
        { title: 'Something', userRank: 1 },
        { title: 'Reprise', userRank: 5 },
        { title: 'The End', userRank: 3 }
    ]
}

// 20 tracks; ratings and popularity with many ties and gaps; some tracks carry ids, some do not
export const twenty = {
    id: 'alb-twenty',
    title: 'Vinte Faixas (Expanded Edition)',
    artist: 'Banda Exemplo',
    tracks: Array.from({ length: 20 }, (_, i) => {
        const track = {
            title: `Faixa ${i + 1}${i % 7 === 3 ? ' (Remastered 2009)' : ''}${i === 12 ? ' – Ao Vivo' : ''}`,
            duration: 150 + ((i * 53) % 190),
            position: i + 1
        }
        if (i % 4 !== 0) track.rating = 60 + ((i * 7) % 30)
        if (i % 3 !== 0) track.spotifyPopularity = (i * 11) % 60
        if (i % 5 === 0) track.id = `twenty-${i + 1}`
        return track
    })
}

export const single = {
    id: 'alb-single',
    title: 'Só Uma',
    artist: 'Artista Único',
    tracks: [t('Única', 400, 70, 50)]
}

export const empty = {
    id: 'alb-empty',
    title: 'Vazio',
    artist: 'Ninguém',
    tracks: []
}

// No rating and no popularity at all: the rules must fall back to the order of the album
export const noScores = {
    id: 'alb-no-scores',
    title: 'Sem Notas',
    artist: 'Mistério',
    tracks: [t('Um', 200), t('Dois', 210), t('Três', 190), t('Quatro', 230), t('Cinco', 180), t('Seis', 205), t('Sete', 199), t('Oito', 222)]
}

export const handmadeAlbums = [pitty, sigurRos, utada, kino, abbeyRoad, revolver, anthology, twenty, single, empty, noScores]

export const handmadeSets = {
    'mixed-five': [pitty, sigurRos, utada, kino, abbeyRoad],
    'beatles-three': [abbeyRoad, revolver, anthology],
    'with-edges': [twenty, single, empty, noScores, pitty],
    'only-empty-and-single': [empty, single],
    'all-handmade': handmadeAlbums
}

// Identity: names written in the ways sources write them
export const albumVariants = [
    { artist: 'Pitty', title: 'Admirável Chip Novo' },
    { artist: 'PITTY', title: 'Admiravel Chip Novo' },
    { artist: 'Pitty', title: 'Admirável Chip Novo (Deluxe Edition)' },
    { artist: 'Sigur Rós', title: 'Ágætis byrjun' },
    { artist: 'Sigur Ros', title: 'Agaetis Byrjun' },
    { artist: 'Sigur Rós', title: 'Ágætis byrjun (20th Anniversary Edition) [Remastered]' },
    { artist: '宇多田ヒカル', title: 'First Love' },
    { artist: 'Hikaru Utada', title: 'First Love' },
    { artist: '宇多田ヒカル', title: 'First Love (15th Anniversary Edition) [2014 Remaster]' },
    { artist: 'Кино', title: 'Группа крови' },
    { artist: 'КИНО', title: 'группа крови' },
    { artist: 'Kino', title: 'Gruppa Krovi' },
    { artist: 'The Beatles', title: 'Abbey Road' },
    { artist: 'Beatles, The', title: 'Abbey Road (Super Deluxe Edition)' },
    { artist: 'The Beatles', title: 'Abbey Road (2019 Mix)' },
    { artist: 'The Beatles', title: 'Revolver (2022 Mix/Master)' },
    { artist: 'The Beatles', title: 'Revolver - Special Edition' },
    { artist: 'Crosby, Stills, Nash & Young', title: 'Déjà Vu' },
    { artist: 'Crosby Stills Nash and Young', title: 'Deja Vu (50th Anniversary Deluxe Edition)' },
    { artist: 'Simon & Garfunkel', title: 'Bridge over Troubled Water' },
    { artist: 'T. Rex', title: 'Electric Warrior (Expanded Edition) [2003 Remaster]' },
    { artist: 'T Rex', title: 'Electric Warrior' },
    { artist: 'Ελευθερία Αρβανιτάκη', title: 'ΟΔΟΣ' },
    { artist: 'Barış Manço', title: 'İstanbul Hatırası' },
    { artist: 'Ninguém', title: '' }
]

export const trackVariantGroups = [
    ['Admirável Chip Novo', 'Admiravel Chip Novo', 'ADMIRÁVEL CHIP NOVO (Ao Vivo)', 'Admirável Chip Novo - 2023 Remaster'],
    ['Starálfur', 'Staralfur', 'Starálfur (Live at Laugardalshöll)', 'Svefn-g-englar'],
    ['Hjartað hamast (bamm bamm bamm)', 'Hjartad hamast', 'Hjartað hamast'],
    ['甘いワナ ～Paint It, Black', '甘いワナ', 'Paint It, Black', 'ｱﾏｲﾜﾅ'],
    ['ﬁrst love （ＡＣＯＵＳＴＩＣ）', 'first love (acoustic)', 'First Love', 'FIRST LOVE'],
    ['Закрой за мной дверь, я ухожу', 'Закрой за мной дверь я ухожу', 'ЗАКРОЙ ЗА МНОЙ ДВЕРЬ, Я УХОЖУ (Live)'],
    ['Ёлка (Live)', 'Елка', 'ёлка', 'Ёлка'],
    ['ΟΔΟΣ', 'οδος', 'Οδός', 'οδοσ'],
    ['İstanbul', 'istanbul', 'ISTANBUL', 'Istanbul'],
    ['Come Together (2019 Mix)', 'Come Together', 'Come Together (Take 5)', 'Come Together - Remastered 2009'],
    ['Golden Slumbers / Carry That Weight / The End (Medley) (2019 Mix)', 'Medley: Golden Slumbers / Carry That Weight / The End', 'Golden Slumbers', 'The End'],
    ["I Want You (She's So Heavy) (2019 Mix)", 'I Want You (She’s So Heavy)', 'I Want You'],
    ['Faixa 4 (Remastered 2009)', 'Faixa 4', 'Faixa 14', 'Faixa IV'],
    ['Part II', 'Part 2', 'Part Two', 'Automatic Part II'],
    ['Reprise', 'Reprise', 'Reprise (Reprise)']
]
