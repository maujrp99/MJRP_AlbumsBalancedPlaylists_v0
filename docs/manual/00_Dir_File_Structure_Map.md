# Project Directory & File Structure Map
> **Purpose**: A comprehensive, numbered mapping of all project files options and directories.
> **Source**: Derived from `proj-documentation-task.md` (Master Task List) and active file system.

## 1. Server-Side Enrichment 
4. `server/index.js` (Analysis: `manual/02_Server_Core.md`)
5. `server/lib/ranking.js` (Analysis: `manual/03_Server_Libraries.md`)
6. `server/lib/fetchRanking.js` (Analysis: `manual/03_Server_Libraries.md`)
7. `server/services/MusicKitTokenService.js` (Analysis: `manual/02_Server_Core.md`)
8. `server/routes/albums.js` (Analysis: `manual/05_Server_Routes.md`)
9. `server/routes/playlists.js` (Analysis: `manual/05_Server_Routes.md`)
10. `server/lib/scrapers/besteveralbums.js` (Analysis: `manual/03_Server_Libraries.md`)
11. `server/schema/album.schema.json` (Analysis: `manual/02_Server_Core.md`)

## 2. Shared Code Enrichment
12. `shared/curation.js` (Analysis: `manual/23_Shared_Code.md`)
13. `shared/normalize.js` (Analysis: `manual/23_Shared_Code.md`)

## 3. Frontend Enrichment (Core)
14. `public/js/app.js` (Analysis: `manual/19_Frontend_JS_Root.md`)
15. `public/js/router.js` (Analysis: `manual/19_Frontend_JS_Root.md`)
16. `public/js/views/InventoryView.js` (Analysis: `manual/09_Frontend_Views.md`)
17. `public/js/views/PlaylistsView.js` (Analysis: `manual/09_Frontend_Views.md`)
18. `public/js/views/BlendingMenuView.js` (Analysis: `manual/09_Frontend_Views.md`)
19. `public/js/views/SeriesView.js` (Analysis: `manual/09_Frontend_Views.md`)
20. `public/js/views/renderers/InventoryGridRenderer.js` (Analysis: `manual/09_Frontend_Views.md`)
21. `public/js/strategies/ViewModeStrategy.js` (Analysis: `manual/09_Frontend_Views.md`)
22. `public/js/stores/albums.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
23. `public/js/services/SpotifyService.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
24. `public/js/services/AuthService.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
25. `public/js/models/Album.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
26. `public/js/models/AlbumIdentity.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
27. `public/js/api.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
28. `docs/manual/01_System_Architecture.md` (System Map)
28a. `docs/manual/00_Dir_File_Structure_Map.md` (File Map)

## 4. Component Audit (The "Long Tail") 

