import { BaseView } from './BaseView.js'
import { MigrationUtility } from '../migration/MigrationUtility.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'

/**
 * SaveAllView
 * Data Migration utility page - moved from HomeView
 */
export class SaveAllView extends BaseView {
  constructor() {
    super()
    this.migrationUtil = new MigrationUtility()
    this.migrationState = 'idle' // idle, running, complete, error
    this.migrationProgress = { current: 0, total: 0, currentItem: '' }
  }

  async render() {
    const hasPendingMigration = await this.migrationUtil.hasPendingMigration()

    return `
      <div class="save-all-view container py-8 max-w-4xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-syne font-bold text-white mb-2">
            ${getIcon('Database', 'w-8 h-8 inline-block mr-3 text-accent-primary')}
            Data Migration
          </h1>
          <p class="text-gray-400">
            Migrate your local browser data to cloud storage for cross-device sync.
          </p>
        </header>

        <section class="glass-panel p-8 mb-8">
          <div class="flex items-center gap-4 mb-6">
            <div class="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center">
              ${getIcon('CloudUpload', 'w-8 h-8 text-accent-primary')}
            </div>
            <div>
              <h2 class="text-xl font-bold text-white">Migration Status</h2>
              <p class="text-gray-400" id="migrationStatusText">
                ${hasPendingMigration ? 'Old data detected. Ready to migrate.' : 'No pending migrations.'}
              </p>
            </div>
          </div>

          <div id="migrationProgressSection" class="hidden mb-6">
            <div class="flex justify-between text-sm text-gray-400 mb-2">
              <span id="migrationProgressText">Processing...</span>
              <span id="migrationProgressPercent">0%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2">
              <div id="migrationProgressBar" class="bg-accent-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>

          <div class="flex gap-4">
            <button 
              id="startMigrationBtn" 
              class="btn btn-primary"
              ${!hasPendingMigration ? 'disabled' : ''}
            >
              ${getIcon('Play', 'w-5 h-5 mr-2')}
              Start Migration
            </button>
            <button id="checkMigrationBtn" class="btn btn-secondary">
              ${getIcon('RefreshCw', 'w-5 h-5 mr-2')}
              Re-check Status
            </button>
          </div>
        </section>

        <section class="glass-panel p-8">
          <h3 class="text-lg font-bold text-white mb-4">What gets migrated?</h3>
          <ul class="space-y-3 text-gray-300">
            <li class="flex items-center gap-3">
              ${getIcon('Check', 'w-5 h-5 text-green-500')}
              Album Series (names, queries, settings)
            </li>
            <li class="flex items-center gap-3">
              ${getIcon('Check', 'w-5 h-5 text-green-500')}
              Playlist Series (curation preferences)
            </li>
            <li class="flex items-center gap-3">
              ${getIcon('Check', 'w-5 h-5 text-green-500')}
              Inventory (owned albums)
            </li>
            <li class="flex items-center gap-3">
              ${getIcon('Check', 'w-5 h-5 text-green-500')}
              Generated Playlists
            </li>
          </ul>
        </section>
      </div>
    `
  }

  async mount() {
    // Start Migration Button
    const startBtn = this.$('#startMigrationBtn')
    if (startBtn) {
      this.on(startBtn, 'click', () => this.startMigration())
    }

    // Re-check Button
    const checkBtn = this.$('#checkMigrationBtn')
    if (checkBtn) {
      this.on(checkBtn, 'click', () => this.checkMigrationStatus())
    }
  }

  async startMigration() {
    const progressSection = this.$('#migrationProgressSection')
    const startBtn = this.$('#startMigrationBtn')
    const statusText = this.$('#migrationStatusText')

    if (progressSection) progressSection.classList.remove('hidden')
    if (startBtn) startBtn.disabled = true
    if (statusText) statusText.textContent = 'Migration in progress...'

    try {
      await this.migrationUtil.runMigration((progress) => {
        this.updateProgress(progress)
      })

      if (statusText) statusText.textContent = 'Migration complete!'
      toast.success('Data migration completed successfully!')
    } catch (error) {
      console.error('Migration failed:', error)
      if (statusText) statusText.textContent = 'Migration failed. Please try again.'
      toast.error('Migration failed: ' + error.message)
    }
  }

  updateProgress(progress) {
    const progressBar = this.$('#migrationProgressBar')
    const progressText = this.$('#migrationProgressText')
    const progressPercent = this.$('#migrationProgressPercent')

    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

    if (progressBar) progressBar.style.width = `${percent}%`
    if (progressText) progressText.textContent = progress.currentItem || 'Processing...'
    if (progressPercent) progressPercent.textContent = `${percent}%`
  }

  async checkMigrationStatus() {
    const hasPending = await this.migrationUtil.hasPendingMigration()
    const statusText = this.$('#migrationStatusText')
    const startBtn = this.$('#startMigrationBtn')

    if (statusText) {
      statusText.textContent = hasPending
        ? 'Old data detected. Ready to migrate.'
        : 'No pending migrations.'
    }

    if (startBtn) {
      startBtn.disabled = !hasPending
    }

    toast.info(hasPending ? 'Pending migration found' : 'No migrations needed')
  }
}
