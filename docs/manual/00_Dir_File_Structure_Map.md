# Project Directory & File Structure Map
> **Purpose**: A comprehensive, numbered mapping of all project files options and directories.
> **Source**: Derived from `proj-documentation-task.md` (Master Task List) and active file system.

## 1. Server-Side Enrichment 
1. `server/index.js` (Analysis: `manual/02_Server_Structure.md`)
2. `server/lib/ranking.js` (Analysis: `manual/04_Backend_Logic_Services.md`)
3. `server/lib/fetchRanking.js` (Analysis: `manual/04_Backend_Logic_Services.md`)
4. `server/services/MusicKitTokenService.js` (Analysis: `manual/04_Backend_Logic_Services.md`)
5. `server/routes/albums.js` (Analysis: `manual/03_Backend_API_Layer.md`)
6. `server/routes/playlists.js` (Analysis: `manual/03_Backend_API_Layer.md`)
7. `server/lib/scrapers/besteveralbums.js` (Analysis: `manual/04_Backend_Logic_Services.md`)
8. `server/schema/album.schema.json` (Analysis: `manual/05_Backend_Data_Schema.md`)

## 2. Shared Code Enrichment
9. `shared/curation.js` (Analysis: `manual/23_Shared_Code.md`)
10. `shared/normalize.js` (Analysis: `manual/23_Shared_Code.md`)

## 3. Frontend Enrichment (Core)
11. `public/js/app.js` (Analysis: `manual/19_Frontend_JS_Root.md`)
12. `public/js/router.js` (Analysis: `manual/19_Frontend_JS_Root.md`)
13. `public/js/views/InventoryView.js` (Analysis: `manual/09_Frontend_Views.md`)
14. `public/js/views/PlaylistsView.js` (Analysis: `manual/09_Frontend_Views.md`)
15. `public/js/views/BlendingMenuView.js` (Analysis: `manual/09_Frontend_Views.md`)
16. `public/js/views/SeriesView.js` (Analysis: `manual/09_Frontend_Views.md`)
17. `public/js/views/renderers/InventoryGridRenderer.js` (Analysis: `manual/09_Frontend_Views.md`)
18. `public/js/strategies/ViewModeStrategy.js` (Analysis: `manual/09_Frontend_Views.md`)
19. `public/js/stores/albums.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
20. `public/js/services/SpotifyService.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
21. `public/js/services/AuthService.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
22. `public/js/models/Album.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
23. `public/js/models/AlbumIdentity.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
24. `public/js/api.js` (Analysis: `manual/06_Frontend_Data_Store.md`)
25. `docs/manual/01_System_Architecture.md` (System Map)
26. `docs/manual/00_Dir_File_Structure_Map.md` (File Map)

## 4. Component Audit (The "Long Tail") 

### Batch 1: Root Components (Core UI)
27. `public/js/components/Autocomplete.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
28. `public/js/components/Breadcrumb.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
29. `public/js/components/EditAlbumModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
30. `public/js/components/Footer.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
31. `public/js/components/GlobalProgress.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
32. `public/js/components/Icons.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
33. `public/js/components/InlineProgress.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
34. `public/js/components/InventoryAddModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
35. `public/js/components/InventoryEditModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
36. `public/js/components/LoginModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
37. `public/js/components/SpotifyConnectButton.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
38. `public/js/components/SpotifyExportModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
39. `public/js/components/Toast.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
40. `public/js/components/TopNav.js` (Analysis: `manual/11_Frontend_Components_Root.md`)
41. `public/js/components/ViewAlbumModal.js` (Analysis: `manual/11_Frontend_Components_Root.md`)