### Batch 1: Root Components (Core UI)
31. `public/js/components/Autocomplete.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
32. `public/js/components/Breadcrumb.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
33. `public/js/components/EditAlbumModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
34. `public/js/components/Footer.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
35. `public/js/components/GlobalProgress.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
36. `public/js/components/Icons.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
37. `public/js/components/InlineProgress.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
38. `public/js/components/InventoryAddModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
39. `public/js/components/InventoryEditModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
40. `public/js/components/LoginModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
41. `public/js/components/SpotifyConnectButton.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
42. `public/js/components/SpotifyExportModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
43. `public/js/components/Toast.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
44. `public/js/components/TopNav.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
45. `public/js/components/ViewAlbumModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)

### Batch 2: Feature Components (Subdirectories)
46. `public/js/components/blend/BlendFlavorCard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
47. `public/js/components/blend/BlendIngredientsPanel.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
48. `public/js/components/blend/BlendSeriesSelector.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
49. `public/js/components/inventory/InventoryGrid.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
50. `public/js/components/inventory/InventoryItemCard.js` (Missing / Superseded)
51. `public/js/components/inventory/InventoryStats.js` (Missing / Superseded)
52. `public/js/components/playlists/PlaylistExportToolbar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
53. `public/js/components/playlists/PlaylistGrid.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
54. `public/js/components/playlists/PlaylistsDragBoard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
55. `public/js/components/playlists/PlaylistsDragHandler.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
56. `public/js/components/playlists/PlaylistsGridRenderer.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
57. `public/js/components/playlists/RegeneratePanel.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
58. `public/js/components/playlists/SavedPlaylistsController.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
59. `public/js/components/playlists/TrackItem.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
60. `public/js/components/series/ArtistScanner.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
61. `public/js/components/series/SeriesDragDrop.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
62. `public/js/components/series/SeriesEditModal.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
63. `public/js/components/series/SeriesEventHandler.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
64. `public/js/components/series/SeriesFilterBar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
65. `public/js/components/series/SeriesGridRenderer.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
66. `public/js/components/series/SeriesHeader.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
66a. `public/js/components/series/SeriesToolbar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
67. `public/js/components/series/SeriesModals.js` (Analysis: `manual/14_Frontend_Components_Features.md`)

### Navigation & UI & Common
68. `public/js/components/ui/BaseModal.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
69. `public/js/components/ui/Card.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
70. `public/js/components/ui/TrackRow.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
71. `public/js/components/base/Component.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
71a. `public/js/components/ui/LoadMoreButton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
71b. `public/js/components/ui/skeletons/AlbumSkeleton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
71c. `public/js/components/ui/skeletons/SeriesSkeleton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
72. `public/js/components/common/AlbumCascade.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
72a. `public/js/components/navigation/SeriesDropdown.js` (Missing / Superseded)
73. `public/js/components/shared/ContextMenu.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
74. `public/js/components/shared/SkeletonLoader.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
74a. `public/js/components/search/DiscographyToolbar.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
74b. `public/js/components/search/VariantPickerModal.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)

### Search & Ranking & Home
75. `public/js/components/ranking/TracksRankingComparison.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
76. `public/js/components/ranking/TracksTable.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
77. `public/js/components/ranking/TracksTabs.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
96a. `public/js/components/ranking/UserRankModal.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
78. `public/js/components/home/SearchController.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
79. `public/js/components/home/StagingAreaController.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)

## 5. Service & Logic Audit 

### Batch 3: Client Services & Adapters
81. `public/js/services/DataSyncService.js` (Analysis: `manual/17_Frontend_Services.md`)
82. `public/js/services/DialogService.js` (Analysis: `manual/17_Frontend_Services.md`)
83. `public/js/services/MusicKitSearchAdapter.js` (Analysis: `manual/17_Frontend_Services.md`)
84. `public/js/services/MusicKitService.js` (Analysis: `manual/17_Frontend_Services.md`)
85. `public/js/services/OptimizedAlbumLoader.js` (Analysis: `manual/17_Frontend_Services.md`)
85a. `public/js/services/AlbumLoader.js` (Analysis: `manual/17_Frontend_Services.md`)
86. `public/js/services/PlaylistGenerationService.js` (Analysis: `manual/17_Frontend_Services.md`)
87. `public/js/services/PlaylistPersistenceService.js` (Analysis: `manual/17_Frontend_Services.md`)
88. `public/js/services/SeriesFilterService.js` (Analysis: `manual/17_Frontend_Services.md`)
89. `public/js/services/SpotifyAuthService.js` (Analysis: `manual/17_Frontend_Services.md`)
90. `public/js/services/SpotifyEnrichmentService.js` (Analysis: `manual/17_Frontend_Services.md`)

### Batch 4: Server Logic & Utils
91. `server/lib/aiClient.js` (Analysis: `manual/04_Server_Logic.md`)
92. `server/lib/fetchRanking.js` (Analysis: `manual/04_Server_Logic.md`)
93. `server/lib/logger.js` (Analysis: `manual/04_Server_Logic.md`)
94. `server/lib/normalize.js` (Analysis: `manual/04_Server_Logic.md`)
95. `server/lib/prompts.js` (Analysis: `manual/04_Server_Logic.md`)
96. `server/lib/schema.js` (Analysis: `manual/04_Server_Logic.md`)
97. `server/lib/validateSource.js` (Analysis: `manual/04_Server_Logic.md`)
98. `server/lib/services/spotifyPopularity.js` (Analysis: `manual/04_Server_Logic.md`)

### Batch 5: Legacy & Deprecated
99. `public/legacy/AlbumsView_DEPRECATED.js` (Analysis: `manual/25_Legacy_Analysis.md`)
101. `public/legacy/hybrid-curator.html` (Analysis: `manual/25_Legacy_Analysis.md`)

### Batch 6: Algorithms & Strategies
102. `public/js/algorithms/BaseAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
103. `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
104. `public/js/algorithms/TopNAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
105. `public/js/algorithms/LegacyRoundRobinAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
105a. `public/js/algorithms/TopNUserAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
106. `public/js/ranking/BalancedRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
107. `public/js/ranking/SpotifyRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
108. `public/js/ranking/BEARankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
108a. `public/js/ranking/UserRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)

