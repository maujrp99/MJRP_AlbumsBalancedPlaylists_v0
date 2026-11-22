/**
 * (2026-11-22, wave 7a: the panel to generate again went to React, and this left the list in the commit that deleted it: components/playlists/RegeneratePanel.js (182 in the
 * list; 183 on the disk), now screens/playlists/RegeneratePanel.tsx on ui/recipe/{RecipeCards,Ingredients}.tsx, with the rules in models/recipeLooks.js and
 * models/recipeIngredients.js, and the wrapper react-bridge/legacy/RegeneratePanel.tsx went with it. Left in the list, with their reasons: components/blend/BlendRecipeCard.js
 * and BlendIngredientsPanel.js (the hand-made Blend screen still draws them, wave 7b; ui/recipe/ is the second writing, kept the same by a test).)
 *
 * (2026-11-22, wave 6b: the windows went to React, and these left the list in the commit that deleted them: components/ViewAlbumModal.js (382, the album window, now
 * ui/albumWindow/AlbumWindow.tsx), components/InventoryValueSection.js (316, now screens/inventory/ValueSection.tsx and BuyLinks.tsx), components/albumWindowSources.js (40,
 * now ui/albumWindow/sources.ts), components/ranking/{TracksRankingComparison,TracksTable,TracksTabs}.js (207 + 314 + 102, now ui/tracks/), components/InventoryEditModal.js
 * (157, now screens/inventory/EditWindow.tsx) and components/InventoryAddModal.js (180, now screens/albums/InventoryAdd.tsx): 1.698 lines in 8 files. The window to edit and
 * the one to add share ui/inventoryItem/ItemForm.tsx. The album window is the one change of behaviour of the wave: it is taken off the page when the screen is left, where the
 * hand-made one stayed over the next screen.)
 *
 * (2026-11-22, wave 6a: the inventory screen went to React, and these left the list in the commit that deleted them: views/InventoryView.js (693 in the list, 707 on
 * the disk), views/InventoryPhoneSheets.js (226), views/renderers/{InventoryGridRenderer,InventoryCardValue,InventoryValueHeader,InventoryPhoneRow,InventoryPhoneTile}.js
 * (755 in all), components/ui/Card.js (341; only the inventory used it) and components/Breadcrumb.js (63; ui/Breadcrumb.tsx has the trail of the inventory, a trail of one
 * step that draws nothing, as the old one drew nothing there): 2.078 lines in 9 files of the list. utils/keepField.js (not in the list) went too: the search field of the
 * new screen is never made anew. Left in the list, with their reasons: the window of the album, the window to edit an item, the one to add one, the value section and
 * the track tables (wave 6b); the controller and InventoryValues stay JavaScript under the screen.)
 *
 * (2026-11-22, the second sync with `main`: what `main` did in hand-made code that stays hand-made on this line comes in as it is. F89 (the inventory as a gallery on
 * the phone) brings views/renderers/InventoryPhoneTile.js (92 lines, the one new file; the inventory is wave 6), and F90 (exporting from the saved playlists) grew
 * components/SpotifyExportModal.js from 434 to 461 lines and views/playlists/PlaylistsExport.js from 116 to 142 (a job given: the playlists, the series, the batch,
 * the positions, the Apple Music folder). The export window and the folder step of F90 are NOT here: they were written in React (ui/PlaylistExportWindow.tsx,
 * ui/AppleFolderStep.tsx), and views/playlists/{PlaylistExportWindow,AppleFolderStep,appleFolderChoice}.js did not come in; the model of the choice moved to
 * models/appleFolderChoice.js.)
 *
 * (2026-11-21, wave 5b: the windows of the albums screen went to React, and these left the list in the commit that deleted them:
 * components/series/{SeriesEditModal,SeriesModals}.js, components/album-picker/{AlbumPickerController,AlbumPickerPanel,pickerParts}.js,
 * components/ranking/{UserRankModal,rankWindowPhone}.js and views/renderers/DiscographyRenderer.js (1.073 lines in 8 files). The window to edit
 * a series is screens/albums/SeriesEdit.tsx, the one album picker is ui/albumPicker/ (the Start screen uses its controller), the window to rank
 * the tracks is screens/albums/RankWindow.tsx. Left in the list, with their reasons: components/ranking/{TracksTable,TracksTabs,
 * TracksRankingComparison}.js and components/ViewAlbumModal.js (the window of the album, shared with the inventory: wave 6).)
 *
 * (2026-11-21, wave 5a: the albums screen went to React, and these left the list in the commit that deleted them: views/SeriesView.js, views/helpers/*,
 * views/albums/*, components/series/{SeriesHeader,SeriesEmptyState,SeriesEventHandler,SeriesGridRenderer,SeriesPhoneSheets}.js, components/ui/{AlbumCardRenderer,
 * AlbumPhoneCard,Pager,FilterToolbar,FilterSheet,LoadMoreButton}.js, the two skeletons, components/base/Component.js and utils/VirtualScrollObserver.js (3.4xx
 * lines). Left in the list, with their reasons: components/series/SeriesModals.js and SeriesEditModal.js (they hold the one album picker), components/ranking/*
 * (the track table and the ranking window, shared with the album window of the inventory) and components/ViewAlbumModal.js: wave 5b and wave 6.)
 *
 * (2026-11-21, wave 4: the Start screen (the old Home) went to React, and these left the list in the commit that deleted them: views/HomeView.js
 * and components/home/{HomeDock,HomeEqualizer,HomePasteList,StagingAreaController}.js (1.054 lines); the controller moved to
 * screens/start/StartController.ts. views/renderers/DiscographyRenderer.js lost the Start card (its `stage` form) and went from 111 to 81 lines.
 * Left in the list, with their reasons: components/album-picker/* and views/renderers/DiscographyRenderer.js (the series edit uses the one
 * album picker: wave 5).)
 *
 * (2026-11-21, wave 3: the shell of the site went to React, and these left the list in the commit that deleted them: components/TopNav.js,
 * Footer.js, LoginModal.js, SpotifyConnectButton.js and, in components/navigation, AuthNav, PhoneMenu, PhoneShell, SeriesDropdown, barName and
 * phoneTabs (1.402 lines). Left in components/navigation, with their reasons: startRoute.js and signInFromLink.js, plain functions with no drawing.)
 *
 * (2026-11-21, wave 2: the playlists screen went to React, and these left the list in the commit that deleted them: views/PlaylistsView.js,
 * views/playlists/{index,phonePlaylistActions,playlistEditActions,unsavedChangesGuard}.js and, in components, playlists/{PhonePlaylists,
 * PhoneUndoNotice,PlaylistGrid,PlaylistsDragHandler,PlaylistsGridRenderer}.js and ui/TrackRow.js. Left in the list, with their reasons:
 * playlists/RegeneratePanel.js (the Blend controller uses it: wave 7), views/playlists/PlaylistsExport.js (the exports, ported on their own),
 * SpotifyExportModal.js, Breadcrumb.js (the screens of waves 5 and 6 still draw their own).)
 *
 * (2026-11-21, wave 1: the saved playlists screen went to React, and these left the list in the commit that deleted them:
 * views/SavedPlaylistsView.js and, in components/playlists, SavedSeriesGroup, SavedPlaylistCard, SavedPlaylistRow,
 * SavedPlaylistActions, SavedPlaylistsPhone, PlaylistDetailsModal and batchNames; the controller moved to controllers/.)
 *
 * (2026-11-21, merge of main into the wave 0 branch: the notices of failed sources in the album window came from main with
 * their files: `components/albumWindowSources.js` is new, and four files were brought to their sizes of that day.)
 *
 * The hand-made screens of the site, as they were when the migration to React began (F83, wave 0, 2026-11-21):
 * every file of public/js/views and public/js/components, and the hand-made drawing that lives outside the two folders, with the lines each one has (as `wc -l` counts them).
 *
 * The list only shrinks (test/architecture/handMadeScreensOnlyShrink.test.js): a screen that migrates takes its files out
 * of this list in the same commit that deletes them. A number here is lowered when a file is cut down; it is never raised.
 *
 * The drawing outside the two folders, found by the survey of wave 0 (a file that builds elements, sets innerHTML or
 * writes the style of the body, and is not under views/ or components/): the SafeDOM helper, the dialog service and the
 * page scroll lock. The rest that touches the DOM there is not screen drawing: the router (the panel of a failed view,
 * moved to a shared function in this wave), app.js (the bootstrap), stringUtils (escapeHtml), MusicKitAuth (a script tag)
 * and AuthService (a class on the body).
 */
export const HAND_MADE = {
    'components/GlobalProgress.js': 80,
    'components/Icons.js': 178,
    'components/SpotifyExportModal.js': 461,
    'components/Toast.js': 154,
    'components/blend/BlendIngredientsPanel.js': 428,
    'components/blend/BlendRecipeCard.js': 174,
    'components/blend/BlendSeriesPhonePicker.js': 141,
    'components/blend/BlendSeriesSelector.js': 340,
    'components/common/AlbumCascade.js': 71,
    'components/navigation/signInFromLink.js': 30,
    'components/navigation/startRoute.js': 62,
    'components/ui/BaseModal.js': 178,
    'components/ui/Sheet.js': 173,
    'components/ui/coverImage.js': 67,
    'components/ui/modals/ConfirmModal.js': 67,
    'components/ui/modals/InputModal.js': 113,
    'components/ui/windowsHoldThePage.js': 58,
    'services/DialogService.js': 147,
    'utils/SafeDOM.js': 237,
    'utils/pageScrollLock.js': 56,
    'views/BaseView.js': 144,
    'views/BlendingMenuView.js': 477,
    'views/playlists/PlaylistsExport.js': 142
}