### Batch 2: Feature Components (Subdirectories)
42. `public/js/components/blend/BlendFlavorCard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
43. `public/js/components/blend/BlendIngredientsPanel.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
44. `public/js/components/blend/BlendSeriesSelector.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
45. `public/js/components/inventory/InventoryGrid.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
46. `public/js/components/inventory/InventoryItemCard.js` (Missing / Superseded)
47. `public/js/components/inventory/InventoryStats.js` (Missing / Superseded)
48. `public/js/components/playlists/PlaylistExportToolbar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
49. `public/js/components/playlists/PlaylistGrid.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
50. `public/js/components/playlists/PlaylistsDragBoard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
51. `public/js/components/playlists/PlaylistsDragHandler.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
52. `public/js/components/playlists/PlaylistsGridRenderer.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
53. `public/js/components/playlists/RegeneratePanel.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
54. `public/js/components/playlists/SavedPlaylistsController.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
55. `public/js/components/playlists/TrackItem.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
56. `public/js/components/series/ArtistScanner.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
57. `public/js/components/series/SeriesDragDrop.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
58. `public/js/components/series/SeriesEditModal.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
59. `public/js/components/series/SeriesEventHandler.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
60. `public/js/components/series/SeriesFilterBar.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
61. `public/js/components/series/SeriesGridRenderer.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
62. `public/js/components/series/SeriesHeader.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
63. `public/js/components/series/SeriesModals.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
64. `public/js/components/ui/FilterToolbar.js` (Analysis: `manual/11_Frontend_Components_Root.md`)

### Navigation & UI & Common
65. `public/js/components/ui/BaseModal.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
66. `public/js/components/ui/Card.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
67. `public/js/components/ui/TrackRow.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
68. `public/js/components/base/Component.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
69. `public/js/components/ui/LoadMoreButton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
70. `public/js/components/ui/skeletons/AlbumSkeleton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
71. `public/js/components/ui/skeletons/SeriesSkeleton.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
72. `public/js/components/common/AlbumCascade.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
73. `public/js/components/navigation/SeriesDropdown.js` (Missing / Superseded)
74. `public/js/components/shared/ContextMenu.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
75. `public/js/components/shared/SkeletonLoader.js` (Analysis: `manual/13_Frontend_Components_Shared.md`)
76. `public/js/components/search/DiscographyToolbar.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
77. `public/js/components/search/VariantPickerModal.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)

### Search & Ranking & Home
78. `public/js/components/ranking/TracksRankingComparison.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
79. `public/js/components/ranking/TracksTable.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
80. `public/js/components/ranking/TracksTabs.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
81. `public/js/components/ranking/UserRankModal.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
82. `public/js/components/home/SearchController.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)
83. `public/js/components/home/StagingAreaController.js` (Analysis: `manual/16_Frontend_Search_Ranking.md`)

## 5. Service & Logic Audit 

