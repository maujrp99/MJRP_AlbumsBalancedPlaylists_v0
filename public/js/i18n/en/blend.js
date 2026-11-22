/**
 * The texts of the recipes of the blend, in English: the name, the description and the label of each recipe as the screen says them (F83 wave 7a).
 * The key is `blend.recipes.<id>.<part>` with the id of the recipe in camelCase (a key has no hyphen): `mjrp-balanced-cascade` is `mjrpBalancedCascade`.
 * The metadata of the algorithms (algorithms/) keep their own English: it is data (the name a generation writes into the name of a batch and
 * into the playlists), and algorithms/ does not import i18n/. A test holds the two together: a recipe of the registry has all three texts in both languages.
 * The texts of the Blend screen come with wave 7b.
 */
export const blend = {
    'blend.recipes.mjrpBalancedCascade.name': "[MJRP] Zé's Balanced Playlists",
    'blend.recipes.mjrpBalancedCascade.description': 'Builds balanced playlists by blending the best tracks of each album. Short playlists are merged automatically.',
    'blend.recipes.mjrpBalancedCascade.badge': 'RECOMMENDED',
    'blend.recipes.topNPopular.name': 'Top Tracks by Spotify Popularity',
    'blend.recipes.topNPopular.description': 'Pick your favorite tracks, based on Spotify popularity.',
    'blend.recipes.topNPopular.badge': 'SPOTIFY',
    'blend.recipes.topNAcclaimed.name': 'Top Acclaimed Tracks on BestEverAlbums',
    'blend.recipes.topNAcclaimed.description': 'Pick the critically acclaimed tracks, based on BestEverAlbums.',
    'blend.recipes.topNAcclaimed.badge': 'BEA',
    'blend.recipes.topNUser.name': 'Top Tracks by My Own Ranking',
    'blend.recipes.topNUser.description': 'Create playlists from your personal track rankings.',
    'blend.recipes.topNUser.badge': 'USER'
}