### Batch 7: Data Layer
109. `public/js/repositories/BaseRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
110. `public/js/repositories/SeriesRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
111. `public/js/repositories/AlbumRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
112. `public/js/repositories/PlaylistRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
113. `public/js/repositories/InventoryRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
114. `public/js/repositories/SpotifyEnrichmentRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
114a. `public/js/repositories/UserRankingRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
115. `public/js/models/Series.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
116. `public/js/models/Track.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
117. `public/js/cache/CacheManager.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
118. `public/js/cache/IndexedDBCache.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
119. `public/js/cache/MemoryCache.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
120. `public/js/stores/albumSeries.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
121. `public/js/stores/playlists.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
122. `public/js/stores/inventory.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
123. `public/js/stores/SpotifyEnrichmentStore.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
124. `public/js/stores/UserStore.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)

### Batch 8: Infrastructure
125. `public/js/workers/search.worker.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
126. `public/js/utils/SafeDOM.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
127. `public/js/utils/stringUtils.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
128. `public/js/utils/SvgGenerator.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
129. `public/js/helpers/dom-helpers.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
130. `public/js/transformers/SpotifyTransformer.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
131. `public/js/transformers/PlaylistTransformer.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
131a. `public/js/utils/VirtualScrollObserver.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)

### Batch 9: Frontend Views & Renderers 
132. `public/js/views/SaveAllView.js` (Analysis: `manual/10_Frontend_Renderers.md`)
133. `public/js/views/ComingSoonView.js` (Analysis: `manual/10_Frontend_Renderers.md`)
134. `public/js/views/albums/AlbumsFilters.js` (Analysis: `manual/10_Frontend_Renderers.md`)
135. `public/js/views/albums/AlbumsGridRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
136. `public/js/views/albums/AlbumsScopedRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
137. `public/js/views/playlists/PlaylistsDragDrop.js` (Analysis: `manual/10_Frontend_Renderers.md`)
138. `public/js/views/playlists/PlaylistsExport.js` (Analysis: `manual/10_Frontend_Renderers.md`)
139. `public/js/views/renderers/DiscographyRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
140. `public/js/views/renderers/InventoryGridRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
141. `public/js/views/renderers/StagingAreaRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
142. `public/js/views/strategies/ViewModeStrategy.js` (Analysis: `manual/10_Frontend_Renderers.md`)

### Batch 10: State, Models & Controllers 
143. `public/js/controllers/SeriesController.js` (Analysis: `manual/08_Frontend_Models.md`)
144. `public/js/models/Album.js` (Analysis: `manual/08_Frontend_Models.md`)
145. `public/js/models/AlbumIdentity.js` (Analysis: `manual/08_Frontend_Models.md`)
146. `public/js/models/Playlist.js` (Analysis: `manual/08_Frontend_Models.md`)
147. `public/js/stores/albums.js` (Analysis: `manual/08_Frontend_Models.md`)
148. `public/js/cache/albumCache.js` (Analysis: `manual/08_Frontend_Models.md`)

### Batch 11: Album Search & Classification Engine
149. `public/js/services/album-search/AlbumSearchService.js` (Analysis: `manual/22_Album_Search_Engine.md`)
150. `public/js/services/album-search/AlbumTypeClassifier.js` (Analysis: `manual/22_Album_Search_Engine.md`)
151. `public/js/services/album-search/ArtistNormalizer.js` (Analysis: `manual/22_Album_Search_Engine.md`)
152. `public/js/services/album-search/EditionFilter.js` (Analysis: `manual/22_Album_Search_Engine.md`)
153. `public/js/services/album-search/ScoreCalculator.js` (Analysis: `manual/22_Album_Search_Engine.md`)
154. `public/js/services/album-search/classification/AIWhitelistStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
155. `public/js/services/album-search/classification/AppleMetadataStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
156. `public/js/services/album-search/classification/BaseStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
157. `public/js/services/album-search/classification/ElectronicGenreDetector.js` (Analysis: `manual/22_Album_Search_Engine.md`)
158. `public/js/services/album-search/classification/GenreGateStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
159. `public/js/services/album-search/classification/RemixTracksStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
160. `public/js/services/album-search/classification/TitleKeywordStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
161. `public/js/services/album-search/classification/TrackCountStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
162. `public/js/services/album-search/classification/TypeSanityCheckStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)