### Batch 3: Client Services & Adapters
84. `public/js/services/DataSyncService.js` (Analysis: `manual/17_Frontend_Services.md`)
85. `public/js/services/DialogService.js` (Analysis: `manual/17_Frontend_Services.md`)
86. `public/js/services/MusicKitSearchAdapter.js` (Analysis: `manual/17_Frontend_Services.md`)
87. `public/js/services/MusicKitService.js` (Analysis: `manual/17_Frontend_Services.md`)
88. `public/js/services/OptimizedAlbumLoader.js` (Analysis: `manual/17_Frontend_Services.md`)
89. `public/js/services/AlbumLoader.js` (Analysis: `manual/17_Frontend_Services.md`)
90. `public/js/services/PlaylistGenerationService.js` (Analysis: `manual/17_Frontend_Services.md`)
91. `public/js/services/PlaylistPersistenceService.js` (Analysis: `manual/17_Frontend_Services.md`)
92. `public/js/services/SavedPlaylistsFilterService.js` (Analysis: `manual/17_Frontend_Services.md`)
93. `public/js/services/SeriesFilterService.js` (Analysis: `manual/17_Frontend_Services.md`)
94. `public/js/utils/FilterUtils.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
95. `public/js/helpers/BEAEnrichmentHelper.js` (Analysis: `manual/17_Frontend_Services.md`)
96. `public/js/services/SpotifyAuthService.js` (Analysis: `manual/17_Frontend_Services.md`)
97. `public/js/services/SpotifyEnrichmentService.js` (Analysis: `manual/17_Frontend_Services.md`)

### Batch 4: Server Logic & Utils
98. `server/lib/aiClient.js` (Analysis: `manual/04_Server_Logic.md`)
99. `server/lib/fetchRanking.js` (Analysis: `manual/04_Server_Logic.md`)
100. `server/lib/logger.js` (Analysis: `manual/04_Server_Logic.md`)
101. `server/lib/normalize.js` (Analysis: `manual/04_Server_Logic.md`)
102. `server/lib/prompts.js` (Analysis: `manual/04_Server_Logic.md`)
103. `server/lib/schema.js` (Analysis: `manual/04_Server_Logic.md`)
104. `server/lib/validateSource.js` (Analysis: `manual/04_Server_Logic.md`)
105. `server/lib/services/spotifyPopularity.js` (Analysis: `manual/04_Server_Logic.md`)

### Batch 5: Legacy & Deprecated
106. `public/legacy/AlbumsView_DEPRECATED.js` (Analysis: `manual/25_Legacy_Analysis.md`)
107. `public/legacy/hybrid-curator.html` (Analysis: `manual/25_Legacy_Analysis.md`)

### Batch 6: Algorithms & Strategies
108. `public/js/algorithms/BaseAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
109. `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
110. `public/js/algorithms/TopNAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
111. `public/js/algorithms/LegacyRoundRobinAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
112. `public/js/algorithms/TopNUserAlgorithm.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
113. `public/js/ranking/BalancedRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
114. `public/js/ranking/SpotifyRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
115. `public/js/ranking/BEARankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
116. `public/js/ranking/UserRankingStrategy.js` (Analysis: `manual/18_Frontend_Logic_Core.md`)
117. `public/js/helpers/BEAEnrichmentHelper.js` (Analysis: `manual/17_Frontend_Services.md`)

### Batch 7: Data Layer
117. `public/js/repositories/BaseRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
118. `public/js/repositories/SeriesRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
119. `public/js/repositories/AlbumRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
120. `public/js/repositories/PlaylistRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
121. `public/js/repositories/InventoryRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
122. `public/js/repositories/SpotifyEnrichmentRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
123. `public/js/repositories/UserRankingRepository.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
124. `public/js/models/Series.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
125. `public/js/models/Track.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
126. `public/js/cache/CacheManager.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
127. `public/js/cache/IndexedDBCache.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
128. `public/js/cache/MemoryCache.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
129. `public/js/stores/albumSeries.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
130. `public/js/stores/playlists.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
131. `public/js/stores/inventory.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
132. `public/js/stores/SpotifyEnrichmentStore.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)
133. `public/js/stores/UserStore.js` (Analysis: `manual/07_Frontend_Data_Infra.md`)

### Batch 8: Infrastructure
134. `public/js/workers/search.worker.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
135. `public/js/utils/SafeDOM.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
136. `public/js/utils/stringUtils.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
137. `public/js/utils/SvgGenerator.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
138. `public/js/helpers/dom-helpers.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
139. `public/js/transformers/SpotifyTransformer.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
140. `public/js/transformers/PlaylistTransformer.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)
141. `public/js/utils/VirtualScrollObserver.js` (Analysis: `manual/28_Frontend_Infra_Utilities.md`)