### Batch 12: MusicKit Internals
163. `public/js/services/musickit/MusicKitAuth.js` (Analysis: `manual/20_MusicKit_Internals.md`)
164. `public/js/services/musickit/MusicKitCatalog.js` (Analysis: `manual/20_MusicKit_Internals.md`)
165. `public/js/services/musickit/MusicKitLibrary.js` (Analysis: `manual/20_MusicKit_Internals.md`)
166. `public/js/services/DataSyncService.js` (Analysis: `manual/20_MusicKit_Internals.md`)
167. `public/js/services/PlaylistPersistenceService.js` (Analysis: `manual/20_MusicKit_Internals.md`)

## 6. Test Suite Audit 
168. `test/e2e/generate-evidence.js` (Analysis: `manual/24_Test_Suite.md`)
169. `test/e2e/ghost-albums-render.test.js` (Analysis: `manual/24_Test_Suite.md`)
170. `test/e2e/helpers.js` (Analysis: `manual/24_Test_Suite.md`)
171. `test/e2e/issue-15-ghost-albums.test.js` (Analysis: `manual/24_Test_Suite.md`)
172. `test/e2e/issue-16-view-toggle.test.js` (Analysis: `manual/24_Test_Suite.md`)
173. `test/e2e/issue-19-series-switching.test.js` (Analysis: `manual/24_Test_Suite.md`)
174. `test/e2e/issue-21-sticky-playlists.test.js` (Analysis: `manual/24_Test_Suite.md`)
175. `test/e2e/quick-demo.js` (Analysis: `manual/24_Test_Suite.md`)
176. `test/e2e/run-all.js` (Analysis: `manual/24_Test_Suite.md`)
177. `test/e2e/setup.js` (Analysis: `manual/24_Test_Suite.md`)
178. `test/e2e/smoke.test.js` (Analysis: `manual/24_Test_Suite.md`)
179. `test/e2e/ui-components.test.js` (Analysis: `manual/24_Test_Suite.md`)
180. `test/algorithms/mixins.test.js` (Analysis: `manual/24_Test_Suite.md`)
181. `test/algorithms/topn.test.js` (Analysis: `manual/24_Test_Suite.md`)
182. `test/services/AuthService.test.js` (Analysis: `manual/24_Test_Suite.md`)
183. `test/services/DataSyncService.test.js` (Analysis: `manual/24_Test_Suite.md`)
184. `test/stores/UserStore.test.js` (Analysis: `manual/24_Test_Suite.md`)
185. `test/stores/albums.test.js` (Analysis: `manual/24_Test_Suite.md`)
186. `test/stores/inventory.test.js` (Analysis: `manual/24_Test_Suite.md`)
187. `test/stores/playlists.test.js` (Analysis: `manual/24_Test_Suite.md`)
188. `test/stores/series.test.js` (Analysis: `manual/24_Test_Suite.md`)
189. `test/views/ConsolidatedRankingView.test.js` (Analysis: `manual/24_Test_Suite.md`)
190. `test/views/PlaylistsView.test.js` (Analysis: `manual/24_Test_Suite.md`)

## 7. Sprint 19 Refactoring 
191. `public/js/services/PlaylistsService.js` (Analysis: `manual/17_Frontend_Services.md`)
192. `public/js/services/SeriesService.js` (Analysis: `manual/17_Frontend_Services.md`)
193. `public/js/components/playlists/SavedPlaylistActions.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
194. `public/js/components/playlists/SavedPlaylistCard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
195. `public/js/components/playlists/SavedPlaylistRow.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
196. `public/js/components/series/SeriesEmptyState.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
197. `public/js/components/series/SeriesProgressBar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
198. `public/js/views/helpers/SeriesGridHelper.js` (Analysis: `manual/09_Frontend_Views.md`)
199. `public/js/views/helpers/SeriesViewHandlers.js` (Analysis: `manual/09_Frontend_Views.md`)
200. `docs/decisions/adr-017-pure-state-stores.md` (Analysis: `manual/01_System_Architecture.md`)
201. `docs/decisions/adr-018-fine-grained-services.md` (Analysis: `manual/01_System_Architecture.md`)
202. `public/js/services/infra/StorageService.js` (Analysis: `manual/17_Frontend_Services.md`)
203. `public/js/services/playlists/PlaylistHistoryService.js` (Analysis: `manual/17_Frontend_Services.md`)
204. `public/js/services/auth/UserSyncService.js` (Analysis: `manual/17_Frontend_Services.md`)
205. `public/js/components/playlists/PlaylistDetailsModal.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
206. `public/js/components/playlists/SavedSeriesGroup.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
207. `public/js/views/helpers/SeriesModalsManager.js` (Analysis: `manual/09_Frontend_Views.md`)
208. `public/js/views/helpers/SeriesViewMounter.js` (Analysis: `manual/09_Frontend_Views.md`)

## 10. Project Documentation & Archives
### Root Documentation
1. `docs/CHANGELOG.md`
2. `docs/CONSTITUTION.md`
3. `docs/CONTRIBUTING.md`
4. `docs/MJRP_Album_Blender_Prod_Vision.md`
5. `docs/README.md`
6. `docs/ROADMAP.md`

### Decisions (ADR)
7. `docs/decisions/adr-015-flavor-to-recipe.md`
8. `docs/decisions/adr-016-service-layer-extraction.md`
9. `docs/decisions/adr-017-pure-state-stores.md` (Also in Refactoring)
10. `docs/decisions/adr-018-fine-grained-services.md` (Also in Refactoring)

### Manuals (The Reference Guide)
11. `docs/manual/00_Deployment_and_Setup.md`
12. `docs/manual/00_Dir_File_Structure_Map.md` (This File)
13. `docs/manual/00_MJRP_Album_Blender_Ref_Guide_Index.md`
14. `docs/manual/01_System_Architecture.md`
15. `docs/manual/02_Server_Core.md`
16. `docs/manual/03_Server_Libraries.md`
17. `docs/manual/04_Server_Logic.md`
18. `docs/manual/05_Server_Routes.md`
19. `docs/manual/06_Frontend_Data_Store.md`
20. `docs/manual/07_Frontend_Data_Infra.md`
21. `docs/manual/07b_Frontend_Utilities_and_Workers.md`
22. `docs/manual/08_Frontend_Models.md`
23. `docs/manual/09_Frontend_Views.md`
24. `docs/manual/09a_Frontend_App_Shell_and_Styles.md`
25. `docs/manual/10_Frontend_Renderers.md`
26. `docs/manual/11_Frontend_Components_Root.md`
27. `docs/manual/12_Frontend_Components_Core.md`
28. `docs/manual/13_Frontend_Components_Shared.md`
29. `docs/manual/14_Frontend_Components_Feature_Map.md`
30. `docs/manual/15_Frontend_Components_Blend_Wizard.md`
31. `docs/manual/16_Frontend_Components_Search_and_Ranking.md`
32. `docs/manual/17_Frontend_Services.md`
33. `docs/manual/18_Frontend_Logic_Core.md`
34. `docs/manual/19_Frontend_JS_Root.md`
35. `docs/manual/20_MusicKit_Internals.md`
36. `docs/manual/21_Dynamic_UI_Mapping.md`
37. `docs/manual/22_Album_Search_Engine.md`
38. `docs/manual/23_Shared_Code.md`
39. `docs/manual/24_Test_Suite.md`
40. `docs/manual/26_Gap_Analysis.md` (From Phase X)
41. `docs/manual/29_Frontend_Technical_Debt_Analysis.md`
42. `docs/manual/31_UI_Style_Guide.md`
43. `docs/manual/32_Data_Schema_Reference.md`
44. `docs/manual/98_Archived_Legacy_Analysis.md`
45. `docs/manual/99_Frontend_Component_Reference_Sheet.md`

### Important Snapshots
46. `docs/manual/MasterManualSnapshot_20260108.md`
47. `docs/manual/regression_checklist.md`

---
**Grand Total Code Files: 208 (Matched with Master List)**
**Grand Total Doc Files: 47**