### Batch 9: Frontend Views & Renderers 
142. `public/js/views/SaveAllView.js` (Analysis: `manual/10_Frontend_Renderers.md`)
143. `public/js/views/ComingSoonView.js` (Analysis: `manual/10_Frontend_Renderers.md`)
144. `public/js/views/albums/AlbumsFilters.js` (Analysis: `manual/10_Frontend_Renderers.md`)
145. `public/js/views/albums/AlbumsGridRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
146. `public/js/views/albums/AlbumsScopedRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
147. `public/js/views/playlists/PlaylistsDragDrop.js` (Analysis: `manual/10_Frontend_Renderers.md`)
148. `public/js/views/playlists/PlaylistsExport.js` (Analysis: `manual/10_Frontend_Renderers.md`)
149. `public/js/views/renderers/DiscographyRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
150. `public/js/views/renderers/InventoryGridRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
151. `public/js/views/renderers/StagingAreaRenderer.js` (Analysis: `manual/10_Frontend_Renderers.md`)
152. `public/js/views/strategies/ViewModeStrategy.js` (Analysis: `manual/10_Frontend_Renderers.md`)

### Batch 10: State, Models & Controllers 
153. `public/js/controllers/SeriesController.js` (Analysis: `manual/08_Frontend_Models.md`)
154. `public/js/models/Album.js` (Analysis: `manual/08_Frontend_Models.md`)
155. `public/js/models/AlbumIdentity.js` (Analysis: `manual/08_Frontend_Models.md`)
156. `public/js/models/Playlist.js` (Analysis: `manual/08_Frontend_Models.md`)
157. `public/js/stores/albums.js` (Analysis: `manual/08_Frontend_Models.md`)
158. `public/js/cache/albumCache.js` (Analysis: `manual/08_Frontend_Models.md`)

### Batch 11: Album Search & Classification Engine
159. `public/js/services/album-search/AlbumSearchService.js` (Analysis: `manual/22_Album_Search_Engine.md`)
160. `public/js/services/album-search/AlbumTypeClassifier.js` (Analysis: `manual/22_Album_Search_Engine.md`)
161. `public/js/services/album-search/ArtistNormalizer.js` (Analysis: `manual/22_Album_Search_Engine.md`)
162. `public/js/services/album-search/EditionFilter.js` (Analysis: `manual/22_Album_Search_Engine.md`)
163. `public/js/services/album-search/ScoreCalculator.js` (Analysis: `manual/22_Album_Search_Engine.md`)
164. `public/js/services/album-search/classification/AIWhitelistStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
165. `public/js/services/album-search/classification/AppleMetadataStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
166. `public/js/services/album-search/classification/BaseStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
167. `public/js/services/album-search/classification/ElectronicGenreDetector.js` (Analysis: `manual/22_Album_Search_Engine.md`)
168. `public/js/services/album-search/classification/GenreGateStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
169. `public/js/services/album-search/classification/RemixTracksStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
170. `public/js/services/album-search/classification/TitleKeywordStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
171. `public/js/services/album-search/classification/TrackCountStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)
172. `public/js/services/album-search/classification/TypeSanityCheckStrategy.js` (Analysis: `manual/22_Album_Search_Engine.md`)

### Batch 12: MusicKit Internals
173. `public/js/services/musickit/MusicKitAuth.js` (Analysis: `manual/20_MusicKit_Internals.md`)
174. `public/js/services/musickit/MusicKitCatalog.js` (Analysis: `manual/20_MusicKit_Internals.md`)
175. `public/js/services/musickit/MusicKitLibrary.js` (Analysis: `manual/20_MusicKit_Internals.md`)
176. `public/js/services/DataSyncService.js` (Analysis: `manual/20_MusicKit_Internals.md`)
177. `public/js/services/PlaylistPersistenceService.js` (Analysis: `manual/20_MusicKit_Internals.md`)

## 6. Test Suite Audit 
178. `test/e2e/generate-evidence.js` (Analysis: `manual/24_Test_Suite.md`)
179. `test/e2e/ghost-albums-render.test.js` (Analysis: `manual/24_Test_Suite.md`)
180. `test/e2e/helpers.js` (Analysis: `manual/24_Test_Suite.md`)
181. `test/e2e/issue-15-ghost-albums.test.js` (Analysis: `manual/24_Test_Suite.md`)
182. `test/e2e/issue-16-view-toggle.test.js` (Analysis: `manual/24_Test_Suite.md`)
183. `test/e2e/issue-19-series-switching.test.js` (Analysis: `manual/24_Test_Suite.md`)
184. `test/e2e/issue-21-sticky-playlists.test.js` (Analysis: `manual/24_Test_Suite.md`)
185. `test/e2e/quick-demo.js` (Analysis: `manual/24_Test_Suite.md`)
186. `test/e2e/run-all.js` (Analysis: `manual/24_Test_Suite.md`)
187. `test/e2e/setup.js` (Analysis: `manual/24_Test_Suite.md`)
188. `test/e2e/smoke.test.js` (Analysis: `manual/24_Test_Suite.md`)
189. `test/e2e/ui-components.test.js` (Analysis: `manual/24_Test_Suite.md`)
190. `test/algorithms/mixins.test.js` (Analysis: `manual/24_Test_Suite.md`)
191. `test/algorithms/topn.test.js` (Analysis: `manual/24_Test_Suite.md`)
192. `test/services/AuthService.test.js` (Analysis: `manual/24_Test_Suite.md`)
193. `test/services/DataSyncService.test.js` (Analysis: `manual/24_Test_Suite.md`)
194. `test/stores/UserStore.test.js` (Analysis: `manual/24_Test_Suite.md`)
195. `test/stores/albums.test.js` (Analysis: `manual/24_Test_Suite.md`)
196. `test/stores/inventory.test.js` (Analysis: `manual/24_Test_Suite.md`)
197. `test/stores/playlists.test.js` (Analysis: `manual/24_Test_Suite.md`)
198. `test/stores/series.test.js` (Analysis: `manual/24_Test_Suite.md`)
199. `test/views/ConsolidatedRankingView.test.js` (Analysis: `manual/24_Test_Suite.md`)
200. `test/views/PlaylistsView.test.js` (Analysis: `manual/24_Test_Suite.md`)

## 7. Sprint 19 Refactoring 
201. `public/js/services/PlaylistsService.js` (Analysis: `manual/17_Frontend_Services.md`)
202. `public/js/services/SeriesService.js` (Analysis: `manual/17_Frontend_Services.md`)
203. `public/js/components/playlists/SavedPlaylistActions.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
204. `public/js/components/playlists/SavedPlaylistCard.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
205. `public/js/components/playlists/SavedPlaylistRow.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
206. `public/js/components/series/SeriesEmptyState.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
207. `public/js/views/helpers/SeriesGridHelper.js` (Analysis: `manual/09_Frontend_Views.md`)
208. `public/js/views/helpers/SeriesViewHandlers.js` (Analysis: `manual/09_Frontend_Views.md`)
209. `docs/decisions/adr-017-pure-state-stores.md` (Analysis: `manual/01_System_Architecture.md`)
210. `docs/decisions/adr-018-fine-grained-services.md` (Analysis: `manual/01_System_Architecture.md`)
211. `public/js/services/infra/StorageService.js` (Analysis: `manual/17_Frontend_Services.md`)
212. `public/js/services/playlists/PlaylistHistoryService.js` (Analysis: `manual/17_Frontend_Services.md`)
213. `public/js/services/auth/UserSyncService.js` (Analysis: `manual/17_Frontend_Services.md`)
214. `public/js/components/playlists/PlaylistDetailsModal.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
215. `public/js/components/playlists/SavedSeriesGroup.js` (Analysis: `manual/14_Frontend_Components_Features.md`)
216. `public/js/views/helpers/SeriesModalsManager.js` (Analysis: `manual/09_Frontend_Views.md`)
217. `public/js/views/helpers/SeriesViewMounter.js` (Analysis: `manual/09_Frontend_Views.md`)

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
32. `docs/manual/16_Frontend_Components_Search_and_Ranking.md`
33. `docs/technical/specs/sprint23-ranking-refactor/plan.md`
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
**Grand Total Code Files: 217 (Matched with Master List)**
**Grand Total Doc Files: 47**
